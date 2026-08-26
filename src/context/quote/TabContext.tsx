import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCompanyDefaults } from '@/context/quote/CompanyDefaultsContext';
import { useConfirm } from '@/context/quote/ConfirmContext';
import { useDatabase } from '@/context/quote/DatabaseContext';
import { getDefaultTabs, getInitialTabData } from '@/context/quote/initialState';
import { deepEqual } from '@/utils/deepEqual';
import Logger from '@/utils/logger';
import type { Tab } from '@/context/quote/types';

export interface TabContextValue {
    tabs: Tab[];
    activeTabId: string;
    setActiveTabId: (id: string) => void;
    addTab: () => Promise<void>;
    closeTab: (tabId: string) => Promise<void>;
    switchTab: (tabId: string) => void;
    updateTabTitle: (tabId: string, title: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
}

const TabContext = createContext<TabContextValue | null>(null);

export const useTab = () => {
    const context = useContext(TabContext);
    if (!context) throw new Error('useTab must be used within a TabProvider');
    return context;
};

export const TabProvider = ({ children }: { children: React.ReactNode }) => {
    const { db, isReady } = useDatabase();
    const { showConfirm } = useConfirm();
    const { companyDefaults } = useCompanyDefaults();

    const [tabs, setTabs] = useState<Tab[]>(() => getDefaultTabs(companyDefaults));
    const activeTabId = 'active-quote';

    // --- Load session data from IndexedDB ---
    useEffect(() => {
        if (isReady && db) {
            const loadActiveQuote = async () => {
                try {
                    const savedTab = await db.getByIndex<{ id: string; value: Tab[] }>('settings', 'key', 'active_quote_session');
                    if (savedTab && Array.isArray(savedTab.value) && savedTab.value.length > 0) {
                        setTabs(savedTab.value.map(tab => ({ ...tab, id: tab.id || activeTabId })));
                    }
                } catch (error) {
                    Logger.error('Error loading session from IndexedDB:', error);
                }
            };
            loadActiveQuote();
        }
    }, [isReady, db]);

    // --- Save session data to IndexedDB ---
    useEffect(() => {
        if (isReady && db) {
            const saveActiveQuote = async () => {
                try {
                    const existingRecord = await db.getByIndex<{ id: string; value: Tab[] }>('settings', 'key', 'active_quote_session');
                    const record = { id: 'active_quote_session', key: 'active_quote_session', value: tabs };
                    if (existingRecord) {
                        record.id = existingRecord.id;
                        await db.put('settings', record);
                    } else {
                        await db.add('settings', record);
                    }
                } catch (error) {
                    Logger.error('Error saving session to IndexedDB:', error);
                }
            };
            const timeoutId = setTimeout(saveActiveQuote, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [tabs, isReady, db]);

    // --- Actions ---
    const addTab = useCallback(async () => {
        const currentData = tabs[0]?.data;
        if ((currentData?.items?.length ?? 0) > 0) {
            const confirmed = await showConfirm(
                'Yeni Teklif',
                'Mevcut teklif temizlenip yeni bir teklif başlatılacak. Devam etmek istiyor musunuz?',
                'warning'
            );
            if (!confirmed) return;
        }
        const initialData = getInitialTabData(companyDefaults);
        setTabs([{
            id: activeTabId,
            title: 'Yeni Teklif',
            savedQuoteId: null,
            data: initialData,
            history: [initialData],
            historyIndex: 0
        }]);
        toast.success('Yeni teklif formu hazırlandı');
    }, [tabs, showConfirm, companyDefaults]);

    const closeTab = useCallback(async () => {
        await addTab();
    }, [addTab]);

    const switchTab = useCallback(() => {
        /* Single quote mode - no tab switching */
    }, []);

    const updateTabTitle = useCallback((_: string, title: string) => {
        setTabs(prev => prev.map(t => ({ ...t, title })));
    }, []);

    // --- History State (Undo / Redo) ---
    const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isNavigatingHistory = useRef(false);

    const undo = useCallback(() => {
        setTabs(prev => {
            const current = prev[0];
            if (!current || current.historyIndex <= 0) return prev;
            isNavigatingHistory.current = true;
            const newIndex = current.historyIndex - 1;
            const previousData = current.history[newIndex];
            return [{
                ...current,
                data: JSON.parse(JSON.stringify(previousData)),
                historyIndex: newIndex
            }];
        });
        toast.success('Geri alındı');
    }, []);

    const redo = useCallback(() => {
        setTabs(prev => {
            const current = prev[0];
            if (!current || current.historyIndex >= (current.history?.length || 0) - 1) return prev;
            isNavigatingHistory.current = true;
            const newIndex = current.historyIndex + 1;
            const nextData = current.history[newIndex];
            return [{
                ...current,
                data: JSON.parse(JSON.stringify(nextData)),
                historyIndex: newIndex
            }];
        });
        toast.success('İleri alındı');
    }, []);

    // History tracker effect
    useEffect(() => {
        if (isNavigatingHistory.current) {
            isNavigatingHistory.current = false;
            return;
        }
        const current = tabs[0];
        if (!current) return;

        if (!current.history || current.history.length === 0) {
            setTabs([{
                ...current,
                history: [JSON.parse(JSON.stringify(current.data))],
                historyIndex: 0
            }]);
            return;
        }

        const currentHistoryState = current.history[current.historyIndex];
        if (!deepEqual(current.data, currentHistoryState)) {
            if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
            historyTimeoutRef.current = setTimeout(() => {
                setTabs(prev => {
                    const active = prev[0];
                    if (!active) return prev;
                    const newHistory = (active.history || []).slice(0, active.historyIndex + 1);
                    newHistory.push(JSON.parse(JSON.stringify(active.data)));
                    if (newHistory.length > 50) newHistory.shift();
                    return [{
                        ...active,
                        history: newHistory,
                        historyIndex: newHistory.length - 1
                    }];
                });
            }, 1000);
        }
        return () => {
            if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
        };
    }, [tabs]);

    const currentTab = tabs[0];
    const canUndo = currentTab ? currentTab.historyIndex > 0 : false;
    const canRedo = currentTab ? currentTab.historyIndex < (currentTab.history?.length || 0) - 1 : false;

    const value = useMemo<TabContextValue>(() => ({
        tabs,
        activeTabId,
        setActiveTabId: () => {},
        addTab,
        closeTab,
        switchTab,
        updateTabTitle,
        undo,
        redo,
        canUndo,
        canRedo,
        setTabs,
    }), [tabs, addTab, closeTab, switchTab, updateTabTitle, undo, redo, canUndo, canRedo]);

    return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
