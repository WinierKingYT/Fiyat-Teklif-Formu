import {
  QuoteData,
  CustomerData,
  CompanyData,
  BankData,
  QuoteItem,
  Discount,
  IndexedDBManager,
  DbQuote,
  QuoteVersion,
} from '@/context/quote/types';
import { calculateQuoteTotals } from '@/utils/calculations';
import { getLocalDateTimeString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';
import { toMinorUnit } from '@/utils/money';

export interface SaveVersionParams {
  db: IndexedDBManager;
  quoteId: number;
  versionName?: string;
  quoteData: QuoteData;
  customerData: CustomerData;
  companyData: CompanyData;
  items: QuoteItem[];
  discount: Discount;
  bankData: BankData;
}

export async function saveVersionService({
  db,
  quoteId,
  versionName,
  quoteData,
  customerData,
  companyData,
  items,
  discount,
  bankData,
}: SaveVersionParams): Promise<string | null> {
  const currency = quoteData.currency || 'TRY';
  const calc = calculateQuoteTotals(items, discount, { currency });
  const subtotalMinor = toMinorUnit(calc.subtotal, currency);
  const taxTotalMinor = toMinorUnit(calc.taxTotal, currency);
  const grandTotalMinor = toMinorUnit(calc.grandTotal, currency);

  const snapshot: DbQuote = {
    id: quoteId,
    quoteNumber: quoteData.number,
    customerName: customerData.name,
    customerCompany: customerData.company,
    status: 'saved',
    currency,
    subtotalMinor,
    taxTotalMinor,
    grandTotalMinor,
    quoteData,
    customerData,
    companyData,
    items,
    discount,
    bankData,
    createdAt: getLocalDateTimeString(),
    updatedAt: getLocalDateTimeString(),
  };

  const versionId = `ver_${quoteId}_${Date.now()}`;
  const version: QuoteVersion = {
    versionId,
    quoteId,
    createdAt: Date.now(),
    snapshot: JSON.parse(JSON.stringify(snapshot)) as DbQuote,
    versionName: versionName?.trim() || undefined,
  };

  try {
    await db.put('quoteVersions', version);
    return versionId;
  } catch (error) {
    Logger.error('Error in saveVersionService:', error);
    throw error;
  }
}

export async function getVersionSnapshotService(
  db: IndexedDBManager,
  versionId: string
): Promise<DbQuote | null> {
  try {
    const version = await db.get<QuoteVersion>('quoteVersions', versionId);
    return version?.snapshot || null;
  } catch (error) {
    Logger.error('Error in getVersionSnapshotService:', error);
    throw error;
  }
}
