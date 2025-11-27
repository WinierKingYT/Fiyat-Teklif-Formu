import React from 'react';
import { FileText, Truck, Shield, StickyNote } from 'lucide-react';

const TermsAndNotes = ({ data, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="form-section">
            <h3 className="section-title">
                <FileText size={20} />
                Koşul ve Notlar
            </h3>

            <div className="form-group">
                <label className="form-label" htmlFor="terms">
                    <FileText size={16} />
                    Ödeme Koşulları
                </label>
                <textarea
                    className="form-control"
                    id="terms"
                    name="terms"
                    value={data.terms || ''}
                    onChange={handleChange}
                    placeholder="Ödeme koşullarını girin"
                    rows="3"
                ></textarea>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="deliveryTerms">
                    <Truck size={16} />
                    Teslimat Koşulları
                </label>
                <textarea
                    className="form-control"
                    id="deliveryTerms"
                    name="deliveryTerms"
                    value={data.deliveryTerms || ''}
                    onChange={handleChange}
                    placeholder="Teslimat koşullarını girin"
                    rows="3"
                ></textarea>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="warrantyTerms">
                    <Shield size={16} />
                    Garanti Koşulları
                </label>
                <textarea
                    className="form-control"
                    id="warrantyTerms"
                    name="warrantyTerms"
                    value={data.warrantyTerms || ''}
                    onChange={handleChange}
                    placeholder="Garanti koşullarını girin"
                    rows="3"
                ></textarea>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="notes">
                    <StickyNote size={16} />
                    Ek Notlar
                </label>
                <textarea
                    className="form-control"
                    id="notes"
                    name="notes"
                    value={data.notes || ''}
                    onChange={handleChange}
                    placeholder="Ek notları girin"
                    rows="3"
                ></textarea>
            </div>
        </div>
    );
};

export default TermsAndNotes;
