import React from 'react'; import { useState, useEffect, useMemo, useCallback } from 'react'; import Modal from './Modal'; import Pagination from './Pagination'; import ConfirmDialog from './ConfirmDialog'; import { Search, FileText, Trash, Eye, Clock, Save, PlusCircle, Trash2 } from 'lucide-react'; import { useIndexedDB } from '../hooks/useIndexedDB'; import { useQuoteData } from '../context/QuoteContext'; import useDebounce from '../hooks/useDebounce'; import Logger from '../utils/logger'; import { calculateQuoteTotals, formatCurrency } from '../utils/calculations'; import { toast } from 'react-hot-toast'; import Skeleton from './Skeleton'; import EmptyState from './EmptyState'; import { useTranslation } from '../hooks/useTranslation';

const SavedQuotesModal = ({ isOpen, onClose, onLoadQuote, onNewQuote, language = 'tr' }) => {
    const { t } = useTranslation(language);
    const { db, isReady } = useIndexedDB();
    const { saveQuote, currentQuoteId, setCurrentQuoteId } = useQuoteData();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    useEffect(() => {
        if (isOpen && isReady) loadQuotes();
    }, [isOpen, isReady]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const result = await (db).getAll('quotes');
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setQuotes(result);
        } catch (error) {
            Logger.error('Error loading quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: any, e?: any) => {
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
            setConfirmDialog({ isOpen: true, title: t('deleteSentQuote'), message: t('deleteSentQuoteConfirm'), onConfirm: () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); handleDelete(currentQuoteId as any); onClose(); onNewQuote(); }, variant: 'danger' });
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
        <Modal isOpen={isOpen} onClose={onClose} title={t('quoteActions')} size="xl">
            <div className="space-y-4 h-[70vh] flex flex-col">
                <div className="flex flex-wrap gap-2 p-3 bg-[var(--color-bg-muted)] rounded-[var(--radius)] border border-[var(--color-border)]">
                    <button type="button" className="btn btn-primary flex-1 py-3" onClick={handleSaveCurrent} title={t('saveCurrentQuote')}>
                        <Save size={20} className="mb-1 mx-auto block" />
                        <span className="text-sm font-medium">{t('saveQuoteAction')}</span>
                    </button>
                    <button type="button" className="btn btn-outline flex-1 py-3" onClick={handleNew} title={t('createNewQuote')}>
                        <PlusCircle size={20} className="mb-1 mx-auto block" />
                        <span className="text-sm font-medium">{t('newQuoteAction')}</span>
                    </button>
                    {currentQuoteId && (
                        <button type="button" className="btn btn-danger flex-1 py-3" onClick={handleDeleteCurrent} title={t('deleteCurrentQuote')}>
                            <Trash2 size={20} className="mb-1 mx-auto block" />
                            <span className="text-sm font-medium">{t('deleteQuoteAction')}</span>
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                    <input type="text" className="form-control pl-9" placeholder={t('searchQuotes')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden flex-1 flex flex-col">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            <Skeleton variant="row" count={4} />
                        </div>
                    ) : filteredQuotes.length === 0 ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <EmptyState
                                icon={<FileText size={32} />}
                                title={searchTerm ? t('noQuotesFound') : t('noSavedQuotes')}
                                text={searchTerm ? t('tryDifferentSearch') : t('startBySaving')}
                            />
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] sticky top-0 z-10">
                                    <tr>
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
                                        return (
                                            <tr key={quote.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                                <td className="p-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </td>
                                                <td className="p-3 font-medium text-[var(--color-text)]">{quote.quoteData?.number || '-'}</td>
                                                <td className="p-3">
                                                    <div className="font-medium text-[var(--color-text)]">{quote.customerData?.company}</div>
                                                    <div className="text-xs text-[var(--color-text-muted)]">{quote.customerData?.name}</div>
                                                </td>
                                                <td className="p-3 font-mono text-[var(--color-text)]">{formatCurrency(calc.grandTotal, quoteCurrency)}</td>
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button type="button" className="btn btn-sm btn-outline p-1" title={t('viewLoad')} onClick={() => { onLoadQuote(quote); onClose(); }}>
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
            </div>
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </Modal>
    );
};

export default SavedQuotesModal;
