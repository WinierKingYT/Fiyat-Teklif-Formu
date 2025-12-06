import { describe, it, expect } from 'vitest';
import { calculateQuoteTotals } from '../utils/calculations';

describe('calculateQuoteTotals', () => {
    it('should return zeros for empty input', () => {
        const result = calculateQuoteTotals([], {});
        expect(result).toEqual({
            subtotal: 0,
            totalTax: 0,
            total: 0,
            discountAmount: 0,
            taxBreakdown: {}
        });
    });

    it('should calculate subtotal correctly for simple items', () => {
        const items = [
            { price: 100, quantity: 2, taxRate: 0 },
            { price: 50, quantity: 1, taxRate: 0 }
        ];
        const result = calculateQuoteTotals(items, {});
        expect(result.subtotal).toBe(250);
        expect(result.total).toBe(250);
    });

    it('should calculate tax correctly', () => {
        const items = [
            { price: 100, quantity: 1, taxRate: 20 }, // Tax: 20
            { price: 200, quantity: 1, taxRate: 10 }  // Tax: 20
        ];
        const result = calculateQuoteTotals(items, {});
        expect(result.subtotal).toBe(300);
        expect(result.totalTax).toBe(40);
        expect(result.total).toBe(340);
        expect(result.taxBreakdown).toEqual({
            '10': 20,
            '20': 20
        });
    });

    it('should apply percentage discount correctly', () => {
        const items = [
            { price: 100, quantity: 1, taxRate: 20 } // Subtotal: 100, Tax: 20
        ];
        // 10% discount
        const discount = { type: 'percentage', value: 10 };

        const result = calculateQuoteTotals(items, discount);

        // Expected:
        // Subtotal: 100
        // Discount: 10 (10% of 100)
        // New Taxable Base effectively: 90
        // Tax: 20 * (1 - 0.10) = 18
        // Total: 100 - 10 + 18 = 108

        expect(result.subtotal).toBe(100);
        expect(result.discountAmount).toBe(10);
        expect(result.totalTax).toBe(18);
        expect(result.total).toBe(108);
    });

    it('should apply fixed discount correctly', () => {
        const items = [
            { price: 100, quantity: 1, taxRate: 20 }
        ];
        // 50 fixed discount
        const discount = { type: 'fixed', value: 50 };

        const result = calculateQuoteTotals(items, discount);

        // Expected:
        // Subtotal: 100
        // Discount: 50
        // Discount Ratio: 0.5
        // Tax: 20 * (1 - 0.5) = 10
        // Total: 100 - 50 + 10 = 60

        expect(result.subtotal).toBe(100);
        expect(result.discountAmount).toBe(50);
        expect(result.totalTax).toBe(10);
        expect(result.total).toBe(60);
    });

    it('should cap discount calculation at subtotal', () => {
        const items = [{ price: 100, quantity: 1, taxRate: 0 }];
        const discount = { type: 'fixed', value: 200 }; // More than subtotal

        const result = calculateQuoteTotals(items, discount);

        expect(result.subtotal).toBe(100);
        expect(result.discountAmount).toBe(100); // Capped
        expect(result.total).toBe(0);
    });

    it('should handle zero quantity or invalid inputs gracefully', () => {
        const items = [
            { price: 100, quantity: 'invalid', taxRate: 0 },
            { price: 'invalid', quantity: 2, taxRate: 0 },
            { price: 100, quantity: 0, taxRate: 20 }
        ];
        const result = calculateQuoteTotals(items, {});
        expect(result.subtotal).toBe(0);
        expect(result.total).toBe(0);
    });
});
