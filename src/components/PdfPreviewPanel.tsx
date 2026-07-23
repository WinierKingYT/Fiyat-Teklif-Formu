import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FileDown, Palette, LayoutTemplate, Eye, Type, Table, Layout, QrCode, Stamp, Sparkles, Trash2, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet, FileText, PenTool, Layers, Edit2, Zap, ZapOff, RefreshCcw, Power, PowerOff, Printer, Share2, Settings2 } from 'lucide-react';
import { calculateQuoteTotals } from '../utils/calculations';
import { generatePDF, printQuote, PAGE_SIZE_OPTIONS, QUALITY_OPTIONS } from '../utils/pdfGenerator';
import { shareQuote } from '../utils/emailService';
import { exportQuoteToExcel, exportQuoteToCSV } from '../utils/excelExporter';
import PrintableQuote from './PrintableQuoteV2';
import PopupEditor from './PopupEditor';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import Logger from '../utils/logger';
import useDebounce from '../hooks/useDebounce';

const PdfPreviewPanel = React.memo(() => {
    const {
        quoteData,
        items,
        customerData,
        companyData,
        bankData,
        discount,
        pdfLayout,
        pdfConfig,
        setPdfConfig,
        updateQuoteData,
        updateCustomerData,
        updateCompanyData
    } = useQuote();
    const { t } = useTranslation(quoteData?.language);

    const [activeTab, setActiveTab] = useState('sections');
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');
    const [signature, setSignature] = useState(null);
    const [performanceMode, setPerformanceMode] = useState(false);
    const [manualRefreshMode, setManualRefreshMode] = useState(false);
    const [renderedConfig, setRenderedConfig] = useState(pdfConfig);
    const [pageSize, setPageSize] = useState('a4');
    const [quality, setQuality] = useState('high');
    const [showControls, setShowControls] = useState(window.innerWidth > 900);
    const [zoomLevel, setZoomLevel] = useState(0.7);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState('');
    const [estimatedPages, setEstimatedPages] = useState(1);
    const contentRef = useRef(null);


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

    // Effect to handle config updates based on mode
    useEffect(() => {
        if (!manualRefreshMode) {
            setRenderedConfig(debouncedPdfConfig);
        }
    }, [debouncedPdfConfig, manualRefreshMode]);

    const handleManualRefresh = () => {
        setRenderedConfig(pdfConfig);
        toast.success('ÖnÖnizleme güncellendi');
    };

    // Check if there are pending changes in Manual Mode
    const hasPendingChanges = manualRefreshMode && JSON.stringify(renderedConfig) !== JSON.stringify(pdfConfig);

    // Popup Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editConfig, setEditConfig] = useState({
        title: '',
        initialValue: '',
        onSave: () => { },
        type: 'text',
        options: []
    });

    const openEditor = (title, initialValue, onSave, type = 'text', options = []) => {
        setEditConfig({
            title,
            initialValue,
            onSave,
            type,
            options
        });
        setIsEditorOpen(true);
    };

    // Load templates from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pdfTemplates');
        if (saved) {
            try {
                setSavedTemplates(JSON.parse(saved));
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
        toast.success('Şablon kaydedildi');
    }, [templateName, pdfConfig, savedTemplates]);

    const loadTemplate = useCallback((template) => {
        setPdfConfig(template.config);
        toast.success('Şablon yüklendi');
    }, [setPdfConfig]);

    const deleteTemplate = useCallback((id) => {
        const updatedTemplates = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('pdfTemplates', JSON.stringify(updatedTemplates));
        toast.success('Şablon silindi');
    }, [savedTemplates]);

    const handleConfigChange = useCallback((key, value) => {
        setPdfConfig(prev => ({ ...prev, [key]: value }));
    }, [setPdfConfig]);

    const handleDownload = async () => {
        setIsGenerating(true);
        setGenerationStage('PDF hazırlanıyor...');
        try {
            const filename = `Teklif_${quoteData.number || 'Taslak'}.pdf`;
            await new Promise(resolve => setTimeout(resolve, 100));
            setGenerationStage('Sayfalar işleniyor...');
            await generatePDF('printable-quote-container-hidden', filename, {
                theme: pdfConfig.theme,
                color: pdfConfig.color,
                pageSize,
                quality,
                orientation: pdfConfig.pageOrientation || 'portrait',
                margin: pdfConfig.margins === 'compact' ? 5 : pdfConfig.margins === 'wide' ? 15 : 10
            });
            setGenerationStage('PDF kaydediliyor...');
        } finally {
            setIsGenerating(false);
            setGenerationStage('');
        }
    };

    const handlePrint = () => {
        printQuote('printable-quote-container-panel');
    };

    const handleShare = async () => {
        try {
            const element = document.getElementById('printable-quote-container-hidden');
            if (!element) { toast.error('PDF Alanı bulunamadı'); return; }
            const { default: html2pdf } = await import('html2pdf.js');
            const isLandscape = pdfConfig.pageOrientation === 'landscape';
            const shareFormat = pageSize === 'a4' && !isLandscape ? 'a4' : isLandscape ? 'a4' : pageSize;
            const shareOrientation = isLandscape ? 'landscape' : 'portrait';
            const pdfBlob = await html2pdf().set({ margin: 0, image: { type: 'png' }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: shareFormat, orientation: shareOrientation } }).from(element).outputPdf('blob');
            const filename = `Teklif_${quoteData.number || 'Taslak'}.pdf`;
            await shareQuote(pdfBlob, filename);
            toast.success('Paylaşım başarılı');
        } catch (error) {
            if (error.message !== 'Share cancelled') {
                toast.error('Paylaşım yapılamadı: ' + error.message);
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
            toast.success('Excel dosyası indirildi');
        } catch (error) {
            toast.error('Excel oluşturulurken hata oluştu');
        }
    };

    const handleCsvExport = () => {
        try {
            const { fullQuoteData, calculatedItems } = buildExportData();
            exportQuoteToCSV(fullQuoteData, calculatedItems);
            toast.success('CSV dosyası indirildi');
        } catch (error) {
            toast.error('CSV oluşturulurken hata oluştu');
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
                    <button
                        onClick={handleExcelExport}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-success)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('downloadExcel')}
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden sm:inline text-xs">{t('downloadExcel')}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('print') || "Yazdır"}
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline text-xs">{t('print') || "Yazdır"}</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-info)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title="Paylaş"
                    >
                        <Share2 size={18} />
                        <span className="hidden sm:inline text-xs">Paylaş</span>
                    </button>
                    <button
                        onClick={handleCsvExport}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('downloadCSV')}
                    >
                        <FileText size={18} />
                        <span className="hidden sm:inline text-xs">{t('downloadCSV')}</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-[var(--radius)] shadow hover:shadow-[var(--shadow-lg)] transition-all font-semibold ${isGenerating ? 'bg-[var(--color-text-muted)] cursor-not-allowed' : 'bg-[var(--color-info)] hover:opacity-90'}`}
                        title="PDF İndir"
                    >
                        {isGenerating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <FileDown size={18} />
                        )}
                        <span>{isGenerating ? 'Oluşturuluyor...' : t('downloadPdf')}</span>
                    </button>
                    <button
                        onClick={() => setShowControls(!showControls)}
                        className="flex items-center gap-1.5 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors md:hidden"
                        title={showControls ? 'Kontrolleri Gizle' : 'Kontrolleri Göster'}
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
                            <button
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
                                        <button
                                            onClick={saveTemplate}
                                            disabled={!templateName.trim()}
                                            className="px-2 py-1.5 bg-[var(--color-info)] text-white text-xs rounded hover:opacity-90 disabled:opacity-50"
                                        >
                                            {t('save')}
                                        </button>
                                    </div>
                                    {savedTemplates.length > 0 && (
                                        <div className="space-y-1">
                                            {savedTemplates.map(t => (
                                                <div key={t.id} className="flex items-center justify-between text-xs bg-[var(--color-bg-muted)] p-1.5 rounded">
                                                    <span className="truncate flex-1">{t.name}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => loadTemplate(t)} className="text-[var(--color-info)] hover:text-[var(--color-info)]"><LayoutTemplate size={12} /></button>
                                                        <button onClick={() => deleteTemplate(t.id)} className="text-[var(--color-error)] hover:text-[var(--color-error)]"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Theme Selection */}
                                <div className="space-y-2 mb-4">
                                    <label className="text-xs font-medium text-[var(--color-text)]">Tasarım</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'modern', name: 'Modern' },
                                            { id: 'classic', name: 'Klasik' },
                                            { id: 'minimal', name: 'Minimal' },
                                            { id: 'corporate', name: 'Kurumsal' },
                                            { id: 'pro', name: 'Premium (Pro)' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleConfigChange('theme', t.id)}
                                                className={`px-2 py-1.5 text-xs rounded border transition-all ${pdfConfig.theme === t.id ? 'bg-[var(--color-primary-muted)] border-[var(--color-info)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'}`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Color */}
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Ana Renk</label>
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

                                {/* Page Size & Quality */}
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)] mt-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Sayfa Boyutu</label>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            {PAGE_SIZE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Yön</label>
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => handleConfigChange('pageOrientation', 'portrait')}
                                                className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.pageOrientation === 'portrait' ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                            >
                                                Dikey
                                            </button>
                                            <button
                                                onClick={() => handleConfigChange('pageOrientation', 'landscape')}
                                                className={`py-1.5 text-[10px] border rounded transition-colors ${pdfConfig.pageOrientation === 'landscape' ? 'border-[var(--color-info)] bg-[var(--color-primary-muted)] text-[var(--color-info)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                            >
                                                Yatay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Kalite</label>
                                        <select
                                            value={quality}
                                            onChange={(e) => setQuality(e.target.value)}
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
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Yazı Tipleri</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Genel Yaz Tipi</label>
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
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Başlık Yaz Tipi</label>
                                        <select
                                            value={pdfConfig.titleFontFamily || ''}
                                            onChange={(e) => handleConfigChange('titleFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="">Genel ile Ayn</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Montserrat', sans-serif">Geometrik (Montserrat)</option>
                                            <option value="'Playfair Display', serif">Zarif (Playfair)</option>
                                            <option value="'Oswald', sans-serif">Gl (Oswald)</option>
                                            <option value="'Roboto Slab', serif">Robotik (Roboto Slab)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Etiket Yaz Tipi (Temel)</label>
                                        <select
                                            value={pdfConfig.labelFontFamily || ''}
                                            onChange={(e) => handleConfigChange('labelFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="">Genel ile Ayn</option>
                                            <option value="'Inter', sans-serif">Modern (Inter)</option>
                                            <option value="'Roboto', sans-serif">Standart (Roboto)</option>
                                            <option value="'Open Sans', sans-serif">Okunaklı (Open Sans)</option>
                                            <option value="'Lato', sans-serif">Dengeli (Lato)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">İçerik Yaz Tipi (Girdiiniz)</label>
                                        <select
                                            value={pdfConfig.bodyFontFamily || ''}
                                            onChange={(e) => handleConfigChange('bodyFontFamily', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="">Genel ile Ayn</option>
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
                            <div className="space-y-6">
                                {/* Header Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Üst Bilgi (Header)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Boyutu</label>
                                            <select
                                                value={pdfConfig.headerTitleFontSize || '1rem'}
                                                onChange={(e) => handleConfigChange('headerTitleFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.8rem">Küçük</option>
                                                <option value="1rem">Normal</option>
                                                <option value="1.2rem">Büyük</option>
                                                <option value="1.5rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Kalınlığı</label>
                                            <select
                                                value={pdfConfig.headerTitleFontWeight || '700'}
                                                onChange={(e) => handleConfigChange('headerTitleFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="600">Orta</option>
                                                <option value="700">Kalın</option>
                                                <option value="800">Çok Kalın</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Bilgi Yazı Boyutu</label>
                                            <select
                                                value={pdfConfig.headerInfoFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('headerInfoFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer/Seller Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Müşteri & Satıcı</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Boyutu</label>
                                            <select
                                                value={pdfConfig.customerTitleFontSize || '0.8rem'}
                                                onChange={(e) => handleConfigChange('customerTitleFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.7rem">Küçük</option>
                                                <option value="0.8rem">Normal</option>
                                                <option value="0.9rem">Büyük</option>
                                                <option value="1rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Kalınlığı</label>
                                            <select
                                                value={pdfConfig.customerTitleFontWeight || '600'}
                                                onChange={(e) => handleConfigChange('customerTitleFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="600">Orta</option>
                                                <option value="700">Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Boyutu (rn: Firma:)</label>
                                            <select
                                                value={pdfConfig.customerLabelFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('customerLabelFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Kalınl</label>
                                            <select
                                                value={pdfConfig.customerLabelFontWeight || '500'}
                                                onChange={(e) => handleConfigChange('customerLabelFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                                <option value="700">Çok Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Deer Boyutu</label>
                                            <select
                                                value={pdfConfig.customerValueFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('customerValueFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Deer Kalınl</label>
                                            <select
                                                value={pdfConfig.customerValueFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('customerValueFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Meta Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Teklif Bilgileri (Sağ Üst)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Boyutu</label>
                                            <select
                                                value={pdfConfig.quoteMetaLabelFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('quoteMetaLabelFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Kalınl</label>
                                            <select
                                                value={pdfConfig.quoteMetaLabelFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('quoteMetaLabelFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Deer Boyutu</label>
                                            <select
                                                value={pdfConfig.quoteMetaValueFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('quoteMetaValueFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                                <option value="0.9rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Deer Kalınl</label>
                                            <select
                                                value={pdfConfig.quoteMetaValueFontWeight || '600'}
                                                onChange={(e) => handleConfigChange('quoteMetaValueFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="600">Orta</option>
                                                <option value="700">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Table */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Ürünler Tablosu</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Boyutu</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="30"
                                                step="1"
                                                value={parseInt(pdfConfig.tableHeaderFontSize) || 14}
                                                onChange={(e) => handleConfigChange('tableHeaderFontSize', parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="text-[10px] text-right text-[var(--color-text-muted)]">{parseInt(pdfConfig.tableHeaderFontSize) || 14}px</div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Kalınlığı</label>
                                            <select
                                                value={pdfConfig.tableHeaderFontWeight || '600'}
                                                onChange={(e) => handleConfigChange('tableHeaderFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="600">Kalın</option>
                                                <option value="700">Çok Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">İçerik Boyutu</label>
                                            <select
                                                value={pdfConfig.tableBodyFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('tableBodyFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                                <option value="0.9rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">İçerik Kalınl</label>
                                            <select
                                                value={pdfConfig.tableBodyFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('tableBodyFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Section */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Özet Alanı</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Boyutu</label>
                                            <select
                                                value={pdfConfig.summaryLabelFontSize || '0.75rem'}
                                                onChange={(e) => handleConfigChange('summaryLabelFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.65rem">Küçük</option>
                                                <option value="0.75rem">Normal</option>
                                                <option value="0.85rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Kalınl</label>
                                            <select
                                                value={pdfConfig.summaryLabelFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('summaryLabelFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Deer Boyutu</label>
                                            <select
                                                value={pdfConfig.summaryValueFontSize || 'inherit'}
                                                onChange={(e) => handleConfigChange('summaryValueFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="inherit">Otomatik</option>
                                                <option value="0.75rem">Normal</option>
                                                <option value="0.85rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Deer Kalınl</label>
                                            <select
                                                value={pdfConfig.summaryValueFontWeight || '500'}
                                                onChange={(e) => handleConfigChange('summaryValueFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="400">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Genel Toplam Boyutu</label>
                                            <select
                                                value={pdfConfig.summaryTotalFontSize || '0.9rem'}
                                                onChange={(e) => handleConfigChange('summaryTotalFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.8rem">Küçük</option>
                                                <option value="0.9rem">Normal</option>
                                                <option value="1rem">Büyük</option>
                                                <option value="1.2rem">Çok Büyük</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Alt Bilgi (Footer)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Yazı Boyutu</label>
                                            <select
                                                value={pdfConfig.footerFontSize || '0.7rem'}
                                                onChange={(e) => handleConfigChange('footerFontSize', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="0.6rem">Küçük</option>
                                                <option value="0.7rem">Normal</option>
                                                <option value="0.8rem">Büyük</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Yazı Kalınlığı</label>
                                            <select
                                                value={pdfConfig.footerFontWeight || 'normal'}
                                                onChange={(e) => handleConfigChange('footerFontWeight', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Orta</option>
                                                <option value="600">Kalın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LAYOUT TAB */}
                        {activeTab === 'layout' && (
                            <div className="space-y-4">
                                {/* Spacing */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Boşluklar</h4>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Sayfa Kenar Boluu</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { val: 'compact', label: 'Dar' },
                                                { val: 'normal', label: 'Normal' },
                                                { val: 'wide', label: 'Geni' }
                                            ].map(opt => (
                                                <button
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
                                            <span>Blm Aral</span>
                                            <span className="text-[var(--color-text-muted)]">{pdfConfig.sectionSpacing || '1rem'}</span>
                                        </label>
                                        <select
                                            value={pdfConfig.sectionSpacing || '1rem'}
                                            onChange={(e) => handleConfigChange('sectionSpacing', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        >
                                            <option value="0.5rem">SKüçük (0.5rem)</option>
                                            <option value="1rem">Normal (1rem)</option>
                                            <option value="1.5rem">Geni (1.5rem)</option>
                                            <option value="2rem">ok Geni (2rem)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Shapes */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Şekiller</h4>
                                    <div>
                                        <label className="flex justify-between text-xs font-medium text-[var(--color-text)] mb-1">
                                            <span>Köşe Yuvarlaklığı</span>
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
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Logo Pozisyonu</label>
                                        <div className="flex bg-[var(--color-bg-muted)] rounded p-1">
                                            {[
                                                { val: 'left', icon: AlignLeft },
                                                { val: 'center', icon: AlignCenter },
                                                { val: 'right', icon: AlignRight }
                                            ].map(opt => (
                                                <button
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
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Kenarlk Stili</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { val: 'solid', label: 'Düz' },
                                                { val: 'dashed', label: 'Kesik' },
                                                { val: 'dotted', label: 'Noktalı' }
                                            ].map(opt => (
                                                <button
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
                                        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Yoğunluk</h4>
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                            <span className="text-[var(--color-text)]">Kompakt Mod (SKüçük)</span>
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
                                    { key: 'showLogo', label: 'Firma Logosu' },
                                    { key: 'showBankInfo', label: 'Banka Bilgileri' },
                                    { key: 'showSignatures', label: 'İmza ve Kaşe Alanı' },
                                    { key: 'showTerms', label: 'Koullar' },
                                    { key: 'showNotes', label: 'Notlar' },
                                    { key: 'showSummary', label: 'Fiyat zeti' }
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
                                        Belge Başlığı
                                    </label>
                                    <input
                                        type="text"
                                        value={pdfConfig.title}
                                        onChange={(e) => handleConfigChange('title', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        placeholder="Örn: FİYAT TEKLİFİ"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TABLE TAB */}
                        {activeTab === 'table' && (
                            <div className="space-y-4">
                                {/* Table Style Options */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Tablo Stili</h4>

                                    {/* Header Colors */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Başlık Arkaplan</label>
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
                                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Başlık Yazısı</label>
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
                                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Kenarlk Rengi</label>
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
                                            <span className="text-[var(--color-text)]">Çizgili Satırlar</span>
                                            <input
                                                type="checkbox"
                                                checked={pdfConfig.tableStriped}
                                                onChange={(e) => handleConfigChange('tableStriped', e.target.checked)}
                                                className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                            <span className="text-[var(--color-text)]">Dikey Çizgiler</span>
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
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Sütunlar</h4>
                                    <div className="space-y-1">
                                        {[
                                            { key: 'showTableImages', label: 'Ürün Görselleri' },
                                            { key: 'showTableUnit', label: 'Birim Sütunu' },
                                            { key: 'showTableTax', label: 'KDV Sütunu' }
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
                                        <span>Satır Yüksekliği</span>
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
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Tablo Başlıklar</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">rn Bal</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textItem || ''}
                                                onChange={(e) => handleConfigChange('textItem', e.target.value)}
                                                placeholder="Varsaylan: rn/Hizmet"
                                                className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Aklama Bal</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textDescription || ''}
                                                onChange={(e) => handleConfigChange('textDescription', e.target.value)}
                                                placeholder="Varsaylan: Aklama"
                                                className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Birim Bal</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textUnit || ''}
                                                    onChange={(e) => handleConfigChange('textUnit', e.target.value)}
                                                    placeholder="Varsaylan: Birim"
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Miktar Bal</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textQuantity || ''}
                                                    onChange={(e) => handleConfigChange('textQuantity', e.target.value)}
                                                    placeholder="Varsaylan: Miktar"
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Fiyat Bal</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textUnitPrice || ''}
                                                    onChange={(e) => handleConfigChange('textUnitPrice', e.target.value)}
                                                    placeholder="Varsaylan: Birim Fiyat"
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">KDV Bal</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.textVat || ''}
                                                    onChange={(e) => handleConfigChange('textVat', e.target.value)}
                                                    placeholder="Varsaylan: KDV"
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Toplam Bal</label>
                                            <input
                                                type="text"
                                                value={pdfConfig.textTotal || ''}
                                                onChange={(e) => handleConfigChange('textTotal', e.target.value)}
                                                placeholder="Varsaylan: Toplam"
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
                                    <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Görsel Efektler</h4>
                                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                        <span className="text-[var(--color-text)]">Gölgelendirme</span>
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
                                        Performans Ayarları
                                    </h4>
                                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--color-text)] font-medium flex items-center gap-2">
                                                {performanceMode ? <Zap size={12} className="text-[var(--color-warning)]" /> : <ZapOff size={12} />}
                                                {t('performanceMode')}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                nÖÖnizlemeyi gecikmeli yenileyerek Performans artırır.
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
                                                Manuel Yenileme
                                            </span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                Değişiklikleri anında görmek için ÖnÖÖnizlemeyi manuel yenileyin.
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

                                {/* QR Code */}
                                <div>
                                    <label className="flex items-center justify-between mb-2 text-xs font-medium text-[var(--color-text)]">
                                        <span>QR Kod</span>
                                        <input
                                            type="checkbox"
                                            checked={pdfConfig.showQRCode}
                                            onChange={(e) => handleConfigChange('showQRCode', e.target.checked)}
                                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                                        />
                                    </label>
                                    {pdfConfig.showQRCode && (
                                        <input
                                            type="text"
                                            value={pdfConfig.qrCodeUrl}
                                            onChange={(e) => handleConfigChange('qrCodeUrl', e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                            placeholder="URL (Bosa site adresi)"
                                        />
                                    )}
                                </div>

                                {/* Watermark */}
                                <div>
                                    <label className="flex items-center justify-between mb-2 text-xs font-medium text-[var(--color-text)]">
                                        <span>Filigran</span>
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
                                                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Metin</label>
                                                <input
                                                    type="text"
                                                    value={pdfConfig.watermarkText}
                                                    onChange={(e) => handleConfigChange('watermarkText', e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                                    placeholder="Metin"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Renk</label>
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
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Boyut ({pdfConfig.watermarkFontSize || 120}px)</label>
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
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Opaklık ({pdfConfig.watermarkOpacity || 0.1})</label>
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
                                                    <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Döndürme ({pdfConfig.watermarkRotation || -45})</label>
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
                                        Alt Bilgi
                                    </label>
                                    <input
                                        type="text"
                                        value={pdfConfig.customFooter}
                                        onChange={(e) => handleConfigChange('customFooter', e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                                        placeholder="Özel alt bilgi metni"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SIGNATURE TAB */}
                        {activeTab === 'signature' && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-xs text-[var(--color-text)]">Dijital İmza</h4>

                                {signature ? (
                                    <div className="space-y-2">
                                        <div className="border border-[var(--color-border)] rounded p-4 bg-[var(--color-bg-card)] flex justify-center items-center h-32">
                                            <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <button
                                            onClick={() => setSignature(null)}
                                            className="w-full py-2 text-xs text-[var(--color-error)] hover:text-[var(--color-error)] font-medium border border-[var(--color-border)] hover:border-[var(--color-error)] rounded bg-[var(--color-error)]/10 hover:bg-[var(--color-error)]/10 transition-colors"
                                        >
                                            İmzayı Kaldır
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-[var(--color-info)] transition-colors bg-[var(--color-bg-muted)]/50">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setSignature(reader.result);
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
                                    Yüklenen İmza PDF'e eklenecektir. Arkaplan şeffaf PNG öönerilir.
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
                        <span>{pdfConfig.pageOrientation === 'landscape' ? 'Yatay' : 'Dikey'}</span>
                        <span className="text-[var(--color-border)]">|</span>
                        <span className="flex items-center gap-1">
                            <FileDown size={10} />
                            {estimatedPages}
                        </span>
                    </div>

                    {/* Manual Refresh Button Overlay */}
                    {manualRefreshMode && hasPendingChanges && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                            <button
                                onClick={handleManualRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-info)] hover:opacity-90 text-white rounded-full shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-lg)] transition-all animate-bounce"
                            >
                                <RefreshCcw size={16} />
                                <span>{t('refreshPreview')}</span>
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center items-start">
                        <div className="origin-top shadow-[var(--shadow-lg)] transition-all duration-300 bg-[var(--color-bg-card)]" style={{ transform: `scale(${zoomLevel})` }}>
                            <div ref={contentRef} className="relative">
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
                    onEdit={() => {}}
                    config={renderedConfig}
                />
                                {/* Page break indicators */}
                                {estimatedPages > 1 && (
                                    <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                                        {Array.from({ length: estimatedPages - 1 }, (_, i) => (
                                            <div
                                                key={i}
                                                className="absolute left-0 right-0 flex items-center gap-2"
                                                style={{
                                                    top: `${((i + 1) / estimatedPages) * 100}%`,
                                                    transform: 'translateY(-50%)'
                                                }}
                                            >
                                                <hr className="flex-1 border-t-2 border-dashed border-[var(--color-border)]" />
                                                <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-card)] px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    Sayfa {i + 2}
                                                </span>
                                                <hr className="flex-1 border-t-2 border-dashed border-[var(--color-border)]" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)] flex-wrap">
                        <div className="flex items-center gap-1">
                            <button onClick={() => setZoomLevel(z => Math.max(0.3, z - 0.1))} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label="Uzaklaştır">−</button>
                            <input
                                type="range"
                                min="0.3"
                                max="2"
                                step="0.05"
                                value={zoomLevel}
                                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
                                aria-label="Yakınlaştırma"
                            />
                            <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label="Yaklaştır">+</button>
                            <span className="text-xs text-[var(--color-text-muted)] w-10 text-right tabular-nums">{Math.round(zoomLevel * 100)}%</span>
                        </div>
                        <button
                            onClick={() => setZoomLevel(0.7)}
                            className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${zoomLevel === 0.7 ? 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`}
                            title="Varsayılan yakınlaştırma"
                        >
                            %70
                        </button>
                        <button
                            onClick={() => setZoomLevel(1)}
                            className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${zoomLevel === 1 ? 'border-[var(--color-info)] text-[var(--color-info)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`}
                            title="Gerçek boyut"
                        >
                            %100
                        </button>
                        {isGenerating && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-info)] ml-auto bg-[var(--color-primary-muted)]/30 px-1.5 py-0.5 rounded whitespace-nowrap">
                                <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-[var(--color-border)] border-t-[var(--color-info)]"></div>
                                <span>{generationStage || 'PDF oluşturuluyor...'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Container for PDF Generation (uses live pdfConfig, not debounced) */}
            <div className="absolute left-[-9999px] top-[-9999px]">
                <PrintableQuote
                    id="printable-quote-container-hidden"
                    theme={pdfConfig.theme}
                    color={pdfConfig.color}
                    quoteData={quoteData}
                    items={items}
                    customerData={customerData}
                    companyData={companyData}
                    bankData={bankData}
                    discount={discount}
                    config={pdfConfig}
                    layout={pdfLayout}
                    signature={signature}
                    onEdit={() => {}}
                />
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
