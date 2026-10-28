# ADR 0001: Immutable Double-Entry Ledger Architecture

* **Status:** Accepted
* **Date:** 2026-10-01
* **Decision Maker:** Valelethia Johnson (Principal FinTech Architect)

## Context
Direct column mutations (`UPDATE accounts SET balance = balance + X`) are prone to race conditions, silent data corruption, and un-auditable financial discrepancies during high-concurrency payment settlement.

## Decision
We enforce an **append-only, immutable double-entry ledger** where every financial event generates at least two offsetting entries (`DEBIT` and `CREDIT`) stored in integer minor units (`BigInt`) whose algebraic sum equals zero.

## Consequences
* **Positive:** Complete cryptographic auditability, zero floating-point drift, and instant reconciliation.
* **Negative:** Slightly higher storage footprint mitigated via periodic account balance snapshots.
