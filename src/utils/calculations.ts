/**
 * Unified financial calculation engine for quotes.
 *
 * Handles line-item discounts, global discounts (percentage/fixed),
 * proportional tax base reduction, and tax breakdown by rate.
 *
 * @param {Array} items - Array of quote items
 *   Each item: { quantity, price, taxRate, discountRate? }
 * @param {Object} discount - Global discount { type: 'percentage'|'fixed', value: number }
 * @param {Object} options
 * @param {string} [options.currency='TRY'] - Currency code
 * @returns {Object} - { items, subtotal, lineDiscountTotal, netTotal, globalDiscountAmount, taxableBase, taxBreakdown, taxTotal, grandTotal }
 */
export const calculateQuoteTotals = (items: any[] = [], discount: any = {}, options: any = {}) => {
    const currency = options.currency || 'TRY';

    // 1. Per-item calculations
    const calculatedItems = items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const taxRate = Number(item.taxRate) || 0;
        const lineDiscountRate = Math.min(Math.max(Number(item.discountRate) || 0, 0), 100);

        const grossTotal = quantity * price;
        const lineDiscount = grossTotal * (lineDiscountRate / 100);
        const netTotal = grossTotal - lineDiscount;
        const tax = netTotal * (taxRate / 100);

        return {
            ...item,
            quantity,
            price,
            taxRate,
            grossTotal,
            lineDiscount,
            netTotal,
            tax,
            lineDiscountRate
        };
    });

    // 2. Aggregate
    const subtotal = calculatedItems.reduce((sum, i) => sum + i.grossTotal, 0);
    const lineDiscountTotal = calculatedItems.reduce((sum, i) => sum + i.lineDiscount, 0);
    const netTotal = calculatedItems.reduce((sum, i) => sum + i.netTotal, 0);

    // 3. Global discount — applied to net total (after line discounts)
    let globalDiscountAmount = 0;
    let globalDiscountRatio = 0;

    if (netTotal > 0) {
        if (discount?.type === 'percentage') {
            globalDiscountAmount = netTotal * (Math.min(Math.max(Number(discount.value) || 0, 0), 100) / 100);
            globalDiscountRatio = globalDiscountAmount / netTotal;
        } else if (discount?.type === 'fixed') {
            globalDiscountAmount = Math.min(Math.max(Number(discount.value) || 0, 0), netTotal);
            globalDiscountRatio = globalDiscountAmount / netTotal;
        }
    }

    // 4. Apply global discount proportionally to each item's taxable base
    const taxBreakdown: any = {};
    let taxTotal = 0;

    calculatedItems.forEach(item => {
        const discountedNet = item.netTotal * (1 - globalDiscountRatio);
        const discountedTax = discountedNet * (item.taxRate / 100);

        taxTotal += discountedTax;

        if (item.taxRate > 0) {
            const rateKey = String(item.taxRate);
            taxBreakdown[rateKey] = (taxBreakdown[rateKey] || 0) + discountedTax;
        }
    });

    // Round tax breakdown values
    Object.keys(taxBreakdown).forEach(rate => {
        taxBreakdown[rate] = roundMoney(taxBreakdown[rate]);
    });
    taxTotal = roundMoney(taxTotal);

    const taxableBase = netTotal - globalDiscountAmount;
    const grandTotal = roundMoney(taxableBase + taxTotal);

    return {
        items: calculatedItems,
        subtotal: roundMoney(subtotal),
        lineDiscountTotal: roundMoney(lineDiscountTotal),
        netTotal: roundMoney(netTotal),
        globalDiscountAmount: roundMoney(globalDiscountAmount),
        taxableBase: roundMoney(taxableBase),
        taxBreakdown,
        taxTotal,
        grandTotal,
        currency
    };
};

/**
 * Round to 2 decimal places (kuruş/precise cent).
 */
function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a numeric amount to a currency string.
 */
export function formatCurrency(amount, currency = 'TRY') {
    const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
