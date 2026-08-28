import { Palette, Layout, AlignLeft, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import PdfPageNavigator from '@/components/pdf-preview/PdfPageNavigator';
import PdfPreviewCanvas from '@/components/pdf-preview/PdfPreviewCanvas';
import PdfPreviewHeader from '@/components/pdf-preview/PdfPreviewHeader';
import PdfVersionModal from '@/components/pdf-preview/PdfVersionModal';
import PdfZoomToolbar from '@/components/pdf-preview/PdfZoomToolbar';
import { PdfDesignTab, PdfLayoutTab, PdfTextsTab } from '@/components/pdf-tabs';
import PopupEditor from '@/components/PopupEditor';
import { useQuoteData, usePdfConfig } from '@/context/QuoteContext';
import { useUI } from '@/context/UIContext';
import useDebounce from '@/hooks/useDebounce';
import { usePdfExport } from '@/hooks/usePdfExport';
import { usePdfPageObserver } from '@/hooks/usePdfPageObserver';
import { usePdfTemplates } from '@/hooks/usePdfTemplates';
import { useTranslation } from '@/hooks/useTranslation';

// Hooks

// Tab Components

// Preview Components

const PdfPreviewPanel = React.memo(() => {
    const {
        quoteData,
        items,
        customerData,
        companyData,
        bankData,
        discount,
        updateQuoteData,
        updateCustomerData,
        updateCompanyData,
        saveVersion,
    } = useQuoteData();
    const { pdfLayout, pdfConfig, setPdfConfig } = usePdfConfig();
    const { performanceMode } = useUI();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState('design');
    const [versionNameInput, setVersionNameInput] = useState('');
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);
    const [renderedConfig, setRenderedConfig] = useState(pdfConfig);
    
    const [showControls, setShowControls] = useState(() => {
        try { return localStorage.getItem('pdf_preview_controls_open') === 'true'; } 
        catch { return false; }
    });

    const toggleControls = useCallback(() => {
        setShowControls(prev => {
            const next = !prev;
            try { localStorage.setItem('pdf_preview_controls_open', String(next)); } 
            catch { /* ignore */ }
            return next;
        });
    }, []);

    const [zoomLevel, setZoomLevel] = useState(0.7);
    const [showMarginGuides, setShowMarginGuides] = useState(false);
    
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const marginGuidesRef = useRef<HTMLDivElement>(null);

    // Custom Hooks
    const {
        savedTemplates,
        templateName,
        setTemplateName,
        saveTemplate,
        loadTemplate,
        deleteTemplate
    } = usePdfTemplates(pdfConfig, setPdfConfig, t);

    const {
        estimatedPages,
        pageCount,
        activePage,
        overflowPages,
        scrollToPage
    } = usePdfPageObserver({
        contentRef,
        scrollRef,
        thumbnailsRef,
        marginGuidesRef,
        pdfConfig,
        renderedConfig,
        items,
        zoomLevel,
        showMarginGuides,
        t
    });

    const {
        isGenerating,
        handleDownload,
        handlePrint,
        handleShare,
        handleExcelExport,
        handleCsvExport
    } = usePdfExport({
        quoteData,
        customerData,
        companyData,
        bankData,
        items,
        discount,
        pdfConfig,
        pageSize: pdfConfig.pageSize || 'a4',
        quality: pdfConfig.pdfQuality || 'high',
        t
    });

    // Debounce the config to avoid expensive PDF re-renders while editing.
    const debouncedPdfConfig = useDebounce(pdfConfig, performanceMode ? 1500 : 300);

    useEffect(() => {
        setRenderedConfig(debouncedPdfConfig);
    }, [debouncedPdfConfig]);

    // Popup Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editConfig, setEditConfig] = useState<{
        title: string;
        initialValue: string;
        onSave: (value: string) => void;
        type: string;
        options: { value: string; label: string }[];
    }>({
        title: '',
        initialValue: '',
        onSave: () => { },
        type: 'text',
        options: []
    });

    const fieldLabels: Record<string, string> = {
        quoteTitle: t('documentTitle'),
        companyName: t('company'),
        customerCompany: t('customerCompany'),
        customerName: t('authorized'),
        customerPhone: t('phone'),
        customerEmail: t('email'),
        date: t('date'),
        validUntil: t('validUntil'),
        notes: t('notes'),
        terms: t('terms'),
        deliveryTerms: t('deliveryTerms')
    };

    const handleConfigChange = useCallback((key: string, value: unknown) => {
        setPdfConfig(prev => ({ ...prev, [key]: value }));
    }, [setPdfConfig]);

    const handleFieldEdit = useCallback((fieldKey: string, value: unknown, type = 'text') => {
        setEditConfig({
            title: fieldLabels[fieldKey] || fieldKey,
            initialValue: String(value ?? ''),
            type,
            options: [],
            onSave: (newValue: string) => {
                switch (fieldKey) {
                    case 'quoteTitle': updateQuoteData('title', newValue); break;
                    case 'companyName': updateCompanyData('name', newValue); break;
                    case 'customerCompany': updateCustomerData('company', newValue); break;
                    case 'customerName': updateCustomerData('name', newValue); break;
                    case 'customerPhone': updateCustomerData('phone', newValue); break;
                    case 'customerEmail': updateCustomerData('email', newValue); break;
                    case 'date': updateQuoteData('date', newValue); break;
                    case 'validUntil': updateQuoteData('validUntil', newValue); break;
                    case 'notes': updateQuoteData('notes', newValue); break;
                    case 'terms': updateQuoteData('terms', newValue); break;
                    case 'warrantyTerms': updateQuoteData('warrantyTerms', newValue); break;
                    case 'deliveryTerms': updateQuoteData('deliveryTerms', newValue); break;
                    default: break;
                }
            }
        });
        setIsEditorOpen(true);
    }, [updateQuoteData, updateCustomerData, updateCompanyData, fieldLabels]);

    const handleSaveVersion = useCallback(async () => {
        if (!versionNameInput.trim()) {
            toast.error('Lütfen bir sürüm adı girin');
            return;
        }
        const verId = await saveVersion(versionNameInput.trim());
        if (verId) {
            setVersionNameInput('');
            setShowVersionModal(false);
        }
    }, [versionNameInput, saveVersion]);

    const tabs = [
        { id: 'design', label: t('tabAppearance') || 'Tasarım', icon: Palette },
        { id: 'layout', label: t('tabLayout') || 'Düzen', icon: Layout },
        { id: 'texts', label: t('tabTexts') || 'Metinler', icon: AlignLeft }
    ];

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-card)] border-l border-[var(--color-border)]">
            <PdfPreviewHeader
                t={t}
                handleExcelExport={handleExcelExport}
                handleCsvExport={handleCsvExport}
                handlePrint={handlePrint}
                handleShare={handleShare}
                setShowVersionModal={setShowVersionModal}
                handleDownload={handleDownload}
                isGenerating={isGenerating}
                showControls={showControls}
                toggleControls={toggleControls}
            />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Controls (Collapsible) */}
                <div className={`${showControls ? 'flex w-full md:w-80' : 'hidden'} flex-shrink-0 border-r border-[var(--color-border)] flex-col bg-[var(--color-bg-card)] transition-all`}>
                    {/* Segmented Control Tabs */}
                    <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-muted)]/50 p-1 gap-1">
                        {tabs.map(tab => (
                            <button type="button"
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${activeTab === tab.id ? 'bg-[var(--color-bg-card)] text-[var(--color-info)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-card)]/50'}`}
                            >
                                <tab.icon size={13} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {activeTab === 'design' && (
                            <PdfDesignTab
                                pdfConfig={pdfConfig}
                                handleConfigChange={handleConfigChange}
                                setPdfConfig={setPdfConfig}
                                t={t}
                                templateName={templateName}
                                setTemplateName={setTemplateName}
                                savedTemplates={savedTemplates}
                                saveTemplate={saveTemplate}
                                loadTemplate={loadTemplate}
                                deleteTemplate={deleteTemplate}
                            />
                        )}
                        {activeTab === 'layout' && (
                            <PdfLayoutTab
                                pdfConfig={pdfConfig}
                                handleConfigChange={handleConfigChange}
                                t={t}
                            />
                        )}
                        {activeTab === 'texts' && (
                            <PdfTextsTab
                                pdfConfig={pdfConfig}
                                handleConfigChange={handleConfigChange}
                                t={t}
                                signature={signature}
                                setSignature={setSignature}
                            />
                        )}
                    </div>
                </div>

                {/* Right: Preview (Zoomable) */}
                <div className="flex-1 bg-[var(--color-bg-muted)] overflow-hidden flex flex-col relative">
                    {/* Overflow Warning */}
                    {overflowPages.length > 0 && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-amber-500/90 text-white text-xs rounded-lg shadow-[var(--shadow-lg)]">
                            <AlertTriangle size={14} />
                            <span>{t('pdfOverflowWarning').replace('{pages}', overflowPages.join(', '))}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center items-start" ref={scrollRef}>
                        <PdfPreviewCanvas
                            zoomLevel={zoomLevel}
                            contentRef={contentRef}
                            marginGuidesRef={marginGuidesRef}
                            pdfConfig={pdfConfig}
                            renderedConfig={renderedConfig}
                            quoteData={quoteData}
                            items={items}
                            customerData={customerData}
                            companyData={companyData}
                            bankData={bankData}
                            discount={discount}
                            pdfLayout={pdfLayout}
                            signature={signature}
                            handleFieldEdit={handleFieldEdit}
                        />
                    </div>

                    <PdfZoomToolbar
                        pageSize={pdfConfig.pageSize || 'a4'}
                        estimatedPages={estimatedPages}
                        t={t}
                        zoomLevel={zoomLevel}
                        setZoomLevel={setZoomLevel}
                        showMarginGuides={showMarginGuides}
                        setShowMarginGuides={setShowMarginGuides}
                        isGenerating={isGenerating}
                    />

                    <PdfPageNavigator
                        pageCount={pageCount}
                        activePage={activePage}
                        scrollToPage={scrollToPage}
                        t={t}
                        thumbnailsRef={thumbnailsRef}
                    />
                </div>
            </div>

            <PdfVersionModal
                showVersionModal={showVersionModal}
                setShowVersionModal={setShowVersionModal}
                versionNameInput={versionNameInput}
                setVersionNameInput={setVersionNameInput}
                handleSaveVersion={handleSaveVersion}
                t={t}
            />

            {/* Popup Editor (Global) */}
            <PopupEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                title={editConfig.title}
                initialValue={editConfig.initialValue}
                onSave={editConfig.onSave}
                type={editConfig.type}
                options={editConfig.options}
            />
        </div>
    );
});

export default PdfPreviewPanel;
