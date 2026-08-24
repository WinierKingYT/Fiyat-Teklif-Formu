import React, { useMemo, useCallback } from 'react';
import { calculateQuoteTotals } from '@/utils/calculations';
import { numberToWords } from '@/utils/numberToWordsTurkish';
import { chunkQuoteItems } from '@/utils/themeHelpers';
import { PdfEditableField } from '../common';
import type { PdfThemeProps } from '@/context/quote/types';

export function usePdfTheme(props: PdfThemeProps) {
    const { activeLayout, items, config, total, quoteData, onEdit, t } = props;

    const layoutMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        (activeLayout || []).forEach((l) => { map[l.id] = l.enabled !== false; });
        return map;
    }, [activeLayout]);

    const showSection = useCallback((sectionId: string) => layoutMap[sectionId] !== false, [layoutMap]);

    const itemChunks = useMemo(() => {
        if (layoutMap['items'] === false) {
            return [[]];
        }
        const effectiveItemsPerPage = (config.itemsPerPage && config.itemsPerPage !== 14) ? config.itemsPerPage : 20;
        return chunkQuoteItems(items, {
            itemsPerPage: effectiveItemsPerPage,
            showSummary: config.showSummary,
            showBankInfo: config.showBankInfo,
            showSignatures: config.showSignatures,
            showTerms: config.showTerms,
            isLandscape: config.pageOrientation === 'landscape',
            margins: config.margins,
            tableRowHeight: typeof config.tableRowHeight === 'number' ? config.tableRowHeight : undefined
        });
    }, [items, config, layoutMap]);

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
        return numberToWords(total, quoteData.currency || 'TRY', quoteData.language || 'tr');
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
        vatBreakdown,
        amountInWords,
        renderEditable
    };
}
