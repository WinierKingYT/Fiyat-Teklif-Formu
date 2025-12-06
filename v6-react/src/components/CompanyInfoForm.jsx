import React, { useRef } from 'react';
import { Building, Mail, Phone, Globe, MapPin, Image, Upload, Trash, Save } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import { useQuote } from '../context/QuoteContext';
import toast from 'react-hot-toast';

const CompanyInfoForm = ({ data, onChange }) => {
    const fileInputRef = useRef(null);
    const { saveCompanyDefaults } = useQuote();

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onChange('logo', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearLogo = () => {
        onChange('logo', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSaveAsDefault = () => {
        saveCompanyDefaults(data);
    };

    return (
        <div className="form-section">
            <div className="flex justify-between items-center mb-4">
                <h3 className="section-title mb-0">
                    <Building size={20} />
                    Firma Bilgileri
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20"
                    onClick={handleSaveAsDefault}
                    title="Bu bilgileri varsayılan olarak kaydet"
                >
                    <Save size={14} /> Varsayılan Olarak Kaydet
                </button>
            </div>

            <div className="form-row">
                <div className="form-group floating-label-group">
                    <input
                        type="text"
                        className="form-control"
                        id="companyName"
                        name="name"
                        value={data.name || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="organization"
                    />
                    <label className="form-label" htmlFor="companyName">Firma Adı</label>
                </div>
                <div className="form-group floating-label-group">
                    <input
                        type="text"
                        className="form-control"
                        id="companyAuthorized"
                        name="authorized"
                        value={data.authorized || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="name"
                    />
                    <label className="form-label" htmlFor="companyAuthorized">Yetkili Satıcı</label>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group floating-label-group">
                    <input
                        type="tel"
                        className="form-control"
                        id="companyPhone"
                        name="phone"
                        value={data.phone || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="tel"
                    />
                    <label className="form-label" htmlFor="companyPhone">
                        <span className="flex items-center gap-1">
                            <Phone size={14} /> Telefon
                        </span>
                    </label>
                </div>
                <div className="form-group floating-label-group">
                    <input
                        type="email"
                        className="form-control"
                        id="companyEmail"
                        name="email"
                        value={data.email || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="email"
                    />
                    <label className="form-label" htmlFor="companyEmail">
                        <span className="flex items-center gap-1">
                            <Mail size={14} /> E-posta
                        </span>
                    </label>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group floating-label-group">
                    <input
                        type="url"
                        className="form-control"
                        id="companyWebsite"
                        name="website"
                        value={data.website || ''}
                        onChange={handleChange}
                        placeholder=" "
                        autoComplete="url"
                    />
                    <label className="form-label" htmlFor="companyWebsite">
                        <span className="flex items-center gap-1">
                            <Globe size={14} /> Web Sitesi
                        </span>
                    </label>
                </div>
            </div>

            <div className="form-group floating-label-group">
                <textarea
                    className="form-control"
                    id="companyAddress"
                    name="address"
                    value={data.address || ''}
                    onChange={handleChange}
                    placeholder=" "
                    rows="2"
                    autoComplete="street-address"
                ></textarea>
                <label className="form-label" htmlFor="companyAddress">
                    <span className="flex items-center gap-1">
                        <MapPin size={14} /> Adres
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Logo Upload */}
                <div className="form-group">
                    <label className="form-label">
                        <Image size={16} />
                        Logo
                    </label>
                    <div className="image-upload-container">
                        <div
                            className="logo-preview"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer', border: '2px dashed var(--border-color)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius)', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {data.logo ? (
                                <img src={data.logo} alt="Company Logo" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                            ) : (
                                <div className="logo-placeholder text-muted">
                                    <Image size={24} className="mx-auto mb-2" />
                                    <div>Logo Yükle</div>
                                </div>
                            )}
                        </div>
                        <div className="upload-actions mt-2 flex gap-2 justify-center">
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={14} /> Seç
                            </button>
                            {data.logo && (
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={clearLogo}
                                >
                                    <Trash size={14} /> Sil
                                </button>
                            )}
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                        title="Logo Yükle"
                    />
                </div>

                {/* Signature Upload/Draw */}
                <div className="form-group">
                    <label className="form-label">Satıcı İmzası</label>
                    <SignatureCanvas
                        savedSignature={data.signature}
                        onSave={(signatureData) => onChange('signature', signatureData)}
                        onClear={() => onChange('signature', null)}
                    />
                </div>

                {/* Stamp Upload */}
                <div className="form-group">
                    <label className="form-label">Firma Kaşesi</label>
                    <div className="image-upload-container">
                        <div
                            className="logo-preview"
                            onClick={() => document.getElementById('stampUpload').click()}
                            style={{ cursor: 'pointer', border: '2px dashed var(--border-color)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius)', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {data.stamp ? (
                                <img src={data.stamp} alt="Stamp" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                            ) : (
                                <div className="logo-placeholder text-muted">
                                    <Upload size={24} className="mx-auto mb-2" />
                                    <div>Kaşe Yükle</div>
                                </div>
                            )}
                        </div>
                        <div className="upload-actions mt-2 flex gap-2 justify-center">
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => document.getElementById('stampUpload').click()}
                            >
                                <Upload size={14} /> Seç
                            </button>
                            {data.stamp && (
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => onChange('stamp', null)}
                                >
                                    <Trash size={14} /> Sil
                                </button>
                            )}
                        </div>
                    </div>
                    <input
                        type="file"
                        id="stampUpload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => onChange('stamp', e.target.result);
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoForm;
