import React from 'react';
import { CompanyDefaultsProvider, useCompanyDefaults } from '@/context/quote/CompanyDefaultsContext';
import { ConfirmProvider, useConfirm, useConfirmState } from '@/context/quote/ConfirmContext';
import { DatabaseProvider, useDatabase } from '@/context/quote/DatabaseContext';
import { PdfConfigProvider, usePdfConfig } from '@/context/quote/PdfConfigContext';
import { QuoteDataProvider, useQuoteData } from '@/context/quote/QuoteDataContext';
import { SaveStatusProvider, useSaveStatus } from '@/context/quote/SaveStatusContext';
import { TabProvider, useTab } from '@/context/quote/TabContext';
import type { QuoteContextValue } from '@/context/quote/types';

export const QuoteProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <DatabaseProvider>
            <CompanyDefaultsProvider>
                <ConfirmProvider>
                    <TabProvider>
                        <SaveStatusProvider>
                            <QuoteDataProvider>
                                <PdfConfigProvider>
                                    {children}
                                </PdfConfigProvider>
                            </QuoteDataProvider>
                        </SaveStatusProvider>
                    </TabProvider>
                </ConfirmProvider>
            </CompanyDefaultsProvider>
        </DatabaseProvider>
    );
};

/**
 * Combined hook for full context access (mostly for tests and legacy callers).
 * Prefer the specific hooks (useTab, useQuoteData, usePdfConfig, useSaveStatus, useConfirm)
 * to avoid re-rendering on unrelated context changes.
 */
export const useQuote = (): QuoteContextValue => {
    const { tabs, activeTabId, setActiveTabId, addTab, closeTab, switchTab, updateTabTitle, undo, redo, canUndo, canRedo } = useTab();
    const data = useQuoteData();
    const { pdfConfig, setPdfConfig, pdfLayout, setPdfLayout } = usePdfConfig();
    const saveStatus = useSaveStatus();
    const confirmState = useConfirmState();
    const { showConfirm, handleConfirmResolve, handleConfirmReject } = useConfirm();
    const { companyDefaults, saveCompanyDefaults } = useCompanyDefaults();
    const { db } = useDatabase();

    return {
        tabs, activeTabId, setActiveTabId, addTab, closeTab, switchTab, updateTabTitle,
        ...data,
        undo, redo, canUndo, canRedo,
        pdfConfig, setPdfConfig, pdfLayout, setPdfLayout,
        saveStatus,
        confirmState, showConfirm, handleConfirmResolve, handleConfirmReject,
        companyDefaults, saveCompanyDefaults,
        db,
    };
};

// Re-exports for consumers
export { useTab } from '@/context/quote/TabContext';
export { useQuoteData } from '@/context/quote/QuoteDataContext';
export { usePdfConfig } from '@/context/quote/PdfConfigContext';
export { useSaveStatus, useSaveStatusSetter } from '@/context/quote/SaveStatusContext';
export { useConfirm, useConfirmState } from '@/context/quote/ConfirmContext';
export { useCompanyDefaults } from '@/context/quote/CompanyDefaultsContext';
export { useDatabase } from '@/context/quote/DatabaseContext';
