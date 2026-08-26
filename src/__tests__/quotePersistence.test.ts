import { describe, expect, it } from 'vitest';
import { getInitialBankData, getInitialCompanyData, getInitialCustomerData, getInitialQuoteData } from '@/context/quote/initialState';
import { buildDbQuote, buildQuoteVersion, calculateQuoteTotalsMinor } from '@/context/quote/quotePersistence';
import type { Discount, QuoteItem } from '@/context/quote/types';

const items: QuoteItem[] = [
    { id: 'item-1', name: 'Danışmanlık', quantity: 2, price: 100, taxRate: 20 },
];
const discount: Discount = { type: 'percentage', value: 10 };

describe('quote persistence helpers', () => {
    it('converts calculated totals to minor units', () => {
        expect(calculateQuoteTotalsMinor(items, discount, 'TRY')).toEqual({
            subtotalMinor: 20000,
            taxTotalMinor: 3600,
            grandTotalMinor: 21600,
        });
    });

    it('builds a database quote without changing the context data shape', () => {
        const quoteData = { ...getInitialQuoteData(), number: 'Q-001', currency: 'TRY' };
        const quote = buildDbQuote({
            id: 42,
            status: 'draft',
            quoteData,
            customerData: { ...getInitialCustomerData(), name: 'Ada' },
            companyData: getInitialCompanyData(),
            items,
            discount,
            bankData: getInitialBankData(),
            createdAt: '2026-01-01T10:00:00',
            updatedAt: '2026-01-01T10:05:00',
        });

        expect(quote).toMatchObject({
            id: 42,
            quoteNumber: 'Q-001',
            customerName: 'Ada',
            subtotalMinor: 20000,
            taxTotalMinor: 3600,
            grandTotalMinor: 21600,
            createdAt: '2026-01-01T10:00:00',
            updatedAt: '2026-01-01T10:05:00',
        });
    });

    it('creates a version snapshot with an immutable copy', () => {
        const quote = buildDbQuote({
            id: 7,
            status: 'saved',
            quoteData: { ...getInitialQuoteData(), number: 'Q-007' },
            customerData: getInitialCustomerData(),
            companyData: getInitialCompanyData(),
            items,
            discount,
            bankData: getInitialBankData(),
        });
        const version = buildQuoteVersion(quote, 'Milestone', 1234);

        expect(version.versionId).toBe('ver_7_1234');
        expect(version.versionName).toBe('Milestone');
        expect(version.snapshot).toEqual(quote);
        expect(version.snapshot).not.toBe(quote);
    });
});
