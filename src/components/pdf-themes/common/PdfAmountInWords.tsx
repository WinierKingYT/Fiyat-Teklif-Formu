import React from 'react';

interface PdfAmountInWordsProps {
    amountInWords: string;
    t: Record<string, string>;
    className?: string;
}

export const PdfAmountInWords: React.FC<PdfAmountInWordsProps> = ({ amountInWords, t, className }) => {
    if (!amountInWords) return null;
    return (
        <div className={className || ''}>
            <span style={{ fontWeight: '700', color: '#64748b', fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.02em', marginRight: '4px' }}>{t.amountInWordsLabel || 'Yazı ile'}:</span>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>{amountInWords}</span>
        </div>
    );
};
