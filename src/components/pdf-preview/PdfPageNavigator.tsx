import React from 'react';

interface PdfPageNavigatorProps {
    pageCount: number;
    activePage: number;
    scrollToPage: (n: number) => void;
    t: (key: string) => string;
    thumbnailsRef: React.RefObject<HTMLDivElement | null>;
}

const PdfPageNavigator: React.FC<PdfPageNavigatorProps> = ({
    pageCount,
    activePage,
    scrollToPage,
    t,
    thumbnailsRef
}) => {
    if (pageCount <= 1) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)] flex-wrap">
            <button
                type="button"
                onClick={() => scrollToPage(Math.max(1, activePage - 1))}
                disabled={activePage <= 1}
                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                &lt; {t('previousPage')}
            </button>
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                {t('page')} {activePage} / {pageCount}
            </span>
            <button
                type="button"
                onClick={() => scrollToPage(Math.min(pageCount, activePage + 1))}
                disabled={activePage >= pageCount}
                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {t('nextPage')} &gt;
            </button>
            <div ref={thumbnailsRef} className="flex gap-1.5 overflow-x-auto custom-scrollbar py-0.5 ml-auto"></div>
        </div>
    );
};

export default PdfPageNavigator;
