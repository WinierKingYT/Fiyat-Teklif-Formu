import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Mail, Phone, Globe, MapPin, Image, Upload, Trash, Save, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import ConfirmDialog from '@/components/ConfirmDialog';
import SignatureCanvas from '@/components/SignatureCanvas';
import { InputField, TextAreaField } from '@/components/ui';
import { useQuoteData, useCompanyDefaults } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import ImageOptimizer from '@/utils/imageOptimizer';
import type { CompanyData } from '@/context/quote/types';

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
  data: Partial<CompanyData>;
  onChange: (name: string, value: string | null) => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { quoteData } = useQuoteData();
  const { companyDefaults, saveCompanyDefaults } = useCompanyDefaults();
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      try {
        const optimizer = new ImageOptimizer();
        const optimizedLogo = await optimizer.optimizeImage(file);
        onChange('logo', optimizedLogo);
      } catch (error) {
        toast.error('Logo yüklenemedi');
      }
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
    saveCompanyDefaults(data as CompanyData);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border)]/50">
          <button
            type="button"
            className="btn btn-ghost btn-xs text-[var(--color-text-secondary)]"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{showDetails ? 'Gizle' : 'Tüm Alanları Göster'}</span>
          </button>
          <button type="button" className="btn btn-outline btn-xs" onClick={handleSaveAsDefault}>
            <Save size={12} /> {t('saveAsDefault')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
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

        {showDetails && (
          <div className="space-y-2.5 pt-1 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <InputField
                id="companyPhone"
                name="phone"
                type="tel"
                register={register}
                error={errors.phone}
                icon={<Phone size={14} />}
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
                icon={<Mail size={14} />}
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
              icon={<Globe size={14} />}
              placeholder={t('website')}
              autoComplete="url"
              onChange={handleChange}
            />
            <TextAreaField
              id="companyAddress"
              name="address"
              register={register}
              icon={<MapPin size={14} />}
              placeholder={t('address')}
              rows={2}
              autoComplete="street-address"
              onChange={handleChange}
            />

            {/* Compact Asset Upload Strip */}
            <div className="pt-2 border-t border-[var(--color-border)]">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                <Image size={13} />
                <span>Kurumsal Görseller (Logo / İmza / Kaşe)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Logo */}
                <div className="p-2 border border-[var(--color-border)] rounded-[var(--radius)] text-center bg-[var(--color-bg-card)]">
                  <div className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Logo</div>
                  {data.logo ? (
                    <div className="relative group inline-block">
                      <img src={data.logo} alt="Logo" className="h-10 mx-auto object-contain rounded" />
                      <button type="button" onClick={clearLogo} className="absolute -top-1 -right-1 bg-[var(--color-error)] text-white rounded-full p-0.5" title="Sil"><Trash size={10} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-xs w-full text-[11px]"><Upload size={11} /> Logo Yükle</button>
                  )}
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>

                {/* İmza */}
                <div className="p-2 border border-[var(--color-border)] rounded-[var(--radius)] text-center bg-[var(--color-bg-card)]">
                  <div className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1">İmza</div>
                  <SignatureCanvas
                    savedSignature={data.signature ?? undefined}
                    onSave={(sig) => onChange('signature', sig)}
                    onClear={() => onChange('signature', null)}
                  />
                </div>

                {/* Kaşe */}
                <div className="p-2 border border-[var(--color-border)] rounded-[var(--radius)] text-center bg-[var(--color-bg-card)]">
                  <div className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Kaşe</div>
                  {data.stamp ? (
                    <div className="relative group inline-block">
                      <img src={data.stamp} alt="Kaşe" className="h-10 mx-auto object-contain rounded" />
                      <button type="button" onClick={clearStamp} className="absolute -top-1 -right-1 bg-[var(--color-error)] text-white rounded-full p-0.5" title="Sil"><Trash size={10} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => document.getElementById('stampUploadTab')?.click()} className="btn btn-outline btn-xs w-full text-[11px]"><Upload size={11} /> Kaşe Yükle</button>
                  )}
                  <input
                    type="file"
                    id="stampUploadTab"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const optimizer = new ImageOptimizer();
                          const optimizedStamp = await optimizer.optimizeImage(file, true);
                          onChange('stamp', optimizedStamp);
                        } catch (error) {
                          toast.error('Kaşe yüklenemedi');
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
