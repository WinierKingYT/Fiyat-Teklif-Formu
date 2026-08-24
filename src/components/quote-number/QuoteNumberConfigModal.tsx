import {
    Hash,
    Sparkles,
    Settings,
    Layers,
    Plus,
    Trash,
    Check,
    HelpCircle,
    Copy
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import {
    NUMBER_PRESETS,
    previewQuoteNumber,
    getActiveSeries,
    generateNextQuoteNumber
} from '@/utils/numberGenerator';
import type { QuoteNumberConfig, QuoteNumberSeries } from '@/context/quote/types';

interface QuoteNumberConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: QuoteNumberConfig;
    onSaveConfig: (newConfig: QuoteNumberConfig) => void;
    onApplyNumber?: (newNumber: string) => void;
}

export const QuoteNumberConfigModal: React.FC<QuoteNumberConfigModalProps> = ({
    isOpen,
    onClose,
    config,
    onSaveConfig,
    onApplyNumber
}) => {
    const [localConfig, setLocalConfig] = useState<QuoteNumberConfig>(() => ({
        ...config,
        series: config.series || [
            { id: 'default', name: 'Standart Seri', prefix: config.prefix || 'TK', template: config.template || '{PREFIX}-{YYYY}{MM}-{INDEX:4}', counter: config.counter || 1 }
        ],
        activeSeriesId: config.activeSeriesId || 'default'
    }));

    React.useEffect(() => {
        if (isOpen) {
            setLocalConfig({
                ...config,
                series: config.series || [
                    { id: 'default', name: 'Standart Seri', prefix: config.prefix || 'TK', template: config.template || '{PREFIX}-{YYYY}{MM}-{INDEX:4}', counter: config.counter || 1 }
                ],
                activeSeriesId: config.activeSeriesId || 'default'
            });
        }
    }, [isOpen, config]);

    const [activeTab, setActiveTab] = useState<'format' | 'series'>('format');
    const [newSeriesName, setNewSeriesName] = useState('');

    const activeSeries = useMemo(() => getActiveSeries(localConfig), [localConfig]);

    const livePreview = useMemo(() => {
        try {
            return previewQuoteNumber(localConfig);
        } catch {
            return 'Hatalı Şablon';
        }
    }, [localConfig]);

    const handleSelectPreset = (template: string) => {
        if (activeSeries && localConfig.series) {
            const updatedSeries = localConfig.series.map(s =>
                s.id === activeSeries.id ? { ...s, template } : s
            );
            setLocalConfig(prev => ({ ...prev, series: updatedSeries, template }));
        } else {
            setLocalConfig(prev => ({ ...prev, template }));
        }
    };

    const handleUpdateActiveField = (field: 'prefix' | 'template' | 'counter', val: string | number) => {
        if (activeSeries && localConfig.series) {
            const updatedSeries = localConfig.series.map(s =>
                s.id === activeSeries.id ? { ...s, [field]: val } : s
            );
            setLocalConfig(prev => ({
                ...prev,
                series: updatedSeries,
                [field]: val
            }));
        } else {
            setLocalConfig(prev => ({ ...prev, [field]: val }));
        }
    };

    const handleSelectSeries = (seriesId: string) => {
        const target = localConfig.series?.find(s => s.id === seriesId);
        if (!target) return;
        setLocalConfig(prev => ({
            ...prev,
            activeSeriesId: seriesId,
            prefix: target.prefix,
            template: target.template,
            counter: target.counter
        }));
    };

    const handleAddSeries = () => {
        if (!newSeriesName.trim()) return;
        const newId = `series-${Date.now()}`;
        const newSeriesItem: QuoteNumberSeries = {
            id: newId,
            name: newSeriesName.trim(),
            prefix: 'TK',
            template: '{PREFIX}-{YYYY}{MM}-{INDEX:4}',
            counter: 1
        };
        const nextSeries = [...(localConfig.series || []), newSeriesItem];
        setLocalConfig(prev => ({
            ...prev,
            series: nextSeries,
            activeSeriesId: newId,
            prefix: newSeriesItem.prefix,
            template: newSeriesItem.template,
            counter: newSeriesItem.counter
        }));
        setNewSeriesName('');
        toast.success(`"${newSeriesItem.name}" serisi eklendi`);
    };

    const handleDeleteSeries = (seriesId: string) => {
        if ((localConfig.series || []).length <= 1) {
            toast.error('En az bir numara serisi bulunmalıdır');
            return;
        }
        const nextSeries = (localConfig.series || []).filter(s => s.id !== seriesId);
        const nextActiveId = localConfig.activeSeriesId === seriesId ? nextSeries[0].id : localConfig.activeSeriesId;
        const nextActive = nextSeries.find(s => s.id === nextActiveId) || nextSeries[0];

        setLocalConfig(prev => ({
            ...prev,
            series: nextSeries,
            activeSeriesId: nextActive.id,
            prefix: nextActive.prefix,
            template: nextActive.template,
            counter: nextActive.counter
        }));
        toast.success('Seri silindi');
    };

    const handleSave = () => {
        onSaveConfig(localConfig);
        toast.success('Numaratör ayarları kaydedildi');
        onClose();
    };

    const handleSaveAndApply = () => {
        const { formattedNumber, updatedConfig } = generateNextQuoteNumber(localConfig);
        onSaveConfig(updatedConfig);
        if (onApplyNumber) {
            onApplyNumber(formattedNumber);
        }
        toast.success(`Yeni numara uygulandı: ${formattedNumber}`);
        onClose();
    };

    const insertTag = (tag: string) => {
        const currentTemplate = activeSeries?.template || localConfig.template;
        handleUpdateActiveField('template', `${currentTemplate}${tag}`);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Dinamik Teklif Numaratörü (Akıllı Sayaç)"
            size="lg"
        >
            <div className="space-y-4 text-xs">
                {/* Tab switcher */}
                <div className="flex bg-[var(--color-bg-muted)] p-1 rounded-lg border border-[var(--color-border)]">
                    <button
                        type="button"
                        onClick={() => setActiveTab('format')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'format' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                    >
                        <Settings size={13} />
                        <span>Format & Şablon Ayarları</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('series')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'series' ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                    >
                        <Layers size={13} />
                        <span>Seri Yönetimi ({(localConfig.series || []).length})</span>
                    </button>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 rounded-lg bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                            Aktif Seri: <span className="text-[var(--color-primary)] font-bold">{activeSeries?.name || 'Standart'}</span>
                        </div>
                        <div className="text-base font-mono font-bold text-[var(--color-text)] mt-0.5">
                            {livePreview}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                        <span className="px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-mono">
                            Sayaç: {activeSeries?.counter || localConfig.counter}
                        </span>
                    </div>
                </div>

                {activeTab === 'format' ? (
                    <div className="space-y-4">
                        {/* Series Selector Chips */}
                        {(localConfig.series || []).length > 1 && (
                            <div>
                                <label className="form-label text-xs">Aktif Seri Seçimi</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {(localConfig.series || []).map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => handleSelectSeries(s.id)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${localConfig.activeSeriesId === s.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs' : 'bg-[var(--color-bg-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'}`}
                                        >
                                            {s.name} ({s.prefix})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Presets Grid */}
                        <div>
                            <label className="form-label text-xs">Hazır Şablon Presetleri</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {NUMBER_PRESETS.map((preset) => {
                                    const isSelected = (activeSeries?.template || localConfig.template) === preset.template;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handleSelectPreset(preset.template)}
                                            className={`p-2 rounded-lg border text-left transition-all ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)] shadow-xs' : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)]'}`}
                                        >
                                            <div className="font-semibold text-[var(--color-text)] flex items-center justify-between">
                                                <span>{preset.label}</span>
                                                {isSelected && <Check size={13} className="text-[var(--color-primary)]" />}
                                            </div>
                                            <div className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                                                {preset.template}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Template Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="form-label text-xs mb-0">Özel Şablon Formatı</label>
                                <span className="text-[10px] text-[var(--color-text-muted)]">Tıklayarak etiket ekleyin</span>
                            </div>
                            <input
                                type="text"
                                className="form-control font-mono text-xs w-full"
                                value={activeSeries?.template || localConfig.template}
                                onChange={(e) => handleUpdateActiveField('template', e.target.value)}
                                placeholder="{PREFIX}-{YYYY}{MM}-{INDEX:4}"
                            />
                            {/* Dynamic Tag Pills */}
                            <div className="flex gap-1 flex-wrap mt-1.5">
                                {[
                                    { tag: '{PREFIX}', label: 'Önek' },
                                    { tag: '{YYYY}', label: 'Yıl (2026)' },
                                    { tag: '{YY}', label: 'Yıl (26)' },
                                    { tag: '{MM}', label: 'Ay (08)' },
                                    { tag: '{DD}', label: 'Gün (21)' },
                                    { tag: '{INDEX:4}', label: 'Sayaç (0001)' },
                                    { tag: '{INDEX:3}', label: 'Sayaç (001)' },
                                    { tag: '{RANDOM:4}', label: 'Rastgele Kod' }
                                ].map((item) => (
                                    <button
                                        key={item.tag}
                                        type="button"
                                        onClick={() => insertTag(item.tag)}
                                        className="px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-secondary)] transition-colors"
                                        title={`${item.label} ekle`}
                                    >
                                        + {item.tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prefix, Counter, Reset Period */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="form-label text-xs">Önek (Prefix)</label>
                                <input
                                    type="text"
                                    className="form-control uppercase font-mono text-xs"
                                    value={activeSeries?.prefix || localConfig.prefix}
                                    onChange={(e) => handleUpdateActiveField('prefix', e.target.value.toUpperCase())}
                                    placeholder="TK"
                                />
                            </div>
                            <div>
                                <label className="form-label text-xs">Sıradaki Sayaç No</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-control font-mono text-xs"
                                    value={activeSeries?.counter ?? localConfig.counter}
                                    onChange={(e) => handleUpdateActiveField('counter', parseInt(e.target.value, 10) || 1)}
                                />
                            </div>
                            <div>
                                <label className="form-label text-xs">Sıfırlama Periyodu</label>
                                <select
                                    className="form-select text-xs"
                                    value={localConfig.resetPeriod}
                                    onChange={(e) => setLocalConfig(prev => ({ ...prev, resetPeriod: e.target.value as 'never' | 'yearly' | 'monthly' | 'daily' }))}
                                >
                                    <option value="daily">Günlük (Her gün 1'e döner)</option>
                                    <option value="monthly">Aylık (Her ayın 1'inde 1'e döner)</option>
                                    <option value="yearly">Yıllık (Her 1 Ocak'ta 1'e döner)</option>
                                    <option value="never">Asla Sıfırlanmaz (Sürekli artar)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* SERIES MANAGEMENT TAB */
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="form-control text-xs flex-1"
                                placeholder="Yeni seri adı (Örn: İhracat, Proje B, Servis)..."
                                value={newSeriesName}
                                onChange={(e) => setNewSeriesName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSeries(); }}
                            />
                            <button
                                type="button"
                                onClick={handleAddSeries}
                                className="btn btn-primary btn-sm flex items-center gap-1"
                            >
                                <Plus size={14} />
                                <span>Seri Ekle</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(localConfig.series || []).map((seriesItem) => {
                                const isActive = localConfig.activeSeriesId === seriesItem.id;
                                const preview = previewQuoteNumber({
                                    ...localConfig,
                                    template: seriesItem.template,
                                    prefix: seriesItem.prefix,
                                    counter: seriesItem.counter
                                });

                                return (
                                    <div
                                        key={seriesItem.id}
                                        className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isActive ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]/40' : 'border-[var(--color-border)] bg-[var(--color-bg-card)]'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[var(--color-text)]">{seriesItem.name}</span>
                                                {isActive && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--color-primary)] text-white">
                                                        AKTİF
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">
                                                Önizleme: <strong className="text-[var(--color-text)]">{preview}</strong> • Önek: {seriesItem.prefix} • Sayaç: {seriesItem.counter}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {!isActive && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectSeries(seriesItem.id)}
                                                    className="btn btn-xs btn-outline"
                                                >
                                                    Aktif Yap
                                                </button>
                                            )}
                                            {(localConfig.series || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSeries(seriesItem.id)}
                                                    className="btn btn-xs btn-danger p-1"
                                                    title="Seriyi Sil"
                                                >
                                                    <Trash size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)] mt-4">
                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 self-start sm:self-auto">
                        <Sparkles size={13} className="text-[var(--color-primary)]" />
                        <span>Sıradaki: <strong className="text-[var(--color-text)] font-mono">{livePreview}</strong></span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                            Vazgeç
                        </button>
                        {onApplyNumber && (
                            <button
                                type="button"
                                onClick={handleSaveAndApply}
                                className="btn btn-sm btn-outline flex items-center gap-1.5 text-[var(--color-primary)] border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-muted)]"
                            >
                                <Sparkles size={14} />
                                <span>Numara Üret & Yaz</span>
                            </button>
                        )}
                        <button type="button" onClick={handleSave} className="btn btn-primary btn-sm flex items-center gap-1.5">
                            <Check size={14} />
                            <span>Kaydet</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
