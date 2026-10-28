# Changelog

All notable architectural changes to the **Enterprise Checkout & Distributed Ledger System** are documented in this file.

## [1.1.0] - 2026-10-28
### Added
- Constant-time HMAC-SHA256 signature verification with replay window enforcement (`src/security/hmac-verifier.ts`).
- Automated `BigInt` double-entry zero-sum reconciliation engine (`src/ledger/reconciliation-engine.ts`).
- Upstream PSP fault isolation via state-driven Circuit Breaker (`src/psp/circuit-breaker.ts`).
- Recursive PCI-DSS Level 1 sensitive payload scrubber (`src/compliance/pci-scrubber.ts`).
- Production Kubernetes zero-downtime deployment, HPA autoscaling, and hardened multi-stage `Dockerfile`.
- Architectural Decision Records (ADRs) for immutable ledgers and pessimistic locking.

## [1.0.0] - 2026-10-20
### Added
- Initial enterprise release featuring idempotent Stripe Connect orchestration, PostgreSQL pessimistic inventory locking, k6 load testing, and Chaos Mesh resilience manifests.
