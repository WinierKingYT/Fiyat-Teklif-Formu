import { FileText, Truck, Shield, StickyNote, Stamp } from 'lucide-react';
import React, { useMemo } from 'react';
import { useQuoteData, usePdfConfig } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { QuoteData } from '@/context/quote/types';

const WATERMARK_PRESETS_BY_LANG: Record<string, Record<string, string>> = {
  tr: { draft: 'TASLAK', preview: 'ÖN TEKLİF', confidential: 'GİZLİDİR', approved: 'ONAYLANDI' },
  en: { draft: 'DRAFT', preview: 'PREVIEW', confidential: 'CONFIDENTIAL', approved: 'APPROVED' },
  de: { draft: 'ENTWURF', preview: 'VORSCHAU', confidential: 'VERTRAULICH', approved: 'GENEHMIGT' },
};

const getPresetFields = (lang: string = 'tr') => {
  if (lang === 'en') {
    return [
      { id: 'terms', icon: FileText, labelKey: 'paymentTerms', presets: ['50% Advance, 50% on Delivery', 'Cash Payment', 'Net 30 Days'] },
      { id: 'deliveryTerms', icon: Truck, labelKey: 'deliveryTerms', presets: ['3 Business Days', 'Within 1 Week', 'Immediate Ex-Stock'] },
      { id: 'warrantyTerms', icon: Shield, labelKey: 'warrantyTerms', presets: ['2 Years Warranty', '1 Year Replacement', 'Manufacturer Warranty'] },
      { id: 'notes', icon: StickyNote, labelKey: 'extraNotes', presets: ['Prices include applicable taxes.', 'Quote valid for 15 days.'] },
    ];
  }
  if (lang === 'de') {
    return [
      { id: 'terms', icon: FileText, labelKey: 'paymentTerms', presets: ['50% Anzahlung, 50% bei Lieferung', 'Barzahlung', '30 Tage Zahlungsziel'] },
      { id: 'deliveryTerms', icon: Truck, labelKey: 'deliveryTerms', presets: ['3 Werktage', 'Innerhalb von 1 Woche', 'Sofort ab Lager'] },
      { id: 'warrantyTerms', icon: Shield, labelKey: 'warrantyTerms', presets: ['2 Jahre Garantie', '1 Jahr Direktersatz', 'Herstellergarantie'] },
      { id: 'notes', icon: StickyNote, labelKey: 'extraNotes', presets: ['Preise verstehen sich inklusive MwSt.', 'Angebot 15 Tage gültig.'] },
    ];
  }
  return [
    { id: 'terms', icon: FileText, labelKey: 'paymentTerms', presets: ['%50 Peşin, %50 Teslimatta', 'Peşin Ödeme', '30 Gün Vade'] },
    { id: 'deliveryTerms', icon: Truck, labelKey: 'deliveryTerms', presets: ['3 İş Günü', '1 Hafta İçinde', 'Stoktan Hemen Teslim'] },
    { id: 'warrantyTerms', icon: Shield, labelKey: 'warrantyTerms', presets: ['2 Yıl Garanti', '1 Yıl Birebir Değişim', 'Üretici Garantili'] },
    { id: 'notes', icon: StickyNote, labelKey: 'extraNotes', presets: ['Fiyatlarımıza KDV dahildir.', 'Teklif 15 gün geçerlidir.'] },
  ];
};

interface TermsAndNotesProps {
    data: Partial<QuoteData>;
    onChange: (field: string, value: string) => void;
}

const TermsAndNotes: React.FC<TermsAndNotesProps> = ({ data, onChange }) => {
    const { quoteData } = useQuoteData();
    const { pdfConfig, setPdfConfig } = usePdfConfig();
    const currentLang = quoteData?.language || 'tr';
    const { t } = useTranslation(currentLang);

    const watermarkMap = useMemo(() =>
        WATERMARK_PRESETS_BY_LANG[currentLang] || WATERMARK_PRESETS_BY_LANG.tr,
        [currentLang]
    );

    const fields = useMemo(() => getPresetFields(currentLang), [currentLang]);

    const activeWatermark = useMemo(() => {
        if (!pdfConfig.showWatermark) return 'none';
        const txt = (pdfConfig.watermarkText || '').toUpperCase();
        for (const [key, val] of Object.entries(watermarkMap)) {
            if (val === txt) return key;
        }
        for (const langMap of Object.values(WATERMARK_PRESETS_BY_LANG)) {
            for (const [key, val] of Object.entries(langMap)) {
                if (val === txt) return key;
            }
        }
        return 'draft';
    }, [pdfConfig.showWatermark, pdfConfig.watermarkText, watermarkMap]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handleWatermarkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        onChange('watermark', val);
        if (val === 'none') {
            setPdfConfig(prev => ({ ...prev, showWatermark: false }));
        } else {
            const text = watermarkMap[val] || val.toUpperCase();
            setPdfConfig(prev => ({ ...prev, showWatermark: true, watermarkText: text }));
        }
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
                    <span>{t('watermarkLabel') || 'PDF Filigranı'}:</span>
                </div>
                <select
                    name="watermark"
                    value={activeWatermark}
                    onChange={handleWatermarkChange}
                    aria-label={t('watermarkLabel') || 'PDF Filigranı'}
                    className="text-xs bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] outline-none cursor-pointer"
                >
                    <option value="none">{t('watermarkNoWatermark') || 'Filigran Yok'}</option>
                    <option value="draft">{watermarkMap.draft}</option>
                    <option value="preview">{watermarkMap.preview}</option>
                    <option value="confidential">{watermarkMap.confidential}</option>
                    <option value="approved">{watermarkMap.approved}</option>
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