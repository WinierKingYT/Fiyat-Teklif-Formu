import { QuoteItem, Discount } from '@/context/quote/types';
import { roundToCurrency } from '@/utils/money';
import { parseLocaleNumber } from '@/utils/parseLocaleNumber';

interface CalculatedItem extends QuoteItem {
  quantity: number;
  price: number;
  taxRate: number;
  grossTotal: number;
  lineDiscount: number;
  netTotal: number;
  tax: number;
  lineDiscountRate: number;
}

interface CalculateOptions {
  currency?: string;
  taxMode?: 'exclusive' | 'inclusive';
}

interface TaxBreakdown {
  [rate: string]: number;
}

export interface QuoteTotals {
  items: CalculatedItem[];
  subtotal: number;
  lineDiscountTotal: number;
  netTotal: number;
  globalDiscountAmount: number;
  taxableBase: number;
  taxBreakdown: TaxBreakdown;
  taxTotal: number;
  grandTotal: number;
  currency: string;
}

/**
 * Unified financial calculation engine for quotes.
 *
 * Handles line-item discounts (percentage/fixed), global discounts (percentage/fixed),
 * KDV dahil/hariç modes, proportional tax base reduction, and tax breakdown by rate.
 */
export const calculateQuoteTotals = (
  items: QuoteItem[] = [],
  discount: Discount = { type: 'fixed', value: 0 },
  options: CalculateOptions = {}
): QuoteTotals => {
  const currency = options.currency || 'TRY';
  const isTaxInclusive = options.taxMode === 'inclusive';

  const calculatedItems: CalculatedItem[] = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    let price = Number(item.price) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const isFixedDiscount = item.discountType === 'fixed';
    const discountVal = Number(item.discountRate) || 0;

    if (isTaxInclusive && taxRate > 0) {
      price = roundMoney(price / (1 + taxRate / 100));
    }

    const grossTotal = quantity * price;
    let lineDiscount = 0;
    let lineDiscountRate = 0;

    if (isFixedDiscount) {
      lineDiscount = Math.min(grossTotal, Math.max(0, discountVal));
      lineDiscountRate = grossTotal > 0 ? (lineDiscount / grossTotal) * 100 : 0;
    } else {
      lineDiscountRate = Math.min(Math.max(discountVal, 0), 100);
      lineDiscount = grossTotal * (lineDiscountRate / 100);
    }

    const netTotal = grossTotal - lineDiscount;
    const tax = netTotal * (taxRate / 100);

    return {
      ...item,
      quantity,
      price,
      taxRate,
      grossTotal,
      lineDiscount,
      netTotal,
      tax,
      lineDiscountRate
    };
  });

  const subtotal = calculatedItems.reduce((sum, i) => sum + i.grossTotal, 0);
  const lineDiscountTotal = calculatedItems.reduce((sum, i) => sum + i.lineDiscount, 0);
  const netTotal = calculatedItems.reduce((sum, i) => sum + i.netTotal, 0);

  let globalDiscountAmount = 0;
  let globalDiscountRatio = 0;

  if (netTotal > 0) {
    if (discount?.type === 'percentage') {
      globalDiscountAmount = netTotal * (Math.min(Math.max(Number(discount.value) || 0, 0), 100) / 100);
      globalDiscountRatio = globalDiscountAmount / netTotal;
    } else if (discount?.type === 'fixed') {
      globalDiscountAmount = Math.min(Math.max(Number(discount.value) || 0, 0), netTotal);
      globalDiscountRatio = globalDiscountAmount / netTotal;
    }
  }

  const taxBreakdown: TaxBreakdown = {};
  let taxTotal = 0;

  calculatedItems.forEach(item => {
    const discountedNet = item.netTotal * (1 - globalDiscountRatio);
    const discountedTax = discountedNet * (item.taxRate / 100);

    taxTotal += discountedTax;

    if (item.taxRate !== 0) {
      const rateKey = String(Number(item.taxRate || 0));
      taxBreakdown[rateKey] = (taxBreakdown[rateKey] || 0) + discountedTax;
    }
  });

  Object.keys(taxBreakdown).forEach(rate => {
    taxBreakdown[rate] = roundMoney(taxBreakdown[rate]);
  });
  taxTotal = roundMoney(taxTotal);

  const taxableBase = netTotal - globalDiscountAmount;
  const grandTotal = roundMoney(taxableBase + taxTotal);

  return {
    items: calculatedItems,
    subtotal: roundMoney(subtotal),
    lineDiscountTotal: roundMoney(lineDiscountTotal),
    netTotal: roundMoney(netTotal),
    globalDiscountAmount: roundMoney(globalDiscountAmount),
    taxableBase: roundMoney(taxableBase),
    taxBreakdown,
    taxTotal,
    grandTotal,
    currency
  };
};

