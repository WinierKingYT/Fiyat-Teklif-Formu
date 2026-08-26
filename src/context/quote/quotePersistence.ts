import {
    buildQuoteRecord,
    buildQuoteVersionRecord,
    type QuoteRecordInput,
} from '@/application/quote/quoteRecordBuilder';
import { calculateQuoteTotals } from '@/utils/calculations';
import { toMinorUnit } from '@/utils/money';
import type {
    DbQuote,
    Discount,
    QuoteItem,
    QuoteVersion,
} from '@/context/quote/types';

export type { QuoteRecordInput };

export const calculateQuoteTotalsMinor = (
    items: QuoteItem[],
    discount: Discount,
    currency: string = 'TRY',
) => {
    try {
        const totals = calculateQuoteTotals(items, discount, { currency });
        return {
            subtotalMinor: toMinorUnit(totals.subtotal, currency),
            taxTotalMinor: toMinorUnit(totals.taxTotal, currency),
            grandTotalMinor: toMinorUnit(totals.grandTotal, currency),
        };
    } catch {
        return { subtotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 0 };
    }
};

export const buildDbQuote = (input: QuoteRecordInput): DbQuote => {
    return buildQuoteRecord(input);
};

export const buildQuoteVersion = (
    snapshot: DbQuote,
    versionName?: string,
    createdAt = Date.now(),
): QuoteVersion => {
    return buildQuoteVersionRecord(snapshot, versionName, createdAt);
};
