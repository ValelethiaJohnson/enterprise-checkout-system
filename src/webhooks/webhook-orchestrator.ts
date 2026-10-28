export class WebhookRetryPolicy {
  public static calculateBackoffMs(attempt: number, baseDelayMs = 1000, maxDelayMs = 60000): number {
    const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    const fullJitter = Math.floor(Math.random() * (exponential * 0.25));
    return exponential + fullJitter;
  }

  public static shouldRouteToDeadLetterQueue(attempt: number, maxRetries = 8): boolean {
    return attempt >= maxRetries;
  }
}
