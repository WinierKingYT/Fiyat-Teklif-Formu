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
                <div className="form-group">
                    <label className="form-label" htmlFor="customerName">Müşteri Adı</label>
                    <input
                        type="text"
                        className="form-control"
                        id="customerName"
                        name="name"
                        value={data.name || ''}
                        onChange={handleChange}
                        placeholder="Müşteri adını girin"
                        autoComplete="name"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="customerCompany">Firma</label>
                    <input
                        type="text"
                        className="form-control"
                        id="customerCompany"
                        name="company"
                        value={data.company || ''}
                        onChange={handleChange}
                        placeholder="Firma adını girin"
                        autoComplete="organization"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="customerEmail">
                        <Mail size={16} />
                        E-posta
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        id="customerEmail"
                        name="email"
                        value={data.email || ''}
                        onChange={handleChange}
                        placeholder="E-posta adresini girin"
                        autoComplete="email"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="customerPhone">
                        <Phone size={16} />
                        Telefon
                    </label>
                    <input
                        type="tel"
                        className="form-control"
                        id="customerPhone"
                        name="phone"
                        value={data.phone || ''}
                        onChange={handleChange}
                        placeholder="Telefon numarasını girin"
                        autoComplete="tel"
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="customerAddress">
                    <MapPin size={16} />
                    Adres
                </label>
                <textarea
                    className="form-control"
                    id="customerAddress"
                    name="address"
                    value={data.address || ''}
                    onChange={handleChange}
                    placeholder="Adres bilgisini girin"
                    rows="2"
                    autoComplete="street-address"
                ></textarea>
            </div>
        </div>
    );
};

export default CustomerInfoForm;
