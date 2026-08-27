/**
 * Parses numbers entered in Turkish/European or English formats.
 * Returns NaN for empty or invalid values so callers can choose their own fallback.
 */
export const parseLocaleNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;

  const input = String(value ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!input) return NaN;

  const hasDot = input.includes('.');
  const hasComma = input.includes(',');
  let normalized = input;

  if (hasDot && hasComma) {
    normalized = input.lastIndexOf(',') > input.lastIndexOf('.')
      ? input.replace(/\./g, '').replace(',', '.')
      : input.replace(/,/g, '');
  } else if (hasComma) {
    normalized = (input.match(/,/g) || []).length > 1
      ? input.replace(/,/g, '')
      : input.replace(',', '.');
  } else if (hasDot) {
    const dotCount = (input.match(/\./g) || []).length;
    if (dotCount > 1) {
      normalized = input.replace(/\./g, '');
    } else {
      const [whole, fraction] = input.split('.');
      // A single three-digit fractional part is conventionally a thousands separator.
      if (fraction?.length === 3 && whole.length <= 3) {
        normalized = input.replace('.', '');
      }
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};
