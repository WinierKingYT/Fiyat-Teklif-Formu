import React from 'react'; import { useState, useEffect, useMemo } from 'react'; import ConfirmDialog from './ConfirmDialog'; import { Search, Clock, Trash, Trash2, Eye, PlusCircle, ArrowLeft, Download, CheckSquare, FileText } from 'lucide-react'; import { useIndexedDB } from '../hooks/useIndexedDB'; import { useQuote } from '../context/QuoteContext'; import useDebounce from '../hooks/useDebounce'; import Logger from '../utils/logger'; import { calculateQuoteTotals } from '../utils/calculations'; import { exportQuoteToExcel, exportQuoteToCSV } from '../utils/excelExporter'; import { toast } from 'react-hot-toast'; import { useTranslation } from '../hooks/useTranslation'; import Skeleton from './Skeleton'; import EmptyState from './EmptyState';

const HistoryList = ({ onNavigate }) => {
    const { db, isReady } = useIndexedDB();
    const { currentQuoteId, setCurrentQuoteId, loadQuote } = useQuote();
    const { t } = useTranslation();
    const [quotes, setQuotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });

    useEffect(() => {
        if (isReady) loadQuotes();
    }, [isReady]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const result = await (db as any).getAll('quotes');
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
        const isSingle = !Array.isArray(id);
        const ids = Array.isArray(id) ? id : [id];
        setConfirmDialog({ isOpen: true, title: isSingle ? 'Teklifi Sil' : 'Teklifleri Sil', message: isSingle ? 'Bu teklifi silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)' : `${ids.length} teklifi silmek istediğinize emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)`, onConfirm: async () => { setConfirmDialog({ ...confirmDialog, isOpen: false }); try { for (const deleteId of ids) { const quoteToDelete = quotes.find(q => q.id === deleteId); if (quoteToDelete) { await (db as any).add('recycle_bin', { originalStore: 'quotes', originalId: deleteId, deletedAt: new Date().toISOString(), deletedBy: 'user', data: quoteToDelete }); } await (db as any).delete('quotes', deleteId); if (currentQuoteId === deleteId) setCurrentQuoteId(null); } toast.success(`${ids.length} teklif geri dönüşüm kutusuna taşındı`); setSelectedIds(new Set()); setSelectAll(false); loadQuotes(); } catch (error) { Logger.error('Error deleting quotes:', error); toast.error('Silme işlemi başarısız'); } }, variant: 'danger' });
    };

    const handleLoad = (quote) => {
        try {
            loadQuote(quote);
            onNavigate('builder');
        } catch (error) {
            Logger.error('Error loading quote:', error);
            toast.error('Teklif yüklenirken hata oluştu');
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
        toast.success(`${selected.length} teklif dışa aktarılıyor...`);
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

    const formatCurrency = (amount, currency = 'TRY') => {
        const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-page)]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button
                    onClick={() => onNavigate('builder')}
                    className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    title="Geri Dön"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Tekliflerim</h2>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button className="btn btn-primary flex items-center gap-2 px-4 py-2" onClick={handleNewQuote}>
                    <PlusCircle size={18} />
                    <span>Yeni Teklif</span>
                </button>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                    <input
                        type="text"
                        className="form-control pl-9 w-full"
                        placeholder="Teklif no, başlık veya müşteri ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">{quotes.length} teklif</span>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-primary-muted)] border-b border-[var(--color-border)]">
                    <CheckSquare size={18} className="text-[var(--color-info)]" />
                    <span className="text-sm font-medium text-[var(--color-text)]">{selectedIds.size} seçili</span>
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => handleBatchExport('excel')}
                            className="btn btn-sm btn-outline flex items-center gap-1.5"
                        >
                            <Download size={14} />
                            Excel'e Aktar
                        </button>
                        <button
                            onClick={() => handleBatchExport('csv')}
                            className="btn btn-sm btn-outline flex items-center gap-1.5"
                        >
                            <Download size={14} />
                            CSV'ye Aktar
                        </button>
                        <button
                            onClick={() => handleDelete([...selectedIds] as any)}
                            className="btn btn-sm btn-danger flex items-center gap-1.5"
                        >
                            <Trash2 size={14} />
                            Seçilenleri Sil
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
                        title={searchTerm ? 'Sonuç bulunamadı' : 'Henüz kayıtlı teklif yok'}
                        text={searchTerm ? 'Farklı bir arama terimi deneyin.' : 'Yeni bir teklif oluşturarak başlayın.'}
                        action={
                            !searchTerm && (
                                <button className="btn btn-primary" onClick={handleNewQuote}>
                                    <PlusCircle size={16} /> Yeni Teklif Oluştur
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
                                    <th className="p-3 font-medium">Tarih</th>
                                    <th className="p-3 font-medium">Teklif No</th>
                                    <th className="p-3 font-medium">Müşteri</th>
                                    <th className="p-3 font-medium">Tutar</th>
                                    <th className="p-3 font-medium w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {filteredQuotes.map((quote) => {
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
                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button className="btn btn-sm btn-outline p-1" title="Görüntüle/Yükle" onClick={() => handleLoad(quote)}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="btn btn-sm btn-danger p-1" title="Sil" onClick={(e) => handleDelete(quote.id, e)}>
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
            </div>

            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} variant={confirmDialog.variant} />
        </div>
    );
};

export default HistoryList;
