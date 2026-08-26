import React, { createContext, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCompanyDefaults } from '@/context/quote/CompanyDefaultsContext';
import { useConfirm } from '@/context/quote/ConfirmContext';
import { useDatabase } from '@/context/quote/DatabaseContext';
import {
    getInitialQuoteData, getInitialCustomerData, getInitialCompanyData, getInitialBankData, getInitialTabData,
} from '@/context/quote/initialState';
import { createLegacyBackup, restoreBackupFile } from '@/context/quote/quoteBackup';
import { buildDbQuote, buildQuoteVersion } from '@/context/quote/quotePersistence';
import { useSaveStatusSetter } from '@/context/quote/SaveStatusContext';
import { useTab } from '@/context/quote/TabContext';
import {
    type QuoteData, type CustomerData, type CompanyData, type BankData,
    type QuoteItem, type Discount, type PdfConfig, type Quote, type SaveStatus,
    type IndexedDBManager, type TabData, type DbQuote, type QuoteVersion,
} from '@/context/quote/types';
import tr from '@/i18n/tr.json';
import cleanupService from '@/utils/cleanupService';
import { getLocalDateString, getLocalDateTimeString } from '@/utils/dateUtils';
import Logger from '@/utils/logger';
import { sanitizeInput, sanitizeObject } from '@/utils/sanitize';

const translations: Record<string, string> = tr;
const tStatic = (key: string) => translations[key] || key;

