export interface LedgerPosting {
  transactionId: string;
  accountId: string;
  direction: 'DEBIT' | 'CREDIT';
  amountMinorUnits: bigint;
}

export interface ReconciliationReport {
  balanced: boolean;
  totalDebits: bigint;
  totalCredits: bigint;
  discrepancy: bigint;
}

export class LedgerReconciliationEngine {
  public static verifyZeroSumInvariant(postings: LedgerPosting[]): ReconciliationReport {
    let totalDebits = 0n;
    let totalCredits = 0n;

    for (const entry of postings) {
      if (entry.amountMinorUnits <= 0n) {
        throw new Error(`Invalid non-positive posting amount in transaction ${entry.transactionId}`);
      }
      if (entry.direction === 'DEBIT') {
        totalDebits += entry.amountMinorUnits;
      } else {
        totalCredits += entry.amountMinorUnits;
      }
    }

    const discrepancy = totalDebits - totalCredits;
    return {
      balanced: discrepancy === 0n,
      totalDebits,
      totalCredits,
      discrepancy,
    };
  }
}
