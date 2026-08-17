import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import Logger from '../utils/logger';
import toast from 'react-hot-toast';
import cleanupService from '../utils/cleanupService';
import performanceMonitor from '../utils/performanceMonitor';
import { useTranslation } from '../hooks/useTranslation';
import { sanitizeInput, sanitizeObject } from '../utils/sanitize';
import { getLocalDateString, getLocalDateTimeString } from '../utils/dateUtils';
import { calculateQuoteTotals } from '../utils/calculations';
import { deepEqual } from '../utils/deepEqual';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    type QuoteData, type CustomerData, type CompanyData, type BankData,
    type QuoteItem, type Discount, type TabData, type Tab, type PdfConfig,
    type PdfLayoutItem, type QuoteContextValue, type Quote, type SaveStatus,
} from './quote/types';
import {
    getInitialQuoteData, getInitialCustomerData, getInitialCompanyData,
    getInitialBankData, getInitialTabData, getDefaultTabs,
    getDefaultPdfConfig, getDefaultPdfLayout,
} from './quote/initialState';

const QuoteContext = createContext<QuoteContextValue | null>(null);

export const useQuote = () => {
    const context = useContext(QuoteContext);
    if (!context) throw new Error('useQuote must be used within a QuoteProvider');
    return context;
};

const sanitizeValue = (val: any) => {
    if (typeof val === 'string') return sanitizeInput(val);
    return val;
};

