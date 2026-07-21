import { describe, it, expect } from 'vitest';
import { calculateQuoteTotals } from '../utils/calculations';

describe('calculateQuoteTotals', () => {
    it('should return zeros for empty input', () => {
        const result = calculateQuoteTotals([], {});
        expect(result.subtotal).toBe(0);
        expect(result.taxTotal).toBe(0);
        expect(result.grandTotal).toBe(0);
        expect(result.globalDiscountAmount).toBe(0);
        expect(result.taxBreakdown).toEqual({});
    });

    it('should calculate subtotal correctly for simple items', () => {
        const items = [
            { price: 100, quantity: 2, taxRate: 0 },
            { price: 50, quantity: 1, taxRate: 0 }
        ];
        const result = calculateQuoteTotals(items, {});
        expect(result.subtotal).toBe(250);
        expect(result.grandTotal).toBe(250);
    });

    it('should calculate tax correctly', () => {
        const items = [
            { price: 100, quantity: 1, taxRate: 20 },
            { price: 200, quantity: 1, taxRate: 10 }
        ];
        const result = calculateQuoteTotals(items, {});
        expect(result.subtotal).toBe(300);
        expect(result.taxTotal).toBe(40);
        expect(result.grandTotal).toBe(340);
        expect(result.taxBreakdown).toEqual({ '10': 20, '20': 20 });
    });

    it('should apply percentage discount correctly', () => {
        const items = [{ price: 100, quantity: 1, taxRate: 20 }];
        const discount = { type: 'percentage', value: 10 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(100);
        expect(result.globalDiscountAmount).toBe(10);
        expect(result.taxTotal).toBe(18);
        expect(result.grandTotal).toBe(108);
    });

    it('should apply fixed discount correctly', () => {
        const items = [{ price: 100, quantity: 1, taxRate: 20 }];
        const discount = { type: 'fixed', value: 50 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(100);
        expect(result.globalDiscountAmount).toBe(50);
        expect(result.taxTotal).toBe(10);
        expect(result.grandTotal).toBe(60);
    });

    it('should cap discount calculation at subtotal', () => {
        const items = [{ price: 100, quantity: 1, taxRate: 0 }];
        const discount = { type: 'fixed', value: 200 };
        const result = calculateQuoteTotals(items, discount);
        expect(result.subtotal).toBe(100);
        expect(result.globalDiscountAmount).toBe(100);
        expect(result.grandTotal).toBe(0);
    });

    it('should handle zero quantity or invalid inputs gracefully', () => {
        const items = [
            { price: 100, quantity: 'invalid', taxRate: 0 },
            { price: 'invalid', quantity: 2, taxRate: 0 },
            { price: 100, quantity: 0, taxRate: 20 }
        ];
        const result = calculateQuoteTotals(items, {});
        expect(result.subtotal).toBe(0);
        expect(result.grandTotal).toBe(0);
    });
});
