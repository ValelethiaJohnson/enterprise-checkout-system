const SENSITIVE_KEYS = new Set([
  'cardNumber',
  'cvv',
  'cvc',
  'pan',
  'secretKey',
  'authorization',
  'iban',
]);

export function scrubPciSensitiveData<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = '[REDACTED_PCI_DSS]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = scrubPciSensitiveData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
