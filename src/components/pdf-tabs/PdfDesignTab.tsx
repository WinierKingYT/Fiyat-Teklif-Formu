import { Layout, LayoutTemplate, Trash2, Check, Sparkles, Palette } from 'lucide-react';
import React, { useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { PdfConfig } from '@/context/quote/types';
import type { SavedPdfTemplate } from '@/hooks/usePdfTemplates';

interface PdfPreset {
    id: string;
    labelKey: string;
    config: Partial<PdfConfig>;
}

interface PdfColorOption {
    id: string;
    nameKey: string;
    sectorKey: string;
    color: string;
    category: 'finance' | 'health' | 'industry';
}

const PDF_COLORS: PdfColorOption[] = [
    // Finans, Teknoloji & Kurumsal
    { id: 'navy', nameKey: 'colorNavy', sectorKey: 'pdfColorSectorFinancial', color: '#1e3a8a', category: 'finance' },
    { id: 'sapphire', nameKey: 'colorSapphire', sectorKey: 'pdfColorSectorTech', color: '#2563eb', category: 'finance' },
    { id: 'anthracite', nameKey: 'colorAnthracite', sectorKey: 'pdfColorSectorConsulting', color: '#334155', category: 'finance' },
    // Sağlık, Tasarım & Mühendislik
    { id: 'emerald', nameKey: 'colorEmerald', sectorKey: 'pdfColorSectorHealth', color: '#047857', category: 'health' },
    { id: 'teal', nameKey: 'petrolTeal', sectorKey: 'pdfColorSectorDesign', color: '#0d9488', category: 'health' },
    { id: 'cyan', nameKey: 'skyCyan', sectorKey: 'pdfColorSectorLogistics', color: '#0284c7', category: 'health' },
    // Sanayi, Perakende & Yaratıcı
    { id: 'amber', nameKey: 'colorAmber', sectorKey: 'pdfColorSectorIndustry', color: '#b45309', category: 'industry' },
    { id: 'cherry', nameKey: 'colorCherry', sectorKey: 'pdfColorSectorRetail', color: '#9f1239', category: 'industry' },
    { id: 'purple', nameKey: 'colorPurple', sectorKey: 'pdfColorSectorMedia', color: '#6b21a8', category: 'industry' },
    { id: 'graphite', nameKey: 'colorGraphite', sectorKey: 'pdfColorSectorPremium', color: '#0f172a', category: 'industry' },
];

const PDF_COLOR_CATEGORIES = [
    { id: 'finance', labelKey: 'categoryFinanceLegal', icon: '🏛️' },
    { id: 'health', labelKey: 'categoryHealthEngineering', icon: '🌿' },
    { id: 'industry', labelKey: 'categoryIndustryCreative', icon: '⚡' },
];

interface PdfDesignTabProps {
    pdfConfig: PdfConfig;
    handleConfigChange: (key: string, value: unknown) => void;
    setPdfConfig: React.Dispatch<React.SetStateAction<PdfConfig>> | ((config: PdfConfig | ((prev: PdfConfig) => PdfConfig)) => void);
    t: (key: string) => string;
    templateName: string;
    setTemplateName: (name: string) => void;
    savedTemplates: SavedPdfTemplate[];
    saveTemplate: () => void;
    loadTemplate: (template: SavedPdfTemplate) => void;
    deleteTemplate: (id: number) => void;
}

const PdfDesignTab: React.FC<PdfDesignTabProps> = ({
    pdfConfig,
    handleConfigChange,
    setPdfConfig,
    t,
    templateName,
    setTemplateName,
    savedTemplates,
    saveTemplate,
    loadTemplate,
    deleteTemplate
}) => {
    const PDF_PRESETS = useMemo<PdfPreset[]>(() => [
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

    return (
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
                        { id: 'bold', name: 'Bold', thumb: (c: string) => (<div className="absolute inset-0"><div className="h-2.5 w-full" style={{ background: c }} /><div className="h-1 w-1/2 mt-1 ml-1 bg-slate-200" /><div className="h-4 w-11/12 mt-1 mx-auto border-2 rounded-sm" style={{ borderColor: c }} /></div>) },
                        { id: 'invoice', name: 'Fatura / Invoice', thumb: (c: string) => (<div className="absolute inset-0 p-1"><div className="h-1.5 w-1/2 rounded-sm" style={{ background: c }} /><div className="h-0.5 w-full my-1 bg-slate-200" /><div className="h-1 w-full bg-slate-100" /><div className="h-1 w-full mt-0.5 bg-slate-100" /><div className="h-1.5 w-1/3 mt-1 ml-auto rounded-sm" style={{ background: c }} /></div>) }
                    ].map((thm) => (
                        <button type="button"
                            key={thm.id}
                            onClick={() => handleConfigChange('theme', thm.id)}
                            className={`flex flex-col items-start gap-1 p-1.5 rounded border transition-all ${pdfConfig.theme === thm.id ? 'bg-[var(--color-primary-muted)] border-[var(--color-info)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'}`}
                        >
                            <div className="w-full aspect-[21/12] rounded overflow-hidden border border-[var(--color-border)] relative bg-white">
                                {thm.thumb(pdfConfig.color || '#3b82f6')}
                            </div>
                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{thm.name}</span>
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

            {/* PDF Primary Color & Palettes */}
            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                        <Palette size={14} className="text-[var(--color-info)]" />
                        {t('primaryColor')}
                    </label>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] uppercase">
                        {pdfConfig.color || '#2563eb'}
                    </span>
                </div>

                {/* Live PDF Proposal Snippet Simulator */}
                <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
                            <Sparkles size={12} style={{ color: pdfConfig.color || '#2563eb' }} />
                            {t('pdfPreviewSnippet')}
                        </span>
                        <span className="text-[9px] text-[var(--color-text-muted)]">
                            {t('pdfPreviewSnippetDesc')}
                        </span>
                    </div>

                    {/* Mini PDF Page Mockup */}
                    <div className="border border-slate-300 rounded bg-white p-2 text-slate-800 text-[9px] shadow-sm select-none">
                        {/* Top decorative stripe */}
                        <div className="h-1.5 w-full rounded-sm mb-1.5" style={{ backgroundColor: pdfConfig.color || '#2563eb' }} />

                        {/* Title Bar */}
                        <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-slate-100">
                            <span className="font-bold tracking-wider text-[10px]" style={{ color: pdfConfig.color || '#2563eb' }}>
                                {t('sampleProposalHeader')}
                            </span>
                            <span className="font-mono text-[8px] text-slate-400">TK-2026-001</span>
                        </div>

                        {/* Mini Table Header */}
                        <div
                            className="flex justify-between px-1.5 py-1 rounded text-white text-[8px] font-semibold mb-1"
                            style={{ backgroundColor: pdfConfig.color || '#2563eb' }}
                        >
                            <span>{t('items') || 'Kalemler'}</span>
                            <span>{t('amountQuote') || 'Tutar'}</span>
                        </div>
                        <div className="flex justify-between px-1.5 py-0.5 text-slate-600 text-[8px] border-b border-slate-100">
                            <span>Standart Hizmet Paketi</span>
                            <span className="font-mono font-medium">₺4.500,00</span>
                        </div>

                        {/* Grand Total Badge */}
                        <div className="flex justify-end mt-1.5">
                            <div
                                className="px-2 py-0.5 rounded text-right text-[8px] font-bold"
                                style={{
                                    backgroundColor: `${pdfConfig.color || '#2563eb'}18`,
                                    color: pdfConfig.color || '#2563eb',
                                    border: `1px solid ${pdfConfig.color || '#2563eb'}40`
                                }}
                            >
                                {t('sampleGrandTotal')}: ₺5.400,00
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categorized Sector Palettes */}
                <div className="space-y-3 pt-1">
                    {PDF_COLOR_CATEGORIES.map(cat => {
                        const catColors = PDF_COLORS.filter(c => c.category === cat.id);
                        return (
                            <div key={cat.id} className="space-y-1.5">
                                <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                                    <span>{cat.icon}</span>
                                    <span>{t(cat.labelKey)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {catColors.map(swatch => {
                                        const isSelected = (pdfConfig.color || '#2563eb').toLowerCase() === swatch.color.toLowerCase();
                                        return (
                                            <button
                                                type="button"
                                                key={swatch.id}
                                                onClick={() => handleConfigChange('color', swatch.color)}
                                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all group ${
                                                    isSelected
                                                        ? 'bg-[var(--color-primary-muted)] border-[var(--color-info)] ring-1 ring-[var(--color-info)] shadow-xs'
                                                        : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                                                }`}
                                            >
                                                <div
                                                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: swatch.color }}
                                                >
                                                    {isSelected && <Check size={11} className="text-white stroke-[3]" />}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-[11px] font-bold text-[var(--color-text)] truncate leading-tight">
                                                        {t(swatch.nameKey)}
                                                    </span>
                                                    <span className="text-[9px] text-[var(--color-text-muted)] truncate leading-tight">
                                                        {t(swatch.sectorKey)}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Custom Color Input */}
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text)]">{t('customColor')}</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={pdfConfig.color || '#2563eb'}
                            onChange={(e) => handleConfigChange('color', e.target.value)}
                            className="w-7 h-7 p-0 border-0 rounded cursor-pointer shrink-0"
                            title={t('customColor')}
                        />
                        <input
                            type="text"
                            value={pdfConfig.color || '#2563eb'}
                            onChange={(e) => handleConfigChange('color', e.target.value)}
                            className="w-20 px-1.5 py-1 text-xs font-mono border border-[var(--color-border)] rounded uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-info)]"
                            placeholder="#000000"
                        />
                    </div>
                </div>
            </div>

            {/* Typography & Fonts */}
            <div className="space-y-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('fontFamilies')}</h4>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('generalFont')}</label>
                    <select
                        value={pdfConfig.globalFontFamily?.replace(/['"]/g, '').split(',')[0].trim() || 'Inter'}
                        onChange={(e) => handleConfigChange('globalFontFamily', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                    >
                        <option value="Inter">Modern (Inter)</option>
                        <option value="Roboto">Standart (Roboto)</option>
                        <option value="Open Sans">Okunaklı (Open Sans)</option>
                        <option value="Lato">Dengeli (Lato)</option>
                        <option value="Montserrat">Geometrik (Montserrat)</option>
                        <option value="Playfair Display">Zarif (Playfair Display)</option>
                        <option value="Merriweather">Klasik (Merriweather)</option>
                        <option value="Roboto Slab">Güçlü (Roboto Slab)</option>
                        <option value="Oswald">Kompakt (Oswald)</option>
                    </select>
                </div>
            </div>

            {/* Watermark & Effects */}
            <div className="space-y-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('watermark')}</h4>
                <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                    <span className="text-[var(--color-text)]">{t('watermark')}</span>
                    <input
                        type="checkbox"
                        checked={pdfConfig.showWatermark}
                        onChange={(e) => handleConfigChange('showWatermark', e.target.checked)}
                        className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                    />
                </label>
                {pdfConfig.showWatermark && (
                    <div className="space-y-2 mt-2">
                        <input
                            type="text"
                            value={pdfConfig.watermarkText}
                            onChange={(e) => handleConfigChange('watermarkText', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                            placeholder={t('watermarkText')}
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default PdfDesignTab;
