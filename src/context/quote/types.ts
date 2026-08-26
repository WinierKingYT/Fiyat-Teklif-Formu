import React from 'react';
import { z } from 'zod';

// ─── Quote Item ─────────────────────────────────────────────────────────────
const finiteNumber = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
export const quoteItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ürün/hizmet adı gerekli'),
  description: z.string().optional(),
  note: z.string().optional(),
  isRecurring: z.boolean().optional(),
  billingPeriod: z.enum(['one-time', 'monthly', 'yearly', 'weekly']).optional(),
  quantity: z.preprocess(finiteNumber, z.number().positive({ message: 'Miktar >0 olmalı' })),
  unit: z.string().optional(),
  price: z.preprocess(finiteNumber, z.number().nonnegative()),
  taxRate: z.preprocess(finiteNumber, z.number().min(0).max(100)),
  discountRate: z.preprocess((v) => v === undefined || v === '' ? 0 : finiteNumber(v), z.number().min(0).max(1000000).optional()),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  image: z.string().optional(),
  total: z.number().optional(),
});

export type QuoteItem = z.infer<typeof quoteItemSchema>;

// ─── Discount ───────────────────────────────────────────────────────────────
export const discountSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().nonnegative(),
});

export type Discount = z.infer<typeof discountSchema>;

// ─── Custom Field ─────────────────────────────────────────────────────────
export const customFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  type: z.enum(['text', 'date', 'select', 'number']).optional(),
  options: z.array(z.string()).optional(),
  showOnPdf: z.boolean(),
  order: z.number(),
});

export type CustomField = z.infer<typeof customFieldSchema>;

// ─── Quote Number Configuration ─────────────────────────────────────────────
export const quoteNumberSeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(),
  template: z.string(),
  counter: z.number(),
});

export type QuoteNumberSeries = z.infer<typeof quoteNumberSeriesSchema>;

export const quoteNumberConfigSchema = z.object({
  template: z.string(),
  prefix: z.string(),
  counter: z.number(),
  resetPeriod: z.enum(['never', 'yearly', 'monthly', 'daily']),
  lastResetDate: z.string().optional(),
  series: z.array(quoteNumberSeriesSchema).optional(),
  activeSeriesId: z.string().optional(),
});

export type QuoteNumberConfig = z.infer<typeof quoteNumberConfigSchema>;

// ─── Quote Data ─────────────────────────────────────────────────────────────
export const quoteDataSchema = z.object({
  title: z.string().optional(),
  number: z.string().optional(),
  date: z.string().optional(),
  validUntilDays: z.string().optional(),
  validUntil: z.string().optional(),
  description: z.string().optional(),
  terms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  warrantyTerms: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  createdAt: z.string().optional(),
  status: z.string().optional(),
  watermark: z.string().optional(),
  taxMode: z.enum(['exclusive', 'inclusive']).optional(),
  showAmountInWords: z.boolean().optional(),
  customFields: z.array(customFieldSchema).optional(),
});

export type QuoteData = z.infer<typeof quoteDataSchema>;

// ─── Customer Data ──────────────────────────────────────────────────────────
export const customerDataSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional().refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Geçersiz e-posta' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional().refine(v => !v || /^\d{10,11}$/.test(v.replace(/\s/g, '')), { message: 'Vergi no 10-11 hane olmalı' }),
});

export type CustomerData = z.infer<typeof customerDataSchema>;
export type Customer = CustomerData;

export interface Product {
  id?: string | number;
  name: string;
  description?: string;
  price: number | string;
  unit?: string;
  taxRate?: number;
  category?: string;
  image?: string | null;
  createdAt?: string;
}

// ─── Company Data ───────────────────────────────────────────────────────────
export const companyDataSchema = z.object({
  name: z.string().optional(),
  authorized: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Geçersiz e-posta' }),
  website: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  stamp: z.string().nullable().optional(),
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional().refine(v => !v || /^\d{10,11}$/.test(v.replace(/\s/g, '')), { message: 'Vergi no 10-11 hane olmalı' }),
});

export type CompanyData = z.infer<typeof companyDataSchema>;

// ─── Bank Data ──────────────────────────────────────────────────────────────
export const bankDataSchema = z.object({
  bankName: z.string().optional(),
  branch: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional().refine(v => !v || /^TR\d{2}\s?(\d{4}\s?){5}\d{2}$/.test(v.replace(/\s/g, '').toUpperCase()) || /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v.replace(/\s/g, '').toUpperCase()), { message: 'Geçersiz IBAN' }),
});

export type BankData = z.infer<typeof bankDataSchema>;

// ─── Quote (Saved Quote in IndexedDB) ───────────────────────────────────────
export interface Quote {
  id: number;
  quoteData: QuoteData;
  customerData: CustomerData;
  companyData: CompanyData;
  items: QuoteItem[];
  discount: Discount;
  bankData: BankData;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  discountRate?: number;
  discountType?: 'percentage' | 'fixed';
}

