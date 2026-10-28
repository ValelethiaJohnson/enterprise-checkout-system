import crypto from 'crypto';

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  responseStatus?: number;
  responseBody?: string;
  expiresAt: number;
}

export class IdempotencyGuard {
  public static computeRequestFingerprint(method: string, path: string, body: unknown): string {
    const canonicalPayload = `${method.toUpperCase()}:${path}:${JSON.stringify(body ?? {})}`;
    return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
  }

  public static validatePayloadConsistency(existingRecord: IdempotencyRecord, incomingHash: string): void {
    if (existingRecord.requestHash !== incomingHash) {
      throw new Error('Idempotency key reuse detected with mutated request parameters');
    }
  }
}
