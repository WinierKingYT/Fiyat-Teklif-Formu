import React from 'react';
import { z } from 'zod';

// ─── Quote Item ─────────────────────────────────────────────────────────────
export const quoteItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ürün/hizmet adı gerekli'),
  description: z.string().optional(),
  quantity: z.union([z.number().positive(), z.string()]).transform((v) => Number(v)),
  unit: z.string().optional(),
  price: z.union([z.number().nonnegative(), z.string()]).transform((v) => Number(v)),
  taxRate: z.union([z.number().nonnegative(), z.string()]).transform((v) => Number(v)),
  discountRate: z.union([z.number().nonnegative(), z.string()]).transform((v) => Number(v)).optional(),
  image: z.string().url().optional(),
  total: z.number().optional(),
});

export type QuoteItem = z.infer<typeof quoteItemSchema>;

// ─── Discount ───────────────────────────────────────────────────────────────
export const discountSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().nonnegative(),
});

export type Discount = z.infer<typeof discountSchema>;

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
});

export type QuoteData = z.infer<typeof quoteDataSchema>;

// ─── Customer Data ──────────────────────────────────────────────────────────
export const customerDataSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional(),
});

export type CustomerData = z.infer<typeof customerDataSchema>;

// ─── Company Data ───────────────────────────────────────────────────────────
export const companyDataSchema = z.object({
  name: z.string().optional(),
  authorized: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  stamp: z.string().nullable().optional(),
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional(),
});

export type CompanyData = z.infer<typeof companyDataSchema>;

// ─── Bank Data ──────────────────────────────────────────────────────────────
export const bankDataSchema = z.object({
  bankName: z.string().optional(),
  branch: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
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
  createdAt: string;
  updatedAt?: string;
  status?: string;
  discountRate?: number;
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

// ─── PDF Config ─────────────────────────────────────────────────────────────
export const pdfConfigSchema = z.object({
  showLogo: z.boolean(),
  showBankInfo: z.boolean(),
  showSignatures: z.boolean(),
  showTerms: z.boolean(),
  showNotes: z.boolean(),
  showSummary: z.boolean(),
  title: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
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
  showQRCode: z.boolean(),
  qrCodeUrl: z.string(),
  showWatermark: z.boolean(),
  watermarkText: z.string(),
  watermarkOpacity: z.number(),
  watermarkColor: z.string(),
  watermarkFontSize: z.number(),
  watermarkRotation: z.number(),
  customFooter: z.string(),
  logoPosition: z.string(),
  theme: z.string(),
  color: z.string(),
  globalFontFamily: z.string(),
  titleFontFamily: z.string(),
  labelFontFamily: z.string(),
  bodyFontFamily: z.string(),
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
  textItem: z.string().optional(),
  textDescription: z.string().optional(),
  textUnit: z.string().optional(),
  textQuantity: z.string().optional(),
  textUnitPrice: z.string().optional(),
  textVat: z.string().optional(),
  textTotal: z.string().optional(),
  enableShadows: z.boolean().optional(),
});

export type PdfConfig = z.infer<typeof pdfConfigSchema>;

// ─── PDF Layout Item ────────────────────────────────────────────────────────
export interface PdfLayoutItem {
  id: string;
  label: string;
  enabled: boolean;
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
  getAll: (storeName: string) => Promise<any[]>;
  get: (storeName: string, id: any) => Promise<any>;
  add: (storeName: string, data: any) => Promise<any>;
  put: (storeName: string, data: any) => Promise<any>;
  delete: (storeName: string, id: any) => Promise<void>;
  getByIndex: (storeName: string, indexName: string, value: any) => Promise<any>;
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
  updateQuoteData: (field: string, value: any) => void;
  updateCustomerData: (field: string, value: any) => void;
  updateCompanyData: (field: string, value: any) => void;
  setItems: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  setDiscount: (discount: Discount) => void;
  updateBankData: (field: string, value: any) => void;
  setBankData: (data: BankData | ((prev: BankData) => BankData)) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Save/Load
  saveQuote: (isFinal?: boolean) => Promise<void>;
  loadQuote: (quote: Quote) => void;
  resetQuote: () => void;
  fillTestData: () => Promise<void>;

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
