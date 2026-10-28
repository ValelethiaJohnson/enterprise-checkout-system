## Architectural Change Summary
Briefly describe the scope and financial impact of this pull request.

## FinTech Safety & Invariant Checklist
- [ ] **Idempotency Preserved:** All state-mutating endpoints enforce strict `Idempotency-Key` validation.
- [ ] **Double-Entry Zero-Sum Verified:** Every ledger mutation balances debits and credits in minor units (`BigInt`).
- [ ] **Concurrency Safe:** Inventory and balance updates utilize pessimistic row locking (`SELECT ... FOR UPDATE`).
- [ ] **PCI-DSS Compliant:** No sensitive cardholder data or cryptographic secrets are written to logs.
- [ ] **Test Coverage:** Unit and concurrency test suites pass with zero regressions.
