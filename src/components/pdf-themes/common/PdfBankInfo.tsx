import React from 'react';
import { formatIban } from '@/utils/themeHelpers';
import type { BankData } from '@/context/quote/types';

interface PdfBankInfoProps {
    bankData: BankData;
    t: Record<string, string>;
    className?: string;
}

export const PdfBankInfo: React.FC<PdfBankInfoProps> = ({ bankData, t, className }) => {
    if (!(bankData.bankName || bankData.iban)) return null;
    return (
        <div className={className || ''}>
            <div style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '7pt', marginBottom: '2px' }}>{t.bankInfo}</div>
            <div style={{ fontSize: '7.5pt', color: '#475569', lineHeight: '1.4' }}>
                {bankData.bankName && <div><strong>{bankData.bankName}</strong> {bankData.branch && <span>({bankData.branch})</span>}</div>}
                {bankData.iban && <div><span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a', letterSpacing: '0.02em' }}>{formatIban(bankData.iban)}</span></div>}
                {bankData.accountHolder && <div style={{ color: '#64748b', fontSize: '7.5pt' }}>{bankData.accountHolder}</div>}
            </div>
        </div>
    );
};
