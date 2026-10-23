# Enterprise Checkout System - Technical Architecture & Concurrency Specification

## 1. System Overview & Problem Statement
The `EnterpriseCheckoutSystem` is designed to handle high-throughput, flash-sale e-commerce checkouts without the risk of inventory overselling, race conditions, or duplicate ledger postings.

## 2. Concurrency Control & Race Condition Mitigation
To prevent race conditions under heavy traffic (e.g., 10,000+ concurrent requests for limited stock):
- **Pessimistic Row-Level Locking:** Queries execute `SELECT ... FOR UPDATE NOWAIT` inside a strict `Serializable` isolation transaction. If a row is locked by another transaction, it fails fast rather than queueing indefinitely, preventing thread pool starvation.
- **Multi-Layer Idempotency:** Requests are guarded by Redis distributed locks (`SET NX EX`) combined with SHA-256 payload hashing to guarantee exactly-once execution.

## 3. Distributed Transaction Lifecycle
1. **Idempotency Check:** Verify request hash in Redis cache.
2. **Stock Reservation:** Acquire pessimistic lock on inventory SKU rows.
3. **PSP Orchestration:** Initiate Stripe Connect split-payment charge with manual capture.
4. **Ledger Posting:** Emit immutable double-entry journal lines to the Ledger Engine.
