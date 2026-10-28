export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'VND' | 'KWD';

const CURRENCY_EXPONENTS: Record<SupportedCurrency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  VND: 0,
  KWD: 3,
};

export class CurrencyFxEngine {
  public static getCurrencyExponent(currency: SupportedCurrency): number {
    return CURRENCY_EXPONENTS[currency];
  }

  public static convertWithBankersRounding(
    amountMinorUnits: bigint,
    rateNumerator: bigint,
    rateDenominator: bigint
  ): bigint {
    if (rateDenominator <= 0n) {
      throw new Error('FX rate denominator must be strictly positive');
    }

    const product = amountMinorUnits * rateNumerator;
    const quotient = product / rateDenominator;
    const remainder = product % rateDenominator;
    const twiceRemainder = remainder * 2n;

    if (twiceRemainder > rateDenominator) {
      return quotient + 1n;
    }
    if (twiceRemainder < rateDenominator) {
      return quotient;
    }
    return quotient % 2n === 0n ? quotient : quotient + 1n;
  }
}
