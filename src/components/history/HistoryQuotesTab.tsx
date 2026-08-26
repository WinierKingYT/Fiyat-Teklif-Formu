import { Clock, Eye, Trash, FileText, PlusCircle, Copy } from 'lucide-react';
import React from 'react';
import EmptyState from '@/components/EmptyState';
import { calculateQuoteTotals, formatCurrency } from '@/utils/calculations';
import type { DbQuote } from '@/context/quote/types';

interface HistoryQuotesTabProps {
    quotes: DbQuote[];
    searchTerm: string;
    selectedIds: Set<number>;
    selectAll: boolean;
    onToggleSelectAll: () => void;
    onToggleSelect: (id: number) => void;
    onLoadQuote: (quote: DbQuote) => void;
    onDuplicateQuote?: (quote: DbQuote, e: React.MouseEvent) => void;
    onDeleteQuote: (id: number, e: React.MouseEvent) => void;
    onNewQuote: () => void;
    t: (key: string) => string;
}

export const HistoryQuotesTab: React.FC<HistoryQuotesTabProps> = ({
    quotes,
    searchTerm,
    selectedIds,
    selectAll,
    onToggleSelectAll,
    onToggleSelect,
    onLoadQuote,
    onDuplicateQuote,
    onDeleteQuote,
    onNewQuote,
    t
}) => {
    if (quotes.length === 0) {
        return (
            <EmptyState
                icon={<FileText size={32} />}
                title={searchTerm ? t('noQuotesFound') : t('noSavedQuotes')}
                text={searchTerm ? t('tryDifferentSearch') : t('creatingNewQuote')}
                action={
                    !searchTerm && (
                        <button type="button" className="btn btn-primary" onClick={onNewQuote}>
                            <PlusCircle size={16} /> {t('createNewQuoteAction')}
                        </button>
                    )
                }
            />
        );
    }

    return (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)]">
                    <tr>
                        <th className="p-2.5 w-8">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={onToggleSelectAll}
                                className="form-checkbox"
                                aria-label={t('selectAll')}
                            />
                        </th>
                        <th className="p-2.5">{t('quoteDate')}</th>
                        <th className="p-2.5">{t('quoteNumber')}</th>
                        <th className="p-2.5">{t('customerLabel')}</th>
                        <th className="p-2.5 text-right">{t('amountQuote')}</th>
                        <th className="p-2.5 w-20 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/50">
                    {quotes.map((quote) => {
                        const quoteCurrency = quote.quoteData?.currency || 'TRY';
                        const quoteDiscount = quote.discount || (quote.discountRate ? { type: 'percentage' as const, value: quote.discountRate } : { type: 'percentage' as const, value: 0 });
                        const calc = calculateQuoteTotals(quote.items || [], quoteDiscount, { currency: quoteCurrency });
                        const isSelected = selectedIds.has(quote.id);
                        return (
                            <tr
                                key={quote.id}
                                className={`hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer ${isSelected ? 'bg-[var(--color-primary-muted)]' : ''}`}
                                onClick={() => onLoadQuote(quote)}
                            >
                                <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(quote.id)}
                                        className="form-checkbox"
                                        aria-label={t('selectItem')}
                                    />
                                </td>
                                <td className="p-2.5 text-[var(--color-text-muted)] whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '-'}
                                    </div>
                                </td>
                                <td className="p-2.5 font-mono font-semibold text-[var(--color-text)]">{quote.quoteData?.number || '-'}</td>
                                <td className="p-2.5">
                                    <div className="font-medium text-[var(--color-text)]">{quote.customerData?.company || quote.customerData?.name || '-'}</div>
                                    {quote.customerData?.company && quote.customerData?.name && (
                                        <div className="text-[10px] text-[var(--color-text-muted)]">{quote.customerData?.name}</div>
                                    )}
                                </td>
                                <td className="p-2.5 font-mono font-bold text-right text-[var(--color-text)]">{formatCurrency(calc.grandTotal, quoteCurrency)}</td>
                                <td className="p-2.5 text-right">
                                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className="btn btn-xs btn-outline p-1" title={t('viewLoad') || 'Yükle / Düzenle'} onClick={() => onLoadQuote(quote)}>
                                            <Eye size={13} />
                                        </button>
                                        {onDuplicateQuote && (
                                            <button type="button" className="btn btn-xs btn-outline p-1" title="Teklifi Klonla (Yeni Olarak Aç)" onClick={(e) => onDuplicateQuote(quote, e)}>
                                                <Copy size={13} />
                                            </button>
                                        )}
                                        <button type="button" className="btn btn-xs btn-danger p-1" title={t('deleteQuoteAction')} onClick={(e) => onDeleteQuote(quote.id, e)}>
                                            <Trash size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
