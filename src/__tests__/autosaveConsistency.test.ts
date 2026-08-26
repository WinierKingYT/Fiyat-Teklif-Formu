import { describe, it, expect, vi } from 'vitest';
import { autosaveQuoteService } from '@/application/quote/autosaveQuoteService';
import { saveQuoteService } from '@/application/quote/saveQuoteService';
import {
  type DbQuote,
  type QuoteItem,
  type Discount,
  type QuoteData,
  type CustomerData,
  type CompanyData,
  type BankData,
  type IndexedDBManager,
} from '@/context/quote/types';

describe('Autosave Financial Consistency Regression Test', () => {
  const quoteData: QuoteData = {
    title: 'Hizmet Teklifi',
    number: 'TK-2026-AUTOSAVE',
    date: '2026-08-26',
    validUntil: '2026-09-26',
    validUntilDays: '30',
    description: '',
    terms: '',
    deliveryTerms: '',
    warrantyTerms: '',
    notes: '',
    currency: 'TRY',
    language: 'tr',
    customFields: [],
  };

  const customerData: CustomerData = {
    name: 'Ahmet Yılmaz',
    company: 'Yılmaz A.Ş.',
    email: 'ahmet@yilmaz.com',
    phone: '05551234567',
    address: 'İstanbul',
  };

  const companyData: CompanyData = {
    name: 'Bizim Firma Ltd.',
    authorized: 'Mehmet Demir',
    phone: '02121234567',
    email: 'info@bizimfirma.com',
    website: 'www.bizimfirma.com',
    address: 'İstanbul',
    logo: null,
    signature: null,
    stamp: null,
  };

  const bankData: BankData = {
    bankName: 'İş Bankası',
    branch: 'Levent',
    accountNumber: '123456',
    iban: 'TR120006400000123456789012',
    accountHolder: 'Bizim Firma Ltd.',
  };

  const initialItems: QuoteItem[] = [
    {
      id: '1',
      name: 'Danışmanlık Hizmeti',
      quantity: 2,
      price: 1000,
      taxRate: 20,
      unit: 'Saat',
      total: 2000,
    },
  ];

  const discount: Discount = { type: 'percentage', value: 0 };

  it('should execute autosaveQuoteService and write non-zero exact financial minor units to the database', async () => {
    const storeMap = new Map<number, DbQuote>();
    const originalCreatedAt = '2026-08-26T10:00:00.000';

    const mockDb: IndexedDBManager = {
      get: vi.fn(<T = unknown>(_store: string, key: IDBValidKey): Promise<T | undefined> => {
        return Promise.resolve((storeMap.get(Number(key)) as unknown as T) || undefined);
      }) as IndexedDBManager['get'],
      getAll: vi.fn(<T = unknown>(): Promise<T[]> => {
        return Promise.resolve(Array.from(storeMap.values()) as unknown as T[]);
      }) as IndexedDBManager['getAll'],
      getByIndex: vi.fn() as IndexedDBManager['getByIndex'],
      add: vi.fn(async (_store: string, record: unknown) => {
        const q = record as DbQuote;
        storeMap.set(q.id, q);
        return q.id;
      }),
      put: vi.fn(async (_store: string, record: unknown) => {
        const q = record as DbQuote;
        storeMap.set(q.id, q);
        return q.id;
      }),
      delete: vi.fn(async (_store: string, key: IDBValidKey) => {
        storeMap.delete(Number(key));
      }),
      clear: vi.fn(async () => { storeMap.clear(); }),
      restoreStores: vi.fn(),
      restoreRecycleBinItem: vi.fn(),
      moveToRecycleBin: vi.fn(),
      moveManyToRecycleBin: vi.fn(),
    };

    // 1. Initial manual save (or initial draft save)
    const quoteId = 999123;
    const initialSaved = await saveQuoteService({
      db: mockDb,
      tabSavedQuoteId: null,
      isFinal: false,
      quoteData,
      customerData,
      companyData,
      items: initialItems,
      discount,
      bankData,
    });

    expect(initialSaved.savedQuote.subtotalMinor).toBe(200000); // 2,000.00 TRY = 200,000 minor units
    expect(initialSaved.savedQuote.taxTotalMinor).toBe(40000);  // 400.00 TRY = 40,000 minor units
    expect(initialSaved.savedQuote.grandTotalMinor).toBe(240000); // 2,400.00 TRY = 240,000 minor units

    // Override ID and createdAt in store to verify preservation
    const savedInDb: DbQuote = {
      ...initialSaved.savedQuote,
      id: quoteId,
      createdAt: originalCreatedAt,
      status: 'saved',
    };
    storeMap.set(quoteId, savedInDb);

    // 2. User edits item (price 1000 -> 1500 => subtotal 3000, VAT 20% = 600, grand total = 3600)
    const modifiedItems: QuoteItem[] = [
      {
        ...initialItems[0],
        price: 1500,
        total: 3000,
      },
    ];

    // 3. Execute actual autosaveQuoteService
    const autosavedQuote = await autosaveQuoteService({
      db: mockDb,
      quoteId,
      quoteData,
      customerData,
      companyData,
      items: modifiedItems,
      discount,
      bankData,
    });

    // 4. Verification: Check mock DB received the put call
    expect(mockDb.put).toHaveBeenCalledWith('quotes', expect.objectContaining({ id: quoteId }));

    // 5. Verification: Check financial minor units are NON-ZERO and mathematically precise
    expect(autosavedQuote.subtotalMinor).not.toBe(0);
    expect(autosavedQuote.taxTotalMinor).not.toBe(0);
    expect(autosavedQuote.grandTotalMinor).not.toBe(0);

    expect(autosavedQuote.subtotalMinor).toBe(300000); // 3,000 TRY
    expect(autosavedQuote.taxTotalMinor).toBe(60000);   // 600 TRY
    expect(autosavedQuote.grandTotalMinor).toBe(360000); // 3,600 TRY

    // 6. Verification: Preserved metadata
    expect(autosavedQuote.createdAt).toBe(originalCreatedAt);
    expect(autosavedQuote.status).toBe('saved');

    // 7. Verify the quote in the DB store matches the returned quote
    const storedQuote = storeMap.get(quoteId);
    expect(storedQuote).toBeDefined();
    expect(storedQuote?.grandTotalMinor).toBe(360000);
    expect(storedQuote?.subtotalMinor).toBe(300000);
    expect(storedQuote?.taxTotalMinor).toBe(60000);
  });
});
