import crypto from 'crypto';

export interface SignatureVerificationInput {
  payload: string;
  signatureHeader: string;
  timestampHeader: string;
  secretKey: string;
  toleranceSeconds?: number;
}

export class HmacSignatureVerifier {
  public static verify(input: SignatureVerificationInput): boolean {
    const tolerance = input.toleranceSeconds ?? 300;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const requestTimestamp = parseInt(input.timestampHeader, 10);

    if (Number.isNaN(requestTimestamp) || Math.abs(currentTimestamp - requestTimestamp) > tolerance) {
      throw new Error('Cryptographic timestamp outside allowable replay window');
    }

    const signedPayload = `${requestTimestamp}.${input.payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', input.secretKey)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(input.signatureHeader, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
