import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Logger from '../../utils/logger';
import toast from 'react-hot-toast';
import performanceMonitor from '../../utils/performanceMonitor';
import { deepEqual } from '../../utils/deepEqual';
import { useDatabase } from './DatabaseContext';
import { useConfirm } from './ConfirmContext';
import { useCompanyDefaults } from './CompanyDefaultsContext';
import type { Tab } from './types';
import { getDefaultTabs, getInitialTabData } from './initialState';

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

    const [tabs, setTabs] = useState<Tab[]>(getDefaultTabs());

    const [activeTabId, setActiveTabId] = useState(() => {
        return localStorage.getItem('activeTabId') || 'default-tab';
    });

    // --- Load tabs from IndexedDB ---
    useEffect(() => {
        if (isReady && db) {
            const loadTabs = async () => {
                try {
                    const savedTabs = await db.getByIndex<{ id: string; value: Tab[] }>('settings', 'key', 'session_tabs');
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
                    const existingRecord = await db.getByIndex<{ id: string; value: Tab[] }>('settings', 'key', 'session_tabs');
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

    // --- Tab Actions ---
    const addTab = useCallback(async () => {
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
    }, [tabs, activeTabId, showConfirm, companyDefaults]);

    const closeTab = useCallback(async (tabId: string) => {
        if (tabs.length <= 1) {
            toast.error('Son sekmeyi kapatamazsınız.');
            return;
        }
        const tabToClose = tabs.find(t => t.id === tabId);
        if ((tabToClose?.data?.items?.length ?? 0) > 0) {
            const confirmed = await showConfirm('Sekmeyi Kapat', 'Bu sekmede kaydedilmemiş değişiklikler olabilir. Kapatmak istiyor musunuz?', 'warning');
            if (!confirmed) return;
        }
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
    }, [tabs, activeTabId, showConfirm]);

    const switchTab = useCallback((tabId: string) => setActiveTabId(tabId), []);

    const updateTabTitle = useCallback((tabId: string, title: string) => {
        setTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, title } : tab));
    }, []);

    // --- History State ---
    const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    // Performance monitoring
    useEffect(() => {
        if (!isReady || !db) return;
        const checkPerformance = async () => {
            try {
                const metrics = await performanceMonitor.getPerformanceMetrics(db, tabs);
                const recommendations = performanceMonitor.getRecommendations(metrics);
                if (recommendations.needsCleanup) {
                    const highWarnings = recommendations.warnings.filter((w: { type: string; severity: string; message: string }) => w.severity === 'high');
                    if (highWarnings.length > 0) toast('Performans uyarısı: ' + highWarnings[0].message, { duration: 5000, icon: '⚠️' });
                }
            } catch (error) { Logger.error('Performance check failed:', error); }
        };
        const interval = setInterval(checkPerformance, 5 * 60 * 1000);
        const timeout = setTimeout(checkPerformance, 60 * 1000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [isReady, db, tabs]);

    const value = useMemo<TabContextValue>(() => ({
        tabs, activeTabId, setActiveTabId, addTab, closeTab, switchTab, updateTabTitle,
        undo, redo, canUndo, canRedo, setTabs,
    }), [tabs, activeTabId, addTab, closeTab, switchTab, updateTabTitle, undo, redo, canUndo, canRedo]);

    return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
