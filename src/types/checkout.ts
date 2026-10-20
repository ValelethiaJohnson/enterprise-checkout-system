export type OrderStatus = 
  | 'DRAFT' 
  | 'PENDING_PAYMENT' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'PAYMENT_FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export interface CheckoutRequestPayload {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  currency: 'USD';
}
