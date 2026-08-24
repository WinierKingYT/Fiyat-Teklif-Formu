import { FileDown, FileSpreadsheet, FileText, Printer, Share2, BookmarkPlus, Settings2 } from 'lucide-react';
import React from 'react';

interface PdfPreviewHeaderProps {
    t: (key: string) => string;
    handleExcelExport: () => void;
    handleCsvExport: () => void;
    handlePrint: () => void;
    handleShare: () => void;
    setShowVersionModal: (show: boolean) => void;
    handleDownload: () => void;
    isGenerating: boolean;
    showControls: boolean;
    toggleControls: () => void;
}

const PdfPreviewHeader: React.FC<PdfPreviewHeaderProps> = ({
    t,
    handleExcelExport,
    handleCsvExport,
    handlePrint,
    handleShare,
    setShowVersionModal,
    handleDownload,
    isGenerating,
    showControls,
    toggleControls
}) => {
    return (
        <div className="px-3.5 py-2.5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-muted)]">
            <h3 className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-2">
                <FileDown size={16} className="text-[var(--color-info)]" />
                {t('livePreview')}
            </h3>
            <div className="flex items-center gap-1">
                <div className="flex items-center bg-[var(--color-bg-card)] rounded-lg p-0.5 border border-[var(--color-border)]">
                    <button type="button"
                        onClick={handleExcelExport}
                        className="p-1.5 text-[var(--color-success)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                        title={t('downloadExcel')}
                        aria-label={t('downloadExcel')}
                    >
                        <FileSpreadsheet size={15} />
                    </button>
                    <button type="button"
                        onClick={handleCsvExport}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                        title={t('downloadCSV')}
                        aria-label={t('downloadCSV')}
                    >
                        <FileText size={15} />
                    </button>
                    <button type="button"
                        onClick={handlePrint}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                        title={t('print')}
                        aria-label={t('print')}
                    >
                        <Printer size={15} />
                    </button>
                    <button type="button"
                        onClick={handleShare}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-info)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                        title={t('share')}
                        aria-label={t('share')}
                    >
                        <Share2 size={15} />
                    </button>
                </div>

                <button type="button"
                    onClick={() => setShowVersionModal(true)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-[var(--color-bg-hover)] rounded-lg border border-indigo-200 dark:border-indigo-800/40 transition-colors font-medium"
                    title={t('saveAsVersion') || 'Versiyon Olarak Kaydet'}
                    aria-label={t('saveAsVersion') || 'Versiyon Olarak Kaydet'}
                >
                    <BookmarkPlus size={14} />
                    <span className="hidden sm:inline">{t('version') || 'Sürüm'}</span>
                </button>

                <button type="button"
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-[var(--radius)] shadow-sm hover:shadow transition-all text-xs font-semibold ${isGenerating ? 'bg-[var(--color-text-muted)] cursor-not-allowed' : 'bg-[var(--color-info)] hover:opacity-95'}`}
                    title={t('downloadPdf')}
                    aria-label={t('downloadPdf')}
                >
                    {isGenerating ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    ) : (
                        <FileDown size={14} />
                    )}
                    <span>{isGenerating ? t('generating') : t('downloadPdf')}</span>
                </button>

                <button type="button"
                    onClick={toggleControls}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] transition-colors text-xs font-medium ${showControls ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
                    title={showControls ? (t('hideControls') || 'Ayarları Gizle') : (t('showControls') || 'Ayar Paneli')}
                >
                    <Settings2 size={15} />
                    <span className="hidden sm:inline">{showControls ? (t('hideControls') || 'Ayarları Gizle') : (t('showControls') || 'Ayar Paneli')}</span>
                </button>
            </div>
        </div>
    );
};

export default PdfPreviewHeader;
