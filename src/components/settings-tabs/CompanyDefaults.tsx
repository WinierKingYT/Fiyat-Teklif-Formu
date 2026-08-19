import React from "react";
import { Save, Building } from "lucide-react";
import CompanyInfoForm from "../CompanyInfoForm";
import { useTranslation } from "../../hooks/useTranslation";
import { useQuoteData } from "../../context/QuoteContext";

interface CompanyDefaultsProps {
  settings: {
    defaultTitle: string;
    defaultDescription: string;
    defaultValidity: number;
    defaultDeliveryTerms: string;
    defaultWarrantyTerms: string;
    defaultTaxRate: number;
    currency: string;
    defaultNote: string;
  };
  companySettings: {
    name: string;
    authorized: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    logo: string | null;
    signature: string | null;
    stamp: string | null;
  };
  onSettingsChange: (name: string, value: string | number) => void;
onCompanyChange: (name: string, value: string | null) => void;
  onSave: () => void;
}

const CompanyDefaults = ({
  settings,
  companySettings,
  onSettingsChange,
  onCompanyChange,
  onSave,
}: CompanyDefaultsProps) => {
  const { quoteData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onSettingsChange(name, value);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <Building size={13} className="text-[var(--color-primary)]" />
          </div>
          <span className="card-title">{t('quoteDefaults')}</span>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>
          <Save size={14} /> {t('saveSettings')}
        </button>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">
              {t('defaultQuoteTitle')}
            </label>
            <input
              type="text"
              className="form-control"
              name="defaultTitle"
              value={settings.defaultTitle || ""}
              onChange={handleChange}
              placeholder={t('defaultQuoteTitlePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              {t('defaultValidity')}
            </label>
            <input
              type="number"
              className="form-control"
              name="defaultValidity"
              value={settings.defaultValidity}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="form-group">
            <label className="form-label">
              {t('defaultQuoteDescription')}
            </label>
          <textarea
            className="form-control"
            rows={2}
            name="defaultDescription"
            value={settings.defaultDescription || ""}
            onChange={handleChange}
            placeholder={t('defaultQuoteDescPlaceholder')}
          ></textarea>
        </div>
        <div className="form-group">
            <label className="form-label">
              {t('defaultDeliveryTerms')}
            </label>
          <textarea
            className="form-control"
            rows={2}
            name="defaultDeliveryTerms"
            value={settings.defaultDeliveryTerms || ""}
            onChange={handleChange}
            placeholder={t('defaultDeliveryPlaceholder')}
          ></textarea>
        </div>
        <div className="form-group">
            <label className="form-label">
              {t('defaultWarranty')}
            </label>
          <textarea
            className="form-control"
            rows={2}
            name="defaultWarrantyTerms"
            value={settings.defaultWarrantyTerms || ""}
            onChange={handleChange}
            placeholder={t('defaultWarrantyPlaceholder')}
          ></textarea>
        </div>
        <div className="form-group">
            <label className="form-label">
              {t('defaultNotes')}
            </label>
          <textarea
            className="form-control"
            rows={3}
            name="defaultNote"
            value={settings.defaultNote}
            onChange={handleChange}
            placeholder={t('defaultNotesPlaceholder')}
          ></textarea>
        </div>
        <div className="border-t border-[var(--color-border)] pt-5 mt-6">
            <h3 className="text-base font-bold text-[var(--color-text)] mb-1.5">
              {t('defaultCompanyInfo')}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {t('defaultCompanyDesc')}
            </p>
          <CompanyInfoForm
            data={companySettings}
            onChange={onCompanyChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyDefaults;