// ─── Stored Quote (IndexedDB'de saklanan genişletilmiş şekil) ───────────────
export interface DbQuote extends Quote {
  quoteNumber?: string;
  customerName?: string;
  customerCompany?: string;
  subtotalMinor?: number;
  taxTotalMinor?: number;
  grandTotalMinor?: number;
  currency?: string;
}

// ─── Quote Version (Snapshot) ─────────────────────────────────────────────
export interface QuoteVersion {
  versionId: string;
  quoteId: number;
  createdAt: number;
  snapshot: DbQuote;
  versionName?: string;
}

// ─── Tab Data ───────────────────────────────────────────────────────────────
export interface TabData {
  quoteData: QuoteData;
  customerData: CustomerData;
  companyData: CompanyData;
  items: QuoteItem[];
  discount: Discount;
  bankData: BankData;
}

// ─── Tab ────────────────────────────────────────────────────────────────────
export interface Tab {
  id: string;
  title: string;
  savedQuoteId: number | null;
  data: TabData;
  history: TabData[];
  historyIndex: number;
}

// ─── PDF Config – Faz6: strict (bilinmeyen anahtarları reddet, PII sızıntısını azalt) ──────
export const pdfConfigSchema = z.object({
  showLogo: z.boolean(),
  showBankInfo: z.boolean(),
  showSignatures: z.boolean(),
  showCustomerSignature: z.boolean().default(false),
  showTerms: z.boolean(),
  showNotes: z.boolean(),
  showSummary: z.boolean(),
  title: z.string(),
  fontFamily: z.string(),
  fontSize: z.union([z.number(), z.string()]),
  tableHeaderFontSize: z.number(),
  tableHeaderFontWeight: z.string().optional(),
  tableRowHeight: z.number(),
  borderRadius: z.number(),
  tableHeaderBg: z.string(),
  margins: z.string(),
  pageOrientation: z.enum(['portrait', 'landscape']),
  showTableImages: z.boolean(),
  showTableUnit: z.boolean(),
  showTableTax: z.boolean(),
  showWatermark: z.boolean(),
  watermarkText: z.string(),
  watermarkOpacity: z.number(),
  watermarkColor: z.string(),
  watermarkFontSize: z.number(),
  watermarkRotation: z.number(),
  customFooter: z.string(),
  logoPosition: z.string().default('left'),
  logoStyle: z.enum(['square', 'rounded', 'circle']).default('square'),
  logoMaxHeight: z.number().default(50),
  showPageNumbers: z.boolean().default(true),
  pageBgPattern: z.enum(['none', 'dots', 'grid', 'gradient']).default('none'),
  theme: z.string(),
  color: z.string(),
  globalFontFamily: z.string(),
  globalFontColor: z.string().optional(),
  titleFontFamily: z.string(),
  titleFontSize: z.string().optional(),
  titleFontWeight: z.string().optional(),
  labelFontFamily: z.string(),
  bodyFontFamily: z.string(),
  bodyLineHeight: z.union([z.string(), z.number()]).optional(),
  headerTitleFontSize: z.string(),
  headerTitleFontWeight: z.string(),
  headerInfoFontSize: z.string(),
  customerTitleFontSize: z.string(),
  customerTitleFontWeight: z.string(),
  customerLabelFontSize: z.string(),
  customerLabelFontWeight: z.string(),
  customerValueFontSize: z.string(),
  customerValueFontWeight: z.string(),
  quoteMetaLabelFontSize: z.string(),
  quoteMetaLabelFontWeight: z.string(),
  quoteMetaValueFontSize: z.string(),
  quoteMetaValueFontWeight: z.string(),
  tableBodyFontSize: z.string(),
  tableBodyFontWeight: z.string(),
  summaryLabelFontSize: z.string(),
  summaryLabelFontWeight: z.string(),
  summaryValueFontSize: z.string(),
  summaryValueFontWeight: z.string(),
  summaryTotalFontSize: z.string(),
  summaryTotalFontWeight: z.string(),
  footerFontSize: z.string(),
  footerFontWeight: z.string(),
  itemsPerPage: z.number(),
  // Additional fields used by PdfPreviewPanel
  sectionSpacing: z.number().optional(),
  boxBorderStyle: z.string().optional(),
  tableDensity: z.string().optional(),
  tableHeaderColor: z.string().optional(),
  tableBorderColor: z.string().optional(),
  tableStriped: z.boolean().optional(),
  tableShowVerticalLines: z.boolean().optional(),
  tableHeaderPadding: z.string().optional(),
  tableCellPadding: z.string().optional(),
  pageBackgroundColor: z.string().optional(),
  textItem: z.string().optional(),
  textDescription: z.string().optional(),
  textUnit: z.string().optional(),
  textQuantity: z.string().optional(),
  textUnitPrice: z.string().optional(),
  textDiscount: z.string().optional(),
  textVat: z.string().optional(),
  textTotal: z.string().optional(),
  enableShadows: z.boolean().optional(),
  pageSize: z.enum(['a4', 'a5', 'letter', 'legal']).optional(),
  tableStripedColor: z.string().optional(),
  showCompanyDetails: z.boolean().optional(),
  footerColor: z.string().optional(),
}).strict();

