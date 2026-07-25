import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Mail, Phone, Globe, MapPin, Image, Upload, Trash, Save, ChevronDown, ChevronUp } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import ConfirmDialog from './ConfirmDialog';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import { InputField, TextAreaField } from './ui';

const companyInfoSchema = z.object({
  name: z.string().min(1, 'Firma adı zorunludur'),
  authorized: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Geçerli bir e-posta girin'
  ),
  website: z.string().optional().refine(
    (val) => !val || /^https?:\/\/.+/.test(val),
    'Geçerli bir URL girin (http://...)'
  ),
  address: z.string().optional(),
});

type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;

interface CompanyInfoFormProps {
  data: Record<string, any>;
  onChange: (name: string, value: any) => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveCompanyDefaults, quoteData } = useQuote();
  const { t } = useTranslation(quoteData?.language);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmClear, setConfirmClear] = useState<{ field: string; isOpen: boolean }>({ field: '', isOpen: false });

  const isFilled = data?.name && (data?.phone || data?.email);

  const {
    register,
    formState: { errors },
  } = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: data.name || '',
      authorized: data.authorized || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      address: data.address || '',
    },
    mode: 'onBlur',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onChange('logo', (ev.currentTarget as FileReader).result);
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setConfirmClear({ field: 'logo', isOpen: true });
  };

  const clearStamp = () => {
    setConfirmClear({ field: 'stamp', isOpen: true });
  };

  const handleConfirmClear = () => {
    const field = confirmClear.field;
    onChange(field, null);
    if (field === 'logo' && fileInputRef.current) fileInputRef.current.value = '';
    setConfirmClear({ field: '', isOpen: false });
  };

  const handleSaveAsDefault = () => {
    saveCompanyDefaults(data);
    toast.success(t('saved'));
  };

  const uploadAreaStyle: React.CSSProperties = {
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
    <>
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
            <InputField
              id="companyName"
              name="name"
              register={register}
              error={errors.name}
              placeholder={t('companyName')}
              autoComplete="organization"
              onChange={handleChange}
            />
            <InputField
              id="companyAuthorized"
              name="authorized"
              register={register}
              placeholder={t('authorizedDealer')}
              autoComplete="name"
              onChange={handleChange}
            />
          </div>

          {(!isFilled || showDetails) && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                  id="companyPhone"
                  name="phone"
                  type="tel"
                  register={register}
                  error={errors.phone}
                  icon={<Phone size={15} />}
                  placeholder={t('phone')}
                  autoComplete="tel"
                  onChange={handleChange}
                />
                <InputField
                  id="companyEmail"
                  name="email"
                  type="email"
                  register={register}
                  error={errors.email}
                  icon={<Mail size={15} />}
                  placeholder={t('email')}
                  autoComplete="email"
                  onChange={handleChange}
                />
              </div>
              <InputField
                id="companyWebsite"
                name="website"
                type="url"
                register={register}
                error={errors.website}
                icon={<Globe size={15} />}
                placeholder={t('website')}
                autoComplete="url"
                onChange={handleChange}
              />
              <TextAreaField
                id="companyAddress"
                name="address"
                register={register}
                icon={<MapPin size={15} />}
                placeholder={t('address')}
                rows={2}
                autoComplete="street-address"
                onChange={handleChange}
              />

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
                      onClick={() => document.getElementById('stampUpload')?.click()}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('stampUpload')?.click(); } }}
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
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById('stampUpload')?.click()}><Upload size={13} /> {t('select')}</button>
                      {data.stamp && <button type="button" className="btn btn-danger btn-sm" onClick={clearStamp}><Trash size={13} /> {t('delete')}</button>}
                    </div>
                  </div>
                  <input type="file" id="stampUpload" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => onChange('stamp', (ev.currentTarget as FileReader).result); reader.readAsDataURL(file); } }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmClear.isOpen}
        title={t('delete')}
        message={`${confirmClear.field === 'logo' ? t('logo') : t('stamp')} silinecek. Emin misiniz?`}
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmClear({ field: '', isOpen: false })}
      />
    </>
  );
};

export default React.memo(CompanyInfoForm);
