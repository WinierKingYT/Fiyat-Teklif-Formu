import React from 'react';
import { FileText, Hash, Calendar, Clock, AlignLeft, DollarSign, Globe } from 'lucide-react';

const QuoteInfoForm = ({ data, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="form-section">
            <h3 className="section-title">
                <FileText size={20} />
                Teklif Bilgileri
            </h3>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="quoteTitle">
                        <Hash size={16} />
                        Teklif Başlığı
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="quoteTitle"
                        name="title"
                        value={data.title || ''}
                        onChange={handleChange}
                        placeholder="Teklif başlığını girin"
                        autoComplete="off"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="quoteNumber">
                        <Hash size={16} />
                        Teklif Numarası
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="quoteNumber"
                        name="number"
                        value={data.number || ''}
                        onChange={handleChange}
                        placeholder="Otomatik oluşturulacak"
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="quoteCurrency">
                        <DollarSign size={16} />
                        Para Birimi
                    </label>
                    <select
                        className="form-control form-select"
                        id="quoteCurrency"
                        name="currency"
                        value={data.currency || 'TRY'}
                        onChange={handleChange}
                    >
                        <option value="TRY">Türk Lirası (₺)</option>
                        <option value="USD">Amerikan Doları ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">Sterlin (£)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="quoteLanguage">
                        <Globe size={16} />
                        Dil
                    </label>
                    <select
                        className="form-control form-select"
                        id="quoteLanguage"
                        name="language"
                        value={data.language || 'tr'}
                        onChange={handleChange}
                    >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="quoteDate">
                        <Calendar size={16} />
                        Teklif Tarihi
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        id="quoteDate"
                        name="date"
                        value={data.date || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="validUntilDays">
                        <Clock size={16} />
                        Geçerlilik Süresi
                    </label>
                    <div className="flex gap-2">
                        <select
                            className="form-control form-select"
                            id="validUntilDays"
                            name="validUntilDays"
                            value={data.validUntilDays || '10'}
                            onChange={handleChange}
                        >
                            <option value="3">3 Gün</option>
                            <option value="5">5 Gün</option>
                            <option value="7">7 Gün</option>
                            <option value="10">10 Gün</option>
                            <option value="15">15 Gün</option>
                            <option value="30">30 Gün</option>
                            <option value="60">60 Gün</option>
                            <option value="90">90 Gün</option>
                        </select>
                        <input
                            type="date"
                            className="form-control"
                            id="validUntil"
                            name="validUntil"
                            value={data.validUntil || ''}
                            readOnly
                            aria-label="Geçerlilik Tarihi"
                        />
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="quoteDescription">
                    <AlignLeft size={16} />
                    Teklif Açıklaması
                </label>
                <textarea
                    className="form-control"
                    id="quoteDescription"
                    name="description"
                    value={data.description || ''}
                    onChange={handleChange}
                    placeholder="Teklif açıklamasını girin"
                    rows="3"
                    autoComplete="off"
                ></textarea>
            </div>
        </div>
    );
};

export default QuoteInfoForm;
