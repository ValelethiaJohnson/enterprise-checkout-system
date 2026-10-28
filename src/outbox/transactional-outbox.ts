import crypto from 'crypto';

export interface OutboxEvent {
  eventId: string;
  aggregateType: 'CHECKOUT_ORDER' | 'LEDGER_POSTING' | 'PSP_SETTLEMENT';
  aggregateId: string;
  eventType: string;
  payload: string;
  status: 'PENDING' | 'PUBLISHED' | 'DEAD_LETTER';
  retryCount: number;
  createdAt: string;
}

export class TransactionalOutboxFactory {
  public static createEvent(
    aggregateType: OutboxEvent['aggregateType'],
    aggregateId: string,
    eventType: string,
    payloadData: Record<string, unknown>
  ): OutboxEvent {
    return {
      eventId: crypto.randomUUID(),
      aggregateType,
      aggregateId,
      eventType,
      payload: JSON.stringify(payloadData),
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
  }
}
