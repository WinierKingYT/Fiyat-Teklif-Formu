import { Clock, History, RotateCcw, Package, Download, Trash, Tag } from 'lucide-react';
import React from 'react';
import EmptyState from '@/components/EmptyState';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateQuoteTotals, formatCurrency } from '@/utils/calculations';
import type { DbQuote, QuoteVersion } from '@/context/quote/types';

interface HistoryVersionsTabProps {
    versions: QuoteVersion[];
    onRevertVersion: (version: QuoteVersion, e: React.MouseEvent) => void;
    onExportPackage: (version: QuoteVersion, e: React.MouseEvent) => void;
    onExportSnapshot: (quote: DbQuote | undefined, format: 'excel' | 'csv') => void;
    onDeleteVersion: (versionId: string, e: React.MouseEvent) => void;
    t?: (key: string) => string;
}

export const HistoryVersionsTab: React.FC<HistoryVersionsTabProps> = ({
    versions,
    onRevertVersion,
    onExportPackage,
    onExportSnapshot,
    onDeleteVersion,
    t
}) => {
    const { t: defaultT } = useTranslation();
    const tr = t || defaultT;

    if (versions.length === 0) {
        return (
            <EmptyState
                icon={<History size={32} />}
                title={tr('noVersionsFound') || 'Kayıtlı Sürüm Yok'}
                text={tr('noVersionsDesc') || 'Teklifleriniz kaydedildikçe veya PDF önizleme ekranından sürüm oluşturdukça anlık görüntüler (snapshot) burada saklanır.'}
            />
        );
    }

    return (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                    <tr>
                        <th className="p-3 font-medium">{tr('versionDate') || 'Sürüm Tarihi'}</th>
                        <th className="p-3 font-medium">{tr('versionName') || 'Sürüm Adı'}</th>
                        <th className="p-3 font-medium">{tr('quoteNumber') || 'Teklif No'}</th>
                        <th className="p-3 font-medium">{tr('customer') || 'Müşteri'}</th>
                        <th className="p-3 font-medium">{tr('itemAndTotal') || 'Kalem / Toplam'}</th>
                        <th className="p-3 font-medium text-right">{tr('actions') || 'İşlemler'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {versions.map((version) => {
                        const snap = version.snapshot;
                        const quoteCurrency = snap?.quoteData?.currency || 'TRY';
                        const snapDiscount = snap?.discount || (snap?.discountRate ? { type: 'percentage' as const, value: snap.discountRate } : { type: 'percentage' as const, value: 0 });
                        const calc = calculateQuoteTotals(snap?.items || [], snapDiscount, { currency: quoteCurrency });
                        return (
                            <tr
                                key={version.versionId}
                                className="hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <td className="p-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-[var(--color-info)]" />
                                        <span>{new Date(version.createdAt).toLocaleString()}</span>
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
                                    <div className="text-xs text-[var(--color-text-muted)]">{(snap?.items || []).length} {tr('itemsCount') || 'kalem'}</div>
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary flex items-center gap-1 px-2.5 py-1 text-xs"
                                            title={tr('revertToVersion') || 'Bu Sürüme Geri Dön'}
                                            onClick={(e) => onRevertVersion(version, e)}
                                        >
                                            <RotateCcw size={13} />
                                            <span>{tr('revertToVersion') || 'Geri Dön'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline flex items-center gap-1 px-2 py-1 text-xs"
                                            title="ZIP"
                                            onClick={(e) => onExportPackage(version, e)}
                                        >
                                            <Package size={13} className="text-indigo-600 dark:text-indigo-400" />
                                            <span>{tr('versionPackageZip') || 'Paket (.zip)'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline p-1"
                                            title="CSV"
                                            onClick={() => onExportSnapshot(snap, 'csv')}
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger p-1"
                                            title={tr('deleteVersion') || 'Sürümü Sil'}
                                            onClick={(e) => onDeleteVersion(version.versionId, e)}
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
    );
};
