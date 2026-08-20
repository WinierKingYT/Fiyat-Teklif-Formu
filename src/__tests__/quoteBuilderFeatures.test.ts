import { describe, it, expect } from 'vitest';
import { calculateQuoteTotals, calculateLineTotal } from '@/utils/calculations';
import type { QuoteItem } from '@/context/quote/types';

describe('Advanced Quote Builder Calculations & Features', () => {
  it('should compute standard exclusive VAT correctly', () => {
    const items: QuoteItem[] = [
      {
        id: '1',
        name: 'Item 1',
        quantity: 2,
        price: 100,
        taxRate: 20,
        discountRate: 0,
      }
    ];

    const res = calculateQuoteTotals(items, { type: 'fixed', value: 0 }, { taxMode: 'exclusive' });
    expect(res.subtotal).toBe(200);
    expect(res.taxableBase).toBe(200);
    expect(res.taxTotal).toBe(40);
    expect(res.grandTotal).toBe(240);
  });

  it('should compute inclusive VAT correctly (extracting base from price)', () => {
    const items: QuoteItem[] = [
      {
        id: '1',
        name: 'Item 1',
        quantity: 1,
        price: 120, // 120 TRY KDV dahil (%20) => Base = 100, VAT = 20
        taxRate: 20,
        discountRate: 0,
      }
    ];

    const res = calculateQuoteTotals(items, { type: 'fixed', value: 0 }, { taxMode: 'inclusive' });
    expect(res.subtotal).toBe(100);
    expect(res.taxableBase).toBe(100);
    expect(res.taxTotal).toBe(20);
    expect(res.grandTotal).toBe(120);
  });

  it('should support fixed amount line item discounts', () => {
    const items: QuoteItem[] = [
      {
        id: '1',
        name: 'Item with fixed discount',
        quantity: 2,
        price: 100, // Gross = 200
        taxRate: 20,
        discountRate: 50, // 50 TRY fixed discount
        discountType: 'fixed',
      }
    ];

    const res = calculateQuoteTotals(items, { type: 'fixed', value: 0 }, { taxMode: 'exclusive' });
    expect(res.subtotal).toBe(200);
    expect(res.lineDiscountTotal).toBe(50);
    expect(res.netTotal).toBe(150);
    expect(res.taxTotal).toBe(30); // 20% of 150
    expect(res.grandTotal).toBe(180);
  });

  it('calculateLineTotal should handle percentage and fixed discounts and taxMode', () => {
    // Percentage
    const linePercent = calculateLineTotal({ quantity: 2, price: 100, discountRate: 10, discountType: 'percentage' });
    expect(linePercent).toBe(180);

    // Fixed
    const lineFixed = calculateLineTotal({ quantity: 2, price: 100, discountRate: 30, discountType: 'fixed' });
    expect(lineFixed).toBe(170);

    // Inclusive
    const lineInclusive = calculateLineTotal({ quantity: 1, price: 120, taxRate: 20, taxMode: 'inclusive' });
    expect(lineInclusive).toBe(100);
  });
});
