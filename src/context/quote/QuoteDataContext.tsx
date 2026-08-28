import React, { createContext, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { autosaveQuoteService } from '@/application/quote/autosaveQuoteService';
import { exportDatabaseBackup, importDatabaseBackup } from '@/application/quote/backupService';
import { prepareQuoteForLoading } from '@/application/quote/loadQuoteService';
import { saveQuoteService } from '@/application/quote/saveQuoteService';
import { validateQuoteService } from '@/application/quote/validateQuoteService';
import { saveVersionService, getVersionSnapshotService } from '@/application/quote/versionQuoteService';
import { useCompanyDefaults } from '@/context/quote/CompanyDefaultsContext';
import { useConfirm } from '@/context/quote/ConfirmContext';
import { useDatabase } from '@/context/quote/DatabaseContext';
import {
    getInitialQuoteData, getInitialBankData, getInitialTabData,
} from '@/context/quote/initialState';
import { useSaveStatusSetter } from '@/context/quote/SaveStatusContext';
import { useTab } from '@/context/quote/TabContext';
import {
    type QuoteData, type CustomerData, type CompanyData, type BankData,
    type QuoteItem, type Discount, type Quote,
    type IndexedDBManager, type TabData,
} from '@/context/quote/types';
import tr from '@/i18n/tr.json';
import cleanupService from '@/utils/cleanupService';
import { getLocalDateString } from '@/utils/dateUtils';
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
    const currentTabId = activeTab?.id || activeTabId;
    const isCurrentTab = useCallback((id: string) => id === activeTabId || id === currentTabId, [activeTabId, currentTabId]);
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
            if (isCurrentTab(tab.id)) {
                const newData = { ...tab.data.quoteData, [field]: value };
                return { ...tab, data: { ...tab.data, quoteData: newData } };
            }
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const updateCustomerData = useCallback((field: string, value: unknown) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) {
                const newData = { ...tab.data.customerData, [field]: value };
                let newTitle = tab.title;
                if (field === 'company' && value) newTitle = String(value);
                else if (field === 'name' && value && !newData.company) newTitle = String(value);
                return { ...tab, title: newTitle, data: { ...tab.data, customerData: newData } };
            }
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const setCustomerData = useCallback((newData: Partial<CustomerData>) => {
        const sanitized = sanitizeObject(newData) as Partial<CustomerData>;
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) {
                const merged = { ...tab.data.customerData, ...sanitized };
                const newTitle = merged.company || merged.name || tab.title;
                return { ...tab, title: newTitle, data: { ...tab.data, customerData: merged } };
            }
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const updateCompanyData = useCallback((field: string, value: unknown) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) {
                return { ...tab, data: { ...tab.data, companyData: { ...tab.data.companyData, [field]: value } } };
            }
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const setItems = useCallback((newItems: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => {
        if (typeof newItems === 'function') {
            setTabs(prev => prev.map(tab => {
                if (isCurrentTab(tab.id)) {
                    const resolvedItems = sanitizeObject(newItems(tab.data.items));
                    return { ...tab, data: { ...tab.data, items: resolvedItems } };
                }
                return tab;
            }));
            return;
        }
        const sanitized = sanitizeObject(newItems);
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) return { ...tab, data: { ...tab.data, items: sanitized } };
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const setDiscount = useCallback((newDiscount: Discount) => {
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) return { ...tab, data: { ...tab.data, discount: newDiscount } };
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const updateBankData = useCallback((field: string, value: unknown) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) {
                return { ...tab, data: { ...tab.data, bankData: { ...tab.data.bankData, [field]: value } } };
            }
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

    const setBankData = useCallback((newData: BankData | ((prev: BankData) => BankData)) => {
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) {
                const resolvedData = typeof newData === 'function' ? newData(tab.data.bankData) : newData;
                return { ...tab, data: { ...tab.data, bankData: resolvedData } };
            }
            return tab;
        }));
    }, [isCurrentTab, setTabs]);

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

    // Auto-save with debounce when quote data changes
    const lastSavedDataRef = useRef<string>('');
    const pendingDataRef = useRef<string>('');
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const savedQuoteId = tabs.find(t => isCurrentTab(t.id))?.savedQuoteId;
        if (!isReady || !db || !savedQuoteId) return;

        const currentDataString = JSON.stringify({
            quoteData,
            customerData,
            companyData,
            items,
            discount,
            bankData,
        });

        // Initialize snapshot on first load if not set
        if (!lastSavedDataRef.current) {
            lastSavedDataRef.current = currentDataString;
            return;
        }

        // If data hasn't changed since last save/autosave, skip
        if (lastSavedDataRef.current === currentDataString) {
            return;
        }

        // If the data has already been queued with an active timer, keep the timer running
        if (pendingDataRef.current === currentDataString && autoSaveTimerRef.current) {
            return;
        }

        pendingDataRef.current = currentDataString;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(async () => {
            const currentTab = tabs.find(t => isCurrentTab(t.id));
            if (!currentTab) return;
            const quoteId = currentTab.savedQuoteId;
            if (!quoteId) return;

            setSaveStatus({ status: 'saving', lastSaved: null });

            try {
                await autosaveQuoteService({
                    db,
                    quoteId,
                    quoteData,
                    customerData,
                    companyData,
                    items,
                    discount,
                    bankData,
                });
                lastSavedDataRef.current = currentDataString;
                pendingDataRef.current = '';
                autoSaveTimerRef.current = null;
                setSaveStatus({ status: 'saved', lastSaved: Date.now() });
                setTimeout(() => {
                    setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev);
                }, 2000);
            } catch (e) {
                Logger.error('Auto-save error:', e);
                pendingDataRef.current = '';
                autoSaveTimerRef.current = null;
                setSaveStatus({ status: 'error', lastSaved: null });
                setTimeout(() => {
                    setSaveStatus(prev => prev.status === 'error' ? { status: 'idle', lastSaved: null } : prev);
                }, 4000);
            }
        }, 1500);
    }, [isReady, db, quoteData, customerData, companyData, items, discount, bankData, tabs, isCurrentTab, setSaveStatus]);

    const validateQuote = useCallback((isFinal = false) => {
        return validateQuoteService({ companyData, customerData, items, quoteData, isFinal });
    }, [companyData, customerData, items, quoteData]);

    const saveQuote = useCallback(async (isFinal = false) => {
        if (!isReady) { toast.error(tStatic('dbNotReady')); return; }
        const activeTab = tabs.find(t => isCurrentTab(t.id)) || tabs[0];
        if (!activeTab) return;
        const tabSavedQuoteId = activeTab.savedQuoteId;
        const errors = validateQuote(isFinal);
        if (errors.length > 0) { toast.error(tStatic('fixErrors') + '\n' + errors.join('\n'), { duration: 6000 }); return; }
        setSaveStatus({ status: 'saving', lastSaved: null });

        try {
            const { savedQuote, isNew } = await saveQuoteService({
                db,
                tabSavedQuoteId,
                isFinal,
                quoteData,
                customerData,
                companyData,
                items,
                discount,
                bankData,
            });

            lastSavedDataRef.current = JSON.stringify({
                quoteData,
                customerData,
                companyData,
                items,
                discount,
                bankData,
            });

            if (isNew) {
                setTabs(prev => prev.map(tab => isCurrentTab(tab.id) ? { ...tab, savedQuoteId: savedQuote.id } : tab));
                toast.success(tStatic('quoteSaved'));
            } else {
                toast.success(tStatic('quoteUpdated'));
            }

            Logger.log('Quote saved successfully', savedQuote);
            setSaveStatus({ status: 'saved', lastSaved: Date.now() });
            setTimeout(() => { setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev); }, 3000);
        } catch (error) {
            Logger.error('Error saving quote', error);
            toast.error(tStatic('quoteSaveFailed'));
            setSaveStatus({ status: 'error', lastSaved: null });
            setTimeout(() => { setSaveStatus(prev => prev.status === 'error' ? { status: 'idle', lastSaved: null } : prev); }, 5000);
        }
    }, [isReady, tabs, isCurrentTab, validateQuote, items, discount, quoteData, customerData, companyData, bankData, db, setTabs, setSaveStatus]);

    const loadQuote = useCallback((quote: Partial<Quote>) => {
        const loaded = prepareQuoteForLoading(quote, companyDefaults);
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) {
                return {
                    ...tab,
                    title: loaded.title,
                    savedQuoteId: loaded.savedQuoteId,
                    data: loaded.data,
                };
            }
            return tab;
        }));
        toast.success(tStatic('quoteLoaded'));
    }, [isCurrentTab, companyDefaults, setTabs]);

    const saveVersion = useCallback(async (versionName?: string): Promise<string | null> => {
        if (!isReady || !db) {
            toast.error(tStatic('dbNotReady'));
            return null;
        }
        const activeTab = tabs.find(t => isCurrentTab(t.id)) || tabs[0];
        const quoteId = activeTab?.savedQuoteId || Date.now();

        try {
            const versionId = await saveVersionService({
                db,
                quoteId,
                versionName,
                quoteData,
                customerData,
                companyData,
                items,
                discount,
                bankData,
            });
            toast.success(versionName ? `"${versionName}" ${tStatic('versionSaved')}` : tStatic('versionSnapshotSaved'));
            return versionId;
        } catch (error) {
            Logger.error('Error saving quote version:', error);
            toast.error(tStatic('versionSaveFailed'));
            return null;
        }
    }, [isReady, db, tabs, isCurrentTab, items, discount, quoteData, customerData, companyData, bankData]);

    const revertToVersion = useCallback(async (versionId: string) => {
        if (!isReady || !db) {
            toast.error(tStatic('dbNotReady'));
            return;
        }
        try {
            const snapshot = await getVersionSnapshotService(db, versionId);
            if (!snapshot) {
                toast.error(tStatic('versionNotFound'));
                return;
            }
            loadQuote(snapshot);
            toast.success(tStatic('versionRevertedGeneric'));
        } catch (error) {
            Logger.error('Error reverting to version:', error);
            toast.error(tStatic('versionRevertFailed'));
        }
    }, [isReady, db, loadQuote]);

    const resetQuote = useCallback(() => {
        const initialData = getInitialTabData(companyDefaults);
        lastSavedDataRef.current = '';
        setTabs(prev => prev.map(tab => isCurrentTab(tab.id) ? {
            ...tab,
            title: tStatic('newQuote'),
            savedQuoteId: null,
            data: initialData,
            history: [initialData],
            historyIndex: 0
        } : tab));
    }, [isCurrentTab, companyDefaults, setTabs]);

    useEffect(() => {
        const handleDbReset = () => {
            resetQuote();
        };
        window.addEventListener('db-cleared', handleDbReset);
        return () => window.removeEventListener('db-cleared', handleDbReset);
    }, [resetQuote]);

    const createBackup = useCallback(async () => {
        try {
            await exportDatabaseBackup(db);
            toast.success(tStatic('backupDownloaded'));
        } catch (error) {
            Logger.error('Backup error:', error);
            toast.error(tStatic('backupError'));
        }
    }, [db]);

    const restoreBackup = useCallback(async (file: File) => {
        if (!file) return;
        try {
            await importDatabaseBackup(db, file);
            toast.success(tStatic('backupRestored'));
        } catch (error) {
            Logger.error('Error restoring backup', error);
            toast.error(tStatic('backupRestoreError'));
        }
    }, [db]);

    const fillTestData = useCallback(async () => {
        const today = getLocalDateString();
        const testData = {
            quoteData: {
                ...getInitialQuoteData(),
                title: 'HİZMET VE ÜRÜN SATIŞ TEKLİFİ',
                number: 'TK-2026-001',
                date: today,
                validUntilDays: '15',
                validUntil: '',
                description: 'Kurumsal dijital dönüşüm ve altyapı geliştirme projesi.',
                deliveryTerms: 'Sipariş onayından sonra 3 iş günü içinde kargo/teslimat yapılacaktır.',
                warrantyTerms: 'Tüm ürün ve hizmetler 24 ay distribütör/firma garantilidir.',
                terms: '%50 peşin, %50 teslimatta havale/EFT.',
                notes: 'Fiyatlarımıza montaj ve teknik destek dahildir. Teklifimiz 15 gün süreyle geçerlidir.'
            },
            customerData: {
                name: 'Mehmet Özdemir',
                company: 'Mega Lojistik ve Ticaret Ltd. Şti.',
                email: 'mehmet@megalojistik.com',
                phone: '+90 (532) 555 98 76',
                address: 'Atatürk Mah. Sanayi Cad. No: 28 Kadıköy / İstanbul',
                taxOffice: 'Kadıköy',
                taxNumber: '9876543210'
            },
            companyData: {
                name: 'Atlas Bilişim ve Danışmanlık A.Ş.',
                authorized: 'Ahmet Yılmaz',
                email: 'iletisim@atlasbilisim.com',
                phone: '+90 (212) 555 01 23',
                website: 'www.atlasbilisim.com',
                address: 'Büyükdere Cad. No: 142 Levent / İstanbul',
                taxOffice: 'Beşiktaş',
                taxNumber: '1234567890',
                logo: null,
                signature: null,
                stamp: null
            },
            items: [
                { id: 'item-test-1', name: 'Kurumsal Web Sitesi Tasarımı ve Geliştirme', description: 'Responsive ve SEO uyumlu özel arayüz tasarımı', quantity: 1, unit: 'Hizmet', price: 25000, taxRate: 20, discountRate: 0, total: 25000 },
                { id: 'item-test-2', name: 'Bulut Sunucu ve Güvenlik Altyapısı', description: 'Yıllık yüksek erişilebilir bulut sunucu paketi', quantity: 1, unit: 'Adet', price: 8500, taxRate: 20, discountRate: 10, total: 7650 },
                { id: 'item-test-3', name: 'SEO & Dijital Pazarlama Danışmanlığı', description: 'Aylık arama motoru optimizasyonu ve raporlama', quantity: 3, unit: 'Ay', price: 4500, taxRate: 20, discountRate: 0, total: 13500 },
                { id: 'item-test-4', name: 'SSL Sertifikası ve Kurumsal E-Posta Paketi', description: '25 kullanıcı için kurumsal e-posta ve güvenlik sertifikası', quantity: 1, unit: 'Paket', price: 1800, taxRate: 20, discountRate: 0, total: 1800 },
                { id: 'item-test-5', name: 'Kullanıcı Eğitimi ve Teknik Destek', description: 'Sistem kullanımı ve operasyonel destek', quantity: 5, unit: 'Saat', price: 1200, taxRate: 20, discountRate: 5, total: 5700 },
            ],
            bankData: {
                bankName: 'Garanti BBVA',
                branch: 'Levent Ticari Şubesi (Kod: 1234)',
                accountNumber: '6298745',
                iban: 'TR120006200000000006298745',
                accountHolder: 'Atlas Bilişim ve Danışmanlık A.Ş.'
            },
            discount: { type: 'percentage' as const, value: 5 }
        };
        setTabs(prev => prev.map(tab => {
            if (isCurrentTab(tab.id)) return { ...tab, data: testData as TabData };
            return tab;
        }));
        toast.success(tStatic('testDataAdded') || 'Örnek test verileri yüklendi!');
    }, [setTabs, isCurrentTab]);

    const currentQuoteId = activeTab?.savedQuoteId || null;
    const setCurrentQuoteId = useCallback((id: number | null) => {
        setTabs(prev => prev.map(tab => isCurrentTab(tab.id) ? { ...tab, savedQuoteId: id } : tab));
    }, [isCurrentTab, setTabs]);

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
