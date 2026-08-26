import { QuoteItem, QuoteData, CustomerData, CompanyData } from '@/context/quote/types';
import tr from '@/i18n/tr.json';

const translations: Record<string, string> = tr;
const tStatic = (key: string) => translations[key] || key;

export interface ValidationParams {
  companyData: CompanyData;
  customerData: CustomerData;
  items: QuoteItem[];
  quoteData: QuoteData;
  isFinal?: boolean;
}

export function validateQuoteService({
  companyData,
  customerData,
  items,
  quoteData,
}: ValidationParams): string[] {
  const errors: string[] = [];

  if (!companyData.name) {
    errors.push(tStatic('validationCompanyRequired'));
  }
  if (!customerData.name && !customerData.company) {
    errors.push(tStatic('validationCustomerRequired'));
  }
  if (items.length === 0) {
    errors.push(tStatic('validationItemsRequired'));
  }
  if (!quoteData.number) {
    errors.push(tStatic('validationQuoteNumberRequired'));
  }
  if (!quoteData.currency) {
    errors.push(tStatic('validationCurrencyRequired'));
  }

  items.forEach((item: QuoteItem, i: number) => {
    if (!item.name) {
      errors.push(`${tStatic('row')} ${i + 1}: ${tStatic('validationProductNameRequired')}`);
    }
    if (item.quantity <= 0) {
      errors.push(`${tStatic('row')} ${i + 1}: ${tStatic('validationQuantityInvalid')}`);
    }
    if (item.price < 0) {
      errors.push(`${tStatic('row')} ${i + 1}: ${tStatic('validationPriceInvalid')}`);
    }
  });

  return errors;
}
