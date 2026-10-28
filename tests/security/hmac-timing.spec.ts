import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { HmacSignatureVerifier } from '../../src/security/hmac-verifier';

describe('Cryptographic HMAC-SHA256 Verification Suite', () => {
  const secret = 'whsec_test_enterprise_secret_key_2026';
  const payload = JSON.stringify({ orderId: 'ord_99182', amount: 50000 });

  it('validates authentic HMAC signatures within the allowable replay window', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    const isValid = HmacSignatureVerifier.verify({
      payload,
      signatureHeader: signature,
      timestampHeader: timestamp,
      secretKey: secret,
    });

    expect(isValid).toBe(true);
  });

  it('rejects expired timestamps to prevent replay attacks', () => {
    const staleTimestamp = (Math.floor(Date.now() / 1000) - 900).toString();
    expect(() =>
      HmacSignatureVerifier.verify({
        payload,
        signatureHeader: 'deadbeef',
        timestampHeader: staleTimestamp,
        secretKey: secret,
      })
    ).toThrow(/replay window/);
  });
});
