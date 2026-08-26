import {
  QuoteData,
  CustomerData,
  CompanyData,
  BankData,
  QuoteItem,
  Discount,
  DbQuote,
  QuoteVersion,
} from '@/context/quote/types';
import { calculateQuoteTotals } from '@/utils/calculations';
import { getLocalDateTimeString } from '@/utils/dateUtils';
import { toMinorUnit } from '@/utils/money';

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
}

export function buildQuoteRecord({
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
}: QuoteRecordInput): DbQuote {
  const currency = quoteData.currency || 'TRY';
  const totals = calculateQuoteTotals(items, discount, { currency });

  return {
    id,
    quoteNumber: quoteData.number,
    customerName: customerData.name,
    customerCompany: customerData.company,
    status,
    currency,
    subtotalMinor: toMinorUnit(totals.subtotal, currency),
    taxTotalMinor: toMinorUnit(totals.taxTotal, currency),
    grandTotalMinor: toMinorUnit(totals.grandTotal, currency),
    quoteData,
    customerData,
    companyData,
    items,
    discount,
    bankData,
    updatedAt,
    ...(createdAt ? { createdAt } : { createdAt: getLocalDateTimeString() }),
  };
}

export function buildQuoteVersionRecord(
  snapshot: DbQuote,
  versionName?: string,
  createdAt = Date.now()
): QuoteVersion {
  return {
    versionId: `ver_${snapshot.id}_${createdAt}`,
    quoteId: snapshot.id,
    createdAt,
    snapshot: JSON.parse(JSON.stringify(snapshot)) as DbQuote,
    versionName: versionName?.trim() || undefined,
  };
}
