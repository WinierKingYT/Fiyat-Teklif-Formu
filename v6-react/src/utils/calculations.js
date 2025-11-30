/**
 * Calculates the financial totals for a quote.
 * 
 * @param {Array} items - Array of quote items (price, quantity, taxRate, discountRate)
 * @param {Object} discount - Global discount object { type: 'percentage' | 'fixed', value: number }
 * @returns {Object} - { subtotal, totalTax, total, discountAmount, taxBreakdown }
 */
export const calculateQuoteTotals = (items = [], discount = {}) => {
    let subtotal = 0;
    let rawTotalTax = 0;
    const rawTaxBreakdown = {};

    // 1. Calculate Subtotal and Raw Tax (before global discount)
    items.forEach(item => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const itemTotal = quantity * price;

        // Handle line item discount if present (future proofing)
        // Currently the app might not fully support line-item discounts in the UI for calculation,
        // but if it did, it would be applied here. 
        // For now, we assume item.price is the effective price or we ignore line discounts 
        // if they aren't part of the core logic yet. 
        // Based on PrintableQuoteV2, it ignores item.discountRate for the main calc 
        // and only uses the global discount. We will stick to that for parity.

        subtotal += itemTotal;

        const taxRate = Number(item.taxRate) || 0;
        const tax = itemTotal * (taxRate / 100);
        rawTotalTax += tax;

        if (tax > 0) {
            rawTaxBreakdown[taxRate] = (rawTaxBreakdown[taxRate] || 0) + tax;
        }
    });

    // 2. Calculate Global Discount
    let discountAmount = 0;
    let discountRatio = 0;

    if (subtotal > 0) {
        if (discount?.type === 'percentage') {
            discountAmount = subtotal * ((Number(discount.value) || 0) / 100);
            discountRatio = (Number(discount.value) || 0) / 100;
        } else if (discount?.type === 'fixed') {
            discountAmount = Number(discount.value) || 0;
            discountRatio = discountAmount / subtotal;
        }
    }

    // Cap discount
    if (discountAmount > subtotal) {
        discountAmount = subtotal;
        discountRatio = 1;
    }

    // 3. Calculate Final Tax (reduced by discount ratio)
    // This assumes the discount is distributed proportionally across all items,
    // reducing their taxable base.
    const totalTax = rawTotalTax * (1 - discountRatio);

    const taxBreakdown = {};
    Object.keys(rawTaxBreakdown).forEach(rate => {
        taxBreakdown[rate] = rawTaxBreakdown[rate] * (1 - discountRatio);
    });

    // 4. Calculate Grand Total
    const total = subtotal - discountAmount + totalTax;

    return {
        subtotal,
        totalTax,
        total,
        discountAmount,
        taxBreakdown
    };
};
