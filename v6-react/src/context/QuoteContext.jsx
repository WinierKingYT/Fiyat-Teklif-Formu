import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import Logger from '../utils/logger';
import toast from 'react-hot-toast';

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
        date: new Date().toISOString().split('T')[0],
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
    const bankData = activeTabData.bankData;

    // --- Tab Actions ---
    const addTab = () => {
        const newTabId = `tab-${Date.now()}`;
        const newTab = {
            id: newTabId,
            title: 'Yeni Teklif',
            data: {
                quoteData: getInitialQuoteData(),
                customerData: getInitialCustomerData(),
                companyData: getInitialCompanyData(), // Ideally load default company data
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

    const updateQuoteData = useCallback((field, value) => {
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

    const updateCustomerData = (field, value) => {
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
    };

    const updateCompanyData = (field, value) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, companyData: { ...tab.data.companyData, [field]: value } }
                };
            }
            return tab;
        }));
    };

    const setItems = (newItems) => {
        // Handle both function update and direct value
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                const resolvedItems = typeof newItems === 'function' ? newItems(tab.data.items) : newItems;
                return {
                    ...tab,
                    data: { ...tab.data, items: resolvedItems }
                };
            }
            return tab;
        }));
    };

    const setDiscount = (newDiscount) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, discount: newDiscount }
                };
            }
            return tab;
        }));
    };

    const updateBankData = (field, value) => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: { ...tab.data, bankData: { ...tab.data.bankData, [field]: value } }
                };
            }
            return tab;
        }));
    };

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
        return savedConfig ? JSON.parse(savedConfig) : {
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
            footerFontWeight: 'normal'
        };
    });

    useEffect(() => {
        localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig));
    }, [pdfConfig]);

    // PDF Layout State (Global)
    const [pdfLayout, setPdfLayout] = useState(() => {
        const savedLayout = localStorage.getItem('pdfLayout');
        return savedLayout ? JSON.parse(savedLayout) : [
            { id: 'header', label: 'Logo ve Başlık', enabled: true },
            { id: 'customer', label: 'Müşteri Bilgileri', enabled: true },
            { id: 'table', label: 'Ürün Tablosu', enabled: true },
            { id: 'notes', label: 'Notlar ve Şartlar', enabled: true },
            { id: 'signatures', label: 'İmza Alanı', enabled: true },
            { id: 'footer', label: 'Alt Bilgi', enabled: true }
        ];
    });

    // UI State
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'desktop');

    useEffect(() => {
        localStorage.setItem('viewMode', viewMode);
    }, [viewMode]);

    // Font Size State
    const [appFontSize, setAppFontSize] = useState(() => {
        return parseInt(localStorage.getItem('appFontSize')) || 14;
    });

    useEffect(() => {
        document.documentElement.style.fontSize = `${appFontSize}px`;
        localStorage.setItem('appFontSize', appFontSize);
    }, [appFontSize]);

    // Performance Mode State
    const [performanceMode, setPerformanceMode] = useState(() => {
        return localStorage.getItem('performanceMode') === 'true';
    });

    useEffect(() => {
        if (performanceMode) {
            document.body.classList.add('performance-mode');
        } else {
            document.body.classList.remove('performance-mode');
        }
        localStorage.setItem('performanceMode', performanceMode);
    }, [performanceMode]);

    // Compact Mode State
    const [compactMode, setCompactMode] = useState(() => {
        return localStorage.getItem('compactMode') === 'true';
    });

    useEffect(() => {
        if (compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        localStorage.setItem('compactMode', compactMode);
    }, [compactMode]);

    // Focus Mode State
    const [focusMode, setFocusMode] = useState(false);

    // Live Preview Mode State
    const [isLivePreviewMode, setIsLivePreviewMode] = useState(false);


    // History State (Per Tab)
    // We need to implement history logic that updates the *active tab's* history
    // For simplicity in this refactor, I will temporarily disable complex history or simplify it
    // to just save snapshots to the tab object.

    // Simplified History: The 'history' and 'historyIndex' are already part of the tab object.
    // We just need undo/redo functions that update the tab's data from its history.

    const saveSnapshot = useCallback(() => {
        // This needs to be called when data changes. 
        // Since we are updating state directly in actions, we might need a different approach 
        // or just rely on the fact that we have the data.
        // For now, let's skip auto-history to avoid infinite loops with the new structure 
        // and focus on getting tabs working. We can re-enable history later.
    }, []);

    const undo = () => {
        // Placeholder
        toast('Geri alma özelliği çoklu sekme modunda geçici olarak devre dışı.');
    };

    const redo = () => {
        // Placeholder
    };


    // Calculate Valid Until Date (Effect on Active Tab)
    useEffect(() => {
        if (quoteData.date && quoteData.validUntilDays) {
            const date = new Date(quoteData.date);
            date.setDate(date.getDate() + parseInt(quoteData.validUntilDays));
            // Avoid infinite loop by checking if value is different
            const newDate = date.toISOString().split('T')[0];
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
                } catch (error) {
                    console.error("Error loading settings:", error);
                }
            };
            loadSettings();
        }
    }, [isReady, db]);

    const saveQuote = async () => {
        if (!isReady) {
            alert('Veritabanı hazır değil!');
            return;
        }

        const quote = {
            id: Date.now(),
            quoteData,
            customerData,
            companyData,
            items,
            discount,
            bankData,
            createdAt: new Date().toISOString()
        };

        try {
            await db.add('quotes', quote);
            Logger.log('Quote saved successfully', quote);
            toast.success('Teklif başarıyla kaydedildi!');
        } catch (error) {
            Logger.error('Error saving quote', error);
            toast.error('Teklif kaydedilirken bir hata oluştu.');
        }
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
            a.download = `teklifmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                title: 'Web Sitesi Tasarım ve Geliştirme',
                number: 'T-2023-001',
                description: 'Kurumsal web sitesi projesi için hazırlanan fiyat teklifidir.',
                validUntilDays: '15',
                terms: '1. Ödeme %50 peşin, %50 teslimatta.\n2. Fiyatlara KDV dahil değildir.\n3. Teslim süresi 15 iş günüdür.',
                notes: 'Lütfen teklifi onaylamak için imzalayıp geri gönderiniz.'
            },
            customerData: {
                name: 'Ahmet Yılmaz',
                company: 'Yılmaz Teknoloji A.Ş.',
                email: 'ahmet@yilmazteknoloji.com',
                phone: '0555 123 45 67',
                address: 'Teknopark İstanbul, Sanayi Mah. No:1\nPendik/İstanbul'
            },
            companyData: {
                name: 'TeklifMaster Bilişim Hizmetleri',
                authorized: 'Mehmet Demir',
                email: 'info@teklifmaster.com',
                phone: '0850 123 45 67',
                website: 'www.teklifmaster.com',
                address: 'Maslak Mah. Büyükdere Cad. No:123\nSarıyer/İstanbul'
            },
            items: [
                { id: 1, name: 'Web Tasarım', description: 'UI/UX Tasarımı ve Prototipleme', quantity: 1, unit: 'Adet', price: 15000, taxRate: 20 },
                { id: 2, name: 'Frontend Geliştirme', description: 'React.js ile arayüz kodlaması', quantity: 1, unit: 'Proje', price: 25000, taxRate: 20 },
                { id: 3, name: 'Backend Geliştirme', description: 'Node.js API ve Veritabanı', quantity: 1, unit: 'Proje', price: 20000, taxRate: 20 },
                { id: 4, name: 'Sunucu Kurulumu', description: 'AWS altyapı yapılandırması', quantity: 5, unit: 'Saat', price: 2000, taxRate: 20 }
            ],
            bankData: {
                bankName: 'Garanti BBVA',
                branch: 'Maslak Şubesi',
                accountNumber: '1234567',
                iban: 'TR12 3456 7890 1234 5678 9012 34',
                accountHolder: 'TeklifMaster Bilişim Ltd. Şti.'
            },
            discount: { type: 'percentage', value: 10 }
        };

        setTabs(prev => prev.map(tab => {
            if (tab.id === activeTabId) {
                return {
                    ...tab,
                    data: testData
                };
            }
            return tab;
        }));

        toast.success('Test verileri dolduruldu!');
    };

    const value = React.useMemo(() => ({
        // Tab State
        tabs,
        activeTabId,
        addTab,
        closeTab,
        switchTab,
        updateTabTitle,

        // Active Tab Data (Backward Compatibility)
        quoteData, updateQuoteData,
        customerData, updateCustomerData,
        companyData, updateCompanyData,
        items, setItems,
        discount, setDiscount,
        bankData, updateBankData, setBankData,
        fillTestData, // Exposed function

        // Global State
        pdfLayout, setPdfLayout,
        saveQuote,
        createBackup, restoreBackup,
        undo, redo,
        canUndo: false, // Temporarily disabled
        canRedo: false, // Temporarily disabled
        viewMode, setViewMode,
        db,
        appFontSize, setAppFontSize,
        performanceMode, setPerformanceMode,
        compactMode, setCompactMode,
        focusMode, setFocusMode,
        isLivePreviewMode, setIsLivePreviewMode,
        pdfConfig, setPdfConfig
    }), [
        tabs, activeTabId, quoteData, customerData, companyData, items, discount, bankData,
        pdfLayout, viewMode, db, appFontSize, performanceMode, compactMode,
        focusMode, isLivePreviewMode, pdfConfig
    ]);

    return (
        <QuoteContext.Provider value={value}>
            {children}
        </QuoteContext.Provider>
    );
};
