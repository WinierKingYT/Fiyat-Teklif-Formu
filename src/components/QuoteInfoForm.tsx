import React from 'react';
import { FileText, Hash, Calendar, Clock, AlignLeft, DollarSign, Globe } from 'lucide-react';

const QuoteInfoForm = ({ data, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" className="form-control pl-9" id="quoteTitle" name="title" value={data.title || ''} onChange={handleChange} placeholder="Teklif Başlığı" autoComplete="off" />
                </div>
                <div className="relative">
                    <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                    <input type="text" className="form-control pl-9" id="quoteNumber" name="number" value={data.number || ''} onChange={handleChange} placeholder="Teklif No (opsiyonel)" autoComplete="off" />
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