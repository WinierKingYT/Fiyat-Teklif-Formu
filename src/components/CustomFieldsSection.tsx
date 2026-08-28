import { Plus, Trash2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { CustomField } from '@/context/quote/types';

export const CustomFieldsSection: React.FC = () => {
    const { quoteData, updateQuoteData } = useQuoteData();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const customFields = quoteData.customFields || [];

    const handleAddField = () => {
        const newField: CustomField = {
            id: `cf_${Date.now()}`,
            label: '',
            value: '',
            showOnPdf: true,
            order: customFields.length
        };
        updateQuoteData('customFields', [...customFields, newField]);
        if (!isOpen) setIsOpen(true);
    };

    const handleUpdateField = (id: string, key: 'label' | 'value', val: string) => {
        const updated = customFields.map(f => f.id === id ? { ...f, [key]: val } : f);
        updateQuoteData('customFields', updated);
    };

    const handleRemoveField = (id: string) => {
        const filtered = customFields.filter(f => f.id !== id);
        updateQuoteData('customFields', filtered);
    };

    return (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
            <div
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--color-bg-muted)] transition-colors select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Tag size={16} className="text-[var(--color-primary)]" />
                    <span className="text-xs font-bold text-[var(--color-text)]">
                        {t('customFields') || 'Özel Dinamik Alanlar'}
                    </span>
                    {customFields.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-bold">
                            {customFields.length}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddField();
                        }}
                        className="btn btn-xs btn-primary flex items-center gap-1 text-[11px]"
                    >
                        <Plus size={13} />
                        {t('addField') || 'Alan Ekle'}
                    </button>
                    {isOpen ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
                </div>
            </div>

            {isOpen && (
                <div className="p-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50 space-y-2.5">
                    {customFields.length === 0 ? (
                        <div className="text-center py-3 text-xs text-[var(--color-text-muted)]">
                            Henüz özel alan eklenmedi. (Örn: Proje Kodu, Sipariş No, Şantiye, Sözleşme Tarihi)
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {customFields.map((field, idx) => (
                                <div key={field.id || idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)}
                                        placeholder="Alan Adı (Örn: Proje Kodu)"
                                        className="form-input text-xs flex-1"
                                    />
                                    <input
                                        type="text"
                                        value={field.value}
                                        onChange={(e) => handleUpdateField(field.id, 'value', e.target.value)}
                                        placeholder="Değer (Örn: PRJ-2026-X)"
                                        className="form-input text-xs flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveField(field.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                        title="Alanı Sil"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomFieldsSection;
