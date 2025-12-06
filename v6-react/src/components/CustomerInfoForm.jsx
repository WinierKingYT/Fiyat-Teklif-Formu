import React from 'react';
import { User, Users, Mail, Phone, MapPin } from 'lucide-react';

const CustomerInfoForm = ({ data, onChange, onSelectCustomer }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <h3 className="section-title">
                    <User size={20} />
                    Müşteri Bilgileri
                </h3>
                <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onSelectCustomer}
                >
                    <Users size={16} />
                    Müşteri Seç
                </button>
            </div>

            <div className="form-row">
                <div className="form-group floating-label-group">
                    <input
                        type="text"
                        className="form-control"
                        id="customerName"
                        name="name"
                        value={data.name || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="name"
                    />
                    <label className="form-label" htmlFor="customerName">Müşteri Adı</label>
                </div>
                <div className="form-group floating-label-group">
                    <input
                        type="text"
                        className="form-control"
                        id="customerCompany"
                        name="company"
                        value={data.company || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="organization"
                    />
                    <label className="form-label" htmlFor="customerCompany">Firma</label>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group floating-label-group">
                    <input
                        type="email"
                        className="form-control"
                        id="customerEmail"
                        name="email"
                        value={data.email || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="email"
                    />
                    <label className="form-label" htmlFor="customerEmail">
                        <span className="flex items-center gap-1">
                            <Mail size={14} /> E-posta
                        </span>
                    </label>
                </div>
                <div className="form-group floating-label-group">
                    <input
                        type="tel"
                        className="form-control"
                        id="customerPhone"
                        name="phone"
                        value={data.phone || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="tel"
                    />
                    <label className="form-label" htmlFor="customerPhone">
                        <span className="flex items-center gap-1">
                            <Phone size={14} /> Telefon
                        </span>
                    </label>
                </div>
            </div>

            <div className="form-group floating-label-group">
                <textarea
                    className="form-control"
                    id="customerAddress"
                    name="address"
                    value={data.address || ''}
                    onChange={handleChange}
                    placeholder=" "
                    rows="2"
                    autoComplete="street-address"
                ></textarea>
                <label className="form-label" htmlFor="customerAddress">
                    <span className="flex items-center gap-1">
                        <MapPin size={14} /> Adres
                    </span>
                </label>
            </div>
        </div>
    );
};

export default CustomerInfoForm;
