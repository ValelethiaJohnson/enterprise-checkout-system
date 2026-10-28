export interface VelocityCheckInput {
  actorId: string;
  attemptCountInWindow: number;
  cumulativeAmountMinorUnits: bigint;
  maxAllowedAttempts: number;
  maxAllowedVolumeMinorUnits: bigint;
}

export interface RiskEvaluationResult {
  decision: 'ALLOW' | 'CHALLENGE_3DS' | 'BLOCK';
  reasonCode: string;
}

export class FraudVelocityEngine {
  public static evaluateTransactionRisk(input: VelocityCheckInput): RiskEvaluationResult {
    if (input.attemptCountInWindow > input.maxAllowedAttempts) {
      return {
        decision: 'BLOCK',
        reasonCode: 'VELOCITY_ATTEMPT_LIMIT_EXCEEDED',
      };
    }

    if (input.cumulativeAmountMinorUnits > input.maxAllowedVolumeMinorUnits) {
      return {
        decision: 'CHALLENGE_3DS',
        reasonCode: 'CUMULATIVE_VOLUME_THRESHOLD_BREACHED',
      };
    }

    return {
      decision: 'ALLOW',
      reasonCode: 'RISK_SCORE_NOMINAL',
    };
  }
}
