import React from "react";
import { Save, Building } from "lucide-react";
import CompanyInfoForm from "../CompanyInfoForm";

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
  onCompanyChange: (name: string, value: string) => void;
  onSave: () => void;
}

const CompanyDefaults = ({
  settings,
  companySettings,
  onSettingsChange,
  onCompanyChange,
  onSave,
}: CompanyDefaultsProps) => {
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
          <span className="card-title">Teklif Varsayılanları</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onSave}>
          <Save size={14} /> Ayarları Kaydet
        </button>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">
              Varsayılan Teklif Başlığı
            </label>
            <input
              type="text"
              className="form-control"
              name="defaultTitle"
              value={settings.defaultTitle || ""}
              onChange={handleChange}
              placeholder="Örn: Hizmet Teklifi"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Varsayılan Geçerlilik (Gün)
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
            Varsayılan Teklif Açıklaması
          </label>
          <textarea
            className="form-control"
            rows={2}
            name="defaultDescription"
            value={settings.defaultDescription || ""}
            onChange={handleChange}
            placeholder="Örn: Aşağıdaki hizmetlerin dökümüdür..."
          ></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">
            Varsayılan Teslimat Koşulları
          </label>
          <textarea
            className="form-control"
            rows={2}
            name="defaultDeliveryTerms"
            value={settings.defaultDeliveryTerms || ""}
            onChange={handleChange}
            placeholder="Örn: Sipariş onayından sonra 3 iş günü içinde..."
          ></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">
            Varsayılan Garanti Koşulları
          </label>
          <textarea
            className="form-control"
            rows={2}
            name="defaultWarrantyTerms"
            value={settings.defaultWarrantyTerms || ""}
            onChange={handleChange}
            placeholder="Örn: 2 yıl parça ve işçilik garantilidir..."
          ></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">
            Varsayılan Ek Notlar / Şartlar
          </label>
          <textarea
            className="form-control"
            rows={3}
            name="defaultNote"
            value={settings.defaultNote}
            onChange={handleChange}
            placeholder="Diğer özel şartlar ve notlar..."
          ></textarea>
        </div>
        <div className="border-t border-[var(--color-border)] pt-5 mt-6">
          <h3 className="text-base font-bold text-[var(--color-text)] mb-1.5">
            Varsayılan Firma Bilgileri
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Buraya gireceğiniz bilgiler, yeni oluşturacağınız tüm
            tekliflerde otomatik olarak doldurulacaktır.
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
