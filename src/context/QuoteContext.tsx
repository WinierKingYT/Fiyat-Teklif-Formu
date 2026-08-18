import React from 'react';
import { DatabaseProvider, useDatabase } from './quote/DatabaseContext';
import { ConfirmProvider, useConfirm, useConfirmState } from './quote/ConfirmContext';
import { CompanyDefaultsProvider, useCompanyDefaults } from './quote/CompanyDefaultsContext';
import { TabProvider, useTab } from './quote/TabContext';
import { QuoteDataProvider, useQuoteData } from './quote/QuoteDataContext';
import { SaveStatusProvider, useSaveStatus, useSaveStatusSetter } from './quote/SaveStatusContext';
import { PdfConfigProvider, usePdfConfig } from './quote/PdfConfigContext';
import type { QuoteContextValue } from './quote/types';

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
export { useTab } from './quote/TabContext';
export { useQuoteData } from './quote/QuoteDataContext';
export { usePdfConfig } from './quote/PdfConfigContext';
export { useSaveStatus, useSaveStatusSetter } from './quote/SaveStatusContext';
export { useConfirm, useConfirmState } from './quote/ConfirmContext';
export { useCompanyDefaults } from './quote/CompanyDefaultsContext';
export { useDatabase } from './quote/DatabaseContext';
