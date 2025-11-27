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

    // Initial State
    const initialQuoteData = {
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
    };

    const initialCustomerData = {
        name: '',
        company: '',
        email: '',
        phone: '',
        address: ''
    };

    const initialCompanyData = {
        name: '',
        authorized: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        logo: null,
        signature: null,
        stamp: null
    };

    const [quoteData, setQuoteData] = useState(initialQuoteData);
    const [customerData, setCustomerData] = useState(initialCustomerData);
    const [companyData, setCompanyData] = useState(initialCompanyData);
    const [items, setItems] = useState([]);
    const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
    const [bankData, setBankData] = useState({
        bankName: '',
        branch: '',
        accountNumber: '',
        iban: '',
        accountHolder: ''
    });

    // PDF Layout State
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
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'desktop');

    useEffect(() => {
        localStorage.setItem('viewMode', viewMode);
    }, [viewMode]);

    // History State
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoing, setIsUndoing] = useState(false);

    // Calculate Valid Until Date
    useEffect(() => {
        if (quoteData.date && quoteData.validUntilDays) {
            const date = new Date(quoteData.date);
            date.setDate(date.getDate() + parseInt(quoteData.validUntilDays));
            setQuoteData(prev => ({ ...prev, validUntil: date.toISOString().split('T')[0] }));
        }
    }, [quoteData.date, quoteData.validUntilDays]);

    // Load draft from IndexedDB when DB is ready
    useEffect(() => {
        if (isReady && db) {
            const loadDraft = async () => {
                try {
                    const savedDraft = await db.get('drafts', 'current_draft');
                    if (savedDraft) {
                        setQuoteData(prev => ({ ...prev, ...savedDraft.quoteData }));
                        setCustomerData(prev => ({ ...prev, ...savedDraft.customerData }));
                        setCompanyData(prev => ({ ...prev, ...savedDraft.companyData }));
                        setItems(savedDraft.items || []);
                        setDiscount(savedDraft.discount || { type: 'percentage', value: 0 });
                        setBankData(prev => ({ ...prev, ...savedDraft.bankData }));
                        Logger.log('Draft loaded from IndexedDB');
                    }
                } catch (error) {
                    Logger.error('Error loading draft from IndexedDB', error);
                }
            };
            loadDraft();
        }
    }, [isReady, db]);

    // Auto-save draft to IndexedDB (Debounced)
    useEffect(() => {
        if (!isReady || !db) return;

        const saveToDB = async () => {
            const draft = {
                id: 'current_draft',
                quoteData,
                customerData,
                companyData,
                items,
                discount,
                bankData,
                updatedAt: new Date().toISOString()
            };
            try {
                await db.put('drafts', draft);
            } catch (error) {
                Logger.error('Error saving draft to IndexedDB', error);
            }
        };

        const timer = setTimeout(saveToDB, 1000);
        return () => clearTimeout(timer);
    }, [quoteData, customerData, companyData, items, discount, bankData, isReady, db]);

    // Load initial data or settings if needed
    useEffect(() => {
        if (isReady && db) {
            Logger.log('DB Ready');
            const loadSettings = async () => {
                try {
                    const settings = await db.get('settings', 'global');
                    if (settings) {
                        if (settings.currency) {
                            setQuoteData(prev => ({ ...prev, currency: settings.currency }));
                        }
                    }
                } catch (error) {
                    console.error("Error loading settings:", error);
                }
            };
            loadSettings();
        }
    }, [isReady, db]);

    // Save Snapshot to History
    const saveSnapshot = useCallback(() => {
        if (isUndoing) return;

        const snapshot = {
            quoteData,
            customerData,
            companyData,
            items,
            discount,
            bankData
        };

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(snapshot);
            // Limit history size to 50
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => {
            const newIndex = prev + 1;
            return newIndex > 49 ? 49 : newIndex;
        });
    }, [quoteData, customerData, companyData, items, discount, bankData, historyIndex, isUndoing]);

    // Debounced Snapshot for text inputs
    useEffect(() => {
        const timer = setTimeout(() => {
            saveSnapshot();
        }, 1000); // Save after 1 second of inactivity
        return () => clearTimeout(timer);
    }, [quoteData, customerData, companyData, items, discount, bankData]);

    const undo = () => {
        if (historyIndex > 0) {
            setIsUndoing(true);
            const prevSnapshot = history[historyIndex - 1];
            setQuoteData(prevSnapshot.quoteData);
            setCustomerData(prevSnapshot.customerData);
            setCompanyData(prevSnapshot.companyData);
            setItems(prevSnapshot.items);
            setDiscount(prevSnapshot.discount);
            if (prevSnapshot.bankData) setBankData(prevSnapshot.bankData);
            setHistoryIndex(historyIndex - 1);
            setTimeout(() => setIsUndoing(false), 100);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setIsUndoing(true);
            const nextSnapshot = history[historyIndex + 1];
            setQuoteData(nextSnapshot.quoteData);
            setCustomerData(nextSnapshot.customerData);
            setCompanyData(nextSnapshot.companyData);
            setItems(nextSnapshot.items);
            setDiscount(nextSnapshot.discount);
            if (nextSnapshot.bankData) setBankData(nextSnapshot.bankData);
            setHistoryIndex(historyIndex + 1);
            setTimeout(() => setIsUndoing(false), 100);
        }
    };

    const updateQuoteData = (field, value) => {
        setQuoteData(prev => ({ ...prev, [field]: value }));
    };

    const updateCustomerData = (field, value) => {
        setCustomerData(prev => ({ ...prev, [field]: value }));
    };

    const updateCompanyData = (field, value) => {
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const updateBankData = (field, value) => {
        setBankData(prev => ({ ...prev, [field]: value }));
    };

    const saveQuote = async () => {
        if (!isReady) {
            alert('Veritabanı hazır değil!');
            return;
        }

        const quote = {
            id: Date.now(), // Simple ID generation
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
                // Optionally reload data if needed
            } catch (error) {
                Logger.error('Error restoring backup', error);
                toast.error('Yedek yüklenirken hata oluştu: Geçersiz dosya');
            }
        };
        reader.readAsText(file);
    };

    const value = {
        quoteData, updateQuoteData,
        customerData, updateCustomerData,
        companyData, updateCompanyData,
        items, setItems,
        discount, setDiscount,
        bankData, updateBankData, setBankData,
        pdfLayout, setPdfLayout,
        saveQuote,
        createBackup, restoreBackup,
        undo, redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        isPdfModalOpen, setIsPdfModalOpen,
        viewMode, setViewMode,
        db
    };

    return (
        <QuoteContext.Provider value={value}>
            {children}
        </QuoteContext.Provider>
    );
};
