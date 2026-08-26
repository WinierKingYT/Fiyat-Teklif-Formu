import { calculateQuoteTotals } from '@/utils/calculations';
import { getLocalDateTimeString } from '@/utils/dateUtils';
import { toMinorUnit } from '@/utils/money';
import type {
    BankData,
    CompanyData,
    CustomerData,
    DbQuote,
    Discount,
    QuoteData,
    QuoteItem,
    QuoteVersion,
} from '@/context/quote/types';

export interface QuoteRecordInput {
    id: number;
    status: string;
    quoteData: QuoteData;
    customerData: CustomerData;
    companyData: CompanyData;
    items: QuoteItem[];
    discount: Discount;
    bankData: BankData;
    createdAt?: string;
    updatedAt?: string;
    calculateTotals?: boolean;
}

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

export const buildDbQuote = ({
    id,
    status,
    quoteData,
    customerData,
    companyData,
    items,
    discount,
    bankData,
    createdAt,
    updatedAt = getLocalDateTimeString(),
    calculateTotals = true,
}: QuoteRecordInput): DbQuote => {
    const currency = quoteData.currency || 'TRY';
    const totals = calculateTotals
        ? calculateQuoteTotalsMinor(items, discount, currency)
        : calculateQuoteTotalsMinor(items, discount, currency);

    return {
        id,
        quoteNumber: quoteData.number,
        customerName: customerData.name,
        customerCompany: customerData.company,
        status,
        currency,
        ...totals,
        quoteData,
        customerData,
        companyData,
        items,
        discount,
        bankData,
        updatedAt,
        ...(createdAt ? { createdAt } : {}),
    };
};

export const buildQuoteVersion = (
    snapshot: DbQuote,
    versionName?: string,
    createdAt = Date.now(),
): QuoteVersion => ({
    versionId: `ver_${snapshot.id}_${createdAt}`,
    quoteId: snapshot.id,
    createdAt,
    snapshot: JSON.parse(JSON.stringify(snapshot)) as DbQuote,
    versionName: versionName?.trim() || undefined,
});
