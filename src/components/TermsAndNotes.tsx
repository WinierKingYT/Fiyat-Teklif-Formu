import { FileText, Truck, Shield, StickyNote, Stamp } from 'lucide-react';
import React from 'react';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { QuoteData } from '@/context/quote/types';

const fields = [
    {
        id: 'terms',
        icon: FileText,
        labelKey: 'paymentTerms',
        presets: ['%50 Peşin, %50 Teslimatta', 'Peşin Ödeme', '30 Gün Vade']
    },
    {
        id: 'deliveryTerms',
        icon: Truck,
        labelKey: 'deliveryTerms',
        presets: ['3 İş Günü', '1 Hafta İçinde', 'Stoktan Hemen Teslim']
    },
    {
        id: 'warrantyTerms',
        icon: Shield,
        labelKey: 'warrantyTerms',
        presets: ['2 Yıl Garanti', '1 Yıl Birebir Değişim', 'Üretici Garantili']
    },
    {
        id: 'notes',
        icon: StickyNote,
        labelKey: 'extraNotes',
        presets: ['Fiyatlarımıza KDV dahildir.', 'Teklif 15 gün geçerlidir.']
    },
];

interface TermsAndNotesProps {
    data: Partial<QuoteData>;
    onChange: (field: string, value: string) => void;
}

const TermsAndNotes: React.FC<TermsAndNotesProps> = ({ data, onChange }) => {
    const { quoteData } = useQuoteData();
    const { t } = useTranslation(quoteData?.language);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handlePresetClick = (fieldId: string, presetText: string) => {
        const current = (data as Record<string, string | undefined>)[fieldId] || '';
        const newValue = current ? `${current}\n${presetText}` : presetText;
        onChange(fieldId, newValue);
    };

    return (
        <div className="space-y-3">
            {/* Watermark Selector */}
            <div className="flex items-center justify-between p-2 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius)] text-xs">
                <div className="flex items-center gap-1.5 font-medium text-[var(--color-text)]">
                    <Stamp size={14} className="text-[var(--color-primary)]" />
                    <span>PDF Filigranı:</span>
                </div>
                <select
                    name="watermark"
                    value={data.watermark || 'none'}
                    onChange={handleChange}
                    aria-label="PDF Filigranı"
                    className="text-xs bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] outline-none cursor-pointer"
                >
                    <option value="none">Filigran Yok</option>
                    <option value="draft">TASLAK</option>
                    <option value="preview">ÖN TEKLİF</option>
                    <option value="confidential">GİZLİDİR</option>
                    <option value="approved">ONAYLANDI</option>
                </select>
            </div>

            {/* Terms & Notes Fields with Presets */}
            {fields.map(field => {
                const Icon = field.icon;
                const currentValue = (data as Record<string, string | undefined>)[field.id] || '';
                return (
                    <div key={field.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]" htmlFor={field.id}>
                                <Icon size={13} className="text-[var(--color-primary)]" />
                                <span>{t(field.labelKey)}</span>
                            </label>
                        </div>
                        <textarea
                            className="form-control text-xs py-1.5"
                            id={field.id}
                            name={field.id}
                            value={currentValue}
                            onChange={handleChange}
                            placeholder={t(field.labelKey)}
                            rows={2}
                        />
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {field.presets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handlePresetClick(field.id, preset)}
                                    className="px-1.5 py-0.5 text-[10px] bg-[var(--color-bg-muted)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded transition-colors"
                                >
                                    + {preset}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(TermsAndNotes);