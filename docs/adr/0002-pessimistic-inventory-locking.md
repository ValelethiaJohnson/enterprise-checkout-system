# ADR 0002: Deterministic Pessimistic Locking for Flash-Sale Inventory

* **Status:** Accepted
* **Date:** 2026-10-05
* **Decision Maker:** Valelethia Johnson (Principal FinTech Architect)

## Context
During high-contention flash sales, optimistic concurrency control causes excessive transaction abort rates and retry storms when thousands of buyers target the same SKU simultaneously.

## Decision
We utilize PostgreSQL row-level **Pessimistic Locking** (`SELECT ... FOR UPDATE NOWAIT`) ordered deterministically by `sku_id` inside short-lived database transactions prior to invoking external PSP authorization.

## Consequences
* **Positive:** Zero inventory overselling, deterministic lock ordering that eliminates deadlocks, and predictable tail latency.
* **Negative:** Requires strict connection pool sizing via PgBouncer.
