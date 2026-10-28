# ADR 0003: Transactional Outbox Pattern for Guaranteed Event Delivery

* **Status:** Accepted
* **Date:** 2026-10-28
* **Decision Maker:** Valelethia Johnson (Principal FinTech Architect)

## Context
Publishing domain events directly to a message broker immediately after committing a database transaction introduces a dual-write vulnerability: if the process crashes after the DB commit but before broker acknowledgement, downstream settlement systems lose synchronization.

## Decision
We persist all outgoing domain events (`CHECKOUT_ORDER`, `LEDGER_POSTING`, `PSP_SETTLEMENT`) into a dedicated `outbox_events` table within the exact same PostgreSQL ACID transaction as the ledger mutation. Asynchronous relay workers poll and publish pending records with at-least-once delivery guarantees.

## Consequences
* **Positive:** Atomic consistency between ledger state and emitted events; zero lost settlement notifications.
* **Negative:** Downstream consumers must be idempotent to handle occasional duplicate event deliveries.
