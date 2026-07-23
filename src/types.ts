export interface QuoteItem {
  id: string;
  name: string;
  description?: string;
  quantity: number | string;
  unit?: string;
  price: number | string;
  taxRate: number | string;
  discountRate?: number | string;
  image?: string;
}

export interface CustomerData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxOffice?: string;
  taxNumber?: string;
}

export interface CompanyData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  taxOffice?: string;
  taxNumber?: string;
}

export interface BankData {
  bankName?: string;
  branch?: string;
  accountType?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  currency?: string;
}

export interface QuoteData {
  title?: string;
  number?: string;
  currency?: string;
  language?: string;
  notes?: string;
  terms?: string;
  createdAt?: string;
  validUntil?: string;
  status?: string;
}

export interface Discount {
  type: 'percentage' | 'amount';
  value: number;
}

export interface Quote {
  id: string;
  quoteData?: QuoteData;
  customerData?: CustomerData;
  companyData?: CompanyData;
  items?: QuoteItem[];
  discount?: Discount;
  bankData?: BankData;
  createdAt: string;
  updatedAt?: string;
}

export interface SettingsData {
  defaultCurrency?: string;
  defaultLanguage?: string;
  theme?: string;
  defaultValidityDays?: number;
}
