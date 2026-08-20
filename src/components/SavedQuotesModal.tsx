import { Search, FileText, Trash, Eye, Clock, Save, PlusCircle, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import { useQuoteData } from '@/context/QuoteContext';
import useDebounce from '@/hooks/useDebounce';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateQuoteTotals, formatCurrency } from '@/utils/calculations';
import Logger from '@/utils/logger';
import type { DbQuote, Quote } from '@/context/quote/types';

interface SavedQuotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadQuote: (quote: Quote) => void;
    onNewQuote: () => void;
    language?: string;
}

const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({ isOpen, onClose, onLoadQuote, onNewQuote, language = 'tr' }) => {
    const { t } = useTranslation(language);
    const { db, isReady } = useIndexedDB();
    const { saveQuote, currentQuoteId, setCurrentQuoteId } = useQuoteData();
    const [quotes, setQuotes] = useState<DbQuote[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    useEffect(() => {
        if (isOpen && isReady) loadQuotes();
    }, [isOpen, isReady]);

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

    const handleDelete = async (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setConfirmDialog({ isOpen: true, title: t('deleteQuote'), message: t('deleteQuoteConfirm'), onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); const quoteToDelete = quotes.find(q => q.id === id); try { if (quoteToDelete) { await (db).add('recycle_bin', { originalStore: 'quotes', originalId: id, deletedAt: new Date().toISOString(), deletedBy: 'user', data: quoteToDelete }); } await (db).delete('quotes', id); toast.success(t('quoteMovedToBin')); loadQuotes(); if (currentQuoteId === id) setCurrentQuoteId(null); } catch (error) { Logger.error('Error deleting quote:', error); toast.error(t('deleteFailedQuote')); } }, variant: 'danger' });
    };

    const handleSaveCurrent = async () => {
        await saveQuote();
        loadQuotes();
    };

    const handleNew = () => { onNewQuote(); onClose(); };

    const handleDeleteCurrent = () => {
        if (!currentQuoteId) return;
        const currentQuote = quotes.find(q => q.id === currentQuoteId);
        if (currentQuote && (currentQuote.status === 'sent' || currentQuote.status === 'accepted')) {
            setConfirmDialog({ isOpen: true, title: t('deleteSentQuote'), message: t('deleteSentQuoteConfirm'), onConfirm: () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); handleDelete(currentQuoteId!); onClose(); onNewQuote(); }, variant: 'danger' });
            return;
        }
        handleDelete(currentQuoteId);
        onClose();
        onNewQuote();
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
        filteredQuotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredQuotes, page]
    );

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('quoteActions')} size="lg">
            <div className="space-y-2.5 h-[65vh] flex flex-col">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                        <input type="text" className="form-control pl-8 text-xs" placeholder={t('searchQuotes')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-outline btn-xs whitespace-nowrap" onClick={handleSaveCurrent} title={t('saveCurrentQuote')}>
                        <Save size={13} /> Kaydet
                    </button>
                    <button type="button" className="btn btn-primary btn-xs whitespace-nowrap" onClick={handleNew} title={t('createNewQuote')}>
                        <PlusCircle size={13} /> Yeni Teklif
                    </button>
                </div>

                <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden flex-1 flex flex-col">
                    {loading ? (
                        <div className="p-4 space-y-2">
                            <Skeleton variant="row" count={4} />
                        </div>
                    ) : filteredQuotes.length === 0 ? (
                        <div className="flex items-center justify-center h-full p-6">
                            <EmptyState
                                icon={<FileText size={24} />}
                                title={searchTerm ? t('noQuotesFound') : t('noSavedQuotes')}
                                text={searchTerm ? t('tryDifferentSearch') : t('startBySaving')}
                            />
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] sticky top-0 z-10 font-semibold border-b border-[var(--color-border)]">
                                    <tr>
                                        <th className="p-2.5">{t('quoteDate')}</th>
                                        <th className="p-2.5">{t('quoteNumber')}</th>
                                        <th className="p-2.5">{t('customerLabel')}</th>
                                        <th className="p-2.5 text-right">{t('amountQuote')}</th>
                                        <th className="p-2.5 w-16 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]/50">
                                    {paginatedQuotes.map((quote) => {
                                        const quoteCurrency = quote.quoteData?.currency || 'TRY';
                                        const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
                                        return (
                                            <tr
                                                key={quote.id}
                                                onClick={() => { onLoadQuote(quote); onClose(); }}
                                                className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer group"
                                            >
                                                <td className="p-2.5 text-[var(--color-text-muted)] whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('tr-TR') : '-'}
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
                                                <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <button type="button" className="btn btn-xs btn-danger p-1" title={t('deleteQuoteAction')} onClick={(e) => handleDelete(quote.id, e)}>
                                                        <Trash size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
        </Modal>
    );
};

export default SavedQuotesModal;
