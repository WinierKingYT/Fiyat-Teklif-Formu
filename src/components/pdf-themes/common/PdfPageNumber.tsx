import React from 'react';
import type { PdfConfig, QuoteData } from '@/context/quote/types';

interface PdfPageNumberProps {
    config: PdfConfig;
    quoteData: QuoteData;
    pageIndex: number;
    totalPages: number;
    t: Record<string, string>;
    className?: string;
}

export const PdfPageNumber: React.FC<PdfPageNumberProps> = ({ config, quoteData, pageIndex, totalPages, t, className }) => {
    if (config.showPageNumbers === false) return null;
    return (
        <div className={className || ''} style={{ marginTop: 'auto', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
            <span>{quoteData.number ? `#${quoteData.number}` : ''}</span>
            <span>{(t.page || 'Sayfa')} {pageIndex + 1} / {totalPages}</span>
        </div>
    );
};
