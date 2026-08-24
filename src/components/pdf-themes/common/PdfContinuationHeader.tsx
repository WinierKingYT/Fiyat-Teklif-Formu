import React from 'react';
import type { CompanyData, PdfConfig } from '@/context/quote/types';

interface PdfContinuationHeaderProps {
    companyData: CompanyData;
    config: PdfConfig;
    t: Record<string, string>;
    className?: string;
}

export const PdfContinuationHeader: React.FC<PdfContinuationHeaderProps> = ({ companyData, config, t, className }) => (
    <div className={className || ''} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.25rem', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{companyData.name}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.continued}</div>
    </div>
);
