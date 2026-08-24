import { getLocalDateString } from '@/utils/dateUtils';
import type { QuoteData, CustomerData, CompanyData, BankData, QuoteItem, Discount, TabData, PdfConfig, PdfLayoutItem, Tab, QuoteNumberConfig } from '@/context/quote/types';

export const getDefaultQuoteNumberConfig = (): QuoteNumberConfig => ({
    template: '{PREFIX}-{YYYY}{MM}-{INDEX:4}',
    prefix: 'TK',
    counter: 1,
    resetPeriod: 'yearly',
    series: [
        { id: 'default', name: 'Standart Seri', prefix: 'TK', template: '{PREFIX}-{YYYY}{MM}-{INDEX:4}', counter: 1 },
        { id: 'export', name: 'İhracat Serisi', prefix: 'EXP', template: '{PREFIX}/{YYYY}/{INDEX:3}', counter: 1 },
        { id: 'project', name: 'Proje Serisi', prefix: 'PRJ', template: '{PREFIX}-{YYYY}-{INDEX:4}', counter: 1 }
    ],
    activeSeriesId: 'default'
});

export const getInitialQuoteData = (): QuoteData => ({
    title: '', number: '', date: getLocalDateString(), validUntilDays: '10',
    validUntil: '', description: '', terms: '', deliveryTerms: '',
    warrantyTerms: '', notes: '', currency: 'TRY', language: 'tr',
    customFields: []
});

export const getInitialCustomerData = (): CustomerData => ({
    name: '', company: '', email: '', phone: '', address: ''
});

export const getInitialCompanyData = (): CompanyData => ({
    name: '', authorized: '', phone: '', email: '', website: '',
    address: '', logo: null, signature: null, stamp: null
});

export const getInitialBankData = (): BankData => ({
    bankName: '', branch: '', accountNumber: '', iban: '', accountHolder: ''
});

export const getInitialItems = (): QuoteItem[] => [];

export const getInitialDiscount = (): Discount => ({
    type: 'percentage', value: 0
});

export const getInitialTabData = (companyDefaults: Partial<CompanyData> | null = null): TabData => ({
    quoteData: getInitialQuoteData(),
    customerData: getInitialCustomerData(),
    companyData: companyDefaults ? { ...getInitialCompanyData(), ...companyDefaults } : getInitialCompanyData(),
    items: getInitialItems(),
    discount: getInitialDiscount(),
    bankData: getInitialBankData()
});

export const getDefaultTabs = (companyDefaults: Partial<CompanyData> | null = null): Tab[] => [{
    id: 'default-tab',
    title: 'Yeni Teklif',
    savedQuoteId: null,
    data: getInitialTabData(companyDefaults),
    history: [],
    historyIndex: -1
}];

export const getDefaultPdfConfig = (): PdfConfig => ({
    showLogo: true, showBankInfo: true, showSignatures: true, showCustomerSignature: false,
    showTerms: true, showNotes: true, showSummary: true,
    title: 'FİYAT TEKLİFİ', fontFamily: 'Inter', fontSize: 12,
    tableHeaderFontSize: 14, tableRowHeight: 35, borderRadius: 6,
    tableHeaderBg: '#f1f5f9', margins: 'normal', pageOrientation: 'portrait',
    showTableImages: true, showTableUnit: true, showTableTax: true,
    showWatermark: false,
    watermarkText: 'TASLAK', watermarkOpacity: 0.1, watermarkColor: '#000000',
    watermarkFontSize: 120, watermarkRotation: -45, customFooter: '',
    logoPosition: 'left', logoStyle: 'square', logoMaxHeight: 50, showPageNumbers: true, pageBgPattern: 'none', theme: 'modern', color: '#000000',
    globalFontFamily: 'Inter', titleFontFamily: '', labelFontFamily: '', bodyFontFamily: '',
    headerTitleFontSize: '1rem', headerTitleFontWeight: '700', headerInfoFontSize: '0.7rem',
    customerTitleFontSize: '0.8rem', customerTitleFontWeight: '600',
    customerLabelFontSize: 'inherit', customerLabelFontWeight: '500',
    customerValueFontSize: 'inherit', customerValueFontWeight: 'normal',
    quoteMetaLabelFontSize: '0.7rem', quoteMetaLabelFontWeight: 'normal',
    quoteMetaValueFontSize: 'inherit', quoteMetaValueFontWeight: '600',
    tableBodyFontSize: '0.7rem', tableBodyFontWeight: 'normal',
    summaryLabelFontSize: '0.75rem', summaryLabelFontWeight: 'normal',
    summaryValueFontSize: 'inherit', summaryValueFontWeight: '500',
    summaryTotalFontSize: '0.9rem', summaryTotalFontWeight: '700',
    footerFontSize: '0.7rem', footerFontWeight: 'normal', itemsPerPage: 20,
    pageBackgroundColor: '#ffffff'
});

export const getDefaultPdfLayout = (): PdfLayoutItem[] => [
    { id: 'header', label: 'Logo ve Başlık', enabled: true },
    { id: 'customer', label: 'Müşteri Bilgileri', enabled: true },
    { id: 'items', label: 'Ürün Tablosu', enabled: true },
    { id: 'notes', label: 'Notlar ve Şartlar', enabled: true },
    { id: 'signatures', label: 'İmza Alanı', enabled: true },
    { id: 'footer', label: 'Alt Bilgi', enabled: true }
];