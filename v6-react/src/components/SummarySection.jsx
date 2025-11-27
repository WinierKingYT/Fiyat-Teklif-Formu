import React from 'react';

const SummarySection = ({ items, discount = { type: 'percentage', value: 0 }, onDiscountChange, currency = 'TRY' }) => {
    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            const discountRate = parseFloat(item.discountRate) || 0;

            const itemSubtotal = qty * price;
            const itemDiscount = itemSubtotal * (discountRate / 100);
            const itemTotal = itemSubtotal - itemDiscount;

            const taxAmount = itemTotal * ((parseFloat(item.taxRate) || 0) / 100);

            subtotal += itemTotal;
            totalTax += taxAmount;
        });

        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = subtotal * (discount.value / 100);
        } else {
            discountAmount = parseFloat(discount.value) || 0;
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount > subtotal) {
            discountAmount = subtotal;
        }

        const grandTotal = subtotal - discountAmount + totalTax;

        return { subtotal, totalTax, discountAmount, grandTotal };
    };

    const { subtotal, totalTax, discountAmount, grandTotal } = calculateTotals();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency }).format(amount);
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
                <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="summary-row">
                <div className="flex items-center gap-2">
                    <span>İskonto</span>
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
                            aria-label="İskonto Değeri"
                        />
                    </div>
                </div>
                <span className="text-error">-{formatCurrency(discountAmount)}</span>
            </div>

            <div className="summary-row">
                <span>Toplam KDV</span>
                <span>{formatCurrency(totalTax)}</span>
            </div>

            <div className="summary-row grand-total">
                <span>Genel Toplam</span>
                <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
        </div>
    );
};

export default SummarySection;
