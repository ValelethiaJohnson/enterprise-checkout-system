import { Prisma, PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import Stripe from 'stripe';
import crypto from 'crypto';

export interface CheckoutItemInput {
  skuId: string;
  quantity: number;
  unitPriceMinor: bigint; // Stored in minor units (e.g., cents) to prevent IEEE 754 floating-point drift
}

export interface CreateCheckoutRequest {
  idempotencyKey: string;
  customerId: string;
  merchantAccountId: string; // Stripe Connect destination account
  currency: string;
  items: CheckoutItemInput[];
}

export interface CheckoutSessionResult {
  orderId: string;
  paymentIntentId: string;
  clientSecret: string | null;
  status: 'AUTHORIZED_PENDING_CAPTURE' | 'IDEMPOTENT_REPLAY';
  ledgerTransactionHash: string;
}

export class EnterpriseCheckoutService {
  private readonly IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours

  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
    private readonly stripe: Stripe
  ) {}

  /**
   * Executes an idempotent, concurrency-safe checkout flow with double-entry ledger recording.
   */
  public async executeCheckout(req: CreateCheckoutRequest): Promise<CheckoutSessionResult> {
    const lockKey = `idempotency:checkout:${req.idempotencyKey}`;
    const payloadHash = this.computePayloadHash(req);

    // 1. Distributed Idempotency Gate (Fast-Path Redis Check + NX Lock)
    const cachedResponse = await this.redis.get(lockKey);
    if (cachedResponse) {
      const parsed = JSON.parse(cachedResponse);
      if (parsed.payloadHash !== payloadHash) {
        throw new Error('IDEMPOTENCY_KEY_REUSE_CONFLICT: Payload mismatch for existing Idempotency-Key.');
      }
      return { ...parsed.result, status: 'IDEMPOTENT_REPLAY' };
    }

    const acquiredLock = await this.redis.set(`${lockKey}:lock`, 'LOCKED', 'EX', 30, 'NX');
    if (!acquiredLock) {
      throw new Error('CONCURRENT_IN_FLIGHT_REQUEST: Transaction with this Idempotency-Key is currently processing.');
    }

    try {
      // 2. Serializable / Pessimistic Database Transaction for Inventory & Immutable Ledger
      const txResult = await this.prisma.$transaction(
        async (tx) => {
          let totalAmountMinor = 0n;

          // Acquire row-level pessimistic locks (FOR UPDATE NOWAIT) sorted by SKU to prevent deadlocks
          const sortedItems = [...req.items].sort((a, b) => a.skuId.localeCompare(b.skuId));

          for (const item of sortedItems) {
            const inventoryRows = await tx.$queryRaw<Array<{ id: string; available_qty: number }>>`
              SELECT id, available_qty
              FROM inventory_stocks
              WHERE sku_id = ${item.skuId}
              FOR UPDATE NOWAIT
            `;

            const stock = inventoryRows[0];
            if (!stock || stock.available_qty < item.quantity) {
              throw new Error(`INSUFFICIENT_INVENTORY: SKU ${item.skuId} cannot fulfill quantity ${item.quantity}`);
            }

            await tx.$executeRaw`
              UPDATE inventory_stocks
              SET available_qty = available_qty - ${item.quantity},
                  reserved_qty = reserved_qty + ${item.quantity},
                  updated_at = NOW()
              WHERE sku_id = ${item.skuId}
            `;

            totalAmountMinor += item.unitPriceMinor * BigInt(item.quantity);
          }

          // Calculate 2.5% platform fee for Stripe Connect split
          const platformFeeMinor = (totalAmountMinor * 250n) / 10000n;

          // Create Order State Machine Record
          const order = await tx.order.create({
            data: {
              customerId: req.customerId,
              merchantAccountId: req.merchantAccountId,
              currency: req.currency.toUpperCase(),
              totalAmountMinor,
              platformFeeMinor,
              state: 'RESERVED_PENDING_PAYMENT',
              idempotencyKey: req.idempotencyKey,
            },
          });

          // 3. Append-Only Double-Entry Ledger Recording (Sum of Debits == Sum of Credits)
          const ledgerHash = this.computeLedgerAuditHash(order.id, totalAmountMinor, req.idempotencyKey);

          await tx.ledgerEntry.createMany({
            data: [
              {
                orderId: order.id,
                accountType: 'CUSTOMER_CLEARING_RECEIVABLE',
                direction: 'DEBIT',
                amountMinor: totalAmountMinor,
                currency: req.currency.toUpperCase(),
                cryptographicHash: ledgerHash,
              },
              {
                orderId: order.id,
                accountType: 'MERCHANT_ESCROW_PAYABLE',
                direction: 'CREDIT',
                amountMinor: totalAmountMinor - platformFeeMinor,
                currency: req.currency.toUpperCase(),
                cryptographicHash: ledgerHash,
              },
              {
                orderId: order.id,
                accountType: 'PLATFORM_REVENUE_FEE',
                direction: 'CREDIT',
                amountMinor: platformFeeMinor,
                currency: req.currency.toUpperCase(),
                cryptographicHash: ledgerHash,
              },
            ],
          });

          return { order, totalAmountMinor, platformFeeMinor, ledgerHash };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }
      );

      // 4. Upstream PSP Execution (Stripe Connect Idempotent PaymentIntent)
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: Number(txResult.totalAmountMinor),
          currency: req.currency.toLowerCase(),
          capture_method: 'manual',
          application_fee_amount: Number(txResult.platformFeeMinor),
          transfer_data: {
            destination: req.merchantAccountId,
          },
          metadata: {
            orderId: txResult.order.id,
            ledgerAuditHash: txResult.ledgerHash,
          },
        },
        {
          idempotencyKey: `stripe:pi:${req.idempotencyKey}`,
        }
      );

      const finalResult: CheckoutSessionResult = {
        orderId: txResult.order.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: 'AUTHORIZED_PENDING_CAPTURE',
        ledgerTransactionHash: txResult.ledgerHash,
      };

      // Cache sealed idempotent response
      await this.redis.setex(
        lockKey,
        this.IDEMPOTENCY_TTL_SECONDS,
        JSON.stringify({ payloadHash, result: finalResult })
      );

      return finalResult;
    } finally {
      await this.redis.del(`${lockKey}:lock`);
    }
  }

  private computePayloadHash(req: CreateCheckoutRequest): string {
    return crypto.createHash('sha256').update(JSON.stringify(req)).digest('hex');
  }

  private computeLedgerAuditHash(orderId: string, amountMinor: bigint, idempotencyKey: string): string {
    return crypto
      .createHash('sha256')
      .update(`${orderId}:${amountMinor.toString()}:${idempotencyKey}`)
      .digest('hex');
  }
}
