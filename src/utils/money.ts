/**
 * Domain Money & Minor-Unit Representation Utility
 *
 * Provides standardized precision, minor-unit conversions (e.g. cents, kuruş),
 * and currency fraction digit mappings for financial calculations.
 */

export interface Money {
  amountMinor: number;
  currency: string;
}

export const CURRENCY_FRACTION_DIGITS: Record<string, number> = {
  TRY: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
  KRW: 0,
  KWD: 3,
  BHD: 3,
  OMR: 3,
};

export const DEFAULT_FRACTION_DIGITS = 2;

/**
 * Returns the number of decimal digits (fraction digits) for a given currency code.
 */
export function getFractionDigits(currency?: string): number {
  if (!currency) return DEFAULT_FRACTION_DIGITS;
  const upper = currency.toUpperCase().trim();
  return upper in CURRENCY_FRACTION_DIGITS ? CURRENCY_FRACTION_DIGITS[upper] : DEFAULT_FRACTION_DIGITS;
}

/**
 * Converts a standard floating/major currency amount (e.g. 1250.50 TL) to its minor integer unit (e.g. 125050 kuruş).
 */
export function toMinorUnit(amount: number, currency?: string): number {
  if (!Number.isFinite(amount)) return 0;
  const decimals = getFractionDigits(currency);
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor);
}

/**
 * Converts a minor integer unit (e.g. 125050 kuruş) to standard major currency value (e.g. 1250.50 TL).
 */
export function fromMinorUnit(amountMinor: number, currency?: string): number {
  if (!Number.isFinite(amountMinor)) return 0;
  const decimals = getFractionDigits(currency);
  const factor = Math.pow(10, decimals);
  return amountMinor / factor;
}

/**
 * Rounds a monetary amount to the proper precision of the given currency.
 */
export function roundToCurrency(amount: number, currency?: string): number {
  if (!Number.isFinite(amount)) return 0;
  const decimals = getFractionDigits(currency);
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Creates a structured Money object from a major amount and currency.
 */
export function createMoney(amount: number, currency: string = 'TRY'): Money {
  return {
    amountMinor: toMinorUnit(amount, currency),
    currency: currency.toUpperCase().trim() || 'TRY',
  };
}

/**
 * Formats a money value or number with proper fraction digits and locale formatting.
 */
export function formatMoney(
  value: number | Money,
  currencyOverride?: string,
  locale: string = 'tr-TR'
): string {
  let amount: number;
  let currency: string;

  if (typeof value === 'object' && value !== null && 'amountMinor' in value) {
    currency = currencyOverride || value.currency || 'TRY';
    amount = fromMinorUnit(value.amountMinor, currency);
  } else {
    amount = Number(value) || 0;
    currency = currencyOverride || 'TRY';
  }

  const fractionDigits = getFractionDigits(currency);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${amount.toFixed(fractionDigits)} ${currency}`;
  }
}
