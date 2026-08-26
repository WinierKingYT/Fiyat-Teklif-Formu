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
import tr from '@/i18n/tr.json';
import { calculateQuoteTotals } from '@/utils/calculations';
import { getLocalDateTimeString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';
import { toMinorUnit } from '@/utils/money';

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
  const currency = quoteData.currency || 'TRY';
  const calc = calculateQuoteTotals(items, discount, { currency });
  const subtotalMinor = toMinorUnit(calc.subtotal, currency);
  const taxTotalMinor = toMinorUnit(calc.taxTotal, currency);
  const grandTotalMinor = toMinorUnit(calc.grandTotal, currency);

  const quoteId = tabSavedQuoteId || Date.now();
  let createdAt = getLocalDateTimeString();
  let status: 'draft' | 'saved' | 'final' = isFinal ? 'final' : 'draft';

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

  const quote: DbQuote = {
    id: quoteId,
    quoteNumber: quoteData.number,
    customerName: customerData.name,
    customerCompany: customerData.company,
    status,
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
    updatedAt: getLocalDateTimeString(),
    createdAt,
  };

  if (tabSavedQuoteId) {
    await db.put('quotes', quote);
  } else {
    await db.add('quotes', quote);
  }

  // Automatic version snapshot
  try {
    const versionId = `ver_${quote.id}_${Date.now()}`;
    const version: QuoteVersion = {
      versionId,
      quoteId: quote.id,
      createdAt: Date.now(),
      snapshot: JSON.parse(JSON.stringify(quote)) as DbQuote,
      versionName: isFinal ? tStatic('finalVersion') : tStatic('autoSave'),
    };
    await db.put('quoteVersions', version);
  } catch (e) {
    Logger.warn('Version snapshot error:', e);
  }

  return {
    savedQuote: quote,
    isNew: !tabSavedQuoteId,
  };
}