export interface QuoteDataContextValue {
    quoteData: QuoteData;
    updateQuoteData: (field: string, value: unknown) => void;
    customerData: CustomerData;
    updateCustomerData: (field: string, value: unknown) => void;
    setCustomerData: (data: Partial<CustomerData>) => void;
    companyData: CompanyData;
    updateCompanyData: (field: string, value: unknown) => void;
    items: QuoteItem[];
    setItems: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
    discount: Discount;
    setDiscount: (discount: Discount) => void;
    bankData: BankData;
    updateBankData: (field: string, value: unknown) => void;
    setBankData: (data: BankData | ((prev: BankData) => BankData)) => void;
    saveQuote: (isFinal?: boolean) => Promise<void>;
    loadQuote: (quote: Partial<Quote>) => void;
    resetQuote: () => void;
    fillTestData: () => Promise<void>;
    createBackup: () => Promise<void>;
    restoreBackup: (file: File) => Promise<void>;
    saveVersion: (versionName?: string) => Promise<string | null>;
    revertToVersion: (versionId: string) => Promise<void>;
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

const sanitizeValue = (val: unknown): unknown => {
    if (typeof val === 'string') return sanitizeInput(val);
    return val;
};

export const QuoteDataProvider = ({ children }: { children: React.ReactNode }) => {
    const { db, isReady } = useDatabase();
    const { tabs, activeTabId, setTabs } = useTab();
    const { showConfirm } = useConfirm();
    const { companyDefaults } = useCompanyDefaults();
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
    const updateQuoteData = useCallback((field: string, value: unknown) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const newData = { ...tab.data.quoteData, [field]: value };
                return { ...tab, data: { ...tab.data, quoteData: newData } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const updateCustomerData = useCallback((field: string, value: unknown) => {
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

    const setCustomerData = useCallback((newData: Partial<CustomerData>) => {
        const sanitized = sanitizeObject(newData) as Partial<CustomerData>;
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const merged = { ...tab.data.customerData, ...sanitized };
                const newTitle = merged.company || merged.name || tab.title;
                return { ...tab, title: newTitle, data: { ...tab.data, customerData: merged } };
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const updateCompanyData = useCallback((field: string, value: unknown) => {
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

    const updateBankData = useCallback((field: string, value: unknown) => {
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
                    const settings = await db.get<{ currency?: string }>('settings', 'global');
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
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!isReady || !db || !tabs.find(t => t.id === activeTabId)?.savedQuoteId) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(async () => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (!activeTab) return;
            const quoteId = activeTab.savedQuoteId;
            if (!quoteId) return;
            setSaveStatus({ status: 'saving', lastSaved: null });
            const quote = buildDbQuote({
                id: quoteId,
                status: 'draft',
                quoteData,
                customerData,
                companyData,
                items,
                discount,
                bankData,
                calculateTotals: false,
                createdAt: getLocalDateTimeString(),
            });
            try {
                await db.put('quotes', quote);
                setSaveStatus({ status: 'saved', lastSaved: Date.now() });
                setTimeout(() => {
                    setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev);
                }, 3000);
            } catch (e) {
                Logger.error('Auto-save error:', e);
                setSaveStatus({ status: 'error', lastSaved: null });
                setTimeout(() => {
                    setSaveStatus(prev => prev.status === 'error' ? { status: 'idle', lastSaved: null } : prev);
                }, 5000);
            }
        }, 3000);
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    }, [isReady, db, quoteData, customerData, companyData, items, discount, bankData, tabs, activeTabId, setSaveStatus]);

    const validateQuote = useCallback((isFinal = false) => {
        const errors: string[] = [];
        if (!companyData.name) errors.push(tStatic('validationCompanyRequired'));
        if (!customerData.name && !customerData.company) errors.push(tStatic('validationCustomerRequired'));
        if (items.length === 0) errors.push(tStatic('validationItemsRequired'));
        if (!quoteData.number) errors.push(tStatic('validationQuoteNumberRequired'));
        if (!quoteData.currency) errors.push(tStatic('validationCurrencyRequired'));
        items.forEach((item: QuoteItem, i: number) => {
            if (!item.name) errors.push(`${tStatic('row')} ${i + 1}: ${tStatic('validationProductNameRequired')}`);
            if (item.quantity <= 0) errors.push(`${tStatic('row')} ${i + 1}: ${tStatic('validationQuantityInvalid')}`);
            if (item.price < 0) errors.push(`${tStatic('row')} ${i + 1}: ${tStatic('validationPriceInvalid')}`);
        });
        return errors;
    }, [companyData, customerData, items, quoteData]);

    const saveQuote = useCallback(async (isFinal = false) => {
        if (!isReady) { toast.error(tStatic('dbNotReady')); return; }
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;
        const tabSavedQuoteId = activeTab.savedQuoteId;
        const errors = validateQuote(isFinal);
        if (errors.length > 0) { toast.error(tStatic('fixErrors') + '\n' + errors.join('\n'), { duration: 6000 }); return; }
        setSaveStatus({ status: 'saving', lastSaved: null });
        const quote = buildDbQuote({
            id: tabSavedQuoteId || Date.now(),
            status: isFinal ? 'final' : 'draft',
            quoteData,
            customerData,
            companyData,
            items,
            discount,
            bankData,
            createdAt: tabSavedQuoteId ? undefined : getLocalDateTimeString(),
        });
        try {
            if (tabSavedQuoteId) {
                const existing = await db.get<DbQuote>('quotes', tabSavedQuoteId);
                if (existing) { quote.createdAt = existing.createdAt; quote.status = isFinal ? 'final' : existing.status; }
                await db.put('quotes', quote);
                toast.success(tStatic('quoteUpdated'));
            } else {
                await db.add('quotes', quote);
                setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: quote.id } : tab));
                toast.success(tStatic('quoteSaved'));
            }

            // Otomatik versiyon snapshot'ı
            try {
                const version = buildQuoteVersion(quote, isFinal ? tStatic('finalVersion') : tStatic('autoSave'));
                await db.put('quoteVersions', version);
            } catch (e) {
                Logger.warn('Version snapshot error:', e);
            }

            Logger.log('Quote saved successfully', quote);
            setSaveStatus({ status: 'saved', lastSaved: Date.now() });
            setTimeout(() => { setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev); }, 3000);
        } catch (error) {
            Logger.error('Error saving quote', error);
            toast.error(tStatic('quoteSaveFailed'));
            setSaveStatus({ status: 'error', lastSaved: null });
            setTimeout(() => { setSaveStatus(prev => prev.status === 'error' ? { status: 'idle', lastSaved: null } : prev); }, 5000);
        }
    }, [isReady, tabs, activeTabId, validateQuote, items, discount, quoteData, customerData, companyData, bankData, db, setTabs, setSaveStatus]);

    const loadQuote = useCallback((quote: Partial<Quote>) => {
        const title = quote.customerData?.company || quote.customerData?.name || tStatic('quote');
        const sanitizedQuoteData = sanitizeObject({ ...getInitialQuoteData(), ...(quote.quoteData || {}) }) as QuoteData;
        const sanitizedCustomerData = sanitizeObject({ ...getInitialCustomerData(), ...(quote.customerData || {}) }) as CustomerData;
        const sanitizedCompanyData = sanitizeObject({ ...getInitialCompanyData(), ...(companyDefaults || {}), ...(quote.companyData || {}) }) as CompanyData;
        const sanitizedBankData = sanitizeObject({ ...getInitialBankData(), ...(quote.bankData || {}) }) as BankData;
        const sanitizedItems = sanitizeObject(quote.items || []) as QuoteItem[];
        const sanitizedDiscount = (quote.discount || (quote.discountRate ? { type: 'percentage', value: quote.discountRate } : { type: 'percentage', value: 0 })) as Discount;

        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    title,
                    savedQuoteId: quote.id || null,
                    data: {
                        quoteData: sanitizedQuoteData,
                        customerData: sanitizedCustomerData,
                        companyData: sanitizedCompanyData,
                        bankData: sanitizedBankData,
                        items: sanitizedItems,
                        discount: sanitizedDiscount,
                    }
                };
            }
            return tab;
        }));
        toast.success(tStatic('quoteLoaded'));
    }, [activeTabId, companyDefaults, setTabs]);

    const saveVersion = useCallback(async (versionName?: string): Promise<string | null> => {
        if (!isReady || !db) {
            toast.error(tStatic('dbNotReady'));
            return null;
        }
        const activeTab = tabs.find(t => t.id === activeTabId);
        const quoteId = activeTab?.savedQuoteId || Date.now();
        const snapshot = buildDbQuote({
            id: quoteId,
            status: 'saved',
            quoteData,
            customerData,
            companyData,
            items,
            discount,
            bankData,
            createdAt: getLocalDateTimeString(),
        });
        const version = buildQuoteVersion(snapshot, versionName);
        try {
            await db.put('quoteVersions', version);
            toast.success(versionName ? `"${versionName}" ${tStatic('versionSaved')}` : tStatic('versionSnapshotSaved'));
            return version.versionId;
        } catch (error) {
            Logger.error('Error saving quote version:', error);
            toast.error(tStatic('versionSaveFailed'));
            return null;
        }
    }, [isReady, db, tabs, activeTabId, items, discount, quoteData, customerData, companyData, bankData]);

    const revertToVersion = useCallback(async (versionId: string) => {
        if (!isReady || !db) {
            toast.error(tStatic('dbNotReady'));
            return;
        }
        try {
            const version = await db.get<QuoteVersion>('quoteVersions', versionId);
            if (!version || !version.snapshot) {
                toast.error(tStatic('versionNotFound'));
                return;
            }
            loadQuote(version.snapshot);
            toast.success(version.versionName ? `"${version.versionName}" ${tStatic('versionReverted')}` : tStatic('versionRevertedGeneric'));
        } catch (error) {
            Logger.error('Error reverting to version:', error);
            toast.error(tStatic('versionRevertFailed'));
        }
    }, [isReady, db, loadQuote]);

    const resetQuote = useCallback(() => {
        const initialData = getInitialTabData(companyDefaults);
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? {
            ...tab,
            title: tStatic('newQuote'),
            savedQuoteId: null,
            data: initialData,
            history: [initialData],
            historyIndex: 0
        } : tab));
    }, [activeTabId, companyDefaults, setTabs]);

    useEffect(() => {
        const handleDbReset = () => {
            resetQuote();
        };
        window.addEventListener('db-cleared', handleDbReset);
        return () => window.removeEventListener('db-cleared', handleDbReset);
    }, [resetQuote]);

    const createBackup = useCallback(async () => {
        try {
            await createLegacyBackup(db);
            toast.success(tStatic('backupDownloaded'));
        } catch (error) { Logger.error('Backup error:', error); toast.error(tStatic('backupError')); }
    }, [db]);

    const restoreBackup = useCallback(async (file: File) => {
        if (!file) return;
        try {
            await restoreBackupFile(db, file);
            toast.success(tStatic('backupRestored'));
        } catch (error) {
            Logger.error('Error restoring backup', error);
            toast.error(tStatic('backupRestoreError'));
        }
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
        const confirmed = await showConfirm(tStatic('testDataTitle'), tStatic('testDataConfirm'), 'warning');
        if (!confirmed) return;
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) return { ...tab, data: testData as TabData };
            return tab;
        }));
        toast.success(tStatic('testDataAdded'));
    }, [showConfirm, setTabs, activeTabId]);

    const currentQuoteId = activeTab?.savedQuoteId || null;
    const setCurrentQuoteId = useCallback((id: number | null) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: id } : tab));
    }, [activeTabId, setTabs]);

    const value = useMemo<QuoteDataContextValue>(() => ({
        quoteData, updateQuoteData, customerData, updateCustomerData, setCustomerData,
        companyData, updateCompanyData, items, setItems, discount, setDiscount,
        bankData, updateBankData, setBankData,
        saveQuote, loadQuote, resetQuote, fillTestData, createBackup, restoreBackup,
        saveVersion, revertToVersion,
        currentQuoteId, setCurrentQuoteId, validateQuote,
        db, isReady,
    }), [
        quoteData, updateQuoteData, customerData, updateCustomerData, setCustomerData,
        companyData, updateCompanyData, items, setItems, discount, setDiscount,
        bankData, updateBankData, setBankData,
        saveQuote, loadQuote, resetQuote, fillTestData, createBackup, restoreBackup,
        saveVersion, revertToVersion,
        currentQuoteId, setCurrentQuoteId, validateQuote,
        db, isReady,
    ]);

    return <QuoteDataContext.Provider value={value}>{children}</QuoteDataContext.Provider>;
};
