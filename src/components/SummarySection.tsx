import React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Calculator, Percent, Receipt, RefreshCw } from 'lucide-react';
import { calculateQuoteTotals } from '../utils/calculations';
import { getExchangeRates, CURRENCIES } from '../utils/exchangeRates';

const SummarySection = React.memo(({ items, discount = { type: 'percentage', value: 0 }, onDiscountChange, currency = 'TRY' }: any) => {
    const calc = useMemo(() => calculateQuoteTotals(items, discount, { currency }), [items, discount, currency]);

    const [rates, setRates] = useState(null);
    const [showConversion, setShowConversion] = useState(false);
    const [targetCurrency, setTargetCurrency] = useState('USD');

    useEffect(() => {
        if (showConversion && currency !== targetCurrency) {
            getExchangeRates().then(setRates).catch(() => {});
        }
    }, [showConversion, currency, targetCurrency]);

    const convertedAmount = useMemo(() => {
        if (!rates || currency === targetCurrency) return null;
        const fromRate = rates[currency];
        const toRate = rates[targetCurrency];
        if (!fromRate || !toRate) return null;
        const amountInTRY = calc.grandTotal / fromRate;
        return amountInTRY * toRate;
    }, [calc.grandTotal, rates, currency, targetCurrency]);

    const formatCurrency = (amount) => {
        const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    };

    const handleDiscountValueChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        onDiscountChange({ ...discount, value });
    };

    const handleDiscountTypeChange = (e) => {
        const type = e.target.value;
        onDiscountChange({ ...discount, type });
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <Calculator size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="card-title">Özet</span>
                </div>
            </div>
            <div className="card-body">
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-[var(--color-text-secondary)]">Ara Toplam</span>
                        <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(calc.subtotal)}</span>
                    </div>

                    {calc.lineDiscountTotal > 0 && (
                        <div className="flex items-center justify-between py-1.5">
                            <span className="text-sm text-[var(--color-text-secondary)]">Satır İskontosu</span>
                            <span className="text-sm font-semibold text-[var(--color-error)]">-{formatCurrency(calc.lineDiscountTotal)}</span>
                        </div>
                    )}

                    <div className="border-t border-dashed border-[var(--color-border)] my-1.5"></div>

                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm font-semibold text-[var(--color-text)]">Net Toplam</span>
                        <span className="text-sm font-bold text-[var(--color-text)]">{formatCurrency(calc.netTotal)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                            <Percent size={14} className="text-[var(--color-text-muted)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">Genel İskonto</span>
                            <div className="flex items-center gap-1">
                                <select
                                    className="form-control py-1 px-2 text-xs w-16"
                                    value={discount.type}
                                    onChange={handleDiscountTypeChange}
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">Tutar</option>
                                </select>
                                <input
                                    type="number"
                                    className="form-control py-1 px-2 w-20 text-right text-xs"
                                    min="0"
                                    step={discount.type === 'percentage' ? "1" : "0.01"}
                                    value={discount.value}
                                    onChange={handleDiscountValueChange}
                                    aria-label="Genel İskonto"
                                />
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-error)]">-{formatCurrency(calc.globalDiscountAmount)}</span>
                    </div>

                    <div className="border-t border-dashed border-[var(--color-border)] my-1.5"></div>

                    {Object.entries(calc.taxBreakdown).length > 0 && (
                        <>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Receipt size={13} className="text-[var(--color-text-muted)]" />
                                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">KDV Dökümü</span>
                            </div>
                            {Object.entries(calc.taxBreakdown).map(([rate, amount]) => (
                                <div className="flex items-center justify-between py-1" key={rate}>
                                    <span className="text-sm text-[var(--color-text-secondary)] ml-4">KDV %{rate}</span>
                                    <span className="text-sm text-[var(--color-text)]">{formatCurrency(amount)}</span>
                                </div>
                            ))}
                        </>
                    )}

                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-[var(--color-text-secondary)]">Toplam KDV</span>
                        <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(calc.taxTotal)}</span>
                    </div>

                    <div className="border-t-2 border-[var(--color-primary)]/20 my-2"></div>

                    <div className="flex items-center justify-between py-2">
                        <span className="text-base font-bold text-[var(--color-text)]">Genel Toplam</span>
                        <span className="text-lg font-extrabold text-[var(--color-primary)]">{formatCurrency(calc.grandTotal)}</span>
                    </div>

                    {showConversion && convertedAmount !== null && currency !== targetCurrency && (
                        <div className="flex items-center justify-between py-1.5 border-t border-[var(--color-border)] mt-1">
                            <span className="text-xs text-[var(--color-text-muted)]">
                                ~{targetCurrency} Karşılığı
                            </span>
                            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: targetCurrency }).format(convertedAmount)}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => setShowConversion(!showConversion)}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-info)] hover:text-[var(--color-info)]/80 mt-2 transition-colors"
                    >
                        <RefreshCw size={12} />
                        {showConversion ? 'Kur Çeviricisini Gizle' : 'Kur Çeviricisini Göster'}
                    </button>
                    {showConversion && (
                        <select
                            value={targetCurrency}
                            onChange={(e) => setTargetCurrency(e.target.value)}
                            className="w-full mt-1.5 px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                        >
                            {CURRENCIES.filter(c => c.code !== currency).map(c => (
                                <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        </div>
    );
});

export default SummarySection;