export type PdfConfig = Partial<z.infer<typeof pdfConfigSchema>>;

// ─── PDF Layout Item ────────────────────────────────────────────────────────
export interface PdfLayoutItem {
  id: string;
  label: string;
  enabled: boolean;
  order?: number;
}

// ─── PDF Theme Component Props ──────────────────────────────────────────────
export interface PdfThemeProps {
  id?: string;
  containerStyles?: React.CSSProperties & { pageMinHeight?: string };
  config: PdfConfig;
  color?: string;
  companyData: CompanyData;
  quoteData: QuoteData;
  customerData: CustomerData;
  items: QuoteItem[];
  bankData: BankData;
  signature?: string | null;
  t: Record<string, string>;
  formatDate: (dateString?: string, locale?: string) => string;
  formatCurrency: (amount: number) => string;
  subtotal: number;
  discount?: Discount;
  discountAmount: number;
  totalTax: number;
  total: number;
  currentLocale: string;
  hasLineItemDiscounts?: boolean;
  onEdit?: (fieldKey: string, value: unknown, type?: string) => void;
  activeLayout?: PdfLayoutItem[];
}

// ─── Company Defaults ───────────────────────────────────────────────────────
export type CompanyDefaults = CompanyData;

// ─── Confirm State ──────────────────────────────────────────────────────────
export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: ((value: boolean) => void) | null;
  variant: 'info' | 'warning' | 'danger';
}

// ─── Save Status ────────────────────────────────────────────────────────────
export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: number | null;
}

export interface IndexedDBManager {
  getAll: <T = unknown>(storeName: string, indexName?: string | null) => Promise<T[]>;
  getAllByIndex?: <T = unknown>(storeName: string, indexName: string, query?: IDBValidKey | IDBKeyRange) => Promise<T[]>;
  get: <T = unknown>(storeName: string, key: IDBValidKey) => Promise<T | undefined>;
  add: <T = unknown>(storeName: string, data: T) => Promise<unknown>;
  put: <T = unknown>(storeName: string, data: T) => Promise<unknown>;
  restoreStores: (stores: Record<string, unknown[]>, options?: { mode?: 'replace' | 'merge' }) => Promise<number>;
  restoreRecycleBinItem: (item: {
    id: IDBValidKey;
    originalStore: string;
    originalId?: IDBValidKey;
    deletedAt?: string;
    deletedBy?: string;
    data?: unknown;
    [key: string]: unknown;
  }) => Promise<void>;
  delete: (storeName: string, key: IDBValidKey) => Promise<void>;
  clear: (storeName: string) => Promise<void>;
  getByIndex: <T = unknown>(storeName: string, indexName: string, value: IDBValidKey) => Promise<T | undefined>;
}

// ─── Quote Context Value ────────────────────────────────────────────────────
export interface QuoteContextValue {
  // Tab state
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: () => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  switchTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;

  // Active tab data
  quoteData: QuoteData;
  customerData: CustomerData;
  companyData: CompanyData;
  items: QuoteItem[];
  discount: Discount;
  bankData: BankData;

  // Database
  db: IndexedDBManager;

  // Update functions
  updateQuoteData: (field: string, value: unknown) => void;
  updateCustomerData: (field: string, value: unknown) => void;
  setCustomerData: (data: Partial<CustomerData>) => void;
  updateCompanyData: (field: string, value: unknown) => void;
  setItems: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  setDiscount: (discount: Discount) => void;
  updateBankData: (field: string, value: unknown) => void;
  setBankData: (data: BankData | ((prev: BankData) => BankData)) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Save/Load
  saveQuote: (isFinal?: boolean) => Promise<void>;
  loadQuote: (quote: Partial<Quote>) => void;
  resetQuote: () => void;
  fillTestData: () => Promise<void>;
  saveVersion: (versionName?: string) => Promise<string | null>;
  revertToVersion: (versionId: string) => Promise<void>;

  // Settings
  saveCompanyDefaults: (data: CompanyData) => Promise<void>;
  companyDefaults: CompanyData | null;

  // PDF Config
  pdfConfig: PdfConfig;
  setPdfConfig: React.Dispatch<React.SetStateAction<PdfConfig>>;
  pdfLayout: PdfLayoutItem[];
  setPdfLayout: React.Dispatch<React.SetStateAction<PdfLayoutItem[]>>;

  // Backup
  createBackup: () => Promise<void>;
  restoreBackup: (file: File) => Promise<void>;

  // Confirm dialog
  showConfirm: (title: string, message: string, variant?: 'info' | 'warning' | 'danger') => Promise<boolean>;
  confirmState: ConfirmState;
  handleConfirmResolve: () => void;
  handleConfirmReject: () => void;

  // Auto-save status
  saveStatus: SaveStatus;

  // Validation
  validateQuote: (isFinal?: boolean) => string[];

  // Current quote ID
  currentQuoteId: number | null;
  setCurrentQuoteId: (id: number | null) => void;
}
