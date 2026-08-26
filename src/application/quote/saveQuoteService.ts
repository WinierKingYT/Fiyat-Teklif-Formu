import {
  QuoteData,
  CustomerData,
  CompanyData,
  BankData,
  QuoteItem,
  Discount,
  IndexedDBManager,
  DbQuote,
} from '@/context/quote/types';
import tr from '@/i18n/tr.json';
import Logger from '@/utils/logger';
import { buildQuoteRecord, buildQuoteVersionRecord } from './quoteRecordBuilder';

const translations: Record<string, string> = tr;
const tStatic = (key: string) => translations[key] || key;

export interface SaveQuoteParams {
  db: IndexedDBManager;
  tabSavedQuoteId: number | null;
  isFinal?: boolean;
  quoteData: QuoteData;
  customerData: CustomerData;
  companyData: CompanyData;
  items: QuoteItem[];
  discount: Discount;
  bankData: BankData;
}

export interface SaveQuoteResult {
  savedQuote: DbQuote;
  isNew: boolean;
}

export async function saveQuoteService({
  db,
  tabSavedQuoteId,
  isFinal = false,
  quoteData,
  customerData,
  companyData,
  items,
  discount,
  bankData,
}: SaveQuoteParams): Promise<SaveQuoteResult> {
  const quoteId = tabSavedQuoteId || Date.now();
  let createdAt: string | undefined;
  let status = isFinal ? 'final' : 'draft';

  if (tabSavedQuoteId) {
    try {
      const existing = await db.get<DbQuote>('quotes', tabSavedQuoteId);
      if (existing) {
        if (existing.createdAt) createdAt = existing.createdAt;
        if (isFinal) {
          status = 'final';
        } else if (existing.status === 'draft' || existing.status === 'saved' || existing.status === 'final') {
          status = existing.status;
        }
      }
    } catch (err) {
      Logger.warn('Could not fetch existing quote during save:', err);
    }
  }

  const quote = buildQuoteRecord({
    id: quoteId,
    status,
    quoteData,
    customerData,
    companyData,
    items,
    discount,
    bankData,
    createdAt,
  });

  if (tabSavedQuoteId) {
    await db.put('quotes', quote);
  } else {
    await db.add('quotes', quote);
  }

  // Automatic version snapshot
  try {
    const version = buildQuoteVersionRecord(
      quote,
      isFinal ? tStatic('finalVersion') : tStatic('autoSave')
    );
    await db.put('quoteVersions', version);
  } catch (e) {
    Logger.warn('Version snapshot error:', e);
  }

  return {
    savedQuote: quote,
    isNew: !tabSavedQuoteId,
  };
}
