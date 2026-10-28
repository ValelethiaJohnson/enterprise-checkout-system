import { describe, it, expect } from 'vitest';
import { CurrencyFxEngine } from '../../src/fx/currency-rounding';
import { MerkleAuditTree } from '../../src/ledger/merkle-audit';

describe('ISO-4217 Bankers Rounding & Cryptographic Merkle Audit Suite', () => {
  it('applies exact half-to-even bankers rounding on equidistant remainders', () => {
    // 5 / 2 = 2.5 -> rounds to even integer 2
    expect(CurrencyFxEngine.convertWithBankersRounding(5n, 1n, 2n)).toBe(2n);
    // 7 / 2 = 3.5 -> rounds to even integer 4
    expect(CurrencyFxEngine.convertWithBankersRounding(7n, 1n, 2n)).toBe(4n);
  });

  it('produces deterministic SHA-256 Merkle roots and detects single-bit tampering', () => {
    const batchA = ['tx_1:1000:USD', 'tx_2:2500:EUR'];
    const batchB = ['tx_1:1000:USD', 'tx_2:2501:EUR'];

    const rootA = MerkleAuditTree.computeMerkleRoot(batchA);
    const rootB = MerkleAuditTree.computeMerkleRoot(batchB);

    expect(rootA).toHaveLength(64);
    expect(rootA).not.toBe(rootB);
  });
});
