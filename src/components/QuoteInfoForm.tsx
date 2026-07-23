import React, { useState } from 'react';
import { FileText, Hash, Calendar, Clock, AlignLeft, DollarSign, Globe } from 'lucide-react';
import FieldError from './FieldError';

const QuoteInfoForm = ({ data, onChange }) => {
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateField = (name, value) => {
        if (name === 'title' && !value) return 'Teklif başlığı zorunludur';
        if (name === 'number' && !value) return 'Teklif numarası zorunludur';
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (name, value) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const getFieldProps = (name, value, placeholder, extra = {}) => ({
        name,
        value: value || '',
        onChange: handleChange,
        onBlur: () => handleBlur(name, value || ''),
        placeholder,
        className: `form-control${errors[name] && touched[name] ? ' field-error' : ''}`,
        'aria-invalid': touched[name] && !!errors[name],
        ...extra,
    });

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" id="quoteTitle" {...getFieldProps('title', data.title, 'Teklif Başlığı', { autoComplete: 'off' })} />
                    <FieldError message={errors.title} show={touched.title && !!errors.title} />
                </div>
                <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" id="quoteNumber" {...getFieldProps('number', data.number, 'Teklif No (opsiyonel)', { autoComplete: 'off' })} />
                    <FieldError message={errors.number} show={touched.number && !!errors.number} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <select className="form-control pl-9" id="quoteCurrency" name="currency" value={data.currency || 'TRY'} onChange={handleChange}>
                        <option value="TRY">₺ TRY</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="GBP">£ GBP</option>
                        <option value="CHF">Fr CHF</option>
                        <option value="JPY">¥ JPY</option>
                    </select>
                </div>
                <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <select className="form-control pl-9" id="quoteLanguage" name="language" value={data.language || 'tr'} onChange={handleChange}>
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="date" className="form-control pl-9" id="quoteDate" name="date" value={data.date || ''} onChange={handleChange} />
                </div>
                <div className="relative">
                    <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <select className="form-control pl-9" id="validUntilDays" name="validUntilDays" value={data.validUntilDays || '10'} onChange={handleChange}>
                        <option value="3">3 Gün</option>
                        <option value="5">5 Gün</option>
                        <option value="7">7 Gün</option>
                        <option value="10">10 Gün</option>
                        <option value="15">15 Gün</option>
                        <option value="30">30 Gün</option>
                        <option value="60">60 Gün</option>
                        <option value="90">90 Gün</option>
                    </select>
                </div>
            </div>
            <div className="relative">
                <AlignLeft size={15} className="absolute left-3 top-3.5 text-[var(--color-text-muted)] pointer-events-none" />
                <textarea className="form-control pl-9" id="quoteDescription" name="description" value={data.description || ''} onChange={handleChange} placeholder="Teklif açıklaması" rows={3} autoComplete="off" />
            </div>
        </div>
    );
};

export default QuoteInfoForm;
