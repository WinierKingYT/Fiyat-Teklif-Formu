import React, { useMemo } from 'react';
import { calculateQuoteTotals } from '../utils/calculations';

const SummarySection = ({ items, discount = { type: 'percentage', value: 0 }, onDiscountChange, currency = 'TRY' }) => {
    const calc = useMemo(() => calculateQuoteTotals(items, discount, { currency }), [items, discount, currency]);

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
        <div className="summary-section">
            <div className="summary-row">
                <span>Ara Toplam</span>
                <span>{formatCurrency(calc.subtotal)}</span>
            </div>

            {calc.lineDiscountTotal > 0 && (
                <div className="summary-row">
                    <span>Satır İskontosu</span>
                    <span className="text-error">-{formatCurrency(calc.lineDiscountTotal)}</span>
                </div>
            )}

            <div className="summary-row">
                <span>Net Toplam</span>
                <span>{formatCurrency(calc.netTotal)}</span>
            </div>

            <div className="summary-row">
                <div className="flex items-center gap-2">
                    <span>Genel İskonto</span>
                    <div className="flex items-center gap-1">
                        <select
                            className="form-control py-1 px-2 text-xs"
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
                <span className="text-error">-{formatCurrency(calc.globalDiscountAmount)}</span>
            </div>

            {Object.entries(calc.taxBreakdown).map(([rate, amount]) => (
                <div className="summary-row" key={rate}>
                    <span>KDV %{rate}</span>
                    <span>{formatCurrency(amount)}</span>
                </div>
            ))}

            <div className="summary-row">
                <span>Toplam KDV</span>
                <span>{formatCurrency(calc.taxTotal)}</span>
            </div>

            <div className="summary-row grand-total">
                <span>Genel Toplam</span>
                <span className="text-primary">{formatCurrency(calc.grandTotal)}</span>
            </div>
        </div>
    );
};

export default SummarySection;
