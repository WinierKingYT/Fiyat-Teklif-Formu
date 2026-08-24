import React from 'react';
import type { QuoteData } from '@/context/quote/types';

interface PdfTermsListProps {
    quoteData: QuoteData;
    t: Record<string, string>;
    renderEditable: (value: unknown, fieldKey: string, type?: string, className?: string) => React.ReactNode;
    className?: string;
}

export const PdfTermsList: React.FC<PdfTermsListProps> = ({ quoteData, t, renderEditable, className }) => {
    if (!(quoteData.deliveryTerms || quoteData.warrantyTerms || quoteData.terms)) return null;
    return (
        <div className={className || ''} style={{ display: 'grid', gap: '3px', marginTop: '6px', fontSize: '7pt' }}>
            {quoteData.deliveryTerms && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 6px' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a', display: 'inline-block', marginRight: '4px' }}>{t.deliveryConditions || t.delivery || 'Teslimat'}:</span>
                    <span style={{ color: '#475569' }}>{renderEditable(quoteData.deliveryTerms, 'deliveryTerms', 'textarea')}</span>
                </div>
            )}
            {quoteData.warrantyTerms && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 6px' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a', display: 'inline-block', marginRight: '4px' }}>{t.warrantyConditions || t.warranty || 'Garanti'}:</span>
                    <span style={{ color: '#475569' }}>{renderEditable(quoteData.warrantyTerms, 'warrantyTerms', 'textarea')}</span>
                </div>
            )}
            {quoteData.terms && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 6px' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a', display: 'inline-block', marginRight: '4px' }}>{t.terms || 'Şartlar'}:</span>
                    <span style={{ color: '#475569' }}>{renderEditable(quoteData.terms, 'terms', 'textarea')}</span>
                </div>
            )}
        </div>
    );
};
