import React from 'react';
import { Landmark, CreditCard, User } from 'lucide-react';
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
        <div className="form-section">
            <div className="section-header flex justify-between items-center mb-4">
                <h3 className="section-title flex items-center gap-2 text-lg font-semibold">
                    <Landmark size={20} />
                    {t('bankInfo')}
                </h3>
                <div className="section-actions">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm flex items-center gap-1"
                        onClick={onOpenManager}
                    >
                        <Landmark size={14} /> {t('bankManagement')}
                    </button>
                </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label" htmlFor="bankName">{t('bankName')}</label>
                    <input
                        type="text"
                        className="form-control"
                        id="bankName"
                        name="bankName"
                        value={data.bankName || ''}
                        onChange={handleChange}
                        placeholder={t('bankName')}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="bankBranch">{t('branch')}</label>
                    <input
                        type="text"
                        className="form-control"
                        id="bankBranch"
                        name="branch"
                        value={data.branch || ''}
                        onChange={handleChange}
                        placeholder={t('branch')}
                    />
                </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-group">
                    <label className="form-label" htmlFor="accountNumber">
                        <CreditCard size={16} />
                        {t('accountNumber')}
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="accountNumber"
                        name="accountNumber"
                        value={data.accountNumber || ''}
                        onChange={handleChange}
                        placeholder={t('accountNumber')}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="iban">{t('iban')}</label>
                    <input
                        type="text"
                        className="form-control"
                        id="iban"
                        name="iban"
                        value={data.iban || ''}
                        onChange={handleChange}
                        placeholder={t('iban')}
                    />
                </div>
            </div>

            <div className="form-group mt-4">
                <label className="form-label" htmlFor="accountHolder">
                    <User size={16} />
                    {t('accountHolder')}
                </label>
                <input
                    type="text"
                    className="form-control"
                    id="accountHolder"
                    name="accountHolder"
                    value={data.accountHolder || ''}
                    onChange={handleChange}
                    placeholder={t('accountHolder')}
                />
            </div>
        </div>
    );
};

export default BankInfoForm;
