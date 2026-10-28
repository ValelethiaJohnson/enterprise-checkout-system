export interface TokenBucketState {
  tokens: number;
  lastRefillTimestampMs: number;
}

export class TokenBucketRateLimiter {
  constructor(
    private readonly capacity: number,
    private readonly refillRatePerSecond: number
  ) {}

  public tryConsume(state: TokenBucketState, nowMs: number, requestedTokens = 1): {
    allowed: boolean;
    updatedState: TokenBucketState;
  } {
    const elapsedSeconds = Math.max(0, (nowMs - state.lastRefillTimestampMs) / 1000);
    const refilledTokens = Math.min(
      this.capacity,
      state.tokens + elapsedSeconds * this.refillRatePerSecond
    );

    if (refilledTokens < requestedTokens) {
      return {
        allowed: false,
        updatedState: { tokens: refilledTokens, lastRefillTimestampMs: nowMs },
      };
    }

    return {
      allowed: true,
      updatedState: {
        tokens: refilledTokens - requestedTokens,
        lastRefillTimestampMs: nowMs,
      },
    };
  }
}
