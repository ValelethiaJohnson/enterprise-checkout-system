# Enterprise Checkout System

An enterprise-grade e-commerce checkout architecture built to showcase robust concurrency controls, distributed transactions, and idempotent payment pipelines.

## Features

* Customer information form
* Shipping address management
* Shipping method selection
* Order summary
* Discount code support
* Multiple payment methods
* Client-side and server-side validation
* Mock payment processing
* Payment success and failure pages
* Responsive checkout interface
* Order status management

## Technical Architecture

The project separates the user interface, business logic, data access, and payment integration into independent layers.

```mermaid
flowchart TD
    Customer[Customer] --> UI[Checkout Interface]
    UI --> Validation[Client Validation]
    Validation --> API[Checkout API]

    API --> CheckoutService[Checkout Service]
    CheckoutService --> PricingService[Pricing Service]
    CheckoutService --> InventoryService[Inventory Service]
    CheckoutService --> OrderService[Order Service]
    CheckoutService --> PaymentAdapter[Payment Gateway Adapter]

    PricingService --> Database[(Database)]
    InventoryService --> Database
    OrderService --> Database

    PaymentAdapter --> Provider[Payment Provider]
    Provider --> Webhook[Webhook Handler]
    Webhook --> OrderService
```

## Architecture Layers

### Presentation Layer

The presentation layer displays the checkout interface and collects information from the customer.

Its responsibilities include:

* Rendering checkout steps
* Collecting customer and shipping information
* Displaying available payment methods
* Showing the order summary
* Performing basic form validation
* Handling loading and error states
* Redirecting customers after checkout

The frontend must not be treated as a trusted source for product prices, discounts, shipping fees, or final totals.

### API Layer

The API layer acts as the communication point between the frontend and backend services.

Its responsibilities include:

* Validating incoming requests
* Sanitizing customer input
* Verifying the checkout session
* Preventing duplicate submissions
* Calling checkout services
* Returning standardized responses
* Handling errors securely

Example endpoint:

```http
POST /api/checkout
```

Example request:

```json
{
  "customer": {
    "name": "Nguyen Van A",
    "email": "customer@example.com",
    "phone": "0900000000"
  },
  "shippingAddress": {
    "address": "123 Main Street",
    "city": "New York",
    "country": "United States"
  },
  "shippingMethod": "standard",
  "paymentMethod": "mock_card",
  "couponCode": "WELCOME10",
  "items": [
    {
      "productId": "product-001",
      "quantity": 2
    }
  ]
}
```

### Checkout Service

The checkout service coordinates the full checkout process.

Typical workflow:

1. Validate the customer information.
2. Validate cart items.
3. Load current product prices.
4. Check product availability.
5. Validate the discount code.
6. Calculate the final order total.
7. Create a pending order.
8. Initialize the payment.
9. Return the checkout result.

The checkout service should coordinate other services without containing provider-specific payment logic.

### Pricing Service

The pricing service calculates all trusted order values on the server.

```text
Subtotal
+ Shipping fee
+ Taxes
- Discounts
= Final total
```

Example:

```json
{
  "currency": "USD",
  "subtotal": 1000000,
  "shippingFee": 30000,
  "tax": 0,
  "discount": 100000,
  "total": 930000
}
```

Money should be stored and calculated using integers in the smallest supported currency unit to avoid floating-point errors.

### Inventory Service

The inventory service verifies whether the requested products and quantities are available.

Possible inventory workflow:

* Check inventory before creating an order.
* Reserve inventory when an order is pending.
* Deduct inventory after successful payment.
* Release reserved inventory when payment fails or expires.

### Order Service

The order service manages order creation and order status transitions.

Example order statuses:

```text
DRAFT
PENDING_PAYMENT
PAID
PROCESSING
COMPLETED
PAYMENT_FAILED
CANCELLED
REFUNDED
```

Payment status should be stored separately from order status.

Example payment statuses:

```text
PENDING
AUTHORIZED
SUCCEEDED
FAILED
CANCELLED
REFUNDED
```

### Payment Gateway Adapter

Payment provider integrations should be isolated behind a common interface.

```ts
interface PaymentGateway {
  createPayment(
    input: CreatePaymentInput
  ): Promise<PaymentResult>;

  getPaymentStatus(
    paymentId: string
  ): Promise<PaymentStatus>;

  refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<RefundResult>;
}
```

Possible implementations:

```text
MockPaymentGateway
StripePaymentGateway
PayPalPaymentGateway
BankTransferGateway
```

This architecture allows payment providers to be replaced without modifying the main checkout workflow.

## Checkout Sequence

```mermaid
sequenceDiagram
    participant Customer
    participant Frontend
    participant API
    participant CheckoutService
    participant OrderService
    participant PaymentGateway
    participant PaymentProvider

    Customer->>Frontend: Submit checkout form
    Frontend->>API: POST /api/checkout
    API->>CheckoutService: Process checkout
    CheckoutService->>CheckoutService: Validate cart and calculate total
    CheckoutService->>OrderService: Create pending order
    OrderService-->>CheckoutService: Return order
    CheckoutService->>PaymentGateway: Create payment
    PaymentGateway->>PaymentProvider: Initialize transaction
    PaymentProvider-->>PaymentGateway: Return payment status
    PaymentGateway-->>CheckoutService: Return payment result
    CheckoutService-->>API: Return checkout response
    API-->>Frontend: Order and payment result
    Frontend-->>Customer: Show success or failure page
```

