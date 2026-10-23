# Enterprise Checkout System - API Specification & Integration Guide

## 1. Authentication & HMAC Security
All requests to the Checkout Gateway must include a valid cryptographic signature in the headers:
- `X-Signature`: HMAC-SHA256 hex digest of the request body signed using the merchant's secret key.

## 2. POST /api/v1/checkout
Initiates a secure, idempotent checkout transaction with inventory reservation.

### Request Body (JSON)
```json
{
  "idempotencyKey": "uuid-v4-string",
  "customerId": "cust_9928192",
  "merchantAccountId": "acct_stripe_connect_123",
  "currency": "USD",
  "items": [
    {
      "skuId": "PROD-ENTERPRISE-01",
      "quantity": 2,
      "unitPriceMinor": "49999"
    }
  ]
}
