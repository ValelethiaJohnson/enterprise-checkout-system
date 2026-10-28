export type DisputeSagaState =
  | 'DISPUTE_OPENED'
  | 'MERCHANT_FUNDS_ESCROWED'
  | 'EVIDENCE_SUBMITTED'
  | 'DISPUTE_WON'
  | 'DISPUTE_LOST_CLAWBACK_COMPLETED';

export class ChargebackSagaOrchestrator {
  public static transitionState(
    currentState: DisputeSagaState,
    event: 'LOCK_ESCROW' | 'SUBMIT_EVIDENCE' | 'ISSUER_ACCEPTS' | 'ISSUER_REJECTS'
  ): DisputeSagaState {
    switch (currentState) {
      case 'DISPUTE_OPENED':
        if (event === 'LOCK_ESCROW') return 'MERCHANT_FUNDS_ESCROWED';
        break;
      case 'MERCHANT_FUNDS_ESCROWED':
        if (event === 'SUBMIT_EVIDENCE') return 'EVIDENCE_SUBMITTED';
        break;
      case 'EVIDENCE_SUBMITTED':
        if (event === 'ISSUER_ACCEPTS') return 'DISPUTE_WON';
        if (event === 'ISSUER_REJECTS') return 'DISPUTE_LOST_CLAWBACK_COMPLETED';
        break;
    }
    throw new Error(`Invalid chargeback saga state transition from ${currentState} via ${event}`);
  }
}
