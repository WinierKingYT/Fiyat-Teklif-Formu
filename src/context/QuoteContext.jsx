import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import Logger from '../utils/logger';
import toast from 'react-hot-toast';
import cleanupService from '../utils/cleanupService';
import performanceMonitor from '../utils/performanceMonitor';
import { sanitizeInput, sanitizeObject } from '../utils/sanitize.js';
import { getLocalDateString, getLocalDateTimeString } from '../utils/dateUtils';
import { calculateQuoteTotals } from '../utils/calculations';

const safeJsonParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const QuoteContext = createContext();

export const useQuote = () => {
    const context = useContext(QuoteContext);
    if (!context) {
        throw new Error('useQuote must be used within a QuoteProvider');
    }
    return context;
};

export const QuoteProvider = ({ children }) => {
    const { db, isReady } = useIndexedDB();

    // Initial State Generators
    const getInitialQuoteData = () => ({
        title: '',
        number: '',
        date: getLocalDateString(),
        validUntilDays: '10',
        validUntil: '',
        description: '',
        terms: '',
        deliveryTerms: '',
        warrantyTerms: '',
        notes: '',
        currency: 'TRY',
        language: 'tr'
    });

    const getInitialCustomerData = () => ({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: ''
    });

    const getInitialCompanyData = () => ({
        name: '',
        authorized: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        logo: null,
        signature: null,
        stamp: null
    });

    const getInitialBankData = () => ({
        bankName: '',
        branch: '',
        accountNumber: '',
        iban: '',
        accountHolder: ''
    });

    // --- Tab Management State ---
    const [tabs, setTabs] = useState([{
        id: 'default-tab',
        title: 'Yeni Teklif',
        savedQuoteId: null,
        data: {
            quoteData: getInitialQuoteData(),
            customerData: getInitialCustomerData(),
            companyData: getInitialCompanyData(),
            items: [],
            discount: { type: 'percentage', value: 0 },
            bankData: getInitialBankData()
        },
        history: [],
        historyIndex: -1
    }]);

    const [activeTabId, setActiveTabId] = useState(() => {
        return localStorage.getItem('activeTabId') || 'default-tab';
    });

    // Load tabs from IndexedDB on startup (with migration from localStorage)
    useEffect(() => {
        if (isReady && db) {
            const loadTabs = async () => {
                try {
                    // 1. Try to load from IndexedDB
                    const savedTabs = await db.getByIndex('settings', 'key', 'session_tabs');

                    if (savedTabs && savedTabs.value) {
                        setTabs(savedTabs.value);
                    } else {
                        // 2. If not in DB, try to migrate from localStorage
                        const localTabs = localStorage.getItem('quoteTabs');
                        if (localTabs) {
                            try {
                                const parsedTabs = JSON.parse(localTabs);
                                setTabs(parsedTabs);

                                // Save to DB immediately to complete migration
                                await db.add('settings', {
                                    id: 'session_tabs',
                                    key: 'session_tabs',
                                    value: parsedTabs
                                });

                                // Clear from localStorage to free up space
                                localStorage.removeItem('quoteTabs');
                                console.log("Migrated tabs from localStorage to IndexedDB");
                            } catch (e) {
                                console.error("Failed to migrate tabs from localStorage", e);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error loading tabs from IndexedDB:", error);
                }
            };
            loadTabs();
        }
    }, [isReady, db]);

    // Save tabs to IndexedDB whenever they change
    useEffect(() => {
        if (isReady && db) {
            const saveTabs = async () => {
                try {
                    // Check if record exists to get ID
                    const existingRecord = await db.getByIndex('settings', 'key', 'session_tabs');
                    const record = {
                        id: 'session_tabs',
                        key: 'session_tabs',
                        value: tabs
                    };

                    if (existingRecord) {
                        record.id = existingRecord.id;
                        await db.put('settings', record);
                    } else {
                        await db.add('settings', record);
                    }
                } catch (error) {
                    console.error("Error saving tabs to IndexedDB:", error);
                }
            };

            // Debounce save to avoid too many DB writes
            const timeoutId = setTimeout(saveTabs, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [tabs, isReady, db]);

    // Save activeTabId to localStorage (keep this as it's small)
    useEffect(() => {
        localStorage.setItem('activeTabId', activeTabId);
    }, [activeTabId]);

    // Helper to get active tab
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const activeTabData = activeTab.data;

    // Derived State (for backward compatibility with components)
    const quoteData = activeTabData.quoteData;
    const customerData = activeTabData.customerData;
    const companyData = activeTabData.companyData;
    const items = activeTabData.items;
    const discount = activeTabData.discount;
    const bankData = activeTabData.bankData || getInitialBankData();

    // Company Defaults State
    const [companyDefaults, setCompanyDefaults] = useState(null);

    // --- Tab Actions ---
    const addTab = () => {
        const newTabId = `tab-${Date.now()}`;
        const newTab = {
            id: newTabId,
            title: 'Yeni Teklif',
            savedQuoteId: null,
            data: {
                quoteData: getInitialQuoteData(),
                customerData: getInitialCustomerData(),
                companyData: companyDefaults || getInitialCompanyData(),
                items: [],
                discount: { type: 'percentage', value: 0 },
                bankData: getInitialBankData()
            },
            history: [],
            historyIndex: -1
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTabId);
    };

    const closeTab = (tabId) => {
        if (tabs.length === 1) {
            toast.error("Son sekmeyi kapatamazsınız.");
            return;
        }

        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);

        if (activeTabId === tabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const switchTab = (tabId) => {
        setActiveTabId(tabId);
    };

    const updateTabTitle = (tabId, title) => {
        setTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, title } : tab
        ));
    };

    // --- Data Update Actions (Targeting Active Tab) ---
    const updateActiveTabData = (field, value) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: {
                        ...tab.data,
                        [field]: value
                    }
                };
            }
            return tab;
        }));
    };

    const sanitizeValue = (val) => {
        if (typeof val === 'string') return sanitizeInput(val);
        return val;
    };

    const updateQuoteData = useCallback((field, value) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const newData = { ...tab.data.quoteData, [field]: value };
                // Update tab title if customer name changes
                let newTitle = tab.title;

                return {
                    ...tab,
                    title: newTitle,
                    data: { ...tab.data, quoteData: newData }
                };
            }
            return tab;
        }));
    }, [activeTabId]);

    const updateCustomerData = useCallback((field, value) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const newData = { ...tab.data.customerData, [field]: value };
                let newTitle = tab.title;
                if (field === 'company' && value) newTitle = value;
                else if (field === 'name' && value && !newData.company) newTitle = value;

                return {
                    ...tab,
                    title: newTitle,
                    data: { ...tab.data, customerData: newData }
                };
            }
            return tab;
        }));
    }, [activeTabId]);

    const updateCompanyData = useCallback((field, value) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, companyData: { ...tab.data.companyData, [field]: value } }
                };
            }
            return tab;
        }));
    }, [activeTabId]);

    const setItems = useCallback((newItems) => {
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
        newItems = sanitizeObject(newItems);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, items: newItems }
                };
            }
            return tab;
        }));
    }, [activeTabId]);

    const setDiscount = useCallback((newDiscount) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, discount: newDiscount }
                };
            }
            return tab;
        }));
    }, [activeTabId]);

    const updateBankData = useCallback((field, value) => {
        value = sanitizeValue(value);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, bankData: { ...tab.data.bankData, [field]: value } }
                };
            }
            return tab;
        }));
    }, [activeTabId]);

    const setBankData = (newData) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const resolvedData = typeof newData === 'function' ? newData(tab.data.bankData) : newData;
                return {
                    ...tab,
                    data: { ...tab.data, bankData: resolvedData }
                };
            }
            return tab;
        }));
    }


    // PDF Configuration State (Shared between Modal and Panel)
    const [pdfConfig, setPdfConfig] = useState(() => {
        const savedConfig = localStorage.getItem('pdfConfig');
        return safeJsonParse(savedConfig, {
            showLogo: true,
            showBankInfo: true,
            showSignatures: true,
            showTerms: true,
            showNotes: true,
            showSummary: true,
            title: 'FİYAT TEKLİFİ',
            fontFamily: 'Inter',
            fontSize: 12,
            tableHeaderFontSize: 14,
            tableRowHeight: 35,
            borderRadius: 6,
            tableHeaderBg: '#f1f5f9',
            margins: 'normal',
            showTableImages: true,
            showTableUnit: true,
            showTableTax: true,
            showQRCode: false,
            qrCodeUrl: '',
            showWatermark: false,
            watermarkText: 'TASLAK',
            watermarkOpacity: 0.1,
            watermarkColor: '#000000',
            watermarkFontSize: 120,
            watermarkRotation: -45,
            customFooter: '',
            logoPosition: 'left',
            theme: 'modern',
            color: '#000000',

            // Typography Defaults
            globalFontFamily: 'Inter',
            titleFontFamily: '',
            labelFontFamily: '',
            bodyFontFamily: '',

            // Granular Typography Defaults
            headerTitleFontSize: '1rem',
            headerTitleFontWeight: '700',
            headerInfoFontSize: '0.7rem',

            customerTitleFontSize: '0.8rem',
            customerTitleFontWeight: '600',
            customerLabelFontSize: 'inherit',
            customerLabelFontWeight: '500',
            customerValueFontSize: 'inherit',
            customerValueFontWeight: 'normal',

            quoteMetaLabelFontSize: '0.7rem',
            quoteMetaLabelFontWeight: 'normal',
            quoteMetaValueFontSize: 'inherit',
            quoteMetaValueFontWeight: '600',

            tableBodyFontSize: '0.7rem',
            tableBodyFontWeight: 'normal',

            summaryLabelFontSize: '0.75rem',
            summaryLabelFontWeight: 'normal',
            summaryValueFontSize: 'inherit',
            summaryValueFontWeight: '500',
            summaryTotalFontSize: '0.9rem',
            summaryTotalFontWeight: '700',

            footerFontSize: '0.7rem',
            footerFontWeight: 'normal',
            itemsPerPage: 14
        });
    });

    useEffect(() => {
        localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig));
    }, [pdfConfig]);

    // PDF Layout State (Global)
    const [pdfLayout, setPdfLayout] = useState(() => {
        try {
            const savedLayout = localStorage.getItem('pdfLayout');
            const parsed = (savedLayout && savedLayout !== 'undefined') ? JSON.parse(savedLayout) : null;
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.error('Error parsing pdfLayout:', e);
        }
        return [
            { id: 'header', label: 'Logo ve Başlık', enabled: true },
            { id: 'customer', label: 'Müşteri Bilgileri', enabled: true },
            { id: 'items', label: 'Ürün Tablosu', enabled: true },
            { id: 'notes', label: 'Notlar ve Şartlar', enabled: true },
            { id: 'signatures', label: 'İmza Alanı', enabled: true },
            { id: 'footer', label: 'Alt Bilgi', enabled: true }
        ];
    });

    // History State (Per Tab)
    const historyTimeoutRef = React.useRef(null);
    const isNavigatingHistory = React.useRef(false);

    const undo = useCallback(() => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                if (tab.historyIndex > 0) {
                    isNavigatingHistory.current = true;
                    const newIndex = tab.historyIndex - 1;
                    const previousData = tab.history[newIndex];
                    return {
                        ...tab,
                        data: JSON.parse(JSON.stringify(previousData)), // Deep copy to avoid reference issues
                        historyIndex: newIndex
                    };
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
                    return {
                        ...tab,
                        data: JSON.parse(JSON.stringify(nextData)), // Deep copy
                        historyIndex: newIndex
                    };
                }
            }
            return tab;
        }));
        toast.success('Yinelendi');
    }, [activeTabId]);

    // Auto-save history effect
    useEffect(() => {
        // Skip history update if we just performed undo/redo
        if (isNavigatingHistory.current) {
            isNavigatingHistory.current = false;
            return;
        }

        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;

        // Initialize history if empty
        if (!activeTab.history || activeTab.history.length === 0) {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                    return {
                        ...t,
                        history: [JSON.parse(JSON.stringify(t.data))],
                        historyIndex: 0
                    };
                }
                return t;
            }));
            return;
        }

        const currentHistoryState = activeTab.history[activeTab.historyIndex];

        // Check if data has changed
        if (JSON.stringify(activeTab.data) !== JSON.stringify(currentHistoryState)) {
            // Clear existing timeout
            if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);

            // Set new timeout (Debounce)
            historyTimeoutRef.current = setTimeout(() => {
                setTabs(prev => prev.map(t => {
                    if (t.id === activeTabId) {
                        const newHistory = t.history.slice(0, t.historyIndex + 1);
                        newHistory.push(JSON.parse(JSON.stringify(t.data)));

                        // Limit history size to 50 steps
                        if (newHistory.length > 50) newHistory.shift();

                        return {
                            ...t,
                            history: newHistory,
                            historyIndex: newHistory.length - 1
                        };
                    }
                    return t;
                }));
            }, 1000); // 1 second debounce
        }

        return () => {
            if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
        };
    }, [tabs, activeTabId]);

    const activeTabObj = tabs.find(t => t.id === activeTabId);
    const canUndo = activeTabObj ? activeTabObj.historyIndex > 0 : false;
    const canRedo = activeTabObj ? activeTabObj.historyIndex < (activeTabObj.history?.length || 0) - 1 : false;


    // Calculate Valid Until Date (Effect on Active Tab)
    useEffect(() => {
        if (quoteData.date && quoteData.validUntilDays) {
            const date = new Date(quoteData.date);
            date.setDate(date.getDate() + parseInt(quoteData.validUntilDays));
            // Avoid infinite loop by checking if value is different
            const newDate = getLocalDateString(date);
            if (quoteData.validUntil !== newDate) {
                updateQuoteData('validUntil', newDate);
            }
        }
    }, [quoteData.date, quoteData.validUntilDays, updateQuoteData]);


    // Load draft from IndexedDB (Global Settings only, or load into active tab?)
    // For multi-tab, we might want to load "Saved Quotes" into a new tab.
    // The "Current Draft" concept changes. Maybe we save *all tabs* as the current session.

    // Let's keep the "Load Settings" part
    useEffect(() => {
        if (isReady && db) {
            const loadSettings = async () => {
                try {
                    const settings = await db.get('settings', 'global');
                    if (settings) {
                        if (settings.currency) {
                            // Update all tabs? Or just active? Let's just update active for now
                            // updateQuoteData('currency', settings.currency);
                        }
                    }

                    // Load Company Defaults
                    const defaultsRecord = await db.getByIndex('settings', 'key', 'company_defaults');
                    if (defaultsRecord && defaultsRecord.value) {
                        setCompanyDefaults(defaultsRecord.value);
                    }
                } catch (error) {
                    console.error("Error loading settings:", error);
                }
            };
            loadSettings();
        }
    }, [isReady, db]);

    // Initialize cleanup service and perform startup cleanup
    useEffect(() => {
        if (isReady && db) {
            cleanupService.setDatabase(db);
            cleanupService.performStartupCleanup().catch(err => {
                console.error('Startup cleanup failed:', err);
            });
        }
    }, [isReady, db]);

    // Performance monitoring warning
    useEffect(() => {
        if (!isReady || !db) return;

        const checkPerformance = async () => {
            try {
                const metrics = await performanceMonitor.getPerformanceMetrics(db, tabs);
                const recommendations = performanceMonitor.getRecommendations(metrics);

                if (recommendations.needsCleanup) {
                    const highWarnings = recommendations.warnings.filter(w => w.severity === 'high');
                    if (highWarnings.length > 0) {
                        toast.warning(
                            'Performans uyarısı: ' + highWarnings[0].message + '. Ayarlar > Performans & Bakım\'dan temizlik yapabilirsiniz.',
                            { duration: 5000 }
                        );
                    }
                }
            } catch (error) {
                console.error('Performance check failed:', error);
            }
        };

        // Check performance every 5 minutes
        const interval = setInterval(checkPerformance, 5 * 60 * 1000);
        // Initial check after 1 minute
        const timeout = setTimeout(checkPerformance, 60 * 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isReady, db, tabs]);

    const saveCompanyDefaults = async (data) => {
        if (!isReady || !db) return;
        try {
            await db.put('settings', {
                id: 'company_defaults',
                key: 'company_defaults',
                value: data
            });
            setCompanyDefaults(data);
            toast.success('Firma bilgileri varsayılan olarak kaydedildi.');
        } catch (error) {
            console.error('Error saving company defaults:', error);
            toast.error('Varsayılanlar kaydedilemedi.');
        }
    };

    // Save Status Tracking for Auto-save Indicator
    const [saveStatus, setSaveStatus] = useState({ status: 'idle', lastSaved: null });

    const validateQuote = (isFinal = false) => {
        const errors = [];

        if (!companyData.name) errors.push('Firma adı zorunludur');
        if (!customerData.name && !customerData.company) errors.push('Müşteri adı veya firma adı zorunludur');
        if (items.length === 0) errors.push('En az bir ürün satırı gereklidir');
        if (!quoteData.number) errors.push('Teklif numarası zorunludur');
        if (!quoteData.currency) errors.push('Para birimi seçilmelidir');

        items.forEach((item, i) => {
            if (!item.name) errors.push(`Satır ${i + 1}: Ürün adı zorunludur`);
            if (item.quantity <= 0) errors.push(`Satır ${i + 1}: Miktar 0'dan büyük olmalıdır`);
            if (item.price < 0) errors.push(`Satır ${i + 1}: Fiyat negatif olamaz`);
            if (item.taxRate === undefined || item.taxRate === null || item.taxRate < 0 || item.taxRate > 100)
                errors.push(`Satır ${i + 1}: Geçersiz KDV oranı (${item.taxRate})`);
        });

        if (isFinal) {
            if (quoteData.validUntil && quoteData.date) {
                const validDate = new Date(quoteData.validUntil);
                const quoteDate = new Date(quoteData.date);
                if (validDate <= quoteDate) errors.push('Geçerlilik tarihi teklif tarihinden sonra olmalıdır');
            }
        }

        return errors;
    };

    const saveQuote = async (isFinal = false) => {
        if (!isReady) {
            alert('Veritabanı hazır değil!');
            return;
        }

        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;
        const tabSavedQuoteId = activeTab.savedQuoteId;

        const errors = validateQuote(isFinal);
        if (errors.length > 0) {
            toast.error('Lütfen hataları düzeltin:\n' + errors.join('\n'), { duration: 6000 });
            return;
        }

        setSaveStatus({ status: 'saving', lastSaved: null });

        const { subtotalMinor, taxTotalMinor, grandTotalMinor } = (() => {
            try {
                const calc = calculateQuoteTotals(items, discount, { currency: quoteData.currency });
                return {
                    subtotalMinor: Math.round(calc.subtotal * 100),
                    taxTotalMinor: Math.round(calc.taxTotal * 100),
                    grandTotalMinor: Math.round(calc.grandTotal * 100)
                };
            } catch {
                return { subtotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 0 };
            }
        })();

        const quote = {
            id: tabSavedQuoteId || Date.now(),
            quoteNumber: quoteData.number,
            customerName: customerData.name,
            customerCompany: customerData.company,
            status: isFinal ? 'final' : 'draft',
            currency: quoteData.currency,
            subtotalMinor,
            taxTotalMinor,
            grandTotalMinor,
            quoteData,
            customerData,
            companyData,
            items,
            discount,
            bankData,
            updatedAt: getLocalDateTimeString(),
            createdAt: tabSavedQuoteId ? undefined : getLocalDateTimeString()
        };

        try {
            if (tabSavedQuoteId) {
                const existing = await db.get('quotes', tabSavedQuoteId);
                if (existing) {
                    quote.createdAt = existing.createdAt;
                    quote.status = isFinal ? 'final' : existing.status;
                }
                await db.put('quotes', quote);
                toast.success('Teklif güncellendi!');
            } else {
                await db.add('quotes', quote);
                setTabs(prev => prev.map(tab =>
                    tab.id === activeTabId ? { ...tab, savedQuoteId: quote.id } : tab
                ));
                toast.success('Teklif başarıyla kaydedildi!');
            }
            Logger.log('Quote saved successfully', quote);

            setSaveStatus({ status: 'saved', lastSaved: Date.now() });

            setTimeout(() => {
                setSaveStatus(prev => prev.status === 'saved' ? { status: 'idle', lastSaved: prev.lastSaved } : prev);
            }, 3000);
        } catch (error) {
            Logger.error('Error saving quote', error);
            toast.error('Teklif kaydedilirken bir hata oluştu.');

            setSaveStatus({ status: 'error', lastSaved: null });

            setTimeout(() => {
                setSaveStatus({ status: 'idle', lastSaved: null });
            }, 5000);
        }
    };

    const loadQuote = (quote) => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, savedQuoteId: quote.id } : tab
        ));
        if (quote.quoteData) {
            Object.entries(quote.quoteData).forEach(([key, value]) => updateQuoteData(key, value));
        }
        if (quote.customerData) {
            Object.entries(quote.customerData).forEach(([key, value]) => updateCustomerData(key, value));
        }
        if (quote.companyData) {
            Object.entries(quote.companyData).forEach(([key, value]) => updateCompanyData(key, value));
        }
        if (quote.bankData) {
            Object.entries(quote.bankData).forEach(([key, value]) => updateBankData(key, value));
        }
        if (quote.items) setItems(quote.items);
        if (quote.discount) setDiscount(quote.discount);
        else if (quote.discountRate) setDiscount({ type: 'percentage', value: quote.discountRate });

        toast.success('Teklif yüklendi');
    };

    const resetQuote = () => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, savedQuoteId: null } : tab
        ));
    };

    const createBackup = async () => {
        // ... (Keep existing backup logic)
        try {
            const [customers, products, quotes, templates, banks] = await Promise.all([
                db.getAll('customers'),
                db.getAll('products'),
                db.getAll('quotes'),
                db.getAll('templates'),
                db.getAll('bankInfo')
            ]);

            const data = {
                customers,
                products,
                quotes,
                templates,
                banks,
                exportDate: new Date().toISOString(),
                version: '2.3'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teklifmaster_backup_${getLocalDateString()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Yedek dosyası indirildi');
        } catch (error) {
            Logger.error('Error creating backup', error);
            toast.error('Yedek oluşturulurken hata oluştu');
        }
    };

    const restoreBackup = async (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.customers) await Promise.all(data.customers.map(item => db.put('customers', item)));
                if (data.products) await Promise.all(data.products.map(item => db.put('products', item)));
                if (data.quotes) await Promise.all(data.quotes.map(item => db.put('quotes', item)));
                if (data.templates) await Promise.all(data.templates.map(item => db.put('templates', item)));
                if (data.banks) await Promise.all(data.banks.map(item => db.put('bankInfo', item)));

                toast.success('Yedek başarıyla yüklendi');
            } catch (error) {
                Logger.error('Error restoring backup', error);
                toast.error('Yedek yüklenirken hata oluştu: Geçersiz dosya');
            }
        };
        reader.readAsText(file);
    };

    const fillTestData = () => {
        const testData = {
            quoteData: {
                ...getInitialQuoteData(),
                title: 'Kapsamlı Kurumsal Web Projesi ve Dijital Dönüşüm Hizmetleri',
                number: 'T-2023-TEST-001',
                description: 'Bu teklif, firmanızın dijital dönüşüm süreçlerini hızlandırmak, kurumsal kimliğinizi modern web teknolojileriyle yenilemek ve e-ticaret altyapınızı güçlendirmek amacıyla hazırlanmıştır. Teklif içeriğinde detaylı analiz, tasarım, geliştirme, test ve bakım süreçleri yer almaktadır.',
                validUntilDays: '30',
                terms: '1. Ödeme Planı: %30 Peşin, %40 Proje Ortasında, %30 Teslimatta.\n2. Fiyatlara KDV (%20) dahil değildir.\n3. Teslim süresi, proje başlangıç tarihinden itibaren 45 iş günüdür.\n4. Ek geliştirmeler ve revizyon talepleri ayrıca ücretlendirilecektir.\n5. Yıllık bakım ve destek hizmetleri ilk yıl ücretsizdir, sonraki yıllar için ayrıca sözleşme yapılacaktır.',
                notes: 'Lütfen teklifi onaylamak için her sayfayı paraflayıp, son sayfayı imzalayıp kaşeleyerek tarafımıza iletiniz. Sorularınız için 7/24 destek hattımızdan bize ulaşabilirsiniz.'
            },
            customerData: {
                name: 'Ahmet Yılmaz',
                company: 'Yılmaz Teknoloji ve İnovasyon A.Ş.',
                email: 'ahmet.yilmaz@yilmazteknoloji.com.tr',
                phone: '+90 (555) 123 45 67',
                address: 'Teknopark İstanbul, Sanayi Mahallesi, Teknoloji Bulvarı, No: 123, Blok: B, Kat: 4, Ofis: 402\nPendik / İstanbul',
                taxOffice: 'Pendik Vergi Dairesi',
                taxNo: '1234567890'
            },
            companyData: {
                name: 'TeklifMaster Bilişim ve Yazılım Hizmetleri Ltd. Şti.',
                authorized: 'Mehmet Demir',
                email: 'kurumsal@teklifmaster.com',
                phone: '+90 (850) 987 65 43',
                website: 'https://www.teklifmaster.com',
                address: 'Maslak Mahallesi, Büyükdere Caddesi, Noramin İş Merkezi, No: 234, Kat: 12\nSarıyer / İstanbul',
                logo: '' // Logo URL'si eklenebilir
            },
            items: [
                { id: 1, name: 'Kurumsal Web Tasarımı (UI/UX)', description: 'Figma üzerinde modern, responsive ve kullanıcı dostu arayüz tasarımı.', quantity: 1, unit: 'Proje', price: 25000, taxRate: 20 },
                { id: 2, name: 'Frontend Geliştirme (React.js)', description: 'Next.js framework kullanılarak SEO uyumlu, hızlı ve modern arayüz kodlaması.', quantity: 1, unit: 'Hizmet', price: 35000, taxRate: 20 },
                { id: 3, name: 'Backend Geliştirme (Node.js)', description: 'Ölçeklenebilir, güvenli RESTful API geliştirme ve mikroservis mimarisi.', quantity: 1, unit: 'Hizmet', price: 30000, taxRate: 20 },
                { id: 4, name: 'Veritabanı Tasarımı (PostgreSQL)', description: 'İlişkisel veritabanı modelleme, optimizasyon ve yedekleme yapılandırması.', quantity: 1, unit: 'Adet', price: 15000, taxRate: 20 },
                { id: 5, name: 'Yönetim Paneli (Admin Dashboard)', description: 'Kullanıcı yetkilendirme, içerik yönetimi ve raporlama modülleri.', quantity: 1, unit: 'Modül', price: 20000, taxRate: 20 },
                { id: 6, name: 'E-Ticaret Entegrasyonu', description: 'Sanal POS, sepet, sipariş yönetimi ve kargo entegrasyonları.', quantity: 1, unit: 'Paket', price: 45000, taxRate: 20 },
                { id: 7, name: 'SEO Optimizasyonu', description: 'Site içi teknik SEO, meta etiketleri, sitemap ve performans iyileştirmeleri.', quantity: 1, unit: 'Hizmet', price: 10000, taxRate: 20 },
                { id: 8, name: 'Sunucu ve Cloud Yapılandırması', description: 'AWS/DigitalOcean üzerinde load balancer, CDN ve güvenlik duvarı kurulumu.', quantity: 10, unit: 'Saat', price: 2500, taxRate: 20 },
                { id: 9, name: 'Mobil Uyumluluk Testleri', description: 'iOS ve Android cihazlarda responsive tasarım testleri ve optimizasyon.', quantity: 5, unit: 'Gün', price: 3000, taxRate: 20 },
                { id: 10, name: 'Güvenlik Testleri (Penetration Testing)', description: 'Uygulama güvenliği, SQL injection ve XSS açıklarına karşı tarama.', quantity: 1, unit: 'Rapor', price: 15000, taxRate: 20 },
                { id: 11, name: 'İçerik Girişi ve Düzenleme', description: 'Mevcut içeriklerin yeni sisteme aktarılması ve düzenlenmesi.', quantity: 50, unit: 'Sayfa', price: 200, taxRate: 20 },
                { id: 12, name: 'Eğitim ve Dokümantasyon', description: 'Yönetim paneli kullanımı eğitimi ve teknik dokümantasyon hazırlanması.', quantity: 2, unit: 'Oturum', price: 5000, taxRate: 20 },
                { id: 13, name: 'Yıllık Hosting Hizmeti', description: 'Yüksek performanslı, SSD diskli ve sınırsız trafikli hosting paketi.', quantity: 1, unit: 'Yıl', price: 8000, taxRate: 20 },
                { id: 14, name: 'SSL Sertifikası (EV)', description: 'Genişletilmiş doğrulama özellikli, yeşil bar SSL sertifikası.', quantity: 1, unit: 'Yıl', price: 4000, taxRate: 20 },
                { id: 15, name: 'Domain Yenileme', description: 'com.tr ve .com uzantılı alan adlarının 5 yıllık yenilenmesi.', quantity: 2, unit: 'Adet', price: 1500, taxRate: 20 },
                { id: 16, name: 'Sosyal Medya Entegrasyonu', description: 'Instagram, LinkedIn ve Twitter API entegrasyonları.', quantity: 3, unit: 'Platform', price: 3000, taxRate: 20 },
                { id: 17, name: 'Google Analytics & Tag Manager', description: 'Gelişmiş e-ticaret takibi ve dönüşüm optimizasyonu kurulumları.', quantity: 1, unit: 'Hizmet', price: 5000, taxRate: 20 },
                { id: 18, name: 'Çoklu Dil Desteği (İngilizce)', description: 'Sistemin İngilizce dil altyapısının kurulması ve çeviri modülü.', quantity: 1, unit: 'Dil', price: 12000, taxRate: 20 },
                { id: 19, name: 'Canlı Destek Sistemi', description: 'Zendesk veya Intercom entegrasyonu ve chatbot yapılandırması.', quantity: 1, unit: 'Entegrasyon', price: 8000, taxRate: 20 },
                { id: 20, name: 'Veri Yedekleme Çözümü', description: 'Günlük otomatik yedekleme ve felaket kurtarma senaryoları.', quantity: 12, unit: 'Ay', price: 1000, taxRate: 20 },
                { id: 21, name: 'Performans Optimizasyonu', description: 'Core Web Vitals skorlarının iyileştirilmesi ve cache yapılandırması.', quantity: 1, unit: 'Hizmet', price: 7500, taxRate: 20 },
                { id: 22, name: 'KVKK & GDPR Uyumluluğu', description: 'Çerez politikası, aydınlatma metinleri ve onay mekanizmaları.', quantity: 1, unit: 'Paket', price: 6000, taxRate: 20 },
                { id: 23, name: 'Mail Server Kurulumu', description: 'Kurumsal e-posta altyapısı, SPF, DKIM ve DMARC ayarları.', quantity: 1, unit: 'Kurulum', price: 4000, taxRate: 20 },
                { id: 24, name: 'Proje Yönetimi ve Danışmanlık', description: 'Agile metodolojisi ile proje takibi ve haftalık raporlama.', quantity: 3, unit: 'Ay', price: 10000, taxRate: 20 },
                { id: 25, name: 'Lansman Sonrası Destek', description: 'Yayın sonrası 1 aylık yerinde teknik destek ve acil müdahale.', quantity: 1, unit: 'Ay', price: 15000, taxRate: 20 }
            ],
            bankData: {
                bankName: 'Garanti BBVA',
                branch: 'Maslak Ticari Şube',
                accountNumber: '9876543',
                iban: 'TR12 0006 2000 0001 2345 6789 01',
                accountHolder: 'TeklifMaster Bilişim ve Yazılım Hizmetleri Ltd. Şti.'
            },
            discount: { type: 'percentage', value: 10 }
        };

        console.log('Filling test data for tab:', activeTab.id);
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTab.id) {
                return {
                    ...tab,
                    data: testData
                };
            }
            return tab;
        }));

        toast.success('Test verileri dolduruldu!');
    };

    const currentQuoteId = activeTab?.savedQuoteId || null;

    const setCurrentQuoteId = useCallback((id) => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, savedQuoteId: id } : tab
        ));
    }, [activeTabId]);

    const value = React.useMemo(() => ({
        tabs, activeTabId, addTab, closeTab, switchTab, updateTabTitle,
        quoteData, updateQuoteData,
        customerData, updateCustomerData,
        companyData, updateCompanyData,
        items, setItems,
        discount, setDiscount,
        bankData, updateBankData,
        pdfConfig, setPdfConfig,
        pdfLayout, setPdfLayout,
        companyDefaults, saveCompanyDefaults,
        fillTestData, createBackup, restoreBackup,
        saveQuote, loadQuote, resetQuote,
        undo, redo, canUndo, canRedo,
        db, currentQuoteId, setCurrentQuoteId,
        saveStatus,
        cleanupService, performanceMonitor,
        setTabs
    }), [
        tabs, activeTabId, quoteData, customerData, companyData, items, discount, bankData,
        pdfConfig, pdfLayout, db, saveStatus, currentQuoteId
    ]);

    return (
        <QuoteContext.Provider value={value}>
            {children}
        </QuoteContext.Provider>
    );
};