## Suggested Project Structure

```text
checkout-demo/
├── src/
│   ├── app/
│   │   ├── checkout/
│   │   ├── checkout-success/
│   │   ├── checkout-failed/
│   │   └── api/
│   │       ├── checkout/
│   │       ├── orders/
│   │       └── webhooks/
│   ├── components/
│   │   ├── checkout-form/
│   │   ├── customer-form/
│   │   ├── shipping-address/
│   │   ├── shipping-methods/
│   │   ├── payment-methods/
│   │   └── order-summary/
│   ├── services/
│   │   ├── checkout.service.ts
│   │   ├── pricing.service.ts
│   │   ├── inventory.service.ts
│   │   ├── order.service.ts
│   │   └── payment.service.ts
│   ├── payments/
│   │   ├── payment-gateway.interface.ts
│   │   ├── mock-payment.gateway.ts
│   │   └── stripe-payment.gateway.ts
│   ├── repositories/
│   ├── validators/
│   ├── types/
│   └── utils/
├── public/
├── tests/
├── .env.example
├── package.json
└── README.md
```

## Example Checkout Response

Successful checkout:

```json
{
  "success": true,
  "orderId": "order_123456",
  "orderStatus": "PENDING_PAYMENT",
  "paymentStatus": "PENDING",
  "total": 930000,
  "currency": "USD",
  "redirectUrl": "/checkout-success?orderId=order_123456"
}
```

Failed checkout:

```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "One or more products are no longer available."
  }
}
```

## Environment Variables

Create a `.env` file based on `.env.example`.

```env
DATABASE_URL=
PAYMENT_PROVIDER=mock
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
APP_URL=http://localhost:3000
```

Do not expose secret keys in frontend code or commit them to the repository.

## Installation

Clone the repository:

```bash
git clone https://github.com/ValelethiaJohnson/enterprise-checkout-system.git
cd enterprise-checkout-system

cd checkout-demo
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```
## Security and Audit

- **Server-Side Authority:** Never trust prices, totals, or discounts calculated on the client side; always recalculate values in the pricing service.
- **Database Transactions:** Wrap critical inventory checks and order creation inside strict database transactions with proper isolation levels.
- **Webhook Verification:** Verify all incoming payment provider webhook signatures before mutating order or payment states.
- **Data Minimization:** Never store raw credit card numbers or sensitive payment payloads in the application database.
- **Audit Trails:** Record immutable audit logs for all state transitions, manual overrides, and refund operations.

## Concurrency and Race Conditions

To prevent overselling inventory and duplicate checkout submissions under high traffic, the system implements strict concurrency controls:

- **Database-Level Pessimistic Locking:** When verifying inventory and creating a pending order, use row-level locking (`SELECT ... FOR UPDATE` via Prisma/PostgreSQL) to serialize operations on the same product variants.
- **Distributed Locks:** Use Redis locks for checkout sessions to prevent a user from triggering parallel payment requests with the same payload.
- **Idempotency Keys:** Enforce `Idempotency-Key` headers on `/api/checkout` to safely handle client retries and network timeouts without duplicating orders.

## Distributed Transactions

Because external payment gateway calls (Stripe) cannot be wrapped inside an internal PostgreSQL ACID transaction, the system handles distributed boundaries using a **Saga Pattern / Compensation Workflow**:

1. **Step 1:** Reserve inventory and create a pending order in the database.
2. **Step 2:** Call the Payment Gateway adapter.
3. **Step 3 (Success):** Deduct inventory permanently and mark the order as paid.
4. **Step 4 (Failure / Timeout):** If the payment fails or times out, trigger an asynchronous compensation transaction via BullMQ to release the reserved inventory and cancel the order.

## Payment Session Expiry & Cleanup

Unpaid orders can lock inventory indefinitely if not handled. 

- **Expiration Window:** Checkout sessions expire after 15 minutes of inactivity.
- **Background Cron Worker:** A scheduled BullMQ delayed job continuously scans for orders stuck in `PENDING_PAYMENT` state past their threshold.
- **Automatic Cleanup:** Expired orders automatically release reserved inventory back to stock and transition their status to `CANCELLED`.

## Webhook Handling

The payment provider webhook should be treated as the trusted source for asynchronous payment updates.

Example endpoint:

```http
POST /api/webhooks/payment
```

Recommended webhook workflow:

1. Receive the payment event.
2. Verify the webhook signature.
3. Check whether the event has already been processed.
4. Update the payment status.
5. Update the related order status.
6. Record the event for auditing.
7. Return a successful HTTP response.

## Testing

Run unit tests:

```bash
npm run test
```

Run integration tests:

```bash
npm run test:integration
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Important scenarios to test:

* Successful checkout
* Invalid customer information
* Invalid discount code
* Out-of-stock product
* Price change during checkout
* Failed payment
* Duplicate submission
* Expired payment session
* Invalid webhook signature
* Successful refund

## Future Improvements

* Add guest and authenticated checkout
* Add saved addresses
* Add multiple currencies
* Add tax calculation
* Add real payment providers
* Add abandoned checkout recovery
* Add fraud detection
* Add order confirmation emails
* Add payment retry support
* Add an administration dashboard
* Add analytics and checkout conversion tracking

## License

This project is available under the MIT License.
