# Enterprise Checkout System - SRE Incident Runbook & Disaster Recovery

## 1. High Concurrency & Deadlock Escalation
If PostgreSQL reports deadlocks or serialization failures under flash-sale spikes:
- Check active transaction locks via `pg_stat_activity`.
- Verify Redis cluster health and memory limits for idempotency locks.

## 2. Stripe Webhook Replay & Idempotency Recovery
If webhook processing fails due to network partitions:
- Inspect dead-letter queue (DLQ) logs.
- Replay events using idempotency keys matching the exact original `X-Stripe-Signature`.

## 3. Database Failover Procedure
- Promote read-replica or trigger automated multi-region failover.
- Ensure strict row-level pessimistic locking (`FOR UPDATE NOWAIT`) integrity across node transitions.
