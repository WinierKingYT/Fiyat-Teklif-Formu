import { Search, Clock, Trash, Trash2, Eye, PlusCircle, ArrowLeft, Download, CheckSquare, FileText, History, RotateCcw, Tag, Package } from 'lucide-react';
import React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import { useQuoteData } from '@/context/QuoteContext';
import useDebounce from '@/hooks/useDebounce';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateQuoteTotals, formatCurrency } from '@/utils/calculations';
import { exportQuoteToExcel, exportQuoteToCSV } from '@/utils/excelExporter';
import { exportVersionPackage } from '@/utils/exportVersionPackage';
import Logger from '@/utils/logger';
import type { DbQuote, QuoteVersion } from '@/context/quote/types';

interface HistoryListProps {
    onNavigate: (view: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onNavigate }) => {
    const { db, isReady } = useIndexedDB();
    const { currentQuoteId, setCurrentQuoteId, loadQuote, revertToVersion, quoteData } = useQuoteData();
    const { t } = useTranslation(quoteData?.language);
    
    const [activeTab, setActiveTab] = useState<'quotes' | 'versions'>('quotes');
    const [quotes, setQuotes] = useState<DbQuote[]>([]);
    const [versions, setVersions] = useState<QuoteVersion[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [quotesRes, versionsRes] = await Promise.all([
                db.getAll<DbQuote>('quotes'),
                db.getAll<QuoteVersion>('quoteVersions')
            ]);
            quotesRes.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
            versionsRes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setQuotes(quotesRes);
            setVersions(versionsRes);
        } catch (error) {
            Logger.error('Error loading history data:', error);
        } finally {
            setLoading(false);
        }
    }, [db]);

    useEffect(() => {
        if (isReady) loadData();
    }, [isReady, loadData]);

    const handleDelete = async (id: number | number[], e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const isSingle = !Array.isArray(id);
        const ids = Array.isArray(id) ? id : [id];
        setConfirmDialog({
            isOpen: true,
            title: t('deleteQuote'),
            message: isSingle ? t('deleteQuoteConfirm') : t('deleteQuotesConfirm').replace('{count}', String(ids.length)),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    for (const deleteId of ids) {
                        const quoteToDelete = quotes.find(q => q.id === deleteId);
                        if (quoteToDelete) {
                            await db.add('recycle_bin', {
                                originalStore: 'quotes',
                                originalId: deleteId,
                                deletedAt: new Date().toISOString(),
                                deletedBy: 'user',
                                data: quoteToDelete
                            });
                        }
                        await db.delete('quotes', deleteId);
                        if (currentQuoteId === deleteId) setCurrentQuoteId(null);
                    }
                    toast.success(t('quotesMovedToBin').replace('{count}', String(ids.length)));
                    setSelectedIds(new Set());
                    setSelectAll(false);
                    loadData();
                } catch (error) {
                    Logger.error('Error deleting quotes:', error);
                    toast.error(t('deleteFailedQuote'));
                }
            },
            variant: 'danger'
        });
    };

    const handleDeleteVersion = async (versionId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: 'Sürümü Sil',
            message: 'Bu teklif sürümünü silmek istediğinize emin misiniz?',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await db.delete('quoteVersions', versionId);
                    toast.success('Sürüm silindi');
                    loadData();
                } catch (error) {
                    Logger.error('Error deleting version:', error);
                    toast.error('Sürüm silinemedi');
                }
            },
            variant: 'danger'
        });
    };

    const handleRevertVersion = (version: QuoteVersion, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const dateStr = new Date(version.createdAt).toLocaleString('tr-TR');
        setConfirmDialog({
            isOpen: true,
            title: 'Sürüme Geri Dön',
            message: `"${version.versionName || dateStr}" tarihli sürüme geri dönmek istiyor musunuz? Mevcut açık teklif formu bu sürümün verileriyle güncellenecektir.`,
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await revertToVersion(version.versionId);
                    onNavigate('builder');
                } catch (error) {
                    Logger.error('Error reverting version:', error);
                }
            },
            variant: 'info'
        });
    };

    const handleExportPackage = async (version: QuoteVersion, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            toast.loading('Sürüm paketi hazırlanıyor...', { id: 'export-pkg' });
            await exportVersionPackage(version);
            toast.success('Sürüm paketi (ZIP) indirildi', { id: 'export-pkg' });
        } catch (error) {
            Logger.error('Export version package error:', error);
            toast.error('Paket oluşturulamadı', { id: 'export-pkg' });
        }
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

    const toggleSelect = (id: number) => {
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

    const handleExportSnapshot = (quote: DbQuote | undefined, format: 'excel' | 'csv') => {
        if (!quote) return;
        const quoteCurrency = quote.quoteData?.currency || 'TRY';
        const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
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
    };

    const handleBatchExport = (format: 'excel' | 'csv') => {
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
            return (q.quoteData?.title?.toLowerCase().includes(qs) || false) ||
                (q.quoteData?.number?.toLowerCase().includes(qs) || false) ||
                (q.customerData?.name?.toLowerCase().includes(qs) || false) ||
                (q.customerData?.company?.toLowerCase().includes(qs) || false);
        }),
        [quotes, debouncedSearch]
    );

    const filteredVersions = useMemo(() =>
        versions.filter(v => {
            const qs = debouncedSearch.toLowerCase();
            const snap = v.snapshot;
            return (v.versionName?.toLowerCase().includes(qs) || false) ||
                (snap?.quoteData?.number?.toLowerCase().includes(qs) || false) ||
                (snap?.customerData?.name?.toLowerCase().includes(qs) || false) ||
                (snap?.customerData?.company?.toLowerCase().includes(qs) || false);
        }),
        [versions, debouncedSearch]
    );

    const totalPages = Math.max(1, Math.ceil(
        (activeTab === 'quotes' ? filteredQuotes.length : filteredVersions.length) / PAGE_SIZE
    ));

    const paginatedQuotes = useMemo(() =>
        filteredQuotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredQuotes, page]
    );

    const paginatedVersions = useMemo(() =>
        filteredVersions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredVersions, page]
    );

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    useEffect(() => {
        setPage(1);
        setSelectedIds(new Set());
        setSelectAll(false);
    }, [debouncedSearch, activeTab]);

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-page)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <div className="flex items-center gap-3">
                    <button type="button"
                        onClick={() => onNavigate('builder')}
                        className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title={t('goBack')}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('myQuotesList')}</h2>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-[var(--color-bg-muted)] p-1 rounded-lg border border-[var(--color-border)]">
                    <button
                        type="button"
                        onClick={() => setActiveTab('quotes')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'quotes' ? 'bg-[var(--color-bg-card)] text-[var(--color-info)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                    >
                        <FileText size={14} />
                        <span>Teklifler ({quotes.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('versions')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'versions' ? 'bg-[var(--color-bg-card)] text-[var(--color-info)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                    >
                        <History size={14} />
                        <span>Versiyonlar ({versions.length})</span>
                    </button>
                </div>
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
                        placeholder={activeTab === 'quotes' ? t('searchQuotes') : 'Versiyon veya teklif no ara...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">
                    {activeTab === 'quotes' ? `${quotes.length} ${t('quotesCount')}` : `${versions.length} Kayıtlı Sürüm`}
                </span>
            </div>

            {/* Batch Action Bar (Quotes tab only) */}
            {activeTab === 'quotes' && selectedIds.size > 0 && (
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
                ) : activeTab === 'quotes' ? (
                    /* QUOTES VIEW */
                    filteredQuotes.length === 0 ? (
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
                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden shadow-2xs">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)]">
                                    <tr>
                                        <th className="p-2.5 w-8">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="form-checkbox"
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
                                                <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(quote.id)}
                                                        className="form-checkbox"
                                                    />
                                                </td>
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
                                                <td className="p-2.5 text-right">
                                                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <button type="button" className="btn btn-xs btn-outline p-1" title={t('viewLoad')} onClick={() => handleLoad(quote)}>
                                                            <Eye size={13} />
                                                        </button>
                                                        <button type="button" className="btn btn-xs btn-danger p-1" title={t('deleteQuoteAction')} onClick={(e) => handleDelete(quote.id, e)}>
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
                    )
                ) : (
                    /* VERSIONS VIEW */
                    filteredVersions.length === 0 ? (
                        <EmptyState
                            icon={<History size={32} />}
                            title="Kayıtlı Sürüm Yok"
                            text="Teklifleriniz kaydedildikçe veya PDF önizleme ekranından sürüm oluşturdukça anlık görüntüler (snapshot) burada saklanır."
                        />
                    ) : (
                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                                    <tr>
                                        <th className="p-3 font-medium">Sürüm Tarihi</th>
                                        <th className="p-3 font-medium">Sürüm Adı</th>
                                        <th className="p-3 font-medium">Teklif No</th>
                                        <th className="p-3 font-medium">Müşteri</th>
                                        <th className="p-3 font-medium">Kalem / Toplam</th>
                                        <th className="p-3 font-medium text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {paginatedVersions.map((version) => {
                                        const snap = version.snapshot;
                                        const quoteCurrency = snap?.quoteData?.currency || 'TRY';
                                        const calc = calculateQuoteTotals(snap?.items || [], snap?.discount || {}, { currency: quoteCurrency });
                                        return (
                                            <tr
                                                key={version.versionId}
                                                className="hover:bg-[var(--color-bg-hover)] transition-colors"
                                            >
                                                <td className="p-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} className="text-[var(--color-info)]" />
                                                        <span>{new Date(version.createdAt).toLocaleString('tr-TR')}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                        <Tag size={11} />
                                                        {version.versionName || 'Snapshot'}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-mono font-medium text-[var(--color-text)]">
                                                    {snap?.quoteData?.number || '-'}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-[var(--color-text)]">{snap?.customerData?.company || snap?.customerData?.name || '-'}</div>
                                                    {snap?.customerData?.company && snap?.customerData?.name && (
                                                        <div className="text-xs text-[var(--color-text-muted)]">{snap.customerData.name}</div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-mono font-medium text-[var(--color-text)]">{formatCurrency(calc.grandTotal, quoteCurrency)}</div>
                                                    <div className="text-xs text-[var(--color-text-muted)]">{(snap?.items || []).length} kalem</div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary flex items-center gap-1 px-2.5 py-1 text-xs"
                                                            title="Bu Sürüme Geri Dön"
                                                            onClick={(e) => handleRevertVersion(version, e)}
                                                        >
                                                            <RotateCcw size={13} />
                                                            <span>Geri Dön</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline flex items-center gap-1 px-2 py-1 text-xs"
                                                            title="Sürüm Paketini İndir (ZIP: PDF/HTML + Excel + CSV + JSON)"
                                                            onClick={(e) => handleExportPackage(version, e)}
                                                        >
                                                            <Package size={13} className="text-indigo-600 dark:text-indigo-400" />
                                                            <span>Paket (.zip)</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline p-1"
                                                            title="CSV İndir"
                                                            onClick={() => handleExportSnapshot(snap, 'csv')}
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger p-1"
                                                            title="Sürümü Sil"
                                                            onClick={(e) => handleDeleteVersion(version.versionId, e)}
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Pagination */}
                {(activeTab === 'quotes' ? filteredQuotes.length : filteredVersions.length) > PAGE_SIZE && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={activeTab === 'quotes' ? filteredQuotes.length : filteredVersions.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                variant={confirmDialog.variant}
            />
        </div>
    );
};

export default HistoryList;
