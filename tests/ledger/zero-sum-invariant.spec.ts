import { describe, it, expect } from 'vitest';
import { LedgerReconciliationEngine, LedgerPosting } from '../../src/ledger/reconciliation-engine';

describe('Double-Entry Ledger Zero-Sum Invariant Suite', () => {
  it('enforces exact equality between aggregate debits and credits in minor units', () => {
    const postings: LedgerPosting[] = [
      { transactionId: 'tx_01', accountId: 'acc_buyer', direction: 'DEBIT', amountMinorUnits: 25000n },
      { transactionId: 'tx_01', accountId: 'acc_merchant', direction: 'CREDIT', amountMinorUnits: 24250n },
      { transactionId: 'tx_01', accountId: 'acc_platform_fee', direction: 'CREDIT', amountMinorUnits: 750n },
    ];

    const report = LedgerReconciliationEngine.verifyZeroSumInvariant(postings);
    expect(report.balanced).toBe(true);
    expect(report.discrepancy).toBe(0n);
  });

  it('detects single-cent imbalance across multi-party split settlements', () => {
    const corruptedPostings: LedgerPosting[] = [
      { transactionId: 'tx_02', accountId: 'acc_buyer', direction: 'DEBIT', amountMinorUnits: 10000n },
      { transactionId: 'tx_02', accountId: 'acc_merchant', direction: 'CREDIT', amountMinorUnits: 9999n },
    ];

    const report = LedgerReconciliationEngine.verifyZeroSumInvariant(corruptedPostings);
    expect(report.balanced).toBe(false);
    expect(report.discrepancy).toBe(1n);
  });
});
