import { calculateQuoteTotals } from '@/utils/calculations';
import { getLocalDateTimeString } from '@/utils/dateUtils';
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
    currency?: string,
) => {
    try {
        const totals = calculateQuoteTotals(items, discount, { currency });
        return {
            subtotalMinor: Math.round(totals.subtotal * 100),
            taxTotalMinor: Math.round(totals.taxTotal * 100),
            grandTotalMinor: Math.round(totals.grandTotal * 100),
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
}: QuoteRecordInput): DbQuote => ({
    id,
    quoteNumber: quoteData.number,
    customerName: customerData.name,
    customerCompany: customerData.company,
    status,
    currency: quoteData.currency,
    ...(calculateTotals ? calculateQuoteTotalsMinor(items, discount, quoteData.currency) : {
        subtotalMinor: 0,
        taxTotalMinor: 0,
        grandTotalMinor: 0,
    }),
    quoteData,
    customerData,
    companyData,
    items,
    discount,
    bankData,
    updatedAt,
    ...(createdAt ? { createdAt } : {}),
});

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
