import React, { useRef } from 'react';
import { Building, Mail, Phone, Globe, MapPin, Image, Upload, Trash, Save } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

const CompanyInfoForm = ({ data, onChange }) => {
    const fileInputRef = useRef(null);
    const { saveCompanyDefaults, quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);

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
                    {t('companyInfo')}
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-1"
                    onClick={handleSaveAsDefault}
                    title={t('saveAsDefault')}
                >
                    <Save size={14} /> {t('saveAsDefault')}
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
                    <label className="form-label" htmlFor="companyName">{t('companyName')}</label>
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
                    <label className="form-label" htmlFor="companyAuthorized">{t('authorizedDealer')}</label>
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
                            <Phone size={14} /> {t('phone')}
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
                            <Mail size={14} /> {t('email')}
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
                            <Globe size={14} /> {t('website')}
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
                        <MapPin size={14} /> {t('address')}
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                    <label className="form-label">
                        <Image size={16} />
                        {t('logo')}
                    </label>
                    <div className="image-upload-container">
                        <div
                            className="logo-preview"
                            role="button"
                            tabIndex={0}
                            aria-label={t('uploadLogo') || 'Firma logosu yükle'}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                            style={{ cursor: 'pointer', border: '2px dashed var(--color-border)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius)', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {data.logo ? (
                                <img src={data.logo} alt="Company Logo" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                            ) : (
                                <div className="logo-placeholder text-muted">
                                    <Image size={24} className="mx-auto mb-2" />
                                    <div>{t('uploadLogo')}</div>
                                </div>
                            )}
                        </div>
                        <div className="upload-actions mt-2 flex gap-2 justify-center">
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={14} /> {t('select')}
                            </button>
                            {data.logo && (
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={clearLogo}
                                >
                                    <Trash size={14} /> {t('delete')}
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
                        title={t('uploadLogo')}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('signature')}</label>
                    <SignatureCanvas
                        savedSignature={data.signature}
                        onSave={(signatureData) => onChange('signature', signatureData)}
                        onClear={() => onChange('signature', null)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{t('stamp')}</label>
                    <div className="image-upload-container">
                        <div
                            className="logo-preview"
                            role="button"
                            tabIndex={0}
                            aria-label={t('uploadLogo') || 'Kaşe yükle'}
                            onClick={() => document.getElementById('stampUpload').click()}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('stampUpload').click(); } }}
                            style={{ cursor: 'pointer', border: '2px dashed var(--color-border)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius)', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {data.stamp ? (
                                <img src={data.stamp} alt="Stamp" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                            ) : (
                                <div className="logo-placeholder text-muted">
                                    <Upload size={24} className="mx-auto mb-2" />
                                    <div>{t('uploadLogo')}</div>
                                </div>
                            )}
                        </div>
                        <div className="upload-actions mt-2 flex gap-2 justify-center">
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => document.getElementById('stampUpload').click()}
                            >
                                <Upload size={14} /> {t('select')}
                            </button>
                            {data.stamp && (
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => onChange('stamp', null)}
                                >
                                    <Trash size={14} /> {t('delete')}
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
