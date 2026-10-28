import crypto from 'crypto';

export class MerkleAuditTree {
  public static hashLeaf(data: string): string {
    return crypto.createHash('sha256').update(`0x00:${data}`, 'utf8').digest('hex');
  }

  public static hashNode(leftHash: string, rightHash: string): string {
    return crypto
      .createHash('sha256')
      .update(`0x01:${leftHash}:${rightHash}`, 'utf8')
      .digest('hex');
  }

  public static computeMerkleRoot(entries: string[]): string {
    if (entries.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_LEDGER_BLOCK', 'utf8').digest('hex');
    }

    let currentLevel = entries.map((entry) => this.hashLeaf(entry));

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(this.hashNode(left, right));
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }
}
