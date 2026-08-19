import React from 'react'; import { useState, useEffect, useMemo, useCallback } from 'react'; import Pagination from './Pagination'; import ConfirmDialog from './ConfirmDialog'; import { Search, Clock, Trash, Trash2, Eye, PlusCircle, ArrowLeft, Download, CheckSquare, FileText } from 'lucide-react'; import { useIndexedDB } from '../hooks/useIndexedDB'; import { useQuoteData } from '../context/QuoteContext'; import useDebounce from '../hooks/useDebounce'; import Logger from '../utils/logger'; import { calculateQuoteTotals, formatCurrency } from '../utils/calculations'; import { exportQuoteToExcel, exportQuoteToCSV } from '../utils/excelExporter'; import { toast } from 'react-hot-toast'; import { useTranslation } from '../hooks/useTranslation'; import Skeleton from './Skeleton'; import EmptyState from './EmptyState'; import type { DbQuote } from '../context/quote/types';

const HistoryList = ({ onNavigate }) => {
    const { db, isReady } = useIndexedDB();
    const { currentQuoteId, setCurrentQuoteId, loadQuote, quoteData } = useQuoteData();
    const { t } = useTranslation(quoteData?.language);
    const [quotes, setQuotes] = useState<DbQuote[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    useEffect(() => {
        if (isReady) loadQuotes();
    }, [isReady]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const result = await (db).getAll<DbQuote>('quotes');
            result.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
            setQuotes(result);
        } catch (error) {
            Logger.error('Error loading quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number | number[], e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const isSingle = !Array.isArray(id);
        const ids = Array.isArray(id) ? id : [id];
        setConfirmDialog({ isOpen: true, title: isSingle ? t('deleteQuote') : t('deleteQuote'), message: isSingle ? t('deleteQuoteConfirm') : t('deleteQuotesConfirm').replace('{count}', String(ids.length)), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { for (const deleteId of ids) { const quoteToDelete = quotes.find(q => q.id === deleteId); if (quoteToDelete) { await (db).add('recycle_bin', { originalStore: 'quotes', originalId: deleteId, deletedAt: new Date().toISOString(), deletedBy: 'user', data: quoteToDelete }); } await (db).delete('quotes', deleteId); if (currentQuoteId === deleteId) setCurrentQuoteId(null); } toast.success(t('quotesMovedToBin').replace('{count}', String(ids.length))); setSelectedIds(new Set()); setSelectAll(false); loadQuotes(); } catch (error) { Logger.error('Error deleting quotes:', error); toast.error(t('deleteFailedQuote')); } }, variant: 'danger' });
    };

    const handleLoad = (quote: DbQuote) => {
        try {
            loadQuote(quote);
            onNavigate('builder');
        } catch (error) {
            Logger.error('Error loading quote:', error);
            toast.error(t('quoteLoadError'));
        }
    };

    const handleNewQuote = () => {
        onNavigate('builder');
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredQuotes.map(q => q.id)));
        }
        setSelectAll(!selectAll);
    };

    const handleBatchExport = (format) => {
        const selected = quotes.filter(q => selectedIds.has(q.id));
        if (selected.length === 0) return;
        selected.forEach((quote, i) => {
            setTimeout(() => {
                const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quote.quoteData?.currency || 'TRY' });
                const fullData = {
                    ...quote.quoteData,
                    customer: quote.customerData,
                    company: quote.companyData,
                    bankData: quote.bankData,
                    items: calc.items,
                    subTotal: calc.subtotal,
                    taxAmount: calc.taxTotal,
                    grandTotal: calc.grandTotal,
                    globalDiscountAmount: calc.globalDiscountAmount,
                    discount: quote.discount
                };
                if (format === 'excel') exportQuoteToExcel(fullData, calc.items);
                else exportQuoteToCSV(fullData, calc.items);
            }, i * 300);
        });
        toast.success(t('exportingQuotes').replace('{count}', String(selected.length)));
    };

    const handleBatchPrint = () => {
        const selected = quotes.filter(q => selectedIds.has(q.id));
        if (selected.length === 0) return;
        selected.forEach((quote, i) => {
            setTimeout(() => {
                const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quote.quoteData?.currency || 'TRY' });
                const win = window.open('', '_blank');
                if (!win) return;
                const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                    .map(s => s.outerHTML).join('\n');
                const rows = (quote.items || []).map(item =>
                    `<tr><td>${item.name || ''}</td><td>${item.quantity || 0}</td><td>${item.unit || ''}</td><td style="text-align:right">${Number(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td><td style="text-align:right">${Number(item.total ?? item.quantity * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td></tr>`
                ).join('');
                win.document.write(`
                    <!DOCTYPE html><html><head><title>${quote.quoteData?.title || 'Teklif'}</title>${styles}
                    <style>body{font-family:sans-serif;padding:10mm;color:#333}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}th{background:#f5f5f5}.total{font-weight:700;font-size:1.1em}</style>
                    </head><body>
                    <h1>${quote.quoteData?.title || 'Fiyat Teklifi'}</h1>
                    <p><strong>${t('quoteNumber')}:</strong> ${quote.quoteData?.number || '-'} | <strong>${t('quoteDate')}:</strong> ${quote.quoteData?.date || '-'}</p>
                    <p><strong>${t('customer')}:</strong> ${quote.customerData?.name || '-'} ${quote.customerData?.company ? `(${quote.customerData.company})` : ''}</p>
                    <hr/><table><thead><tr><th>${t('itemsAndServices')}</th><th>${t('quantity')}</th><th>${t('unit')}</th><th>${t('unitPrice')}</th><th>${t('total')}</th></tr></thead><tbody>${rows}</tbody></table>
                    <hr/><p class="total">${t('grandTotal')}: ${calc.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency: quote.quoteData?.currency || 'TRY' })}</p>
                    <script>window.onload=function(){window.print();window.close()};<\/script>
                    </body></html>
                `);
                win.document.close();
            }, i * 500);
        });
        toast.success(t('printingQuotes').replace('{count}', String(selected.length)));
    };

    const debouncedSearch = useDebounce(searchTerm, 250);
    const filteredQuotes = useMemo(() =>
        quotes.filter(q => {
            const qs = debouncedSearch.toLowerCase();
            return q.quoteData?.title?.toLowerCase().includes(qs) ||
                q.quoteData?.number?.toLowerCase().includes(qs) ||
                q.customerData?.name?.toLowerCase().includes(qs) ||
                q.customerData?.company?.toLowerCase().includes(qs);
        }),
        [quotes, debouncedSearch]
    );

    const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
    const paginatedQuotes = useMemo(() =>
        filteredQuotes.slice(0, page * PAGE_SIZE),
        [filteredQuotes, page]
    );

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-page)]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button type="button"
                    onClick={() => onNavigate('builder')}
                    className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    title={t('goBack')}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('myQuotesList')}</h2>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button type="button" className="btn btn-primary flex items-center gap-2 px-4 py-2" onClick={handleNewQuote}>
                    <PlusCircle size={18} />
                    <span>{t('newQuoteBtn')}</span>
                </button>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                    <input
                        type="text"
                        className="form-control pl-9 w-full"
                        placeholder={t('searchQuotes')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">{quotes.length} {t('quotesCount')}</span>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-primary-muted)] border-b border-[var(--color-border)]">
                    <CheckSquare size={18} className="text-[var(--color-info)]" />
                    <span className="text-sm font-medium text-[var(--color-text)]">{selectedIds.size} {t('selectedCount')}</span>
                    <div className="flex gap-2 ml-auto">
                        <button type="button"
                            onClick={() => handleBatchExport('excel')}
                            className="btn btn-sm btn-outline flex items-center gap-1.5"
                        >
                            <Download size={14} />
                            {t('exportToExcel')}
                        </button>
                        <button type="button"
                            onClick={() => handleBatchExport('csv')}
                            className="btn btn-sm btn-outline flex items-center gap-1.5"
                        >
                            <Download size={14} />
                            {t('exportToCSV')}
                        </button>
                        <button type="button"
                            onClick={handleBatchPrint}
                            className="btn btn-sm btn-outline flex items-center gap-1.5"
                        >
                            <FileText size={14} />
                            {t('printBtn')}
                        </button>
                        <button type="button"
                            onClick={() => handleDelete([...selectedIds])}
                            className="btn btn-sm btn-danger flex items-center gap-1.5"
                        >
                            <Trash2 size={14} />
                            {t('deleteSelected')}
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="space-y-3 p-4">
                        <Skeleton variant="row" count={5} />
                    </div>
                ) : filteredQuotes.length === 0 ? (
                    <EmptyState
                        icon={<FileText size={32} />}
                        title={searchTerm ? t('noQuotesFound') : t('noSavedQuotes')}
                        text={searchTerm ? t('tryDifferentSearch') : t('creatingNewQuote')}
                        action={
                            !searchTerm && (
                                <button type="button" className="btn btn-primary" onClick={handleNewQuote}>
                                    <PlusCircle size={16} /> {t('createNewQuoteAction')}
                                </button>
                            )
                        }
                    />
                ) : (
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                                <tr>
                                    <th className="p-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            className="form-checkbox"
                                        />
                                    </th>
                                    <th className="p-3 font-medium">{t('quoteDate')}</th>
                                    <th className="p-3 font-medium">{t('quoteNumber')}</th>
                                    <th className="p-3 font-medium">{t('customerLabel')}</th>
                                    <th className="p-3 font-medium">{t('amountQuote')}</th>
                                    <th className="p-3 font-medium w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {paginatedQuotes.map((quote) => {
                                    const quoteCurrency = quote.quoteData?.currency || 'TRY';
                                    const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
                                    const isSelected = selectedIds.has(quote.id);
                                    return (
                                        <tr
                                            key={quote.id}
                                            className={`hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer ${isSelected ? 'bg-[var(--color-primary-muted)]' : ''}`}
                                            onClick={() => { if (!isSelected) handleLoad(quote); }}
                                        >
                                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(quote.id)}
                                                    className="form-checkbox"
                                                />
                                            </td>
                                            <td className="p-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('tr-TR') : '-'}
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-[var(--color-text)]">{quote.quoteData?.number || '-'}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-[var(--color-text)]">{quote.customerData?.company}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">{quote.customerData?.name}</div>
                                            </td>
                                            <td className="p-3 font-mono text-[var(--color-text)]">{formatCurrency(calc.grandTotal, quoteCurrency)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button type="button" className="btn btn-sm btn-outline p-1" title={t('viewLoad')} onClick={() => handleLoad(quote)}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-danger p-1" title={t('deleteQuoteAction')} onClick={(e) => handleDelete(quote.id, e)}>
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {filteredQuotes.length > PAGE_SIZE && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={filteredQuotes.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </div>
    );
};

export default HistoryList;
