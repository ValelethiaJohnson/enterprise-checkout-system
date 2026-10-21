import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnterpriseCheckoutService } from '../../src/services/checkout.service';

describe('EnterpriseCheckoutService - High-Concurrency Race Condition Tests', () => {
  let mockPrisma: any;
  let mockRedis: any;
  let mockStripe: any;
  let checkoutService: EnterpriseCheckoutService;

  beforeEach(() => {
    // Mock các tầng Database, Redis và Stripe để kiểm thử độ chịu tải và tranh chấp luồng
    mockPrisma = {
      $transaction: vi.fn(async (callback) => callback(mockPrisma)),
      $queryRaw: vi.fn(),$executeRaw: vi.fn(),
      order: {
        create: vi.fn().mockResolvedValue({ id: 'mock-order-uuid-123' }),
      },
      ledgerEntry: {
        createMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
    };

    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    mockStripe = {
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: 'pi_mock_123',
          client_secret: 'pi_mock_123_secret_xyz',
        }),
      },
    };

    checkoutService = new EnterpriseCheckoutService(mockPrisma, mockRedis, mockStripe);
  });

  it('should prevent overselling under high concurrent requests for limited stock', async () => {
    // Giả lập kho chỉ còn đúng 1 sản phẩm duy nhất
    let availableInventory = 1;

    mockPrisma.$queryRaw.mockImplementation(async () => {
      if (availableInventory > 0) {
        return [{ id: 'stock-uuid-1', available_qty: availableInventory }];
      }
      return []; // Hết hàng
    });

    mockPrisma.$executeRaw.mockImplementation(async () => {
      if (availableInventory > 0) {
        availableInventory -= 1;
        return 1;
      }
      throw new Error('INSUFFICIENT_INVENTORY');
    });

    // Mô phỏng 10 luồng khách hàng cùng bắn request checkout mua SKU này đồng thời (Race Condition)
    const concurrentRequests = Array.from({ length: 10 }, (_, index) =>
      checkoutService.executeCheckout({
        idempotencyKey: `idem-key-race-${index}`,
        customerId: `customer-${index}`,
        merchantAccountId: 'acct_mock_stripe_connect',
        currency: 'USD',
        items: [{ skuId: 'IPHONE-15-PRO-MAX', quantity: 1, unitPriceMinor: 100000n }],
      }).catch((err) => ({ error: err.message }))
    );

    const results = await Promise.all(concurrentRequests);

    // Thống kê kết quả
    const successes = results.filter((r: any) => !r.error);
    const failures = results.filter((r: any) => r.error === 'INSUFFICIENT_INVENTORY');

    // Kiểm chứng khắt khe theo chuẩn tài chính:
    // 1. Chỉ được phép đúng 1 giao dịch thành công vì kho chỉ có 1 sản phẩm
    expect(successes.length).toBe(1);
    
    // 2. 9 giao dịch còn lại phải bị từ chối do hết hàng (chặn đứng overselling)
    expect(failures.length).toBe(9);

    // 3. Tồn kho cuối cùng phải bằng 0, không bao giờ bị âm
    expect(availableInventory).toBe(0);
  });
});
