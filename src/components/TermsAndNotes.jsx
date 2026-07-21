import React from 'react';
import { FileText, Truck, Shield, StickyNote } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const TermsAndNotes = ({ data, onChange }) => {
    const { quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="form-section">
            <h3 className="section-title">
                <FileText size={20} />
                {t('conditionsAndNotes')}
            </h3>

            <div className="form-group">
                <label className="form-label" htmlFor="terms">
                    <FileText size={16} />
                    {t('paymentTerms')}
                </label>
                <textarea
                    className="form-control"
                    id="terms"
                    name="terms"
                    value={data.terms || ''}
                    onChange={handleChange}
                    placeholder={t('paymentTerms')}
                    rows="3"
                ></textarea>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="deliveryTerms">
                    <Truck size={16} />
                    {t('deliveryTerms')}
                </label>
                <textarea
                    className="form-control"
                    id="deliveryTerms"
                    name="deliveryTerms"
                    value={data.deliveryTerms || ''}
                    onChange={handleChange}
                    placeholder={t('deliveryTerms')}
                    rows="3"
                ></textarea>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="warrantyTerms">
                    <Shield size={16} />
                    {t('warrantyTerms')}
                </label>
                <textarea
                    className="form-control"
                    id="warrantyTerms"
                    name="warrantyTerms"
                    value={data.warrantyTerms || ''}
                    onChange={handleChange}
                    placeholder={t('warrantyTerms')}
                    rows="3"
                ></textarea>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="notes">
                    <StickyNote size={16} />
                    {t('extraNotes')}
                </label>
                <textarea
                    className="form-control"
                    id="notes"
                    name="notes"
                    value={data.notes || ''}
                    onChange={handleChange}
                    placeholder={t('extraNotes')}
                    rows="3"
                ></textarea>
            </div>
        </div>
    );
};

export default TermsAndNotes;
