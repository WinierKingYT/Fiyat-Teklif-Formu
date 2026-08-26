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
import Logger from '@/utils/logger';
import { buildQuoteRecord } from './quoteRecordBuilder';

export interface AutosaveQuoteParams {
  db: IndexedDBManager;
  quoteId: number;
  quoteData: QuoteData;
  customerData: CustomerData;
  companyData: CompanyData;
  items: QuoteItem[];
  discount: Discount;
  bankData: BankData;
}

export async function autosaveQuoteService({
  db,
  quoteId,
  quoteData,
  customerData,
  companyData,
  items,
  discount,
  bankData,
}: AutosaveQuoteParams): Promise<DbQuote> {
  let createdAt: string | undefined;
  let status = 'draft';

  try {
    const existing = await db.get<DbQuote>('quotes', quoteId);
    if (existing) {
      if (existing.createdAt) createdAt = existing.createdAt;
      if (existing.status === 'draft' || existing.status === 'saved' || existing.status === 'final') {
        status = existing.status;
      }
    }
  } catch (err) {
    Logger.warn('Could not read existing quote during autosave:', err);
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

  await db.put('quotes', quote);
  return quote;
}
