import { CheckSquare, Download, FileText, Trash2 } from 'lucide-react';
import React from 'react';

interface HistoryBatchBarProps {
    selectedCount: number;
    onBatchExport: (format: 'excel' | 'csv') => void;
    onBatchPrint: () => void;
    onDeleteSelected: () => void;
    t: (key: string) => string;
}

export const HistoryBatchBar: React.FC<HistoryBatchBarProps> = ({
    selectedCount,
    onBatchExport,
    onBatchPrint,
    onDeleteSelected,
    t
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-primary-muted)] border-b border-[var(--color-border)]">
            <CheckSquare size={18} className="text-[var(--color-info)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">{selectedCount} {t('selectedCount')}</span>
            <div className="flex gap-2 ml-auto">
                <button
                    type="button"
                    onClick={() => onBatchExport('excel')}
                    className="btn btn-sm btn-outline flex items-center gap-1.5"
                >
                    <Download size={14} />
                    {t('exportToExcel')}
                </button>
                <button
                    type="button"
                    onClick={() => onBatchExport('csv')}
                    className="btn btn-sm btn-outline flex items-center gap-1.5"
                >
                    <Download size={14} />
                    {t('exportToCSV')}
                </button>
                <button
                    type="button"
                    onClick={onBatchPrint}
                    className="btn btn-sm btn-outline flex items-center gap-1.5"
                >
                    <FileText size={14} />
                    {t('printBtn')}
                </button>
                <button
                    type="button"
                    onClick={onDeleteSelected}
                    className="btn btn-sm btn-danger flex items-center gap-1.5"
                >
                    <Trash2 size={14} />
                    {t('deleteSelected')}
                </button>
            </div>
        </div>
    );
};
