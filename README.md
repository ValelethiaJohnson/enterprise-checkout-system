# Enterprise Checkout & Distributed Ledger System

![Enterprise CI Pipeline](https://img.shields.io/badge/Enterprise_CI_Pipeline-passing-success?style=flat-square&logo=githubactions)
![License Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square)
![TypeScript 5.6 Strict](https://img.shields.io/badge/TypeScript-5.6_Strict-3178C6?style=flat-square&logo=typescript)
![ORM Prisma 5](https://img.shields.io/badge/ORM-Prisma_5-2D3748?style=flat-square&logo=prisma)
![PSP Stripe Connect](https://img.shields.io/badge/PSP-Stripe_Connect-635BFF?style=flat-square&logo=stripe)
![Database PostgreSQL Serializable](https://img.shields.io/badge/Database-PostgreSQL_Serializable-336791?style=flat-square&logo=postgresql)

An enterprise-grade e-commerce checkout and financial ledger architecture designed for high-concurrency transaction processing, deterministic inventory reservation, and idempotent multi-party payment orchestration via Stripe Connect.

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
        Idempotency-->>API: Return Cached Transaction Response
    else New Request
        API->>DB: Acquire Pessimistic Row Lock & Reserve Inventory
        DB-->>API: Inventory Reserved Successfully
        API->>PSP: Process Payment via Stripe Connect
        PSP-->>API: Payment Authorized / Captured
        API->>DB: Commit Immutable Double-Entry Ledger Posting
        DB-->>API: Ledger Verified & Saved
        API->>Client: 201 Created (Transaction Successful)
    end
