import {
    Hash,
    Sparkles,
    Layers,
    Plus,
    Trash,
    Check,
    HelpCircle,
    Copy,
    Save
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getDefaultQuoteNumberConfig } from '@/context/quote/initialState';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';
import {
    NUMBER_PRESETS,
    previewQuoteNumber,
    getActiveSeries,
    generateNextQuoteNumber
} from '@/utils/numberGenerator';
import type { QuoteNumberConfig, QuoteNumberSeries } from '@/context/quote/types';

export const QuoteNumberSettingsTab: React.FC = () => {
    const { t } = useTranslation();
    const { db } = useIndexedDB();
    const [config, setConfig] = useState<QuoteNumberConfig>(getDefaultQuoteNumberConfig);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'format' | 'series'>('format');
    const [newSeriesName, setNewSeriesName] = useState('');

    useEffect(() => {
        if (!db) return;
        const loadConfig = async () => {
            try {
                const saved = await db.get<QuoteNumberConfig>('settings', 'quote_number_config');
                if (saved) {
                    setConfig({
                        ...saved,
                        series: saved.series || getDefaultQuoteNumberConfig().series,
                        activeSeriesId: saved.activeSeriesId || 'default'
                    });
                }
            } catch (err) {
                Logger.error('Error loading quote number config:', err);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [db]);

    const activeSeries = useMemo(() => getActiveSeries(config), [config]);

    const livePreview = useMemo(() => {
        try {
            return previewQuoteNumber(config);
        } catch {
            return 'Hatalı Şablon';
        }
    }, [config]);

    const handleSelectPreset = (template: string) => {
        if (activeSeries && config.series) {
            const updatedSeries = config.series.map(s =>
                s.id === activeSeries.id ? { ...s, template } : s
            );
            setConfig(prev => ({ ...prev, series: updatedSeries, template }));
        } else {
            setConfig(prev => ({ ...prev, template }));
        }
    };

    const handleUpdateActiveField = (field: 'prefix' | 'template' | 'counter', val: string | number) => {
        if (activeSeries && config.series) {
            const updatedSeries = config.series.map(s =>
                s.id === activeSeries.id ? { ...s, [field]: val } : s
            );
            setConfig(prev => ({
                ...prev,
                series: updatedSeries,
                [field]: val
            }));
        } else {
            setConfig(prev => ({ ...prev, [field]: val }));
        }
    };

    const handleSelectSeries = (seriesId: string) => {
        const target = config.series?.find(s => s.id === seriesId);
        if (!target) return;
        setConfig(prev => ({
            ...prev,
            activeSeriesId: seriesId,
            prefix: target.prefix,
            template: target.template,
            counter: target.counter
        }));
    };

    const handleAddSeries = () => {
        if (!newSeriesName.trim()) return;
        const newId = `series_${Date.now()}`;
        const newSeries: QuoteNumberSeries = {
            id: newId,
            name: newSeriesName.trim(),
            prefix: 'TK',
            template: '{PREFIX}-{YYYY}{MM}-{INDEX:4}',
            counter: 1
        };
        setConfig(prev => ({
            ...prev,
            series: [...(prev.series || []), newSeries],
            activeSeriesId: newId,
            prefix: newSeries.prefix,
            template: newSeries.template,
            counter: newSeries.counter
        }));
        setNewSeriesName('');
        toast.success(`"${newSeries.name}" serisi eklendi`);
    };

    const handleDeleteSeries = (seriesId: string) => {
        if (config.series && config.series.length <= 1) {
            toast.error('En az bir numara serisi bulunmalıdır');
            return;
        }
        const filtered = config.series?.filter(s => s.id !== seriesId) || [];
        const nextActive = filtered[0];
        setConfig(prev => ({
            ...prev,
            series: filtered,
            activeSeriesId: prev.activeSeriesId === seriesId ? nextActive?.id || 'default' : prev.activeSeriesId,
            prefix: prev.activeSeriesId === seriesId ? nextActive?.prefix || 'TK' : prev.prefix,
            template: prev.activeSeriesId === seriesId ? nextActive?.template || '' : prev.template,
            counter: prev.activeSeriesId === seriesId ? nextActive?.counter || 1 : prev.counter
        }));
        toast.success('Seri silindi');
    };

    const handleSave = async () => {
        if (!db) return;
        try {
            await db.put('settings', {
                id: 'quote_number_config',
                key: 'quote_number_config',
                ...config
            });
            toast.success(t('settingsSaved') || 'Numaratör ayarları kaydedildi');
        } catch (err) {
            Logger.error('Error saving quote number config:', err);
            toast.error(t('settingsSaveError') || 'Ayarlar kaydedilemedi');
        }
    };

    if (loading) {
        return <div className="p-4 text-xs text-[var(--color-text-muted)]">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Live Preview Box */}
            <div className="p-4 rounded-[var(--radius-lg)] bg-linear-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <Sparkles size={13} />
                            Canlı Numara Önizlemesi (Sıradaki Teklif No)
                        </div>
                        <div className="text-xl font-mono font-black text-[var(--color-text)] tracking-wider mt-1 select-all">
                            {livePreview}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Aktif Seri: <strong>{activeSeries?.name || 'Standart'}</strong> &bull; Sayaç: <strong>{activeSeries?.counter || config.counter}</strong>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn btn-primary text-xs flex items-center gap-1.5 px-4 py-2"
                    >
                        <Save size={14} />
                        {t('saveChanges') || 'Ayarları Kaydet'}
                    </button>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('format')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        activeTab === 'format'
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                >
                    <Hash size={13} className="inline mr-1" />
                    Şablon & Format
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('series')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        activeTab === 'series'
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                >
                    <Layers size={13} className="inline mr-1" />
                    Seri Yönetimi ({config.series?.length || 1})
                </button>
            </div>

            {activeTab === 'format' ? (
                <div className="space-y-4">
                    {/* Prefix & Counter */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                                Ön Ek (Prefix)
                            </label>
                            <input
                                type="text"
                                value={activeSeries?.prefix ?? config.prefix ?? 'TK'}
                                onChange={(e) => handleUpdateActiveField('prefix', e.target.value.toUpperCase())}
                                placeholder="Örn: TK, EXP, PRJ"
                                className="form-input font-mono uppercase text-xs w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                                Başlangıç Sayacı
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={activeSeries?.counter ?? config.counter ?? 1}
                                onChange={(e) => handleUpdateActiveField('counter', Math.max(1, parseInt(e.target.value) || 1))}
                                className="form-input font-mono text-xs w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                                Sıfırlama Periyodu
                            </label>
                            <select
                                value={config.resetPeriod || 'yearly'}
                                onChange={(e) => setConfig(prev => ({ ...prev, resetPeriod: e.target.value as QuoteNumberConfig['resetPeriod'] }))}
                                className="form-select text-xs w-full"
                            >
                                <option value="never">Hiçbir Zaman</option>
                                <option value="yearly">Her Yıl Başında</option>
                                <option value="monthly">Her Ay Başında</option>
                                <option value="daily">Her Gün</option>
                            </select>
                        </div>
                    </div>

                    {/* Template Field */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                            Özel Şablon Deseni
                        </label>
                        <input
                            type="text"
                            value={activeSeries?.template ?? config.template ?? '{PREFIX}-{YYYY}{MM}-{INDEX:4}'}
                            onChange={(e) => handleUpdateActiveField('template', e.target.value)}
                            placeholder="{PREFIX}-{YYYY}{MM}-{INDEX:4}"
                            className="form-input font-mono text-xs w-full"
                        />
                    </div>

                    {/* Presets */}
                    <div>
                        <div className="text-xs font-medium text-[var(--color-text)] mb-2">
                            Hazır Numaratör Şablonları
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {NUMBER_PRESETS.map((preset) => {
                                const isCurrent = (activeSeries?.template || config.template) === preset.template;
                                return (
                                    <button
                                        type="button"
                                        key={preset.template}
                                        onClick={() => handleSelectPreset(preset.template)}
                                        className={`p-2.5 rounded border text-left transition-all flex items-center justify-between ${
                                            isCurrent
                                                ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-xs'
                                                : 'border-[var(--color-border)] hover:bg-[var(--color-bg-muted)] text-[var(--color-text)]'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-semibold">{preset.label}</div>
                                            <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                                                {preset.description}
                                            </div>
                                        </div>
                                        {isCurrent && <Check size={16} className="text-blue-600 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Add Series */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSeriesName}
                            onChange={(e) => setNewSeriesName(e.target.value)}
                            placeholder="Yeni Seri Adı (Örn: İhracat, Bayi, Proje)"
                            className="form-input text-xs flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleAddSeries}
                            className="btn btn-primary text-xs flex items-center gap-1 shrink-0"
                        >
                            <Plus size={14} /> Seri Ekle
                        </button>
                    </div>

                    {/* Series List */}
                    <div className="space-y-2">
                        {config.series?.map((s) => {
                            const isActive = config.activeSeriesId === s.id;
                            return (
                                <div
                                    key={s.id}
                                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                                        isActive
                                            ? 'border-blue-500 bg-blue-500/5'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-card)]'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelectSeries(s.id)}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[var(--color-text)]">{s.name}</span>
                                            {isActive && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-semibold">
                                                    Aktif Seri
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                                            Ön Ek: <strong>{s.prefix}</strong> &bull; Sayaç: <strong>{s.counter}</strong> &bull; Şablon: {s.template}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {!isActive && (
                                            <button
                                                type="button"
                                                onClick={() => handleSelectSeries(s.id)}
                                                className="btn btn-xs btn-outline text-xs"
                                            >
                                                Seç
                                            </button>
                                        )}
                                        {(config.series?.length || 0) > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSeries(s.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                title="Seriyi Sil"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteNumberSettingsTab;
