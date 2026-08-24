import {
    Plus,
    Trash2,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    Tag,
    Sliders,
    ArrowUp,
    ArrowDown,
    Sparkles
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';
import type { CustomField } from '@/context/quote/types';

interface CustomFieldsEditorProps {
    customFields: CustomField[];
    onChange: (fields: CustomField[]) => void;
    t?: (key: string) => string;
}

interface QuickPreset {
    labelKey: string;
    defaultLabel: string;
}

const QUICK_FIELD_PRESETS: QuickPreset[] = [
    { labelKey: 'presetProjectCode', defaultLabel: 'Proje Kodu' },
    { labelKey: 'presetDeliveryPlace', defaultLabel: 'Teslimat Yeri' },
    { labelKey: 'presetShippingType', defaultLabel: 'Sevkiyat Şekli' },
    { labelKey: 'presetOrderRef', defaultLabel: 'Sipariş / Ref No' },
    { labelKey: 'presetSalesRep', defaultLabel: 'Satış Temsilcisi' },
    { labelKey: 'presetDeliveryTime', defaultLabel: 'Teslim Süresi' },
    { labelKey: 'presetWarrantyScope', defaultLabel: 'Garanti Kapsamı' }
];

export const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({
    customFields = [],
    onChange,
    t
}) => {
    const { t: defaultT } = useTranslation();
    const tr = t || defaultT;
    const [isExpanded, setIsExpanded] = useState(customFields.length > 0);
    const [newLabel, setNewLabel] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newShowOnPdf, setNewShowOnPdf] = useState(true);

    const handleAddField = (labelToAdd?: string, valueToAdd?: string) => {
        const label = (labelToAdd || newLabel).trim();
        const value = (valueToAdd !== undefined ? valueToAdd : newValue).trim();

        if (!label) {
            toast.error(tr('fieldLabelPlaceholder') || 'Lütfen alan etiketi giriniz');
            return;
        }

        const newField: CustomField = {
            id: `cf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            label,
            value,
            type: 'text',
            showOnPdf: newShowOnPdf,
            order: customFields.length
        };

        onChange([...customFields, newField]);
        setNewLabel('');
        setNewValue('');
        setIsExpanded(true);
        toast.success(`"${label}" ${tr('loadedSuccess') || 'eklendi'}`);
    };

    const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
        const updated = customFields.map(f => f.id === id ? { ...f, ...updates } : f);
        onChange(updated);
    };

    const handleDeleteField = (id: string) => {
        const updated = customFields.filter(f => f.id !== id);
        onChange(updated);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= customFields.length) return;

        const updated = [...customFields];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        onChange(updated);
    };

    return (
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-card)] overflow-hidden shadow-2xs">
            {/* Header Toggle */}
            <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Tag size={16} className="text-[var(--color-primary)]" />
                    <div>
                        <span className="text-xs font-semibold text-[var(--color-text)]">
                            {tr('customFieldsTitle') || 'Özel Alanlar & Proje Bilgileri'}
                        </span>
                        {customFields.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                                {customFields.length}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
                        aria-label="Toggle"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-3 space-y-3 text-xs border-t border-[var(--color-border)]">
                    {/* Quick Presets */}
                    <div>
                        <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles size={11} className="text-[var(--color-primary)]" />
                            <span>{tr('customFieldsPresets') || 'Hızlı Alan Şablonları'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_FIELD_PRESETS.map((preset) => {
                                const localizedLabel = tr(preset.labelKey) || preset.defaultLabel;
                                const alreadyAdded = customFields.some(f => f.label.toLowerCase() === localizedLabel.toLowerCase());
                                return (
                                    <button
                                        key={preset.labelKey}
                                        type="button"
                                        disabled={alreadyAdded}
                                        onClick={() => handleAddField(localizedLabel, '')}
                                        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${alreadyAdded ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] border-[var(--color-border)] opacity-60 cursor-not-allowed' : 'bg-[var(--color-bg-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40'}`}
                                    >
                                        + {localizedLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* New Field Creator Form */}
                    <div className="p-2.5 rounded-lg bg-[var(--color-bg-muted)]/60 border border-[var(--color-border)] flex flex-col sm:flex-row items-center gap-2">
                        <input
                            type="text"
                            className="form-control text-xs w-full sm:w-1/3"
                            placeholder={tr('fieldLabelPlaceholder') || 'Alan Adı (Örn: Proje Kodu)'}
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddField(); }}
                        />
                        <input
                            type="text"
                            className="form-control text-xs w-full sm:flex-1"
                            placeholder={tr('fieldValuePlaceholder') || 'Değeri (Örn: PRJ-2026-X)'}
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddField(); }}
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--color-text-secondary)] select-none">
                                <input
                                    type="checkbox"
                                    checked={newShowOnPdf}
                                    onChange={(e) => setNewShowOnPdf(e.target.checked)}
                                    className="form-checkbox"
                                />
                                <span>{tr('showOnPdf') || "PDF'te Göster"}</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => handleAddField()}
                                className="btn btn-primary btn-xs flex items-center gap-1 px-3 py-1.5"
                            >
                                <Plus size={13} />
                                <span>{tr('add') || 'Ekle'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Defined Custom Fields List */}
                    {customFields.length > 0 ? (
                        <div className="space-y-2">
                            {customFields.map((field, idx) => (
                                <div
                                    key={field.id}
                                    className="p-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-[var(--color-border-hover)] transition-all"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => handleMove(idx, 'up')}
                                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 p-0.5"
                                                title={tr('moveUp') || 'Yukarı Taşı'}
                                            >
                                                <ArrowUp size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={idx === customFields.length - 1}
                                                onClick={() => handleMove(idx, 'down')}
                                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 p-0.5"
                                                title={tr('moveDown') || 'Aşağı Taşı'}
                                            >
                                                <ArrowDown size={11} />
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control text-xs w-28 sm:w-36 font-semibold"
                                            value={field.label}
                                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                            placeholder={tr('labelSize') || 'Etiket'}
                                        />

                                        <span className="text-[var(--color-text-muted)] font-bold">:</span>

                                        <input
                                            type="text"
                                            className="form-control text-xs flex-1"
                                            value={field.value}
                                            onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                                            placeholder={tr('fieldValuePlaceholder') || 'Değer giriniz...'}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateField(field.id, { showOnPdf: !field.showOnPdf })}
                                            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${field.showOnPdf ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}
                                            title={field.showOnPdf ? (tr('showOnPdf') || "PDF'te Gösteriliyor") : (tr('pdfHidden') || "PDF'te Gizli")}
                                        >
                                            {field.showOnPdf ? <Eye size={13} /> : <EyeOff size={13} />}
                                            <span className="text-[10px] font-medium">{field.showOnPdf ? (tr('pdfVisible') || 'PDF Açık') : (tr('pdfHidden') || 'PDF Gizli')}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteField(field.id)}
                                            className="btn btn-xs btn-danger p-1.5"
                                            title={tr('delete') || 'Alanı Sil'}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-3 text-[var(--color-text-muted)]">
                            <Sliders size={20} className="mx-auto mb-1 opacity-30" />
                            <p className="text-[11px]">{tr('noCustomFields') || 'Henüz özel alan eklenmedi. Yukarıdaki şablonlardan veya formdan ekleyebilirsiniz.'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

