import React from 'react';
import type { PdfConfig, CompanyData, CustomerData } from '@/context/quote/types';

interface PdfSignaturesProps {
    companyData: CompanyData;
    customerData: CustomerData;
    signature?: string | null;
    config: PdfConfig;
    t: Record<string, string>;
    className?: string;
}

export const PdfSignatures: React.FC<PdfSignaturesProps> = ({ companyData, customerData, signature, config, t, className }) => {
    if (!config.showSignatures) return null;
    const isSingle = !config.showCustomerSignature;
    return (
        <div className={className || ''} style={isSingle ? { display: 'flex', justifyContent: 'center' } : undefined}>
            <div className="signature-col seller-col" style={{ textAlign: 'center', width: isSingle ? '280px' : undefined }}>
                <div className="signature-header" style={{ fontSize: '7.5pt', fontWeight: 600 }}>
                    <span className="signature-company">{companyData.name || companyData.authorized || t.seller}</span>
                    {companyData.name && companyData.authorized && <span className="signature-authorized"> - {companyData.authorized}</span>}
                </div>
                <div className="signature-line" style={{ minHeight: '40px', borderBottom: '1px solid #cbd5e1', margin: '4px 0', display: 'flex', justifyContent: 'center' }}>
                    {(() => {
                        const effectiveSig = (signature === null || signature === '') ? null : (signature || companyData.signature);
                        return effectiveSig ? <img src={effectiveSig as string} alt={t.signature} style={{ maxHeight: '38px', maxWidth: '100px', objectFit: 'contain' }} /> : null;
                    })()}
                    {companyData.stamp && <img src={companyData.stamp as string} alt={t.companyStamp} style={{ maxHeight: '38px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85 }} />}
                </div>
                <div className="signature-label" style={{ fontSize: '6.5pt', color: '#64748b' }}>{t.seller} ({t.deliveredBy || 'Yetkili Kaşe / İmza'})</div>
            </div>
            {config.showCustomerSignature && (
                <div className="signature-col customer-col" style={{ textAlign: 'center' }}>
                    <div className="signature-header" style={{ fontSize: '7.5pt', fontWeight: 600 }}>
                        <span className="signature-company">{customerData.name || customerData.company || t.customer}</span>
                        <span className="signature-authorized"> - {t.customerApproval || 'Müşteri Onayı'}</span>
                    </div>
                    <div className="signature-line" style={{ minHeight: '40px', borderBottom: '1px solid #cbd5e1', margin: '4px 0' }}></div>
                    <div className="signature-label" style={{ fontSize: '6.5pt', color: '#64748b' }}>{t.customer} ({t.receivedBy || 'Teslim Alan'})</div>
                </div>
            )}
        </div>
    );
};
