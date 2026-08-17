import { describe, it, expect } from 'vitest';
import { calculateQuoteTotals, calculateLineTotal, formatCurrency } from '../utils/calculations';
import { QuoteItem } from '../context/quote/types';

describe('calculateLineTotal', () => {
    it('should calculate basic line total', () => {
        expect(calculateLineTotal({ quantity: 2, price: 100, discountRate: 0 })).toBe(200);
    });

    it('should apply discount rate', () => {
        expect(calculateLineTotal({ quantity: 1, price: 100, discountRate: 10 })).toBe(90);
    });

    it('should handle string inputs', () => {
        expect(calculateLineTotal({ quantity: '3', price: '50', discountRate: '20' })).toBe(120);
    });

    it('should handle missing discountRate', () => {
        expect(calculateLineTotal({ quantity: 2, price: 100 })).toBe(200);
    });

    it('should return 0 for zero quantity', () => {
        expect(calculateLineTotal({ quantity: 0, price: 100 })).toBe(0);
    });

    it('should handle mixed string and number inputs', () => {
        expect(calculateLineTotal({ quantity: '2', price: 100, discountRate: 0 })).toBe(200);
    });
});

describe('formatCurrency', () => {
    it('should format TRY currency', () => {
        const result = formatCurrency(1234.56, 'TRY');
        expect(result).toContain('₺');
        expect(result).toContain('1.234,56');
    });

    it('should format USD currency', () => {
        const result = formatCurrency(1234.56, 'USD');
        expect(result).toContain('$');
        expect(result).toContain('1,234.56');
    });

    it('should format zero', () => {
        const result = formatCurrency(0, 'TRY');
        expect(result).toContain('₺');
    });

    it('should format negative values', () => {
        const result = formatCurrency(-500, 'TRY');
        expect(result).toContain('-');
    });
});

describe('calculateQuoteTotals', () => {
    it('should return zeros for empty input', () => {
        const result = calculateQuoteTotals([]);
        expect(result.subtotal).toBe(0);
        expect(result.taxTotal).toBe(0);
        expect(result.grandTotal).toBe(0);
        expect(result.globalDiscountAmount).toBe(0);
        expect(result.taxBreakdown).toEqual({});
    });

    it('should calculate subtotal correctly for simple items', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 2, taxRate: 0 },
            { id: '2', name: 'Item 2', price: 50, quantity: 1, taxRate: 0 }
        ];
        const result = calculateQuoteTotals(items);
        expect(result.subtotal).toBe(250);
        expect(result.grandTotal).toBe(250);
    });

    it('should calculate tax correctly', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 1, taxRate: 20 },
            { id: '2', name: 'Item 2', price: 200, quantity: 1, taxRate: 10 }
        ];
        const result = calculateQuoteTotals(items);
        expect(result.subtotal).toBe(300);
        expect(result.taxTotal).toBe(40);
        expect(result.grandTotal).toBe(340);
        expect(result.taxBreakdown).toEqual({ '10': 20, '20': 20 });
    });

    it('should apply percentage discount correctly', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 1, taxRate: 20 }
        ];
        const discount = { type: 'percentage' as const, value: 10 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(100);
        expect(result.globalDiscountAmount).toBe(10);
        expect(result.taxTotal).toBe(18);
        expect(result.grandTotal).toBe(108);
    });

    it('should apply fixed discount correctly', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 1, taxRate: 20 }
        ];
        const discount = { type: 'fixed' as const, value: 50 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(100);
        expect(result.globalDiscountAmount).toBe(50);
        expect(result.taxTotal).toBe(10);
        expect(result.grandTotal).toBe(60);
    });

    it('should cap discount calculation at subtotal', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 1, taxRate: 0 }
        ];
        const discount = { type: 'fixed' as const, value: 200 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(100);
        expect(result.globalDiscountAmount).toBe(100);
        expect(result.grandTotal).toBe(0);
    });

    it('should handle zero quantity or invalid inputs gracefully', () => {
        const items = [
            { id: '1', name: 'Item 1', price: 100, quantity: 0, taxRate: 0 },
            { id: '2', name: 'Item 2', price: 0, quantity: 2, taxRate: 0 },
            { id: '3', name: 'Item 3', price: 100, quantity: 0, taxRate: 20 }
        ] as QuoteItem[];
        const result = calculateQuoteTotals(items);
        expect(result.subtotal).toBe(0);
        expect(result.grandTotal).toBe(0);
    });

    it('should apply line-item discountRate', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 1, taxRate: 20, discountRate: 10 }
        ];
        const result = calculateQuoteTotals(items);
        expect(result.subtotal).toBe(100);
        expect(result.items[0].lineDiscount).toBe(10);
        expect(result.items[0].netTotal).toBe(90);
        expect(result.items[0].tax).toBe(18);
        expect(result.grandTotal).toBe(108);
    });

    it('should handle string-typed numeric fields', () => {
        const items = [
            { id: '1', name: 'Item 1', price: '100', quantity: '2', taxRate: '20' }
        ] as unknown as QuoteItem[];
        const result = calculateQuoteTotals(items);
        expect(result.subtotal).toBe(200);
        expect(result.taxTotal).toBe(40);
        expect(result.grandTotal).toBe(240);
    });

    it('should handle multiple tax rates with global discount', () => {
        const items: QuoteItem[] = [
            { id: '1', name: 'Item 1', price: 100, quantity: 1, taxRate: 20 },
            { id: '2', name: 'Item 2', price: 100, quantity: 1, taxRate: 10 }
        ];
        const discount = { type: 'percentage' as const, value: 50 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(200);
        expect(result.globalDiscountAmount).toBe(100);
        expect(result.taxableBase).toBe(100);
        expect(result.taxTotal).toBe(15);
        expect(result.grandTotal).toBe(115);
    });

    it('should return correct currency', () => {
        const result = calculateQuoteTotals([], { type: 'fixed', value: 0 }, { currency: 'USD' });
        expect(result.currency).toBe('USD');
    });

    it('should default to TRY currency', () => {
        const result = calculateQuoteTotals([]);
        expect(result.currency).toBe('TRY');
    });
});
