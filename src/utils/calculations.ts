import { QuoteItem, Discount } from '@/context/quote/types';

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
    const isFixedDiscount = (item as unknown as { discountType?: string }).discountType === 'fixed';
    const discountVal = Number(item.discountRate) || 0;

    if (isTaxInclusive && taxRate > 0) {
      price = price / (1 + taxRate / 100);
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

    if (item.taxRate > 0) {
      const rateKey = String(item.taxRate);
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

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(item: {
  quantity: number | string;
  price: number | string;
  discountRate?: number | string;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number | string;
  taxMode?: 'exclusive' | 'inclusive';
}): number {
  const quantity = parseFloat(String(item.quantity)) || 0;
  let price = parseFloat(String(item.price)) || 0;
  const taxRate = parseFloat(String(item.taxRate)) || 0;

  if (item.taxMode === 'inclusive' && taxRate > 0) {
    price = price / (1 + taxRate / 100);
  }

  const gross = quantity * price;
  const discountVal = parseFloat(String(item.discountRate)) || 0;

  if (item.discountType === 'fixed') {
    return Math.max(0, gross - discountVal);
  }

  return gross * (1 - Math.min(Math.max(discountVal, 0), 100) / 100);
}

export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
