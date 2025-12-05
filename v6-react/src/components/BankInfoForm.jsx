import React, { useState } from 'react';
import { Landmark, CreditCard, User, Building } from 'lucide-react';

const BankInfoForm = ({ data = {}, onChange, onOpenManager }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    return (
        <div className="form-section">
            <div className="section-header flex justify-between items-center mb-4">
                <h3 className="section-title flex items-center gap-2 text-lg font-semibold">
                    <Landmark size={20} />
                    Banka Bilgileri
                </h3>
                <div className="section-actions">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm flex items-center gap-1"
                        onClick={onOpenManager}
                    >
                        <Landmark size={14} /> Banka Yönetimi
                    </button>
                </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label" htmlFor="bankName">Banka Adı</label>
                    <input
                        type="text"
                        className="form-control"
                        id="bankName"
                        name="bankName"
                        value={data.bankName || ''}
                        onChange={handleChange}
                        placeholder="Banka adını girin"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="bankBranch">Şube</label>
                    <input
                        type="text"
                        className="form-control"
                        id="bankBranch"
                        name="branch"
                        value={data.branch || ''}
                        onChange={handleChange}
                        placeholder="Şube adını girin"
                    />
                </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-group">
                    <label className="form-label" htmlFor="accountNumber">
                        <CreditCard size={16} />
                        Hesap Numarası
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="accountNumber"
                        name="accountNumber"
                        value={data.accountNumber || ''}
                        onChange={handleChange}
                        placeholder="Hesap numarasını girin"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="iban">IBAN</label>
                    <input
                        type="text"
                        className="form-control"
                        id="iban"
                        name="iban"
                        value={data.iban || ''}
                        onChange={handleChange}
                        placeholder="IBAN numarasını girin"
                    />
                </div>
            </div>

            <div className="form-group mt-4">
                <label className="form-label" htmlFor="accountHolder">
                    <User size={16} />
                    Hesap Sahibi
                </label>
                <input
                    type="text"
                    className="form-control"
                    id="accountHolder"
                    name="accountHolder"
                    value={data.accountHolder || ''}
                    onChange={handleChange}
                    placeholder="Hesap sahibi adını girin"
                />
            </div>
        </div>
    );
};

export default BankInfoForm;
