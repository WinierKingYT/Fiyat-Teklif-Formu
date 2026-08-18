import React, { createContext, useContext } from 'react';
import { useIndexedDB } from '../../hooks/useIndexedDB';
import type { IndexedDBManager } from './types';

interface DatabaseContextValue {
    db: IndexedDBManager;
    isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const DatabaseProvider = ({ children }: { children: React.ReactNode }) => {
    const { db, isReady } = useIndexedDB();
    const value = { db, isReady };
    return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
    return context;
};
