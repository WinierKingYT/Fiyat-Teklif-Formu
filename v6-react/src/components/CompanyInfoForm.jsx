import React, { useRef } from 'react';
import { Building, Mail, Phone, Globe, MapPin, Image, Upload, Trash } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';

const CompanyInfoForm = ({ data, onChange }) => {
    const fileInputRef = useRef(null);

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

    return (
        <div className="form-section">
            <h3 className="section-title">
                <Building size={20} />
                Firma Bilgileri
            </h3>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="companyName">Firma Adı</label>
                    <input
                        type="text"
                        className="form-control"
                        id="companyName"
                        name="name"
                        value={data.name || ''}
                        onChange={handleChange}
                        placeholder="Firma adını girin"
                        autoComplete="organization"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="companyAuthorized">Yetkili Satıcı</label>
                    <input
                        type="text"
                        className="form-control"
                        id="companyAuthorized"
                        name="authorized"
                        value={data.authorized || ''}
                        onChange={handleChange}
                        placeholder="Yetkili satıcı adını girin"
                        autoComplete="name"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="companyPhone">
                        <Phone size={16} />
                        Telefon
                    </label>
                    <input
                        type="tel"
                        className="form-control"
                        id="companyPhone"
                        name="phone"
                        value={data.phone || ''}
                        onChange={handleChange}
                        placeholder="Telefon numarasını girin"
                        autoComplete="tel"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="companyEmail">
                        <Mail size={16} />
                        E-posta
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        id="companyEmail"
                        name="email"
                        value={data.email || ''}
                        onChange={handleChange}
                        placeholder="E-posta adresini girin"
                        autoComplete="email"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="companyWebsite">
                        <Globe size={16} />
                        Web Sitesi
                    </label>
                    <input
                        type="url"
                        className="form-control"
                        id="companyWebsite"
                        name="website"
                        value={data.website || ''}
                        onChange={handleChange}
                        placeholder="Web sitesi adresini girin"
                        autoComplete="url"
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="companyAddress">
                    <MapPin size={16} />
                    Adres
                </label>
                <textarea
                    className="form-control"
                    id="companyAddress"
                    name="address"
                    value={data.address || ''}
                    onChange={handleChange}
                    placeholder="Adres bilgisini girin"
                    rows="2"
                    autoComplete="street-address"
                ></textarea>
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
