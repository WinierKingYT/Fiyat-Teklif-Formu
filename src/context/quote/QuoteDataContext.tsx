import React, { createContext, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import Logger from '../../utils/logger';
import toast from 'react-hot-toast';
import cleanupService from '../../utils/cleanupService';
import { sanitizeInput, sanitizeObject } from '../../utils/sanitize';
import { getLocalDateString, getLocalDateTimeString } from '../../utils/dateUtils';
import { calculateQuoteTotals } from '../../utils/calculations';
import { useDatabase } from './DatabaseContext';
import { useTab } from './TabContext';
import { useConfirm } from './ConfirmContext';
import { useSaveStatusSetter } from './SaveStatusContext';
import {
    type QuoteData, type CustomerData, type CompanyData, type BankData,
    type QuoteItem, type Discount, type PdfConfig, type Quote, type SaveStatus,
    type IndexedDBManager, type TabData,
} from './types';
import {
    getInitialQuoteData, getInitialBankData,
} from './initialState';

export interface QuoteDataContextValue {
    quoteData: QuoteData;
    updateQuoteData: (field: string, value: any) => void;
    customerData: CustomerData;
    updateCustomerData: (field: string, value: any) => void;
    companyData: CompanyData;
    updateCompanyData: (field: string, value: any) => void;
    items: QuoteItem[];
    setItems: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
    discount: Discount;
    setDiscount: (discount: Discount) => void;
    bankData: BankData;
    updateBankData: (field: string, value: any) => void;
    setBankData: (data: BankData | ((prev: BankData) => BankData)) => void;
    saveQuote: (isFinal?: boolean) => Promise<void>;
    loadQuote: (quote: Quote) => void;
    resetQuote: () => void;
    fillTestData: () => Promise<void>;
    createBackup: () => Promise<void>;
    restoreBackup: (file: File) => Promise<void>;
    currentQuoteId: number | null;
    setCurrentQuoteId: (id: number | null) => void;
    validateQuote: (isFinal?: boolean) => string[];
    db: IndexedDBManager;
    isReady: boolean;
}

const QuoteDataContext = createContext<QuoteDataContextValue | null>(null);

export const useQuoteData = () => {
    const context = useContext(QuoteDataContext);
    if (!context) throw new Error('useQuoteData must be used within a QuoteDataProvider');
    return context;
};

const sanitizeValue = (val: any) => {
    if (typeof val === 'string') return sanitizeInput(val);
    return val;
};

export const QuoteDataProvider = ({ children }: { children: React.ReactNode }) => {
    const { db, isReady } = useDatabase();
    const { tabs, activeTabId, setTabs } = useTab();
    const { showConfirm } = useConfirm();
    const setSaveStatus = useSaveStatusSetter();

    // Helper to get active tab
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const activeTabData = activeTab.data;

    // Derived State
    const quoteData = activeTabData.quoteData;
    const customerData = activeTabData.customerData;
    const companyData = activeTabData.companyData;
    const items = activeTabData.items;
    const discount = activeTabData.discount;
    const bankData = activeTabData.bankData || getInitialBankData();

    // --- Data Update Actions ---
    const updateQuoteData = useCallback((field: string, value: any) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const newData = { ...tab.data.quoteData, [field]: value };
                return { ...tab, data: { ...tab.data, quoteData: newData } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const updateCustomerData = useCallback((field: string, value: any) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const newData = { ...tab.data.customerData, [field]: value };
                let newTitle = tab.title;
                if (field === 'company' && value) newTitle = String(value);
                else if (field === 'name' && value && !newData.company) newTitle = String(value);
                return { ...tab, title: newTitle, data: { ...tab.data, customerData: newData } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const updateCompanyData = useCallback((field: string, value: any) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return { ...tab, data: { ...tab.data, companyData: { ...tab.data.companyData, [field]: value } } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const setItems = useCallback((newItems: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => {
        if (typeof newItems === 'function') {
            setTabs(prev => prev.map(tab => {
                if (tab.id === activeTabId) {
                    const resolvedItems = sanitizeObject(newItems(tab.data.items));
                    return { ...tab, data: { ...tab.data, items: resolvedItems } };
                }
                return tab;
            }));
            return;
        }
        const sanitized = sanitizeObject(newItems);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) return { ...tab, data: { ...tab.data, items: sanitized } };
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const setDiscount = useCallback((newDiscount: Discount) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) return { ...tab, data: { ...tab.data, discount: newDiscount } };
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const updateBankData = useCallback((field: string, value: any) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return { ...tab, data: { ...tab.data, bankData: { ...tab.data.bankData, [field]: value } } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const setBankData = useCallback((newData: BankData | ((prev: BankData) => BankData)) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const resolvedData = typeof newData === 'function' ? newData(tab.data.bankData) : newData;
                return { ...tab, data: { ...tab.data, bankData: resolvedData } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    // Calculate Valid Until Date
    useEffect(() => {
        if (quoteData.date && quoteData.validUntilDays) {
            const date = new Date(quoteData.date);
            date.setDate(date.getDate() + parseInt(quoteData.validUntilDays));
            const newDate = getLocalDateString(date);
            if (quoteData.validUntil !== newDate) updateQuoteData('validUntil', newDate);
        }
    }, [quoteData.date, quoteData.validUntilDays, updateQuoteData]);

    // Load settings (currency)
    useEffect(() => {
        if (isReady && db) {
            const loadSettings = async () => {
                try {
                    const settings = await db.get('settings', 'global');
                    if (settings && settings.currency) updateQuoteData('currency', settings.currency);
                } catch (error) { Logger.error("Error loading settings:", error); }
            };
            loadSettings();
        }
    }, [isReady, db, updateQuoteData]);

    // Initialize cleanup service
    useEffect(() => {
        if (isReady && db) {
            cleanupService.setDatabase(db);
            cleanupService.performStartupCleanup().catch(err => Logger.error('Startup cleanup failed:', err));
        }
    }, [isReady, db]);

    // Auto-save with debounce
    const autoSaveTimerRef = useRef<any>(null);
    useEffect(() => {
        if (!isReady || !db || !tabs.find(t => t.id === activeTabId)?.savedQuoteId) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (!activeTab) return;
            const quoteId = activeTab.savedQuoteId;
            if (!quoteId) return;
            const quote = {
                id: quoteId, quoteNumber: quoteData.number, customerName: customerData.name,
                customerCompany: customerData.company, status: 'draft', currency: quoteData.currency,
                subtotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 0,
                quoteData, customerData, companyData, items, discount, bankData,
                updatedAt: getLocalDateTimeString(),
            };
            db.put('quotes', quote).catch(e => Logger.error('Auto-save error:', e));
        }, 3000);
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    }, [isReady, db, quoteData, customerData, companyData, items, discount, bankData, tabs, activeTabId]);

    const validateQuote = useCallback((isFinal = false) => {
        const errors: string[] = [];
        if (!companyData.name) errors.push('Firma adı gerekli');
        if (!customerData.name && !customerData.company) errors.push('Müşteri bilgisi gerekli');
        if (items.length === 0) errors.push('En az bir kalem ekleyin');
        if (!quoteData.number) errors.push('Teklif numarası gerekli');
        if (!quoteData.currency) errors.push('Para birimi seçin');
        items.forEach((item: QuoteItem, i: number) => {
            if (!item.name) errors.push(`Satır ${i + 1}: Ürün adı gerekli`);
            if (item.quantity <= 0) errors.push(`Satır ${i + 1}: Miktar geçersiz`);
            if (item.price < 0) errors.push(`Satır ${i + 1}: Fiyat geçersiz`);
        });
        return errors;
    }, [companyData, customerData, items, quoteData]);

    const saveQuote = useCallback(async (isFinal = false) => {
        if (!isReady) { toast.error('Veritabanı hazır değil'); return; }
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;
        const tabSavedQuoteId = activeTab.savedQuoteId;
        const errors = validateQuote(isFinal);
        if (errors.length > 0) { toast.error('Hataları düzeltin:\n' + errors.join('\n'), { duration: 6000 }); return; }
        setSaveStatus({ status: 'saving', lastSaved: null });
        const { subtotalMinor, taxTotalMinor, grandTotalMinor } = (() => {
            try {
                const calc = calculateQuoteTotals(items, discount, { currency: quoteData.currency });
                return { subtotalMinor: Math.round(calc.subtotal * 100), taxTotalMinor: Math.round(calc.taxTotal * 100), grandTotalMinor: Math.round(calc.grandTotal * 100) };
            } catch { return { subtotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 0 }; }
        })();
        const quote: any = {
            id: tabSavedQuoteId || Date.now(), quoteNumber: quoteData.number, customerName: customerData.name,
            customerCompany: customerData.company, status: isFinal ? 'final' : 'draft', currency: quoteData.currency,
            subtotalMinor, taxTotalMinor, grandTotalMinor, quoteData, customerData, companyData, items, discount, bankData,
            updatedAt: getLocalDateTimeString(), createdAt: tabSavedQuoteId ? undefined : getLocalDateTimeString()
        };
        try {
            if (tabSavedQuoteId) {
                const existing = await db.get('quotes', tabSavedQuoteId);
                if (existing) { quote.createdAt = existing.createdAt; quote.status = isFinal ? 'final' : existing.status; }
                await db.put('quotes', quote);
                toast.success('Teklif güncellendi');
            } else {
                await db.add('quotes', quote);
                setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: quote.id } : tab));
                toast.success('Teklif kaydedildi');
            }
            Logger.log('Quote saved successfully', quote);
            setSaveStatus({ status: 'saved', lastSaved: Date.now() });
            setTimeout(() => { setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev); }, 3000);
        } catch (error) {
            Logger.error('Error saving quote', error);
            toast.error('Teklif kaydedilemedi');
            setSaveStatus({ status: 'error', lastSaved: null });
            setTimeout(() => { setSaveStatus({ status: 'idle', lastSaved: null }); }, 5000);
        }
    }, [isReady, tabs, activeTabId, validateQuote, items, discount, quoteData, customerData, companyData, bankData, db, setTabs, setSaveStatus]);

    const loadQuote = useCallback((quote: Quote) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: quote.id } : tab));
        if (quote.quoteData) Object.entries(quote.quoteData).forEach(([key, value]) => updateQuoteData(key, value));
        if (quote.customerData) Object.entries(quote.customerData).forEach(([key, value]) => updateCustomerData(key, value));
        if (quote.companyData) Object.entries(quote.companyData).forEach(([key, value]) => updateCompanyData(key, value));
        if (quote.bankData) Object.entries(quote.bankData).forEach(([key, value]) => updateBankData(key, value));
        if (quote.items) setItems(quote.items);
        if (quote.discount) setDiscount(quote.discount);
        else if (quote.discountRate) setDiscount({ type: 'percentage', value: quote.discountRate });
        toast.success('Teklif yüklendi');
    }, [activeTabId, setTabs, updateQuoteData, updateCustomerData, updateCompanyData, updateBankData, setItems, setDiscount]);

    const resetQuote = useCallback(() => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: null } : tab));
    }, [activeTabId, setTabs]);

    const createBackup = useCallback(async () => {
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                db.getAll('customers'), db.getAll('products'), db.getAll('quotes'),
                db.getAll('templates'), db.getAll('bankInfo')
            ]);
            const data = { customers, products, quotes, templates, banks, exportDate: new Date().toISOString(), version: '2.3' };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `teklifmaster_backup_${getLocalDateString()}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url); toast.success('Yedekleme indirildi');
        } catch (error) { Logger.error('Backup error:', error); toast.error('Yedekleme hatası'); }
    }, [db]);

    const restoreBackup = useCallback(async (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse((event.target as FileReader).result as string);
                if (data.customers) await Promise.all(data.customers.map((item: any) => db.put('customers', item)));
                if (data.products) await Promise.all(data.products.map((item: any) => db.put('products', item)));
                if (data.quotes) await Promise.all(data.quotes.map((item: any) => db.put('quotes', item)));
                if (data.templates) await Promise.all(data.templates.map((item: any) => db.put('templates', item)));
                if (data.banks) await Promise.all(data.banks.map((item: any) => db.put('bankInfo', item)));
                toast.success('Yedekleme geri yüklendi');
            } catch (error) { Logger.error('Error restoring backup', error); toast.error('Yedekleme geri yükleme hatası'); }
        };
        reader.readAsText(file);
    }, [db]);

    const fillTestData = useCallback(async () => {
        const testData = {
            quoteData: { ...getInitialQuoteData(), title: 'Kapsamlı Kurumsal Web Projesi', number: 'T-2023-TEST-001' },
            customerData: { name: 'Ahmet Yılmaz', company: 'Yılmaz Teknoloji A.Ş.', email: 'ahmet@yilmazteknoloji.com', phone: '+90 555 123 45 67', address: 'Teknopark İstanbul' },
            companyData: { name: 'TeklifMaster Bilişim Ltd.', authorized: 'Mehmet Demir', email: 'kurumsal@teklifmaster.com', phone: '+90 850 987 65 43', website: 'https://www.teklifmaster.com', address: 'Maslak, İstanbul' },
            items: [
                { id: '1', name: 'Kurumsal Web Tasarımı', quantity: 1, unit: 'Proje', price: 25000, taxRate: 20 },
                { id: '2', name: 'Frontend Geliştirme', quantity: 1, unit: 'Hizmet', price: 35000, taxRate: 20 },
            ],
            bankData: { bankName: 'Garanti BBVA', branch: 'Maslak', accountNumber: '9876543', iban: 'TR12 0006 2000 0001 2345 6789 01', accountHolder: 'TeklifMaster' },
            discount: { type: 'percentage' as const, value: 10 }
        };
        const confirmed = await showConfirm('Test Verileri', 'Test verileri mevcut verilerin üzerine yazılacak. Devam etmek istiyor musunuz?', 'warning');
        if (!confirmed) return;
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) return { ...tab, data: testData as TabData };
            return tab;
        }));
        toast.success('Test verileri eklendi');
    }, [showConfirm, setTabs, activeTabId]);

    const currentQuoteId = activeTab?.savedQuoteId || null;
    const setCurrentQuoteId = useCallback((id: number | null) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: id } : tab));
    }, [activeTabId, setTabs]);

    const value = useMemo<QuoteDataContextValue>(() => ({
        quoteData, updateQuoteData, customerData, updateCustomerData,
        companyData, updateCompanyData, items, setItems, discount, setDiscount,
        bankData, updateBankData, setBankData,
        saveQuote, loadQuote, resetQuote, fillTestData, createBackup, restoreBackup,
        currentQuoteId, setCurrentQuoteId, validateQuote,
        db, isReady,
    }), [
        quoteData, updateQuoteData, customerData, updateCustomerData,
        companyData, updateCompanyData, items, setItems, discount, setDiscount,
        bankData, updateBankData, setBankData,
        saveQuote, loadQuote, resetQuote, fillTestData, createBackup, restoreBackup,
        currentQuoteId, setCurrentQuoteId, validateQuote,
        db, isReady,
    ]);

    return <QuoteDataContext.Provider value={value}>{children}</QuoteDataContext.Provider>;
};
