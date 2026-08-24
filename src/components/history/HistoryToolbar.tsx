import { Search, PlusCircle, ArrowLeft, FileText, History } from 'lucide-react';
import React from 'react';

interface HistoryToolbarProps {
    activeTab: 'quotes' | 'versions';
    onTabChange: (tab: 'quotes' | 'versions') => void;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    quotesCount: number;
    versionsCount: number;
    onNavigateBack: () => void;
    onNewQuote: () => void;
    t: (key: string) => string;
}

export const HistoryToolbar: React.FC<HistoryToolbarProps> = ({
    activeTab,
    onTabChange,
    searchTerm,
    onSearchChange,
    quotesCount,
    versionsCount,
    onNavigateBack,
    onNewQuote,
    t
}) => {
    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onNavigateBack}
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
                        onClick={() => onTabChange('quotes')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'quotes' ? 'bg-[var(--color-bg-card)] text-[var(--color-info)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                    >
                        <FileText size={14} />
                        <span>Teklifler ({quotesCount})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange('versions')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'versions' ? 'bg-[var(--color-bg-card)] text-[var(--color-info)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
                    >
                        <History size={14} />
                        <span>Versiyonlar ({versionsCount})</span>
                    </button>
                </div>
            </div>

            {/* Sub-toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <button type="button" className="btn btn-primary flex items-center gap-2 px-4 py-2" onClick={onNewQuote}>
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
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">
                    {activeTab === 'quotes' ? `${quotesCount} ${t('quotesCount')}` : `${versionsCount} Kayıtlı Sürüm`}
                </span>
            </div>
        </>
    );
};
