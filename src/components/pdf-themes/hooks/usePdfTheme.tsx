import { useMemo, useCallback } from 'react';
import { useMeasuredPagination } from '@/hooks/useMeasuredPagination';
import { calculateQuoteTotals } from '@/utils/calculations';
import { numberToWords } from '@/utils/numberToWordsTurkish';
import { hasValidItemContent, type DensitySource } from '@/utils/themeHelpers';
import { PdfEditableField } from '../common';
import type { PdfThemeProps } from '@/context/quote/types';

export function usePdfTheme(props: PdfThemeProps) {
    const { activeLayout, items, config, total, quoteData, onEdit, t } = props;

    const validItems = useMemo(() => (items || []).filter(hasValidItemContent), [items]);

    const layoutMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        (activeLayout || []).forEach((l) => { map[l.id] = l.enabled !== false; });
        return map;
    }, [activeLayout]);

    const showSection = useCallback((sectionId: string) => layoutMap[sectionId] !== false, [layoutMap]);

    const hasAnyImage = useMemo(() => validItems.some((item) => !!item.image), [validItems]);

    // Single canonical source for BOTH pagination measurement and rendering, so
    // row heights are measured against exactly the visibility/theme/density the
    // theme component actually renders.
    const densitySource = useMemo<DensitySource>(() => ({
        config: config as Record<string, unknown>,
        layout: activeLayout,
        bankData: props.bankData,
        quoteData,
        customerData: props.customerData,
    }), [config, activeLayout, props.bankData, props.customerData, quoteData]);

    const { itemChunks, density, denseImage, effectiveRowHeight } = useMeasuredPagination(items, densitySource, props.id);

    const vatBreakdown = useMemo(() => {
        const calc = calculateQuoteTotals(items, props.discount, { currency: quoteData.currency, taxMode: quoteData.taxMode });
        const map: Record<string, { taxable: number; tax: number }> = {};
        const globalDiscountRatio = calc.netTotal > 0 ? Math.min(1.0, Math.max(0, calc.globalDiscountAmount / calc.netTotal)) : 0;
        const targetDiscountedSubtotal = Math.max(0, calc.netTotal - calc.globalDiscountAmount);

        let sumTaxable = 0;
        let maxRateKey = '';
        let maxTaxable = -1;

        calc.items.forEach((item) => {
            const rate = Number(item.taxRate || 0).toString();
            const discountedNet = item.netTotal * (1 - globalDiscountRatio);
            if (!map[rate]) {
                map[rate] = { taxable: 0, tax: 0 };
            }
            map[rate].taxable += discountedNet;
        });

        // Round taxable amounts and find largest bucket
        Object.entries(map).forEach(([rate, val]) => {
            val.taxable = Math.round(val.taxable * 100) / 100;
            sumTaxable += val.taxable;
            if (val.taxable > maxTaxable) {
                maxTaxable = val.taxable;
                maxRateKey = rate;
            }
        });

        // Distribute rounding remainder if any to the largest bucket
        const diff = Math.round((targetDiscountedSubtotal - sumTaxable) * 100) / 100;
        if (diff !== 0 && maxRateKey && map[maxRateKey]) {
            map[maxRateKey].taxable = Math.round((map[maxRateKey].taxable + diff) * 100) / 100;
        }

        Object.entries(calc.taxBreakdown).forEach(([rawRate, taxAmount]) => {
            const rate = Number(rawRate || 0).toString();
            if (!map[rate]) {
                map[rate] = { taxable: 0, tax: taxAmount };
            } else {
                map[rate].tax = taxAmount;
            }
        });

        return map;
    }, [items, props.discount, quoteData.currency, quoteData.taxMode]);

    const amountInWords = useMemo(() => {
        if (typeof total !== 'number' || !Number.isFinite(total) || isNaN(total)) return '';
        try {
            return numberToWords(total, quoteData.currency || 'TRY', quoteData.language || 'tr');
        } catch {
            return '';
        }
    }, [total, quoteData.currency, quoteData.language]);

    const renderEditable = useCallback((value: unknown, fieldKey: string, type = 'text', className = '') => {
        return (
            <PdfEditableField
                value={value}
                fieldKey={fieldKey}
                type={type}
                className={className}
                onEdit={onEdit}
                t={t}
            />
        );
    }, [onEdit, t]);

    return {
        layoutMap,
        showSection,
        itemChunks,
        density,
        denseImage,
        effectiveRowHeight,
        vatBreakdown,
        amountInWords,
        renderEditable,
        hasAnyImage
    };
}
