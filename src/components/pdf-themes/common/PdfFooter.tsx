import React from 'react';
import type { CompanyData, PdfConfig } from '@/context/quote/types';

interface PdfFooterProps {
    companyData: CompanyData;
    config: PdfConfig;
    t: Record<string, string>;
    className?: string;
}

export const PdfFooter: React.FC<PdfFooterProps> = ({ companyData, config, t, className }) => (
    <div className={className || ''} style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '7.5pt', color: '#64748b' }}>
            {companyData.name && <span><strong style={{ color: '#0f172a' }}>{companyData.name}</strong></span>}
            {companyData.phone && <span>&bull; {companyData.phone}</span>}
            {companyData.email && <span>&bull; {companyData.email}</span>}
            {companyData.website && <span>&bull; {companyData.website}</span>}
        </div>
        <div style={{ marginTop: '2px', fontSize: '7pt', color: '#94a3b8' }}>
            {t.thankYou} &bull; {t.regards}
        </div>
        {config.customFooter && <div style={{ fontSize: '6.5pt', color: '#94a3b8', marginTop: '2px' }}>{config.customFooter}</div>}
    </div>
);
