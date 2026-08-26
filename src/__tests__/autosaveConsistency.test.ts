import { describe, it, expect } from 'vitest';
import { type DbQuote, type QuoteItem, type Discount } from '@/context/quote/types';
import { calculateQuoteTotals } from '@/utils/calculations';

describe('Autosave Financial Consistency Regression Test', () => {
    it('should maintain consistent financial minor units between manual save and autosave', () => {
        const items: QuoteItem[] = [
            {
                id: '1',
                name: 'Danışmanlık Hizmeti',
                quantity: 2,
                price: 1000,
                taxRate: 20,
                unit: 'Saat',
                total: 2000,
            },
        ];

        const discount: Discount = { type: 'percentage', value: 0 };
        const currency = 'TRY';

        // 1. Calculate totals for initial quote
        const initialCalc = calculateQuoteTotals(items, discount, { currency });
        expect(initialCalc.subtotal).toBe(2000);
        expect(initialCalc.taxTotal).toBe(400);
        expect(initialCalc.grandTotal).toBe(2400);

        const initialSubtotalMinor = Math.round(initialCalc.subtotal * 100);
        const initialTaxTotalMinor = Math.round(initialCalc.taxTotal * 100);
        const initialGrandTotalMinor = Math.round(initialCalc.grandTotal * 100);

        expect(initialSubtotalMinor).toBe(200000);
        expect(initialTaxTotalMinor).toBe(40000);
        expect(initialGrandTotalMinor).toBe(240000);

        // 2. Simulate manual save DB Quote
        const manualSavedQuote: DbQuote = {
            id: 101,
            quoteNumber: 'TK-2026-001',
            customerName: 'Test Müşteri',
            customerCompany: 'Test Firma',
            status: 'draft',
            currency,
            subtotalMinor: initialSubtotalMinor,
            taxTotalMinor: initialTaxTotalMinor,
            grandTotalMinor: initialGrandTotalMinor,
            quoteData: {
                title: 'Test',
                number: 'TK-2026-001',
                date: '2026-08-26',
                validUntil: '2026-09-26',
                validUntilDays: '30',
                description: '',
                terms: '',
                deliveryTerms: '',
                warrantyTerms: '',
                notes: '',
                currency,
                language: 'tr',
                customFields: [],
            },
            customerData: { name: 'Test Müşteri', company: 'Test Firma', email: '', phone: '', address: '' },
            companyData: { name: 'Örnek Firma', authorized: '', phone: '', email: '', website: '', address: '', logo: null, signature: null, stamp: null },
            items,
            discount,
            bankData: { bankName: '', branch: '', accountNumber: '', iban: '', accountHolder: '' },
            updatedAt: '2026-08-26T12:00:00',
            createdAt: '2026-08-26T12:00:00',
        };

        expect(manualSavedQuote.grandTotalMinor).toBe(240000);

        // 3. User modifies item (e.g. price becomes 1500)
        const modifiedItems: QuoteItem[] = [
            {
                ...items[0],
                price: 1500,
                total: 3000,
            },
        ];

        // 4. Autosave calculation logic (must calculate non-zero, exact minor units)
        const autosaveCalc = calculateQuoteTotals(modifiedItems, discount, { currency });
        const autosaveSubtotalMinor = Math.round(autosaveCalc.subtotal * 100);
        const autosaveTaxTotalMinor = Math.round(autosaveCalc.taxTotal * 100);
        const autosaveGrandTotalMinor = Math.round(autosaveCalc.grandTotal * 100);

        const autosavedQuote: DbQuote = {
            ...manualSavedQuote,
            items: modifiedItems,
            subtotalMinor: autosaveSubtotalMinor,
            taxTotalMinor: autosaveTaxTotalMinor,
            grandTotalMinor: autosaveGrandTotalMinor,
            updatedAt: '2026-08-26T12:05:00',
        };

        // 5. Verification: Autosave must NOT write 0 to financial totals
        expect(autosavedQuote.subtotalMinor).not.toBe(0);
        expect(autosavedQuote.taxTotalMinor).not.toBe(0);
        expect(autosavedQuote.grandTotalMinor).not.toBe(0);

        expect(autosavedQuote.subtotalMinor).toBe(300000);
        expect(autosavedQuote.taxTotalMinor).toBe(60000);
        expect(autosavedQuote.grandTotalMinor).toBe(360000);
    });
});
