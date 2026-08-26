import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
    HistoryToolbar,
    HistoryBatchBar,
    HistoryQuotesTab,
    HistoryVersionsTab
} from '@/components/history';
import { useHistoryData } from '@/components/history/useHistoryData';
import { HISTORY_PAGE_SIZE, useHistoryFilters } from '@/components/history/useHistoryFilters';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import { useQuoteData } from '@/context/QuoteContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateQuoteTotals, formatCurrency } from '@/utils/calculations';
import { exportQuoteToExcel, exportQuoteToCSV } from '@/utils/excelExporter';
import Logger from '@/utils/logger';
import { escapeHtml } from '@/utils/sanitize';
import type { DbQuote, QuoteVersion } from '@/context/quote/types';

interface HistoryListProps {
    onNavigate: (view: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onNavigate }) => {
    const { db, isReady } = useIndexedDB();
    const { currentQuoteId, setCurrentQuoteId, loadQuote, revertToVersion, quoteData } = useQuoteData();
    const { t } = useTranslation(quoteData?.language);

    const [activeTab, setActiveTab] = useState<'quotes' | 'versions'>('quotes');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'info' | 'warning' | 'danger';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'danger' });
    const { quotes, versions, loading, loadData } = useHistoryData({ db, isReady, t });
    const {
        searchTerm, setSearchTerm, page, setPage, filteredQuotes, filteredVersions,
        paginatedQuotes, paginatedVersions, totalPages, debouncedSearch,
    } = useHistoryFilters({ quotes, versions, activeTab });

    const handleDelete = async (idOrIds: number | number[], e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
        if (ids.length === 0) return;

        setConfirmDialog({
            isOpen: true,
            title: t('deleteQuoteAction'),
            message: ids.length === 1
                ? t('deleteQuoteConfirm')
                : t('deleteMultipleQuotesConfirm').replace('{count}', String(ids.length)),
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
            title: t('deleteVersion') || 'Sürümü Sil',
            message: t('deleteVersionConfirm') || 'Bu teklif sürümünü silmek istediğinize emin misiniz?',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await db.delete('quoteVersions', versionId);
                    toast.success(t('versionDeleted') || 'Sürüm silindi');
                    loadData();
                } catch (error) {
                    Logger.error('Error deleting version:', error);
                    toast.error(t('versionDeleteError') || 'Sürüm silinemedi');
                }
            },
            variant: 'danger'
        });
    };

    const handleRevertVersion = (version: QuoteVersion, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const dateStr = new Date(version.createdAt).toLocaleString();
        const targetName = String(escapeHtml(version.versionName || dateStr) || '');
        const confirmMsg = (t('revertVersionConfirm') || '"{name}" tarihli sürüme geri dönmek istiyor musunuz? Mevcut açık teklif formu bu sürümün verileriyle güncellenecektir.').replace('{name}', targetName);
        setConfirmDialog({
            isOpen: true,
            title: t('revertVersionTitle') || 'Sürüme Geri Dön',
            message: confirmMsg,
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
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(version, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `surum_${version.versionName || version.versionId}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            toast.success(t('packageDownloaded') || 'Sürüm yedeği (JSON) indirildi');
        } catch (error) {
            Logger.error('Export version package error:', error);
            toast.error(t('packageError') || 'Paket oluşturulamadı');
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

    const handleDuplicateQuote = (quote: DbQuote, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const duplicated: DbQuote = {
                ...quote,
                id: Date.now(),
                quoteData: {
                    ...quote.quoteData,
                    title: quote.quoteData?.title ? `${quote.quoteData.title} (Kopya)` : 'Kopya Teklif',
                    number: quote.quoteData?.number ? `${quote.quoteData.number}-REV` : `TK-${Date.now().toString().slice(-4)}`,
                    date: new Date().toISOString().slice(0, 10),
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            loadQuote(duplicated);
            setCurrentQuoteId(null);
            toast.success('Teklif klonlandı ve düzenleyiciye yüklendi');
            onNavigate('builder');
        } catch (error) {
            Logger.error('Error duplicating quote:', error);
            toast.error('Teklif klonlanamadı');
        }
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
                const quoteCurrency = quote.quoteData?.currency || 'TRY';
                const calc = calculateQuoteTotals(quote.items || [], quote.discount || {}, { currency: quoteCurrency });
                const win = window.open('', '_blank');
                if (!win) return;
                const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                    .map(s => s.outerHTML).join('\n');
                const rows = (quote.items || []).map(item =>
                    `<tr><td>${escapeHtml(item.name || '')}</td><td>${Number(item.quantity || 0)}</td><td>${escapeHtml(item.unit || '')}</td><td style="text-align:right">${formatCurrency(Number(item.price || 0), quoteCurrency)}</td><td style="text-align:right">${formatCurrency(Number(item.total ?? item.quantity * item.price), quoteCurrency)}</td></tr>`
                ).join('');
                win.document.write(`
                    <!DOCTYPE html><html><head><title>${escapeHtml(quote.quoteData?.title || 'Teklif')}</title>${styles}
                    <style>body{font-family:sans-serif;padding:10mm;color:#333}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}th{background:#f5f5f5}.total{font-weight:700;font-size:1.1em}</style>
                    </head><body>
                    <h1>${escapeHtml(quote.quoteData?.title || 'Fiyat Teklifi')}</h1>
                    <p><strong>${escapeHtml(t('quoteNumber'))}:</strong> ${escapeHtml(quote.quoteData?.number || '-')} | <strong>${escapeHtml(t('quoteDate'))}:</strong> ${escapeHtml(quote.quoteData?.date || '-')}</p>
                    <p><strong>${escapeHtml(t('customer'))}:</strong> ${escapeHtml(quote.customerData?.name || '-')} ${quote.customerData?.company ? `(${escapeHtml(quote.customerData.company)})` : ''}</p>
                    <hr/><table><thead><tr><th>${escapeHtml(t('itemsAndServices'))}</th><th>${escapeHtml(t('quantity'))}</th><th>${escapeHtml(t('unit'))}</th><th>${escapeHtml(t('unitPrice'))}</th><th>${escapeHtml(t('total'))}</th></tr></thead><tbody>${rows}</tbody></table>
                    <hr/><p class="total">${escapeHtml(t('grandTotal'))}: ${formatCurrency(calc.grandTotal, quoteCurrency)}</p>
                    <script>window.onload=function(){window.print();window.close()};<\/script>
                    </body></html>
                `);
                win.document.close();
            }, i * 500);
        });
        toast.success(t('printingQuotes').replace('{count}', String(selected.length)));
    };

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, [setPage]);

    useEffect(() => {
        setSelectedIds(new Set());
        setSelectAll(false);
    }, [debouncedSearch, activeTab]);

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-page)]">
            <HistoryToolbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                quotesCount={quotes.length}
                versionsCount={versions.length}
                onNavigateBack={() => onNavigate('builder')}
                onNewQuote={() => onNavigate('builder')}
                t={t}
            />

            {activeTab === 'quotes' && (
                <HistoryBatchBar
                    selectedCount={selectedIds.size}
                    onBatchExport={handleBatchExport}
                    onBatchPrint={handleBatchPrint}
                    onDeleteSelected={() => handleDelete([...selectedIds])}
                    t={t}
                />
            )}

            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="space-y-3 p-4">
                        <Skeleton variant="row" count={5} />
                    </div>
                ) : activeTab === 'quotes' ? (
                    <HistoryQuotesTab
                        quotes={paginatedQuotes}
                        searchTerm={searchTerm}
                        selectedIds={selectedIds}
                        selectAll={selectAll}
                        onToggleSelectAll={handleSelectAll}
                        onToggleSelect={toggleSelect}
                        onLoadQuote={handleLoad}
                        onDuplicateQuote={handleDuplicateQuote}
                        onDeleteQuote={handleDelete}
                        onNewQuote={() => onNavigate('builder')}
                        t={t}
                    />
                ) : (
                    <HistoryVersionsTab
                        versions={paginatedVersions}
                        onRevertVersion={handleRevertVersion}
                        onExportPackage={handleExportPackage}
                        onExportSnapshot={handleExportSnapshot}
                        onDeleteVersion={handleDeleteVersion}
                        t={t}
                    />
                )}

                {(activeTab === 'quotes' ? filteredQuotes.length : filteredVersions.length) > HISTORY_PAGE_SIZE && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={activeTab === 'quotes' ? filteredQuotes.length : filteredVersions.length}
                        pageSize={HISTORY_PAGE_SIZE}
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
