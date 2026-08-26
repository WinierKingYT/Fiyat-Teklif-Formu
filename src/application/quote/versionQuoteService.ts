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
import Logger from '@/utils/logger';
import { buildQuoteRecord, buildQuoteVersionRecord } from './quoteRecordBuilder';

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
  const snapshot = buildQuoteRecord({
    id: quoteId,
    status: 'saved',
    quoteData,
    customerData,
    companyData,
    items,
    discount,
    bankData,
  });

  const version = buildQuoteVersionRecord(snapshot, versionName);

  try {
    await db.put('quoteVersions', version);
    return version.versionId;
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
