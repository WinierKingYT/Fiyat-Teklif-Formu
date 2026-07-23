import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
}

const Pagination = React.memo(({ currentPage, totalPages, totalItems, pageSize, onPageChange, showPageNumbers = true }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-b-[var(--radius)] text-sm">
            <span className="text-[var(--color-text-muted)]">
                {startItem}-{endItem} / {totalItems}
            </span>
            <div className="flex items-center gap-1">
                <button
                    className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-muted)]"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    aria-label="Önceki sayfa"
                >
                    <ChevronLeft size={16} />
                </button>
                {showPageNumbers && totalPages <= 7 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${page === currentPage
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    ))
                ) : showPageNumbers ? (
                    <>
                        {[1, 2, totalPages - 1, totalPages].filter((p, i, a) => a.indexOf(p) === i).map(page => (
                            <button
                                key={page}
                                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${page === currentPage
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                        {currentPage > 3 && currentPage < totalPages - 2 && (
                            <span className="px-1 text-[var(--color-text-muted)]">...</span>
                        )}
                    </>
                ) : null}
                <button
                    className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-muted)]"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    aria-label="Sonraki sayfa"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
});

Pagination.displayName = 'Pagination';
export default Pagination;
