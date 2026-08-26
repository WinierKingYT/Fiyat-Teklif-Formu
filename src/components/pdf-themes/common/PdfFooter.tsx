import React from 'react';
import type { CompanyData, PdfConfig } from '@/context/quote/types';

interface PdfFooterProps {
    companyData: CompanyData;
    config: PdfConfig;
    t: Record<string, string>;
    className?: string;
}

export const PdfFooter: React.FC<PdfFooterProps> = ({ companyData, config, t, className }) => {
    const contactItems = [
        companyData.phone,
        companyData.email,
        companyData.website
    ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

    return (
        <div className={className || ''} style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #f1f5f9', textAlign: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '7.5pt', color: '#64748b' }}>
                {[
                    companyData.name ? <strong key="name" style={{ color: '#0f172a' }}>{companyData.name}</strong> : null,
                    ...contactItems.map((item, idx) => <span key={`item-${idx}`}>{item}</span>)
                ]
                    .filter(Boolean)
                    .reduce<React.ReactNode[]>((acc, elem, idx) => (idx === 0 ? [elem] : [...acc, <span key={`sep-${idx}`}>&bull;</span>, elem]), [])}
            </div>
            <div style={{ marginTop: '2px', fontSize: '7pt', color: '#94a3b8' }}>
                {t.thankYou} &bull; {t.regards}
            </div>
            {config.customFooter && <div style={{ fontSize: '6.5pt', color: '#94a3b8', marginTop: '2px' }}>{config.customFooter}</div>}
        </div>
    );
};
