import React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileDown, Palette, LayoutTemplate, Eye, Type, Table, Layout, Stamp, Sparkles, Trash2, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet, FileText, PenTool, Layers, Edit2, Zap, ZapOff, RefreshCcw, Power, PowerOff, Printer, Share2, Settings2, Ruler, AlertTriangle } from 'lucide-react';
import { calculateQuoteTotals } from '../utils/calculations';
import { generatePDF, printQuote, loadPdfFonts, getPdfMetadata, PAGE_SIZE_OPTIONS, QUALITY_OPTIONS, type PageSize, type PdfQuality } from '../utils/pdfGenerator';
import { shareQuote } from '../utils/emailService';
import { exportQuoteToExcel, exportQuoteToCSV } from '../utils/excelExporter';
import PrintableQuote from './PrintableQuoteV2';
import PopupEditor from './PopupEditor';
import { useQuoteData, usePdfConfig } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import Logger from '../utils/logger';
import useDebounce from '../hooks/useDebounce';
import { deepEqual } from '../utils/deepEqual';
import PdfSectionsTab from './pdf-tabs/PdfSectionsTab';
import type html2pdfType from 'html2pdf.js';
import type { PdfConfig } from '../context/quote/types';

type Html2PdfOptions = NonNullable<Parameters<typeof html2pdfType>[1]>;

interface SavedPdfTemplate {
    id: number;
    name: string;
    config: PdfConfig;
}

