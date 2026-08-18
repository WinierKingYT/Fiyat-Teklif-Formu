import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import Logger from '../../utils/logger';
import { useDatabase } from './DatabaseContext';
import type { CompanyData } from './types';

interface CompanyDefaultsContextValue {
    companyDefaults: CompanyData | null;
    saveCompanyDefaults: (data: CompanyData) => Promise<void>;
}

const CompanyDefaultsContext = createContext<CompanyDefaultsContextValue | null>(null);

export const CompanyDefaultsProvider = ({ children }: { children: React.ReactNode }) => {
    const { db, isReady } = useDatabase();
    const [companyDefaults, setCompanyDefaults] = useState<CompanyData | null>(null);

    useEffect(() => {
        if (isReady && db) {
            const loadDefaults = async () => {
                try {
                    const defaultsRecord = await db.getByIndex('settings', 'key', 'company_defaults');
                    if (defaultsRecord && defaultsRecord.value) setCompanyDefaults(defaultsRecord.value);
                } catch (error) { Logger.error("Error loading company defaults:", error); }
            };
            loadDefaults();
        }
    }, [isReady, db]);

    const saveCompanyDefaults = useCallback(async (data: CompanyData) => {
        if (!isReady || !db) return;
        try {
            await db.put('settings', { id: 'company_defaults', key: 'company_defaults', value: data });
            setCompanyDefaults(data);
            toast.success('Firma bilgileri kaydedildi');
        } catch (error) { Logger.error('Error saving company defaults:', error); }
    }, [isReady, db]);

    const value = useMemo<CompanyDefaultsContextValue>(() => ({ companyDefaults, saveCompanyDefaults }), [companyDefaults, saveCompanyDefaults]);

    return <CompanyDefaultsContext.Provider value={value}>{children}</CompanyDefaultsContext.Provider>;
};

export const useCompanyDefaults = () => {
    const context = useContext(CompanyDefaultsContext);
    if (!context) throw new Error('useCompanyDefaults must be used within a CompanyDefaultsProvider');
    return context;
};