function roundMoney(value: number, currency: string = 'TRY'): number {
  return roundToCurrency(value, currency);
}

function parseTrNumber(val: unknown): number {
  const parsed = parseLocaleNumber(val);
  return Number.isFinite(parsed) ? parsed : 0;
}
export function calculateLineTotal(item: {
  quantity: number | string;
  price: number | string;
  discountRate?: number | string;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number | string;
  taxMode?: 'exclusive' | 'inclusive';
}): number {
  const quantity = parseTrNumber(item.quantity);
  let price = parseTrNumber(item.price);
  const taxRate = parseTrNumber(item.taxRate);
  const safeTax = Number.isFinite(taxRate) ? Math.min(Math.max(taxRate, 0), 100) : 0;
  if (item.taxMode === 'inclusive' && safeTax > 0) {
    price = price / (1 + safeTax / 100);
  }
  const gross = (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(price) ? price : 0);
  const discountVal = parseTrNumber(item.discountRate);
  if (item.discountType === 'fixed') {
    return roundMoney(Math.max(0, gross - Math.max(0, discountVal)));
  }
  return roundMoney(gross * (1 - Math.min(Math.max(discountVal, 0), 100) / 100));
}

const CURRENCY_LOCALES: Record<string, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CHF: 'de-CH',
  CAD: 'en-CA',
  AUD: 'en-AU',
  CNY: 'zh-CN',
  RUB: 'ru-RU',
  SAR: 'ar-SA',
  AED: 'ar-AE',
  // Faz5: localeMap genişlet (para/tarih uyumu)
  PLN: 'pl-PL',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  HUF: 'hu-HU',
  CZK: 'cs-CZ',
  RON: 'ro-RO',
  BGN: 'bg-BG',
  HRK: 'hr-HR',
  ILS: 'he-IL',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  SGD: 'en-SG',
  HKD: 'zh-HK',
  INR: 'en-IN',
  ZAR: 'en-ZA',
};

export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  const code = (currency || 'TRY').toUpperCase();
  // Faz5: EUR locale de-DE (virgül ondalık), fallback güvenli
  const locale = CURRENCY_LOCALES[code] ?? (code === 'TRY' ? 'tr-TR' : code === 'EUR' ? 'de-DE' : 'en-US');
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount);
  } catch {
    // vat/tax fallback – güvenli fallback format
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount);
    } catch {
      return `${(Number(amount) || 0).toFixed(2)} ${code}`;
    }
  }
}

export function getCurrencySymbol(currency: string = 'TRY'): string {
  // Faz5: currency kelime USD için de sembol tutarlı
  switch ((currency ?? 'TRY').toUpperCase()) {
    case 'TRY': return '₺';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'CHF': return 'CHF';
    case 'CAD': return 'CA$';
    case 'AUD': return 'AU$';
    case 'RUB': return '₽';
    case 'SAR': return '﷼';
    case 'AED': return 'د.إ';
    case 'PLN': return 'zł';
    case 'SEK': return 'kr';
    case 'NOK': return 'kr';
    case 'DKK': return 'kr';
    default: return currency ?? 'TRY';
  }
}