interface PdfPreset {
    id: string;
    labelKey: string;
    config: Partial<PdfConfig>;
}

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
        updateCompanyData
    } = useQuoteData();
    const { pdfLayout, pdfConfig, setPdfConfig } = usePdfConfig();
    const { t } = useTranslation(quoteData?.language);

    const [activeTab, setActiveTab] = useState('sections');
    const [savedTemplates, setSavedTemplates] = useState<SavedPdfTemplate[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [signature, setSignature] = useState<string | null>(null);
    const [performanceMode, setPerformanceMode] = useState(false);
    const [manualRefreshMode, setManualRefreshMode] = useState(false);
    const [renderedConfig, setRenderedConfig] = useState(pdfConfig);
    const [pageSize, setPageSize] = useState<PageSize>('a4');
    const [quality, setQuality] = useState<PdfQuality>('high');
    const [showControls, setShowControls] = useState(window.innerWidth > 900);
    const [zoomLevel, setZoomLevel] = useState(0.7);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState('');
    const [estimatedPages, setEstimatedPages] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [activePage, setActivePage] = useState(1);
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const marginGuidesRef = useRef<HTMLDivElement>(null);
    const [showMarginGuides, setShowMarginGuides] = useState(false);
    const [overflowPages, setOverflowPages] = useState<number[]>([]);


    // Estimate page count from content height
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => {
            const isLandscapeParam = pdfConfig.pageOrientation === 'landscape';
            const pageWidthMm = isLandscapeParam ? 297 : 210;
            const pageHeightMm = isLandscapeParam ? 210 : 297;
            const pxPerMm = el.offsetWidth / pageWidthMm;
            const pageHeightPx = pageHeightMm * pxPerMm;
            setEstimatedPages(Math.max(1, Math.ceil(el.scrollHeight / pageHeightPx)));
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, [pdfConfig.pageOrientation, items.length, renderedConfig]);

    // Debounce the config for preview rendering (used when Manual Mode is OFF)
    // In Performance Mode, use longer debounce (1500ms), otherwise 300ms
    const debouncedPdfConfig = useDebounce(pdfConfig, performanceMode ? 1500 : 300);

    // Real page count from rendered .pdf-page blocks
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const count = el.querySelectorAll('.pdf-page').length;
        setPageCount(Math.max(1, count));
    }, [renderedConfig, items.length, pdfConfig.theme, pdfConfig.color]);

    // Track active page while scrolling
    useEffect(() => {
        const el = contentRef.current;
        const root = scrollRef.current;
        if (!el || !root) return;
        const pages = el.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    const topEntry = visible.reduce((a, b) =>
                        a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
                    );
                    const idx = Array.prototype.indexOf.call(pages, topEntry.target);
                    if (idx >= 0) setActivePage(idx + 1);
                }
            },
            { root, threshold: 0.2 }
        );
        pages.forEach((p) => observer.observe(p));
        return () => observer.disconnect();
    }, [pageCount, renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, zoomLevel]);

    const scrollToPage = useCallback((n: number) => {
        const pages = contentRef.current?.querySelectorAll('.pdf-page');
        const page = pages?.[n - 1] as HTMLElement | undefined;
        if (page) {
            page.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActivePage(n);
        }
    }, []);

    // Detect pages whose content overflows the page height
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const pages = el.querySelectorAll('.pdf-page');
        const overflow: number[] = [];
        pages.forEach((p, i) => {
            const pageEl = p as HTMLElement;
            if (pageEl.scrollHeight > pageEl.clientHeight + 2) overflow.push(i + 1);
        });
        setOverflowPages(overflow);
    }, [renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, pdfConfig.margins, pdfConfig.tableRowHeight]);

    // Margin guide overlay (preview only, not included in PDF output)
    useEffect(() => {
        const overlay = marginGuidesRef.current;
        const src = contentRef.current;
        if (!overlay || !src) return;
        overlay.innerHTML = '';
        if (!showMarginGuides) return;
        const pages = src.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        const marginMm = pdfConfig.margins === 'compact' ? 5 : pdfConfig.margins === 'wide' ? 15 : 10;
        const first = pages[0] as HTMLElement;
        const pageWidth = first.offsetWidth || 794;
        const pxPerMm = pageWidth / 210;
        const marginPx = marginMm * pxPerMm;
        pages.forEach((page) => {
            const el = page as HTMLElement;
            const guide = document.createElement('div');
            guide.style.cssText = `position:absolute;left:${marginPx}px;top:${el.offsetTop + marginPx}px;width:${pageWidth - marginPx * 2}px;height:${el.offsetHeight - marginPx * 2}px;border:1px dashed var(--color-info);opacity:0.55;pointer-events:none;border-radius:2px;`;
            overlay.appendChild(guide);
        });
    }, [showMarginGuides, pageCount, renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, pdfConfig.margins]);

    const PDF_PRESETS = useMemo(() => [
        {
            id: 'corporate',
            labelKey: 'presetCorporate',
            config: {
                theme: 'corporate', color: '#1e3a8a', globalFontFamily: 'Georgia, serif',
                titleFontFamily: 'Georgia, serif', fontSize: 11, margins: 'normal',
                tableHeaderBg: '#1e3a8a', tableRowHeight: 35, showTableImages: true, showWatermark: false
            }
        },
        {
            id: 'minimal',
            labelKey: 'presetMinimal',
            config: {
                theme: 'minimal', color: '#111827', globalFontFamily: 'Inter',
                fontSize: 12, margins: 'wide', tableHeaderBg: 'transparent',
                tableRowHeight: 32, showTableImages: false, showWatermark: false
            }
        },
        {
            id: 'economy',
            labelKey: 'presetEconomy',
            config: {
                theme: 'classic', color: '#000000', globalFontFamily: "'Times New Roman', Times, serif",
                titleFontFamily: "'Times New Roman', Times, serif", fontSize: 10, margins: 'compact',
                tableRowHeight: 28, tableCellPadding: '4px', showTableImages: false, showWatermark: false
            }
        },
        {
            id: 'modern',
            labelKey: 'presetModern',
            config: {
                theme: 'modern', color: '#2563eb', globalFontFamily: 'Inter',
                fontSize: 12, margins: 'normal', tableHeaderBg: '#f1f5f9',
                tableRowHeight: 35, showTableImages: true, showWatermark: false
            }
        }
    ], []);

    const applyPreset = useCallback((preset: PdfPreset) => {
        setPdfConfig(prev => ({ ...prev, ...preset.config }));
        toast.success(t('presetApplied'));
    }, [setPdfConfig, t]);

    // Build scaled thumbnail clones of each page
    const debouncedItems = useDebounce(items, 500);
    useEffect(() => {
        const container = thumbnailsRef.current;
        const src = contentRef.current;
        if (!container || !src) return;
        const pages = src.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        container.innerHTML = '';
        const pageWidth = (pages[0] as HTMLElement).offsetWidth || 794;
        const thumbWidth = 56;
        const scale = thumbWidth / pageWidth;
        const thumbHeight = Math.round(pageWidth * (297 / 210) * scale);
        pages.forEach((page, i) => {
            const box = document.createElement('div');
            box.className = 'relative overflow-hidden rounded border border-[var(--color-border)] bg-white shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-[var(--color-info)]';
            box.style.width = `${thumbWidth}px`;
            box.style.height = `${thumbHeight}px`;
            box.title = `${t('page')} ${i + 1}`;
            box.setAttribute('aria-label', `${t('page')} ${i + 1}`);
            const clone = page.cloneNode(true) as HTMLElement;
            clone.style.position = 'absolute';
            clone.style.top = '0';
            clone.style.left = '0';
            clone.style.width = `${pageWidth}px`;
            clone.style.transform = `scale(${scale})`;
            clone.style.transformOrigin = 'top left';
            clone.style.pointerEvents = 'none';
            clone.style.margin = '0';
            box.appendChild(clone);
            const label = document.createElement('div');
            label.className = 'absolute bottom-0 inset-x-0 text-center text-[9px] font-semibold text-white bg-black/60 py-0.5';
            label.textContent = String(i + 1);
            box.appendChild(label);
            box.addEventListener('click', () => scrollToPage(i + 1));
            container.appendChild(box);
        });
    }, [pageCount, renderedConfig, debouncedItems, pdfConfig.theme, pdfConfig.color, scrollToPage, t]);

    // Effect to handle config updates based on mode
    useEffect(() => {
        if (!manualRefreshMode) {
            setRenderedConfig(debouncedPdfConfig);
        }
    }, [debouncedPdfConfig, manualRefreshMode]);

    const handleManualRefresh = () => {
        setRenderedConfig(pdfConfig);
        toast.success(t('previewUpdated'));
    };

    // Check if there are pending changes in Manual Mode
    const hasPendingChanges = useMemo(
        () => manualRefreshMode && !deepEqual(renderedConfig, pdfConfig),
        [manualRefreshMode, renderedConfig, pdfConfig]
    );

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

    const openEditor = useCallback((title, initialValue, onSave, type = 'text', options = []) => {
        setEditConfig({
            title,
            initialValue,
            onSave,
            type,
            options
        });
        setIsEditorOpen(true);
    }, []);

    const fieldLabels = {
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

    const handleConfigChange = useCallback((key, value) => {
        setPdfConfig(prev => ({ ...prev, [key]: value }));
    }, [setPdfConfig]);

    const handleFieldEdit = useCallback((fieldKey, value, type = 'text') => {
        setEditConfig({
            title: fieldLabels[fieldKey] || fieldKey,
            initialValue: value,
            onSave: (newValue) => {
                switch (fieldKey) {
                    case 'quoteTitle':
                        handleConfigChange('title', newValue);
                        break;
                    case 'companyName':
                        updateCompanyData('name', newValue);
                        break;
                    case 'customerCompany':
                        updateCustomerData('company', newValue);
                        break;
                    case 'customerName':
                        updateCustomerData('name', newValue);
                        break;
                    case 'customerPhone':
                        updateCustomerData('phone', newValue);
                        break;
                    case 'customerEmail':
                        updateCustomerData('email', newValue);
                        break;
                    case 'date':
                        updateQuoteData('date', newValue);
                        break;
                    case 'validUntil':
                        updateQuoteData('validUntil', newValue);
                        break;
                    case 'notes':
                        updateQuoteData('notes', newValue);
                        break;
                    case 'terms':
                        updateQuoteData('warrantyTerms', newValue);
                        break;
                    case 'deliveryTerms':
                        updateQuoteData('deliveryTerms', newValue);
                        break;
                    default:
                        break;
                }
            },
            type,
            options: []
        });
        setIsEditorOpen(true);
    }, [quoteData, customerData, companyData, updateQuoteData, updateCustomerData, updateCompanyData, handleConfigChange, fieldLabels]);

    // Load templates from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pdfTemplates');
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved) as SavedPdfTemplate[]);
            } catch (e) {
                Logger.error('Failed to parse templates', e);
            }
        }
    }, []);

    const saveTemplate = useCallback(() => {
        if (!templateName.trim()) return;
        const newTemplate = {
            id: Date.now(),
            name: templateName,
            config: pdfConfig
        };
        const updatedTemplates = [...savedTemplates, newTemplate];
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        setTemplateName('');
        toast.success(t('templateSaved'));
    }, [templateName, pdfConfig, savedTemplates]);

    const loadTemplate = useCallback((template: SavedPdfTemplate) => {
        setPdfConfig(template.config);
        toast.success(t('templateLoaded'));
    }, [setPdfConfig]);

    const deleteTemplate = useCallback((id: number) => {
        const updatedTemplates = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        toast.success(t('templateDeleted'));
    }, [savedTemplates]);

    const sanitizeFileNamePart = useCallback((value: string) => {
        const trMap: Record<string, string> = {
            'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
            'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
        };
        return value
            .split('')
            .map(ch => trMap[ch] || ch)
            .join('')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .slice(0, 40);
    }, []);

    const buildPdfFilename = useCallback(() => {
        const meta = getPdfMetadata(quoteData.language || 'tr');
        const slug = meta.filename.replace(/\.pdf$/i, '');
        const customerPart = sanitizeFileNamePart(customerData.name || 'Musteri');
        const numberPart = quoteData.number || t('draft');
        const datePart = new Date().toISOString().slice(0, 10);
        return `${slug}_${customerPart}_${numberPart}_${datePart}.pdf`;
    }, [quoteData.language, quoteData.number, customerData.name, sanitizeFileNamePart, t]);

    const generationStageLabels: Record<string, string> = {
        fonts: t('pdfPreparing'),
        images: t('pdfProcessingImages'),
        render: t('pagesProcessing'),
        save: t('pdfSaving'),
        done: t('pdfSaving')
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        setGenerationStage(t('pdfPreparing'));
        try {
            const filename = buildPdfFilename();
            await new Promise(resolve => setTimeout(resolve, 100));
            const result = await generatePDF('printable-quote-container-panel', filename, {
                theme: pdfConfig.theme,
                color: pdfConfig.color,
                pageSize,
                quality,
                orientation: pdfConfig.pageOrientation || 'portrait',
                margin: pdfConfig.margins === 'compact' ? 5 : pdfConfig.margins === 'wide' ? 15 : 10,
                title: pdfConfig.title,
                author: companyData.name || 'TeklifApp',
                language: quoteData.language || 'tr',
                fontFamilies: [pdfConfig.globalFontFamily, pdfConfig.titleFontFamily, pdfConfig.labelFontFamily, pdfConfig.bodyFontFamily, pdfConfig.fontFamily],
                backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
                onStage: (stage) => setGenerationStage(generationStageLabels[stage] || t('pdfPreparing'))
            });
            if (result) {
                toast.success(t('pdfDownloaded').replace('{size}', result.sizeText).replace('{time}', result.elapsedText));
            }
        } finally {
            setIsGenerating(false);
            setGenerationStage('');
        }
    };

    const handlePrint = () => {
        printQuote('printable-quote-container-panel', {
            language: quoteData.language || 'tr',
            backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
            pageSize,
            orientation: pdfConfig.pageOrientation || 'portrait'
        });
    };

    const handleShare = async () => {
        try {
            const element = document.getElementById('printable-quote-container-panel');
            if (!element) { toast.error(t('pdfAreaNotFound')); return; }
            const { default: html2pdf } = await import('html2pdf.js');
            await loadPdfFonts([pdfConfig.globalFontFamily, pdfConfig.titleFontFamily, pdfConfig.labelFontFamily, pdfConfig.bodyFontFamily, pdfConfig.fontFamily]);
            const isLandscape = pdfConfig.pageOrientation === 'landscape';
            const shareFormat = pageSize === 'a4' && !isLandscape ? 'a4' : isLandscape ? 'a4' : pageSize;
            const shareOrientation = isLandscape ? 'landscape' : 'portrait';
            const qual = quality === 'draft' ? 2 : quality === 'normal' ? 3 : quality === 'high' ? 4 : quality === 'print' ? 5 : 6;
            const shareOptions = {
                margin: 0,
                image: { type: 'png', quality: 1.0 },
                html2canvas: {
                    scale: qual,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: pdfConfig.pageBackgroundColor || '#ffffff',
                    imageTimeout: 0,
                    letterRendering: quality !== 'draft'
                },
                jsPDF: {
                    unit: 'mm',
                    format: shareFormat,
                    orientation: shareOrientation,
                    compress: true,
                    properties: {
                        title: pdfConfig.title || getPdfMetadata(quoteData.language || 'tr').title,
                        author: companyData.name || 'TeklifApp'
                    }
                }
            } as Html2PdfOptions;
            const pdfBlob = await html2pdf().set(shareOptions).from(element).outputPdf('blob');
            const filename = buildPdfFilename();
            await shareQuote(pdfBlob, filename);
            toast.success(t('shareSuccess'));
        } catch (error) {
            if ((error as Error).message !== 'Share cancelled') {
                toast.error(t('shareFailed') + (error as Error).message);
            }
        }
    };

    
    const buildExportData = () => {
        const calc = calculateQuoteTotals(items, discount, { currency: quoteData.currency });
        return {
            fullQuoteData: {
                ...quoteData,
                customer: customerData,
                company: companyData,
                bankData: bankData,
                items: calc.items,
                subTotal: calc.subtotal,
                taxAmount: calc.taxTotal,
                grandTotal: calc.grandTotal,
                globalDiscountAmount: calc.globalDiscountAmount,
                discount: discount
            },
            calculatedItems: calc.items
        };
    };

    const handleExcelExport = async () => {
        try {
            const { fullQuoteData, calculatedItems } = buildExportData();
            await exportQuoteToExcel(fullQuoteData, calculatedItems);
            toast.success(t('excelDownloaded'));
        } catch (error) {
            toast.error(t('excelError'));
        }
    };

    const handleCsvExport = () => {
        try {
            const { fullQuoteData, calculatedItems } = buildExportData();
            exportQuoteToCSV(fullQuoteData, calculatedItems);
            toast.success(t('csvDownloaded'));
        } catch (error) {
            toast.error(t('csvError'));
        }
    };

    const tabs = [
        { id: 'appearance', label: t('tabAppearance'), icon: Palette },
        { id: 'sections', label: t('tabSections'), icon: Layout },
        { id: 'typography', label: t('tabTypography'), icon: Type },
        { id: 'layout', label: t('tabLayout'), icon: Layout },
        { id: 'table', label: t('tabTable'), icon: Table },
        { id: 'texts', label: t('tabTexts'), icon: AlignLeft },
        { id: 'content', label: t('tabContent'), icon: Eye },
        { id: 'extras', label: t('tabExtras'), icon: Sparkles },
        { id: 'signature', label: t('tabSignature'), icon: PenTool }
    ];

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-card)] border-l border-[var(--color-border)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-muted)]">
                <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
                    <FileDown size={20} className="text-[var(--color-info)]" />
                    {t('livePreview')}
                </h3>
                <div className="flex items-center gap-1">
                    <button type="button"
                        onClick={handleExcelExport}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-success)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('downloadExcel')}
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden sm:inline text-xs">{t('downloadExcel')}</span>
                    </button>
                    <button type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('print')}
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline text-xs">{t('print')}</span>
                    </button>
                    <button type="button"
                        onClick={handleShare}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-info)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('share')}
                    >
                        <Share2 size={18} />
                        <span className="hidden sm:inline text-xs">{t('share')}</span>
                    </button>
                    <button type="button"
                        onClick={handleCsvExport}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('downloadCSV')}
                    >
                        <FileText size={18} />
                        <span className="hidden sm:inline text-xs">{t('downloadCSV')}</span>
                    </button>
                    <button type="button"
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-[var(--radius)] shadow hover:shadow-[var(--shadow-lg)] transition-all font-semibold ${isGenerating ? 'bg-[var(--color-text-muted)] cursor-not-allowed' : 'bg-[var(--color-info)] hover:opacity-90'}`}
                        title={t('downloadPdf')}
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <FileDown size={18} />
                        )}
                        <span>{isGenerating ? t('generating') : t('downloadPdf')}</span>
                    </button>
                    <button type="button"
                        onClick={() => setShowControls(!showControls)}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors md:hidden"
                        title={showControls ? t('hideControls') : t('showControls')}
                    >
                        <Settings2 size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Controls (Collapsible on mobile) */}
                <div className={`${showControls ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-shrink-0 border-r border-[var(--color-border)] flex-col bg-[var(--color-bg-card)]`}>
                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-[var(--color-border)] scrollbar-hide">
                        {tabs.map(tab => (
                            <button type="button"
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[60px] flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-primary-muted)]/50' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {/* APPEARANCE (THEME) TAB */}
                        {activeTab === 'appearance' && (
                            <>
                                {/* Template Management */}
                                <div className="space-y-3 mb-4 pb-4 border-b border-[var(--color-border)]">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-2">
                                        <Layout size={14} /> {t('templates')}
                                    </h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            placeholder={t('templateName')}
                                            className="flex-1 px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        />
                                        <button type="button"
                                            onClick={saveTemplate}
                                            disabled={!templateName.trim()}
                                            className="px-2 py-1.5 bg-[var(--color-info)] text-white text-xs rounded hover:opacity-90 disabled:opacity-50"
                                        >
                                            {t('save')}
                                        </button>
                                    </div>
                                    {savedTemplates.length > 0 && (
                                        <div className="space-y-1">
                                            {savedTemplates.map(tmpl => (
                                                <div key={tmpl.id} className="flex items-center justify-between text-xs bg-[var(--color-bg-muted)] p-1.5 rounded">
                                                    <span className="truncate flex-1">{tmpl.name}</span>
                                                    <div className="flex gap-1">
                                                        <button type="button" onClick={() => loadTemplate(tmpl)} className="text-[var(--color-info)] hover:text-[var(--color-info)]" aria-label={`${t('loadTemplate')}: ${tmpl.name}`}><LayoutTemplate size={12} /></button>
                                                        <button type="button" onClick={() => deleteTemplate(tmpl.id)} className="text-[var(--color-error)] hover:text-[var(--color-error)]" aria-label={`${t('deleteTemplate')}: ${tmpl.name}`}><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Theme Selection */}
                                <div className="space-y-2 mb-4">
                                    <label className="text-xs font-medium text-[var(--color-text)]">{t('design')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'modern', name: 'Modern', thumb: (c: string) => (<div className="absolute inset-0"><div className="h-1.5 w-full" style={{ background: c }} /><div className="h-2 w-1/3 mt-1 ml-1 rounded-sm bg-slate-300" /><div className="h-1 w-1/2 mt-1 ml-1 rounded-sm bg-slate-200" /><div className="h-3 w-4/5 mt-2 ml-1 rounded-sm bg-slate-100" /></div>) },
                                            { id: 'classic', name: 'Klasik', thumb: () => (<div className="absolute inset-1 border-2 border-slate-400 rounded-sm"><div className="h-1.5 w-3/4 mx-auto mt-1 bg-slate-400" /><div className="h-1 w-full mt-1 bg-slate-300" /><div className="h-1 w-full mt-1 bg-slate-300" /><div className="h-1 w-full mt-1 bg-slate-300" /></div>) },
                                            { id: 'minimal', name: 'Minimal', thumb: () => (<div className="absolute inset-0"><div className="h-2 w-1/3 mt-1 ml-1 bg-slate-200" /><div className="h-1 w-1/4 mt-2 ml-1 bg-slate-100" /><div className="w-5/6 mx-auto mt-3 border-t border-slate-200" /><div className="h-1 w-3/4 mx-auto mt-2 bg-slate-100" /></div>) },
                                            { id: 'corporate', name: 'Kurumsal', thumb: (c: string) => (<div className="absolute inset-0"><div className="h-3 w-full" style={{ background: c }} /><div className="h-2 w-2/3 mt-1 ml-1 rounded-sm bg-slate-200" /><div className="h-1 w-1/2 mt-1 ml-1 bg-slate-100" /><div className="h-3 w-4/5 mt-2 mx-auto rounded-sm bg-slate-100" /></div>) },
                                            { id: 'pro', name: 'Premium (Pro)', thumb: (c: string) => (<div className="absolute inset-0 flex gap-1 p-1"><div className="w-1 h-full rounded-sm" style={{ background: c }} /><div className="flex-1"><div className="h-1.5 w-full rounded-sm bg-slate-200" /><div className="h-1.5 w-4/5 mt-1 rounded-sm bg-slate-100" /><div className="h-3 w-full mt-2 rounded-sm border border-slate-200" /></div></div>) },
                                            { id: 'bold', name: 'Bold', thumb: (c: string) => (<div className="absolute inset-0"><div className="h-2.5 w-full" style={{ background: c }} /><div className="h-1 w-1/2 mt-1 ml-1 bg-slate-200" /><div className="h-4 w-11/12 mt-1 mx-auto border-2 rounded-sm" style={{ borderColor: c }} /></div>) }
                                        ].map((t) => (
                                            <button type="button"
                                                key={t.id}
                                                onClick={() => handleConfigChange('theme', t.id)}
                                                className={`flex flex-col items-start gap-1 p-1.5 rounded border transition-all ${pdfConfig.theme === t.id ? 'bg-[var(--color-primary-muted)] border-[var(--color-info)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'}`}
                                            >
                                                <div className="w-full aspect-[21/12] rounded overflow-hidden border border-[var(--color-border)] relative bg-white">
                                                    {t.thumb(pdfConfig.color)}
                                                </div>
                                                <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{t.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Presets */}
                                <div className="mt-3">
                                    <label className="text-xs font-medium text-[var(--color-text)]">{t('presets')}</label>
                                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                                        {PDF_PRESETS.map((p) => (
                                            <button type="button"
                                                key={p.id}
                                                onClick={() => applyPreset(p)}
                                                className="px-2 py-1.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-info)] transition-all"
                                            >
                                                {t(p.labelKey)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Color */}
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('primaryColor')}</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={pdfConfig.color}
                                            onChange={(e) => handleConfigChange('color', e.target.value)}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <span className="text-xs text-[var(--color-text-muted)] uppercase">{pdfConfig.color}</span>
                                    </div>
                                </div>

                                {/* Page Background Color */}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('pageBackground')}</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={pdfConfig.pageBackgroundColor || '#ffffff'}
                                            onChange={(e) => handleConfigChange('pageBackgroundColor', e.target.value)}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <span className="text-xs text-[var(--color-text-muted)] uppercase">{pdfConfig.pageBackgroundColor || '#ffffff'}</span>
                                    </div>
                                </div>

                                {/* Page Background Pattern */}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('pageBgPattern')}</label>
                                    <select
                                        value={pdfConfig.pageBgPattern || 'none'}
                                        onChange={(e) => handleConfigChange('pageBgPattern', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                    >
                                        <option value="none">{t('patternNone')}</option>
                                        <option value="dots">{t('patternDots')}</option>
                                        <option value="grid">{t('patternGrid')}</option>
                                        <option value="gradient">{t('patternGradient')}</option>
                                    </select>
                                </div>

                                {/* Logo Appearance */}
                                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1.5">{t('logoAppearance')}</label>
                                    <div className="grid grid-cols-3 gap-1 mb-2">
                                        {(['left', 'center', 'right'] as const).map(pos => (
                                            <button type="button"
                                                key={pos}
                                                onClick={() => handleConfigChange('logoPosition', pos)}
                                                className={`py-1 text-[10px] border rounded transition-colors ${pdfConfig.logoPosition === pos ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                            >
                                                {t(`logoPos${pos.charAt(0).toUpperCase() + pos.slice(1)}`)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {(['square', 'rounded', 'circle'] as const).map(s => (
                                            <button type="button"
                                                key={s}
                                                onClick={() => handleConfigChange('logoStyle', s)}
                                                className={`py-1 text-[10px] border rounded transition-colors ${pdfConfig.logoStyle === s ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                            >
                                                {t(`logoStyle${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                                            </button>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">{t('logoMaxHeight')}: {pdfConfig.logoMaxHeight || 50}px</label>
                                        <input
                                            type="range"
                                            min={20}
                                            max={120}
                                            value={pdfConfig.logoMaxHeight || 50}
                                            onChange={(e) => handleConfigChange('logoMaxHeight', parseInt(e.target.value, 10))}
                                            className="w-full accent-[var(--color-info)]"
                                        />
                                    </div>
                                </div>

                                {/* Page Size & Quality */}
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)] mt-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('pageSize')}</label>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(e.target.value as PageSize)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            {PAGE_SIZE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('orientation')}</label>
                                        <div className="grid grid-cols-2 gap-1">
                                            <button type="button"
                                                onClick={() => handleConfigChange('pageOrientation', 'portrait')}
                                                className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.pageOrientation === 'portrait' ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                            >
                                                {t('portrait')}
                                            </button>
                                            <button type="button"
                                                onClick={() => handleConfigChange('pageOrientation', 'landscape')}
                                                className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.pageOrientation === 'landscape' ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                            >
                                                {t('landscape')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('quality')}</label>
                                        <select
                                            value={quality}
                                            onChange={(e) => setQuality(e.target.value as PdfQuality)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            {QUALITY_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* TYPOGRAPHY TAB */}
                        {activeTab === 'typography' && (
                            <div className="space-y-4">
                                {/* Font Families */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('fontFamilies')}</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('generalFont')}</label>
                                        <select
                                            value={pdfConfig.globalFontFamily || 'Inter'}
                                            onChange={(e) => handleConfigChange('globalFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Lato', sans-serif">Dengeli (Lato)</option>
                                            <option value="'Montserrat', sans-serif">Geometrik (Montserrat)</option>
                                            <option value="'Playfair Display', serif">Zarif (Playfair)</option>
                                            <option value="'Merriweather', serif">Klasik (Merriweather)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('titleFont')}</label>
                                        <select
                                            value={pdfConfig.titleFontFamily || ''}
                                            onChange={(e) => handleConfigChange('titleFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="">{t('sameAsGeneral')}</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Montserrat', sans-serif">Geometrik (Montserrat)</option>
                                            <option value="'Playfair Display', serif">Zarif (Playfair)</option>
                                            <option value="'Oswald', sans-serif">{t('strong')} (Oswald)</option>
                                            <option value="'Roboto Slab', serif">Robotik (Roboto Slab)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('labelFont')}</label>
                                        <select
                                            value={pdfConfig.labelFontFamily || ''}
                                            onChange={(e) => handleConfigChange('labelFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="">{t('sameAsGeneral')}</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Lato', sans-serif">Dengeli (Lato)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('contentFont')}</label>
                                        <select
                                            value={pdfConfig.bodyFontFamily || ''}
                                            onChange={(e) => handleConfigChange('bodyFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="">{t('sameAsGeneral')}</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Merriweather', serif">Klasik (Merriweather)</option>
                                            <option value="'Courier New', monospace">Daktilo (Courier)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTIONS TAB (Granular Typography) */}
                        {activeTab === 'sections' && (
                            <PdfSectionsTab pdfConfig={pdfConfig} handleConfigChange={handleConfigChange} t={t} />
                        )}

                        {/* LAYOUT TAB */}
                        {activeTab === 'layout' && (
                            <div className="space-y-4">
                                {/* Spacing */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('spacing')}</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('pageMargin')}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { val: 'compact', label: 'Dar' },
                                                { val: 'normal', label: 'Normal' },
                                                { val: 'wide', label: 'Geni' }
                                            ].map(opt => (
                                                <button type="button"
                                                    key={opt.val}
                                                    onClick={() => handleConfigChange('margins', opt.val)}
                                                    className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.margins === opt.val ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                                            <span>{t('sectionSpacing')}</span>
                                            <span className="text-[var(--color-text-muted)]">{pdfConfig.sectionSpacing || '1rem'}</span>
                                        </label>
                                        <select
                                            value={pdfConfig.sectionSpacing || '1rem'}
                                            onChange={(e) => handleConfigChange('sectionSpacing', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="0.5rem">{t('small')} (0.5rem)</option>
                                            <option value="1rem">Normal (1rem)</option>
                                            <option value="1.5rem">{t('wide')} (1.5rem)</option>
                                            <option value="2rem">{t('veryWide')} (2rem)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Shapes */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('shapes')}</h4>
                                    <div>
                                        <label className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                                            <span>{t('borderRadius')}</span>
                                            <span className="text-[var(--color-text-muted)]">{pdfConfig.borderRadius || 6}px</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            step="2"
                                            value={pdfConfig.borderRadius !== undefined ? pdfConfig.borderRadius : 6}
                                            onChange={(e) => handleConfigChange('borderRadius', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('logoPosition')}</label>
                                        <div className="flex bg-[var(--color-bg-muted)] rounded p-1">
                                            {[
                                                { val: 'left', icon: AlignLeft },
                                                { val: 'center', icon: AlignCenter },
                                                { val: 'right', icon: AlignRight }
                                            ].map(opt => (
                                                <button type="button"
                                                    key={opt.val}
                                                    onClick={() => handleConfigChange('logoPosition', opt.val)}
                                                    className={`flex-1 py-1 flex justify-center rounded transition-colors ${pdfConfig.logoPosition === opt.val ? 'bg-[var(--color-bg-card)] shadow text-[var(--color-info)]' : 'text-[var(--color-text-muted)]'}`}
                                                >
                                                    <opt.icon size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('borderStyle')}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { val: 'solid', label: t('solid') },
                                                { val: 'dashed', label: t('dashed') },
                                                { val: 'dotted', label: t('dotted') }
                                            ].map(opt => (
                                                <button type="button"
                                                    key={opt.val}
                                                    onClick={() => handleConfigChange('boxBorderStyle', opt.val)}
                                                    className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.boxBorderStyle === opt.val ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Density */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('density')}</h4>
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                            <span className="text-[var(--color-text)]">{t('compactMode')} ({t('small')})</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableDensity === 'compact'}
                                                onChange={(e) => handleConfigChange('tableDensity', e.target.checked ? 'compact' : 'normal')}
                                                className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTENT TAB */}
                        {activeTab === 'content' && (
                            <div className="space-y-2">
                                {[
                                    { key: 'showLogo', label: t('companyLogo') },
                                    { key: 'showBankInfo', label: t('bankInfo') },
                                    { key: 'showSignatures', label: t('signatureStampArea') },
                                    { key: 'showTerms', label: t('terms') },
                                    { key: 'showNotes', label: t('notes') },
                                    { key: 'showSummary', label: t('priceSummary') }
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                        <span className="text-[var(--color-text)]">{item.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig[item.key]}
                                            onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                        />
                                    </label>
                                ))}

                                <div className="pt-3 border-t border-[var(--color-border)] mt-3">
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                                        {t('documentTitle')}
                                    </label>
                                    <input
                                        type="text"
                                        value={pdfConfig.title}
                                        onChange={(e) => handleConfigChange('title', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        placeholder={t('titlePlaceholder')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TABLE TAB */}
                        {activeTab === 'table' && (
                            <div className="space-y-4">
                                {/* Table Style Options */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('tableStyle')}</h4>

                                    {/* Header Colors */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('headerBackground')}</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={pdfConfig.tableHeaderBg || '#f1f5f9'}
                                                    onChange={(e) => handleConfigChange('tableHeaderBg', e.target.value)}
                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('headerText')}</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={pdfConfig.tableHeaderColor || '#475569'}
                                                    onChange={(e) => handleConfigChange('tableHeaderColor', e.target.value)}
                                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Border Color */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('borderColor')}</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={pdfConfig.tableBorderColor || '#e2e8f0'}
                                                onChange={(e) => handleConfigChange('tableBorderColor', e.target.value)}
                                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="space-y-2 pt-2">
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                            <span className="text-[var(--color-text)]">{t('stripedRows')}</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableStriped}
                                                onChange={(e) => handleConfigChange('tableStriped', e.target.checked)}
                                                className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                            <span className="text-[var(--color-text)]">{t('verticalLines')}</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableShowVerticalLines}
                                                onChange={(e) => handleConfigChange('tableShowVerticalLines', e.target.checked)}
                                                className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Column Visibility */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('columns')}</h4>
                                    <div className="space-y-1">
                                        {[
                                            { key: 'showTableImages', label: t('productImages') },
                                            { key: 'showTableUnit', label: t('unitColumn') },
                                            { key: 'showTableTax', label: t('vatColumn') }
                                        ].map((item) => (
                                            <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                                <span className="text-[var(--color-text)]">{item.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={pdfConfig[item.key]}
                                                    onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                                    className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Row Height */}
                                <div>
                                    <label className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                                        <span>{t('rowHeight')}</span>
                                        <span className="text-[var(--color-text-muted)]">{pdfConfig.tableRowHeight}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="80"
                                        step="5"
                                        value={pdfConfig.tableRowHeight}
                                        onChange={(e) => handleConfigChange('tableRowHeight', parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* EXTRAS TAB */}
                        {/* TEXTS TAB */}
                        {activeTab === 'texts' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('tableHeaders')}</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('itemHeader')}</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textItem || ''}
                                                onChange={(e) => handleConfigChange('textItem', e.target.value)}
                                                placeholder={t('item')}
                                                className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('descriptionHeader')}</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textDescription || ''}
                                                onChange={(e) => handleConfigChange('textDescription', e.target.value)}
                                                placeholder={t('description')}
                                                className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('unitHeader')}</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textUnit || ''}
                                                    onChange={(e) => handleConfigChange('textUnit', e.target.value)}
                                                    placeholder={t('unit')}
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('quantityHeader')}</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textQuantity || ''}
                                                    onChange={(e) => handleConfigChange('textQuantity', e.target.value)}
                                                    placeholder={t('quantity')}
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('priceHeader')}</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textUnitPrice || ''}
                                                    onChange={(e) => handleConfigChange('textUnitPrice', e.target.value)}
                                                    placeholder={t('unitPrice')}
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('vatHeader')}</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textVat || ''}
                                                    onChange={(e) => handleConfigChange('textVat', e.target.value)}
                                                    placeholder={t('vat')}
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('totalHeader')}</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textTotal || ''}
                                                onChange={(e) => handleConfigChange('textTotal', e.target.value)}
                                                placeholder={t('total')}
                                                className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EXTRAS TAB */}
                        {activeTab === 'extras' && (
                            <div className="space-y-4">
                                {/* Visual Effects */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('visualEffects')}</h4>
                                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                        <span className="text-[var(--color-text)]">{t('shadow')}</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig.enableShadows}
                                            onChange={(e) => handleConfigChange('enableShadows', e.target.checked)}
                                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                        />
                                    </label>
                                </div>

                                {/* Performance Mode */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1 flex items-center gap-2">
                                        <Zap size={14} className={performanceMode ? "text-[var(--color-warning)]" : ""} />
                                        {t('performanceSettings')}
                                    </h4>
                                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--color-text)] font-medium flex items-center gap-2">
                                                {performanceMode ? <Zap size={12} className="text-[var(--color-warning)]" /> : <ZapOff size={12} />}
                                                {t('performanceMode')}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                {t('performanceDesc')}
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={performanceMode}
                                            onChange={(e) => setPerformanceMode(e.target.checked)}
                                            className="rounded border-[var(--color-border)] text-[var(--color-warning)] focus:ring-[var(--color-warning)] w-4 h-4"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--color-text)] font-medium flex items-center gap-2">
                                                <RefreshCcw size={12} />
                                                {t('manualRefresh')}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                {t('manualRefreshDesc')}
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={manualRefreshMode}
                                            onChange={(e) => setManualRefreshMode(e.target.checked)}
                                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                        />
                                    </label>
                                </div>

                                {/* Watermark */}
                                <div>
                                    <label className="flex items-center justify-between mb-2 text-xs font-medium text-[var(--color-text)]">
                                        <span>{t('watermark')}</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig.showWatermark}
                                            onChange={(e) => handleConfigChange('showWatermark', e.target.checked)}
                                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                        />
                                    </label>
                                    {pdfConfig.showWatermark && (
                                        <div className="space-y-3 pl-2 border-l-2 border-[var(--color-border)] mt-2">
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('watermarkText')}</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.watermarkText}
                                                    onChange={(e) => handleConfigChange('watermarkText', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                    placeholder={t('watermarkText')}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('color')}</label>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="color"
                                                            value={pdfConfig.watermarkColor || '#000000'}
                                                            onChange={(e) => handleConfigChange('watermarkColor', e.target.value)}
                                                            className="w-full h-6 p-0 border-0 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('size')} ({pdfConfig.watermarkFontSize || 120}px)</label>
                                                    <input
                                                        type="range"
                                                        min="40"
                                                        max="200"
                                                        step="10"
                                                        value={pdfConfig.watermarkFontSize || 120}
                                                        onChange={(e) => handleConfigChange('watermarkFontSize', parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('opacity')} ({pdfConfig.watermarkOpacity || 0.1})</label>
                                                    <input
                                                        type="range"
                                                        min="0.05"
                                                        max="0.5"
                                                        step="0.05"
                                                        value={pdfConfig.watermarkOpacity || 0.1}
                                                        onChange={(e) => handleConfigChange('watermarkOpacity', parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('rotation')} ({pdfConfig.watermarkRotation || -45})</label>
                                                    <input
                                                        type="range"
                                                        min="-90"
                                                        max="90"
                                                        step="15"
                                                        value={pdfConfig.watermarkRotation || -45}
                                                        onChange={(e) => handleConfigChange('watermarkRotation', parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                                        {t('footer')}
                                    </label>
                                    <input
                                        type="text"
                                        value={pdfConfig.customFooter}
                                        onChange={(e) => handleConfigChange('customFooter', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        placeholder={t('footer')}
                                    />
                                </div>
                            </div>
                        )}

                        {/* SIGNATURE TAB */}
                        {activeTab === 'signature' && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-xs text-[var(--color-text)]">{t('digitalSignature')}</h4>

                                {signature ? (
                                    <div className="space-y-2">
                                        <div className="border border-[var(--color-border)] rounded p-4 bg-[var(--color-bg-card)] flex justify-center items-center h-32">
                                            <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <button type="button"
                                            onClick={() => setSignature(null)}
                                            className="w-full py-2 text-xs text-[var(--color-error)] hover:text-[var(--color-error)] font-medium border border-[var(--color-border)] hover:border-[var(--color-error)] rounded bg-[var(--color-error)]/10 hover:bg-[var(--color-error)]/10 transition-colors"
                                        >
                                            {t('removeSignature')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-info)] transition-colors bg-[var(--color-bg-muted)]/50">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setSignature(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="signature-upload"
                                            />
                                            <label
                                                htmlFor="signature-upload"
                                                className="cursor-pointer flex flex-col items-center gap-2"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-info)]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-[var(--color-text)]">
                                                    {t('uploadSignature')}
                                                </span>
                                                <span className="text-[10px] text-[var(--color-text-muted)]">
                                                    {t('imageHint')}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-[var(--color-text-muted)]">
                                    {t('signatureUploadHint')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Preview (Zoomable) */}
                <div className="flex-1 bg-[var(--color-bg-muted)] overflow-hidden flex flex-col relative">
                    <div className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1.5 rounded-[var(--radius)] shadow border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] font-medium ${performanceMode ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-bg-card)]/80 backdrop-blur'}`}>
                        <span>{pageSize.toUpperCase()}</span>
                        <span className="text-[var(--color-border)]">|</span>
                        <span>{pdfConfig.pageOrientation === 'landscape' ? t('landscape') : t('portrait')}</span>
                        <span className="text-[var(--color-border)]">|</span>
                        <span className="flex items-center gap-1">
                            <FileDown size={10} />
                            {estimatedPages}
                        </span>
                    </div>

                    {/* Manual Refresh Button Overlay */}
                    {manualRefreshMode && hasPendingChanges && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                            <button type="button"
                                onClick={handleManualRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-info)] hover:opacity-90 text-white rounded-full shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-lg)] transition-all animate-bounce"
                            >
                                <RefreshCcw size={16} />
                                <span>{t('refreshPreview')}</span>
                            </button>
                        </div>
                    )}

                    {/* Overflow Warning */}
                    {overflowPages.length > 0 && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-amber-500/90 text-white text-xs rounded-lg shadow-[var(--shadow-lg)]">
                            <AlertTriangle size={14} />
                            <span>{t('pdfOverflowWarning').replace('{pages}', overflowPages.join(', '))}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center items-start" ref={scrollRef}>
                        <div className="origin-top shadow-[var(--shadow-lg)] transition-all duration-300 bg-[var(--color-bg-card)] relative" style={{ transform: `scale(${zoomLevel})`, imageRendering: zoomLevel < 0.5 ? 'auto' : 'crisp-edges' } as React.CSSProperties}>
                            <div ref={contentRef} className="relative">
                                <style>{`
                                    #printable-quote-container-panel .pdf-page {
                                        margin-bottom: 28px;
                                    }
                                    #printable-quote-container-panel .pdf-page:last-child {
                                        margin-bottom: 0;
                                    }
                                `}</style>
                <PrintableQuote
                    id="printable-quote-container-panel"
                    theme={pdfConfig.theme}
                    color={pdfConfig.color}
                    quoteData={quoteData}
                    items={items}
                    customerData={customerData}
                    companyData={companyData}
                    bankData={bankData}
                    discount={discount}
                    layout={pdfLayout}
                    signature={signature}
                    onEdit={handleFieldEdit}
                    config={renderedConfig}
                />
                            </div>
                            <div ref={marginGuidesRef} className="absolute inset-0 z-[5] pointer-events-none"></div>
                        </div>
                    </div>
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)] flex-wrap">
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setZoomLevel(z => Math.max(0.3, z - 0.1))} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label={t('zoomOut')}>−</button>
                            <input
                                type="range"
                                min="0.3"
                                max="2"
                                step="0.05"
                                value={zoomLevel}
                                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                aria-label={t('zoomSlider')}
                            />
                            <button type="button" onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label={t('zoomIn')}>+</button>
                            <span className="text-xs text-[var(--color-text-muted)] w-10 text-right tabular-nums">{Math.round(zoomLevel * 100)}%</span>
                        </div>
                        <button type="button"
                            onClick={() => setZoomLevel(0.7)}
                            className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${zoomLevel === 0.7 ? 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`}
                            title={t('defaultZoom')}
                        >
                            %70
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowMarginGuides(v => !v)}
                            aria-pressed={showMarginGuides}
                            title={t('marginGuides')}
                            className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${showMarginGuides ? 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`}
                        >
                            <Ruler size={10} />
                        </button>
                        <button type="button"
                            onClick={() => setZoomLevel(1)}
                            className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${zoomLevel === 1 ? 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`}
                            title={t('actualSize')}
                        >
                            %100
                        </button>
                        {isGenerating && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-info)] ml-auto bg-[var(--color-primary-muted)]/30 px-1.5 py-0.5 rounded whitespace-nowrap">
                                <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-[var(--color-border)] border-t-[var(--color-info)]"></div>
                                <span>{generationStage || t('pdfGenerating')}</span>
                            </div>
                        )}
                    </div>
                    {/* Page Navigation + Thumbnails */}
                    {pageCount > 1 && (
                        <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)] flex-wrap">
                            <button
                                type="button"
                                onClick={() => scrollToPage(Math.max(1, activePage - 1))}
                                disabled={activePage <= 1}
                                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                &lt; {t('previousPage')}
                            </button>
                            <span className="text-xs text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                                {t('page')} {activePage} / {pageCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => scrollToPage(Math.min(pageCount, activePage + 1))}
                                disabled={activePage >= pageCount}
                                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('nextPage')} &gt;
                            </button>
                            <div ref={thumbnailsRef} className="flex gap-1.5 overflow-x-auto custom-scrollbar py-0.5 ml-auto"></div>
                        </div>
                    )}
                </div>
            </div>


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
        </div >
    );
});

export default PdfPreviewPanel;
