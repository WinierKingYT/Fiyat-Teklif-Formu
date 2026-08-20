import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { getDefaultPdfConfig, getDefaultPdfLayout } from '@/context/quote/initialState';
import { useQuoteData } from '@/context/quote/QuoteDataContext';
import Logger from '@/utils/logger';
import { getPdfMetadata } from '@/utils/pdfGenerator';
import type { PdfConfig, PdfLayoutItem } from '@/context/quote/types';

export interface PdfConfigContextValue {
    pdfConfig: PdfConfig;
    setPdfConfig: React.Dispatch<React.SetStateAction<PdfConfig>>;
    pdfLayout: PdfLayoutItem[];
    setPdfLayout: React.Dispatch<React.SetStateAction<PdfLayoutItem[]>>;
}

const PdfConfigContext = createContext<PdfConfigContextValue | null>(null);

export const usePdfConfig = () => {
    const context = useContext(PdfConfigContext);
    if (!context) throw new Error('usePdfConfig must be used within a PdfConfigProvider');
    return context;
};

export const PdfConfigProvider = ({ children }: { children: React.ReactNode }) => {
    // PDF Configuration State
    const [pdfConfig, setPdfConfig] = useState<PdfConfig>(() => {
        const savedConfig = localStorage.getItem('pdfConfig');
        try { return savedConfig ? { ...getDefaultPdfConfig(), ...JSON.parse(savedConfig) } : getDefaultPdfConfig(); }
        catch { return getDefaultPdfConfig(); }
    });

    useEffect(() => { localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig)); }, [pdfConfig]);

    const { quoteData } = useQuoteData();

    useEffect(() => {
        const language = quoteData?.language || 'tr';
        const localizedDefault = getPdfMetadata(language).title.toUpperCase();
        const knownDefaults = ['FİYAT TEKLİFİ', 'PRICE QUOTE', 'PREISANGEBOT'];
        setPdfConfig(prev =>
            prev.title && knownDefaults.includes(prev.title) && prev.title !== localizedDefault
                ? { ...prev, title: localizedDefault }
                : prev
        );
    }, [quoteData?.language]);

    // PDF Layout State
    const [pdfLayout, setPdfLayout] = useState<PdfLayoutItem[]>(() => {
        try {
            const savedLayout = localStorage.getItem('pdfLayout');
            const parsed = (savedLayout && savedLayout !== 'undefined') ? JSON.parse(savedLayout) : null;
            if (Array.isArray(parsed)) return parsed;
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
