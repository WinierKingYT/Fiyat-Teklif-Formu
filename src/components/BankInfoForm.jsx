import React from 'react';
import { Landmark, CreditCard, User, Building, Hash } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const BankInfoForm = ({ data = {}, onChange, onOpenManager }) => {
    const { quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                    <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" className="form-control pl-9" id="bankName" name="bankName" value={data.bankName || ''} onChange={handleChange} placeholder={t('bankName')} />
                </div>
                <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" className="form-control pl-9" id="bankBranch" name="branch" value={data.branch || ''} onChange={handleChange} placeholder={t('branch')} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                    <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" className="form-control pl-9" id="accountNumber" name="accountNumber" value={data.accountNumber || ''} onChange={handleChange} placeholder={t('accountNumber')} />
                </div>
                <div className="relative">
                    <Landmark size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" className="form-control pl-9" id="iban" name="iban" value={data.iban || ''} onChange={handleChange} placeholder={t('iban')} />
                </div>
            </div>
            <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                <input type="text" className="form-control pl-9" id="accountHolder" name="accountHolder" value={data.accountHolder || ''} onChange={handleChange} placeholder={t('accountHolder')} />
            </div>
        </div>
    );
};

export default BankInfoForm;