export const QuoteProvider = ({ children }: { children: React.ReactNode }) => {
    const { db, isReady } = useIndexedDB();

    // --- Tab Management State ---
    const [tabs, setTabs] = useState<Tab[]>(getDefaultTabs());

    const [activeTabId, setActiveTabId] = useState(() => {
        return localStorage.getItem('activeTabId') || 'default-tab';
    });

    // Confirm dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean; title: string; message: string;
        resolve: ((value: boolean) => void) | null; variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', resolve: null, variant: 'info' });

    const showConfirm = useCallback((title: string, message: string, variant: 'info' | 'warning' | 'danger' = 'info') => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({ isOpen: true, title, message, resolve, variant });
        });
    }, []);

    const handleConfirmResolve = useCallback(() => {
        confirmState.resolve?.(true);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, [confirmState.resolve]);

    const handleConfirmReject = useCallback(() => {
        confirmState.resolve?.(false);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, [confirmState.resolve]);

    // --- Load tabs from IndexedDB ---
    useEffect(() => {
        if (isReady && db) {
            const loadTabs = async () => {
                try {
                    const savedTabs = await db.getByIndex('settings', 'key', 'session_tabs');
                    if (savedTabs && savedTabs.value) {
                        setTabs(savedTabs.value);
                    } else {
                        const localTabs = localStorage.getItem('quoteTabs');
                        if (localTabs) {
                            try {
                                const parsedTabs = JSON.parse(localTabs);
                                setTabs(parsedTabs);
                                await db.add('settings', { id: 'session_tabs', key: 'session_tabs', value: parsedTabs });
                                localStorage.removeItem('quoteTabs');
                                Logger.log("Migrated tabs from localStorage to IndexedDB");
                            } catch (e) { Logger.error("Failed to migrate tabs from localStorage", e); }
                        }
                    }
                } catch (error) { Logger.error("Error loading tabs from IndexedDB:", error); }
            };
            loadTabs();
        }
    }, [isReady, db]);

    // --- Save tabs to IndexedDB ---
    useEffect(() => {
        if (isReady && db) {
            const saveTabs = async () => {
                try {
                    const existingRecord = await db.getByIndex('settings', 'key', 'session_tabs');
                    const record = { id: 'session_tabs', key: 'session_tabs', value: tabs };
                    if (existingRecord) { record.id = existingRecord.id; await db.put('settings', record); }
                    else { await db.add('settings', record); }
                } catch (error) { Logger.error("Error saving tabs to IndexedDB:", error); }
            };
            const timeoutId = setTimeout(saveTabs, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [tabs, isReady, db]);

    // Save activeTabId to localStorage
    useEffect(() => { localStorage.setItem('activeTabId', activeTabId); }, [activeTabId]);

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

    // Company Defaults State
    const [companyDefaults, setCompanyDefaults] = useState<CompanyData | null>(null);

    // --- Tab Actions ---
    const addTab = async () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if ((currentTab?.data?.items?.length ?? 0) > 0) {
            const confirmed = await showConfirm('Yeni Sekme', 'Mevcut teklifte kaydedilmemiş değişiklikler olabilir. Yeni sekme açmak istiyor musunuz?', 'warning');
            if (!confirmed) return;
        }
        const newTabId = `tab-${Date.now()}`;
        const newTab: Tab = {
            id: newTabId, title: 'Yeni Teklif', savedQuoteId: null,
            data: getInitialTabData(companyDefaults),
            history: [], historyIndex: -1
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTabId);
    };

    const closeTab = async (tabId: string) => {
        if (tabs.length === 1) { toast.error("Son sekmeyi kapatamazsınız."); return; }
        const tabToClose = tabs.find(t => t.id === tabId);
        if ((tabToClose?.data?.items?.length ?? 0) > 0) {
            const confirmed = await showConfirm('Sekmeyi Kapat', 'Bu sekmede kaydedilmemiş değişiklikler olabilir. Kapatmak istiyor musunuz?', 'warning');
            if (!confirmed) return;
        }
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId) setActiveTabId(newTabs[newTabs.length - 1].id);
    };

    const switchTab = (tabId: string) => setActiveTabId(tabId);

    const updateTabTitle = (tabId: string, title: string) => {
        setTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, title } : tab));
    };

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
    }, [activeTabId]);

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
    }, [activeTabId]);

    const updateCompanyData = useCallback((field: string, value: any) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return { ...tab, data: { ...tab.data, companyData: { ...tab.data.companyData, [field]: value } } };
            }
            return tab;
        }));
    }, [activeTabId]);

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
    }, [activeTabId]);

    const setDiscount = useCallback((newDiscount: Discount) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) return { ...tab, data: { ...tab.data, discount: newDiscount } };
            return tab;
        }));
    }, [activeTabId]);

    const updateBankData = useCallback((field: string, value: any) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return { ...tab, data: { ...tab.data, bankData: { ...tab.data.bankData, [field]: value } } };
            }
            return tab;
        }));
    }, [activeTabId]);

    const setBankData = useCallback((newData: BankData | ((prev: BankData) => BankData)) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const resolvedData = typeof newData === 'function' ? newData(tab.data.bankData) : newData;
                return { ...tab, data: { ...tab.data, bankData: resolvedData } };
            }
            return tab;
        }));
    }, [activeTabId]);

    // PDF Configuration State
    const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() => {
        const savedConfig = localStorage.getItem('pdfConfig');
        try { return savedConfig ? { ...getDefaultPdfConfig(), ...JSON.parse(savedConfig) } : getDefaultPdfConfig(); }
        catch { return getDefaultPdfConfig(); }
    });

    useEffect(() => { localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig)); }, [pdfConfig]);

    // PDF Layout State
    const [pdfLayout, setPdfLayout] = useState<PdfLayoutItem[]>(() => {
        try {
            const savedLayout = localStorage.getItem('pdfLayout');
            const parsed = (savedLayout && savedLayout !== 'undefined') ? JSON.parse(savedLayout) : null;
            if (Array.isArray(parsed)) return parsed;
        } catch (e) { Logger.error('Error parsing pdfLayout:', e); }
        return getDefaultPdfLayout();
    });

    // History State
    const historyTimeoutRef = useRef<any>(null);
    const isNavigatingHistory = useRef(false);

    const undo = useCallback(() => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                if (tab.historyIndex > 0) {
                    isNavigatingHistory.current = true;
                    const newIndex = tab.historyIndex - 1;
                    const previousData = tab.history[newIndex];
                    return { ...tab, data: JSON.parse(JSON.stringify(previousData)), historyIndex: newIndex };
                }
            }
            return tab;
        }));
        toast.success('Geri alındı');
    }, [activeTabId]);

    const redo = useCallback(() => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                if (tab.historyIndex < tab.history.length - 1) {
                    isNavigatingHistory.current = true;
                    const newIndex = tab.historyIndex + 1;
                    const nextData = tab.history[newIndex];
                    return { ...tab, data: JSON.parse(JSON.stringify(nextData)), historyIndex: newIndex };
                }
            }
            return tab;
        }));
        toast.success('İleri alındı');
    }, [activeTabId]);

    // Auto-save history effect
    useEffect(() => {
        if (isNavigatingHistory.current) { isNavigatingHistory.current = false; return; }
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;
        if (!activeTab.history || activeTab.history.length === 0) {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) return { ...t, history: [JSON.parse(JSON.stringify(t.data))], historyIndex: 0 };
                return t;
            }));
            return;
        }
        const currentHistoryState = activeTab.history[activeTab.historyIndex];
        if (!deepEqual(activeTab.data, currentHistoryState)) {
            if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
            historyTimeoutRef.current = setTimeout(() => {
                setTabs(prev => prev.map(t => {
                    if (t.id === activeTabId) {
                        const newHistory = t.history.slice(0, t.historyIndex + 1);
                        newHistory.push(JSON.parse(JSON.stringify(t.data)));
                        if (newHistory.length > 50) newHistory.shift();
                        return { ...t, history: newHistory, historyIndex: newHistory.length - 1 };
                    }
                    return t;
                }));
            }, 1000);
        }
        return () => { if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current); };
    }, [tabs, activeTabId]);

    const activeTabObj = tabs.find(t => t.id === activeTabId);
    const canUndo = activeTabObj ? activeTabObj.historyIndex > 0 : false;
    const canRedo = activeTabObj ? activeTabObj.historyIndex < (activeTabObj.history?.length || 0) - 1 : false;

    // Calculate Valid Until Date
    useEffect(() => {
        if (quoteData.date && quoteData.validUntilDays) {
            const date = new Date(quoteData.date);
            date.setDate(date.getDate() + parseInt(quoteData.validUntilDays));
            const newDate = getLocalDateString(date);
            if (quoteData.validUntil !== newDate) updateQuoteData('validUntil', newDate);
        }
    }, [quoteData.date, quoteData.validUntilDays, updateQuoteData]);

    // Load settings
    useEffect(() => {
        if (isReady && db) {
            const loadSettings = async () => {
                try {
                    const settings = await db.get('settings', 'global');
                    if (settings && settings.currency) updateQuoteData('currency', settings.currency);
                    const defaultsRecord = await db.getByIndex('settings', 'key', 'company_defaults');
                    if (defaultsRecord && defaultsRecord.value) setCompanyDefaults(defaultsRecord.value);
                } catch (error) { Logger.error("Error loading settings:", error); }
            };
            loadSettings();
        }
    }, [isReady, db]);

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

    // Performance monitoring
    useEffect(() => {
        if (!isReady || !db) return;
        const checkPerformance = async () => {
            try {
                const metrics = await performanceMonitor.getPerformanceMetrics(db, tabs);
                const recommendations = performanceMonitor.getRecommendations(metrics);
                if (recommendations.needsCleanup) {
                    const highWarnings = recommendations.warnings.filter((w: any) => w.severity === 'high');
                    if (highWarnings.length > 0) toast('Performans uyarısı: ' + highWarnings[0].message, { duration: 5000, icon: '⚠️' });
                }
            } catch (error) { Logger.error('Performance check failed:', error); }
        };
        const interval = setInterval(checkPerformance, 5 * 60 * 1000);
        const timeout = setTimeout(checkPerformance, 60 * 1000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [isReady, db, tabs]);

    const saveCompanyDefaults = async (data: CompanyData) => {
        if (!isReady || !db) return;
        try {
            await db.put('settings', { id: 'company_defaults', key: 'company_defaults', value: data });
            setCompanyDefaults(data);
            toast.success('Firma bilgileri kaydedildi');
        } catch (error) { Logger.error('Error saving company defaults:', error); }
    };

    // Save Status Tracking
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle', lastSaved: null });

    const validateQuote = (isFinal = false) => {
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
    };

    const saveQuote = async (isFinal = false) => {
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
    };

    const loadQuote = (quote: Quote) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: quote.id } : tab));
        if (quote.quoteData) Object.entries(quote.quoteData).forEach(([key, value]) => updateQuoteData(key, value));
        if (quote.customerData) Object.entries(quote.customerData).forEach(([key, value]) => updateCustomerData(key, value));
        if (quote.companyData) Object.entries(quote.companyData).forEach(([key, value]) => updateCompanyData(key, value));
        if (quote.bankData) Object.entries(quote.bankData).forEach(([key, value]) => updateBankData(key, value));
        if (quote.items) setItems(quote.items);
        if (quote.discount) setDiscount(quote.discount);
        else if (quote.discountRate) setDiscount({ type: 'percentage', value: quote.discountRate });
        toast.success('Teklif yüklendi');
    };

    const resetQuote = () => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: null } : tab));
    };

    const createBackup = async () => {
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
    };

    const restoreBackup = async (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse((event.target as any).result);
                if (data.customers) await Promise.all(data.customers.map((item: any) => db.put('customers', item)));
                if (data.products) await Promise.all(data.products.map((item: any) => db.put('products', item)));
                if (data.quotes) await Promise.all(data.quotes.map((item: any) => db.put('quotes', item)));
                if (data.templates) await Promise.all(data.templates.map((item: any) => db.put('templates', item)));
                if (data.banks) await Promise.all(data.banks.map((item: any) => db.put('bankInfo', item)));
                toast.success('Yedekleme geri yüklendi');
            } catch (error) { Logger.error('Error restoring backup', error); toast.error('Yedekleme geri yükleme hatası'); }
        };
        reader.readAsText(file);
    };

    const fillTestData = async () => {
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
            if (tab.id === activeTab.id) return { ...tab, data: testData as any };
            return tab;
        }));
        toast.success('Test verileri eklendi');
    };

    const currentQuoteId = activeTab?.savedQuoteId || null;
    const setCurrentQuoteId = useCallback((id: number | null) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, savedQuoteId: id } : tab));
    }, [activeTabId]);

    const { t } = useTranslation(quoteData?.language);

    const value = useMemo<QuoteContextValue>(() => ({
        tabs, activeTabId, setActiveTabId, addTab, closeTab, switchTab, updateTabTitle,
        quoteData, updateQuoteData, customerData, updateCustomerData,
        companyData, updateCompanyData, items, setItems, discount, setDiscount,
        bankData, updateBankData, setBankData, pdfConfig, setPdfConfig, pdfLayout, setPdfLayout,
        companyDefaults, saveCompanyDefaults, fillTestData, createBackup, restoreBackup,
        saveQuote, loadQuote, resetQuote, undo, redo, canUndo, canRedo,
        db, currentQuoteId, setCurrentQuoteId, saveStatus, validateQuote,
        showConfirm, confirmState, handleConfirmResolve, handleConfirmReject
    }), [
        tabs, activeTabId, quoteData, customerData, companyData, items, discount, bankData,
        pdfConfig, pdfLayout, db, saveStatus, currentQuoteId, canUndo, canRedo
    ]);

    return (
        <QuoteContext.Provider value={value}>
            {children}
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant as any}
                confirmText="Evet"
                cancelText="İptal"
                onConfirm={handleConfirmResolve}
                onCancel={handleConfirmReject}
            />
        </QuoteContext.Provider>
    );
};
