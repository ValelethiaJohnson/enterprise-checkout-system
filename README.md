## 📊 Enterprise Checkout & Distributed Ledger Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Gateway (Node.js)
    participant Idempotency as Idempotency Engine
    participant DB as PostgreSQL (Pessimistic Lock)
    participant Ledger as Double-Entry Ledger
    participant PSP as Stripe Connect / PSP

    Client->>API: POST /api/v1/checkout (HMAC-SHA256 Signed)
    API->>Idempotency: Check Request Hash & TTL Cache
    alt Duplicate Request
        Idempotency--return: Return Cached Transaction Response
    else New Request
        API->>DB: Acquire Pessimistic Row Lock & Reserve Inventory
        DB-->>API: Inventory Reserved Successfully
        API->>PSP: Process Payment via Stripe Connect
        PSP-->>API: Payment Authorized / Captured
        API->>DB: Commit Immutable Double-Entry Ledger Posting
        DB-->>API: Ledger Verified & Saved
        API->>Client: 201 Created (Transaction Successful)
    end
---

## 💖 Sponsor This Project

If you find this enterprise-grade FinTech architecture valuable, consider supporting the development and maintenance of high-concurrency open-source financial systems.

[![Sponsor Enterprise Checkout System](https://img.shields.io/badge/Sponsor-%F0%9F%92%96%20GitHub%20Sponsors-pink?style=for-the-badge)](https://github.com/sponsors/ValelethiaJohnson)
