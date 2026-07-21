import React, { useState, useRef } from 'react';
import { Building, Mail, Phone, Globe, MapPin, Image, Upload, Trash, Save, ChevronDown, ChevronUp } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

const CompanyInfoForm = ({ data, onChange }) => {
    const fileInputRef = useRef(null);
    const { saveCompanyDefaults, quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const [showDetails, setShowDetails] = useState(false);

    const isFilled = data?.name && (data?.phone || data?.email);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => onChange('logo', e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const clearLogo = () => {
        onChange('logo', null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveAsDefault = () => {
        saveCompanyDefaults(data);
        toast.success(t('saved'));
    };

    const uploadAreaStyle = {
        cursor: 'pointer',
        border: '2px dashed var(--color-border)',
        padding: '1rem',
        textAlign: 'center',
        borderRadius: 'var(--radius-md)',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.15s, background 0.15s',
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <Building size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="card-title">{t('companyInfo')}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isFilled && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDetails(!showDetails)}>
                            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            {showDetails ? 'Gizle' : 'Detay'}
                        </button>
                    )}
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleSaveAsDefault}>
                        <Save size={14} /> {t('saveAsDefault')}
                    </button>
                </div>
            </div>
            <div className="card-body space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" className="form-control" id="companyName" name="name" value={data.name || ''} onChange={handleChange} placeholder={t('companyName')} autoComplete="organization" />
                    <input type="text" className="form-control" id="companyAuthorized" name="authorized" value={data.authorized || ''} onChange={handleChange} placeholder={t('authorizedDealer')} autoComplete="name" />
                </div>

                {(!isFilled || showDetails) && (
                    <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                                <input type="tel" className="form-control pl-9" id="companyPhone" name="phone" value={data.phone || ''} onChange={handleChange} placeholder={t('phone')} autoComplete="tel" />
                            </div>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                                <input type="email" className="form-control pl-9" id="companyEmail" name="email" value={data.email || ''} onChange={handleChange} placeholder={t('email')} autoComplete="email" />
                            </div>
                        </div>
                        <div className="relative">
                            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                            <input type="url" className="form-control pl-9" id="companyWebsite" name="website" value={data.website || ''} onChange={handleChange} placeholder={t('website')} autoComplete="url" />
                        </div>
                        <div className="relative">
                            <MapPin size={15} className="absolute left-3 top-3.5 text-[var(--color-text-muted)] pointer-events-none" />
                            <textarea className="form-control pl-9" id="companyAddress" name="address" value={data.address || ''} onChange={handleChange} placeholder={t('address')} rows="2" autoComplete="street-address" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="form-label text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Image size={14} /> {t('logo')}
                                </label>
                                <div className="image-upload-container">
                                    <div
                                        className="logo-preview hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
                                        role="button" tabIndex={0}
                                        aria-label={t('uploadLogo') || 'Firma logosu yükle'}
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                        style={uploadAreaStyle}
                                    >
                                        {data.logo ? (
                                            <img src={data.logo} alt="Company Logo" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                                        ) : (
                                            <div className="text-center">
                                                <Image size={28} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                                                <div className="text-xs text-[var(--color-text-muted)]">{t('uploadLogo')}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 justify-center mt-2">
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={13} /> {t('select')}</button>
                                        {data.logo && <button type="button" className="btn btn-danger btn-sm" onClick={clearLogo}><Trash size={13} /> {t('delete')}</button>}
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} title={t('uploadLogo')} />
                            </div>

                            <div>
                                <label className="form-label text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Upload size={14} /> {t('signature')}
                                </label>
                                <SignatureCanvas
                                    savedSignature={data.signature}
                                    onSave={(signatureData) => onChange('signature', signatureData)}
                                    onClear={() => onChange('signature', null)}
                                />
                            </div>

                            <div>
                                <label className="form-label text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Upload size={14} /> {t('stamp')}
                                </label>
                                <div className="image-upload-container">
                                    <div
                                        className="logo-preview hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
                                        role="button" tabIndex={0}
                                        aria-label={t('uploadLogo') || 'Kaşe yükle'}
                                        onClick={() => document.getElementById('stampUpload').click()}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('stampUpload').click(); } }}
                                        style={uploadAreaStyle}
                                    >
                                        {data.stamp ? (
                                            <img src={data.stamp} alt="Stamp" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                                        ) : (
                                            <div className="text-center">
                                                <Upload size={28} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                                                <div className="text-xs text-[var(--color-text-muted)]">{t('uploadLogo')}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 justify-center mt-2">
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById('stampUpload').click()}><Upload size={13} /> {t('select')}</button>
                                        {data.stamp && <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange('stamp', null)}><Trash size={13} /> {t('delete')}</button>}
                                    </div>
                                </div>
                                <input type="file" id="stampUpload" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => onChange('stamp', e.target.result); reader.readAsDataURL(file); } }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyInfoForm;