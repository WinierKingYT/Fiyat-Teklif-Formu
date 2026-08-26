import {
  getInitialQuoteData,
  getInitialCustomerData,
  getInitialCompanyData,
  getInitialBankData,
} from '@/context/quote/initialState';
import {
  Quote,
  QuoteData,
  CustomerData,
  CompanyData,
  BankData,
  QuoteItem,
  Discount,
  TabData,
} from '@/context/quote/types';
import tr from '@/i18n/tr.json';
import { sanitizeObject } from '@/utils/sanitize';

const translations: Record<string, string> = tr;
const tStatic = (key: string) => translations[key] || key;

export interface LoadQuoteResult {
  title: string;
  savedQuoteId: number | null;
  data: TabData;
}

export function prepareQuoteForLoading(
  quote: Partial<Quote>,
  companyDefaults?: Partial<CompanyData> | null
): LoadQuoteResult {
  const title = quote.customerData?.company || quote.customerData?.name || tStatic('quote');
  const sanitizedQuoteData = sanitizeObject({
    ...getInitialQuoteData(),
    ...(quote.quoteData || {}),
  }) as QuoteData;
  const sanitizedCustomerData = sanitizeObject({
    ...getInitialCustomerData(),
    ...(quote.customerData || {}),
  }) as CustomerData;
  const sanitizedCompanyData = sanitizeObject({
    ...getInitialCompanyData(),
    ...(companyDefaults || {}),
    ...(quote.companyData || {}),
  }) as CompanyData;
  const sanitizedBankData = sanitizeObject({
    ...getInitialBankData(),
    ...(quote.bankData || {}),
  }) as BankData;
  const sanitizedItems = sanitizeObject(quote.items || []) as QuoteItem[];
  const sanitizedDiscount = (
    quote.discount ||
    (quote.discountRate ? { type: 'percentage', value: quote.discountRate } : { type: 'percentage', value: 0 })
  ) as Discount;

  return {
    title,
    savedQuoteId: quote.id || null,
    data: {
      quoteData: sanitizedQuoteData,
      customerData: sanitizedCustomerData,
      companyData: sanitizedCompanyData,
      bankData: sanitizedBankData,
      items: sanitizedItems,
      discount: sanitizedDiscount,
    },
  };
}
