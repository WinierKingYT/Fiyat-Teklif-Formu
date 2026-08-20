import { Calculator, Receipt, Save, FileText } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateQuoteTotals, formatCurrency } from '@/utils/calculations';
import { numberToWordsTurkish } from '@/utils/numberToWordsTurkish';
import type { QuoteItem, Discount } from '@/context/quote/types';

interface SummarySectionProps {
    items: QuoteItem[];
    discount: Discount;
    onDiscountChange: (discount: Discount) => void;
    currency?: string;
    language?: string;
    showAmountInWords?: boolean;
    onToggleAmountInWords?: (show: boolean) => void;
    onSaveQuote?: () => void;
    onPreviewPdf?: () => void;
    isSaving?: boolean;
}

const SummarySection = React.memo(({
    items,
    discount = { type: 'percentage', value: 0 },
    onDiscountChange,
    currency = 'TRY',
    language = 'tr',
    showAmountInWords,
    onToggleAmountInWords,
    onSaveQuote,
    onPreviewPdf,
    isSaving = false
}: SummarySectionProps) => {
    const { t } = useTranslation(language);
    const calc = useMemo(() => calculateQuoteTotals(items, discount, { currency }), [items, discount, currency]);
    const [localShowWords, setLocalShowWords] = useState(showAmountInWords ?? false);
    const isShowingWords = showAmountInWords !== undefined ? showAmountInWords : localShowWords;

    const handleToggleWords = () => {
        const next = !isShowingWords;
        setLocalShowWords(next);
        if (onToggleAmountInWords) onToggleAmountInWords(next);
    };

    const amountInWords = useMemo(() => numberToWordsTurkish(calc.grandTotal, currency), [calc.grandTotal, currency]);

    const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        onDiscountChange({ ...discount, value });
    };

    const handleDiscountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onDiscountChange({ ...discount, type: e.target.value as 'percentage' | 'fixed' });
    };

    if (!items?.length) return null;

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <Calculator size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="card-title">{t('summary')}</span>
                </div>
            </div>
            <div className="card-body">
                <div className="space-y-2">
                    <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-[var(--color-text-secondary)]">{t('subtotal')}</span>
                        <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(calc.subtotal)}</span>
                    </div>

                    {calc.lineDiscountTotal > 0 && (
                        <div className="flex items-center justify-between py-1 text-[var(--color-warning)]">
                            <span className="text-sm">{t('lineDiscounts')}</span>
                            <span className="text-sm font-semibold">-{formatCurrency(calc.lineDiscountTotal)}</span>
                        </div>
                    )}

                    <div className="border-t border-[var(--color-border)] my-1"></div>

                    {/* General Discount */}
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('discount')}</span>
                            <div className="inline-flex items-center border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden bg-[var(--color-bg-card)] focus-within:border-[var(--color-primary)]">
                                <input
                                    type="number"
                                    className="w-16 py-1 px-2 text-right text-xs bg-transparent border-0 outline-none"
                                    min="0"
                                    step={discount.type === 'percentage' ? "1" : "0.01"}
                                    value={discount.value}
                                    onChange={handleDiscountValueChange}
                                    aria-label={t('generalDiscount')}
                                />
                                <select
                                    className="py-1 px-1.5 text-xs bg-[var(--color-bg-muted)] border-0 border-l border-[var(--color-border)] outline-none text-[var(--color-text-secondary)] font-semibold cursor-pointer"
                                    value={discount.type}
                                    onChange={handleDiscountTypeChange}
                                    aria-label={t('discountType')}
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">{currency}</option>
                                </select>
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-error)]">-{formatCurrency(calc.globalDiscountAmount)}</span>
                    </div>

                    {/* VAT Section */}
                    {Object.keys(calc.taxBreakdown).length > 1 ? (
                        <>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Receipt size={13} className="text-[var(--color-text-muted)]" />
                                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{t('vatBreakdown')}</span>
                            </div>
                            {Object.entries(calc.taxBreakdown).map(([rate, amount]) => (
                                <div className="flex items-center justify-between py-0.5" key={rate}>
                                    <span className="text-xs text-[var(--color-text-secondary)] ml-3">{t('vatRateDisplay').replace('{rate}', rate)}</span>
                                    <span className="text-xs font-medium text-[var(--color-text)]">{formatCurrency(amount)}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between py-1 border-t border-[var(--color-border)]/50 mt-1">
                                <span className="text-sm text-[var(--color-text-secondary)]">{t('totalVat')}</span>
                                <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(calc.taxTotal)}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                {Object.keys(calc.taxBreakdown).length === 1
                                    ? `KDV (%${Object.keys(calc.taxBreakdown)[0]})`
                                    : t('totalVat')}
                            </span>
                            <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(calc.taxTotal)}</span>
                        </div>
                    )}

                    <div className="border-t-2 border-[var(--color-primary)]/20 my-2"></div>

                    <div className="flex items-center justify-between py-2">
                        <span className="text-base font-bold text-[var(--color-text)]">{t('grandTotal')}</span>
                        <span className="text-lg font-extrabold text-[var(--color-primary)]">{formatCurrency(calc.grandTotal)}</span>
                    </div>

                    {/* Amount in Words */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={handleToggleWords}
                            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        >
                            <FileText size={12} />
                            <span>{isShowingWords ? 'Yazıyla Tutarı Gizle' : 'Yazıyla Tutar Ekle'}</span>
                        </button>
                        {isShowingWords && (
                            <div className="mt-1.5 p-2 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded text-xs font-mono text-[var(--color-text-secondary)] italic leading-relaxed select-all">
                                {amountInWords}
                            </div>
                        )}
                    </div>

                    {/* Prominent Action Buttons (CTAs) */}
                    {(onSaveQuote || onPreviewPdf) && (
                        <div className="pt-2 space-y-2 border-t border-[var(--color-border)]">
                            {onPreviewPdf && (
                                <button
                                    type="button"
                                    onClick={onPreviewPdf}
                                    className="w-full btn btn-primary flex items-center justify-center gap-2 py-2.5 font-semibold text-sm shadow-sm"
                                    title="PDF Önizle & İndir (Ctrl+P)"
                                >
                                    <FileText size={16} />
                                    <span>PDF Önizle & İndir</span>
                                </button>
                            )}
                            {onSaveQuote && (
                                <button
                                    type="button"
                                    onClick={onSaveQuote}
                                    disabled={isSaving}
                                    className="w-full btn btn-outline flex items-center justify-center gap-2 py-2 text-xs font-medium text-[var(--color-text)]"
                                    title="Teklifi Kaydet (Ctrl+S)"
                                >
                                    <Save size={14} className="text-[var(--color-info)]" />
                                    <span>{isSaving ? 'Kaydediliyor...' : 'Teklifi Kaydet'}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default SummarySection;
