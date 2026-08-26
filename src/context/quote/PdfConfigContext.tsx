import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { getDefaultPdfConfig, getDefaultPdfLayout } from '@/context/quote/initialState';
import { useQuoteData } from '@/context/quote/QuoteDataContext';
import { pdfConfigSchema, type PdfConfig, type PdfLayoutItem } from '@/context/quote/types';
import Logger from '@/utils/logger';
import { getPdfMetadata } from '@/utils/pdfGenerator';

export interface PdfConfigContextValue {
    pdfConfig: PdfConfig;
    setPdfConfig: React.Dispatch<React.SetStateAction<PdfConfig>>;
    pdfLayout: PdfLayoutItem[];
    setPdfLayout: React.Dispatch<React.SetStateAction<PdfLayoutItem[]>>;
}

const PdfConfigContext = createContext<PdfConfigContextValue | null>(null);

const isPdfLayoutItem = (value: unknown): value is PdfLayoutItem => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string' && typeof item.label === 'string' && typeof item.enabled === 'boolean';
};

export const parseStoredPdfConfig = (savedConfig: string | null): PdfConfig => {
    const defaults = getDefaultPdfConfig();
    if (!savedConfig) return defaults;

    try {
        const parsed = JSON.parse(savedConfig);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('PDF ayarları nesne biçiminde değil.');
        }

        const allowedKeys = new Set<string>(pdfConfigSchema.keyof().options);
        const supportedEntries = Object.entries(parsed as Record<string, unknown>)
            .filter(([key]) => allowedKeys.has(key));
        const result = pdfConfigSchema.safeParse({ ...defaults, ...Object.fromEntries(supportedEntries) });

        if (!result.success) {
            Logger.warn('Geçersiz PDF ayarları varsayılan değerlere döndürüldü.', result.error.issues);
            return defaults;
        }
        return result.data;
    } catch (error) {
        Logger.warn('PDF ayarları okunamadı; varsayılan değerler kullanılacak.', error);
        return defaults;
    }
};

export const usePdfConfig = () => {
    const context = useContext(PdfConfigContext);
    if (!context) throw new Error('usePdfConfig must be used within a PdfConfigProvider');
    return context;
};

export const PdfConfigProvider = ({ children }: { children: React.ReactNode }) => {
    const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() =>
        parseStoredPdfConfig(localStorage.getItem('pdfConfig'))
    );

    useEffect(() => {
        try { localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig)); } catch (e) { Logger.error('Error saving pdfConfig:', e); }
    }, [pdfConfig]);

    const { quoteData } = useQuoteData();

    useEffect(() => {
        const language = quoteData?.language || 'tr';
        const localizedDefault = getPdfMetadata(language).title.toUpperCase();
        const knownDefaults = ['FİYAT TEKLİFİ', 'TEKLİF', 'PRICE QUOTE', 'QUOTE', 'PREISANGEBOT', 'ANGEBOT', 'DEVIS', 'PRESUPUESTO'];
        setPdfConfig(prev =>
            prev.title && knownDefaults.includes(prev.title.toUpperCase()) && prev.title !== localizedDefault
                ? { ...prev, title: localizedDefault }
                : prev
        );
    }, [quoteData?.language]);

    // PDF Layout State
    const [pdfLayout, setPdfLayout] = useState<PdfLayoutItem[]>(() => {
        try {
            const defaults = getDefaultPdfLayout();
            const savedLayout = localStorage.getItem('pdfLayout');
            const parsed = (savedLayout && savedLayout !== 'undefined') ? JSON.parse(savedLayout) : null;
            if (Array.isArray(parsed)) {
                const defaultIds = new Set(defaults.map(item => item.id));
                const savedItems = parsed.filter(isPdfLayoutItem).filter(item => defaultIds.has(item.id));
                const savedIds = new Set(savedItems.map(item => item.id));
                return [...savedItems, ...defaults.filter(item => !savedIds.has(item.id))];
            }
        } catch (e) { Logger.error('Error parsing pdfLayout:', e); }
        return getDefaultPdfLayout();
    });

    useEffect(() => {
        try {
            localStorage.setItem('pdfLayout', JSON.stringify(pdfLayout));
        } catch (e) {
            Logger.error('Error saving pdfLayout:', e);
        }
    }, [pdfLayout]);

    const value = useMemo<PdfConfigContextValue>(() => ({ pdfConfig, setPdfConfig, pdfLayout, setPdfLayout }), [pdfConfig, pdfLayout]);

    return <PdfConfigContext.Provider value={value}>{children}</PdfConfigContext.Provider>;
};
