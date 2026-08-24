import { Settings2 } from "lucide-react";
import React from "react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { GeneralSettings, CompanyDefaults, PdfLayoutSettings, WatermarkSettings } from '@/components/settings-tabs';
import { useQuoteData, usePdfConfig } from '@/context/QuoteContext';
import { useUI } from '@/context/UIContext';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useTranslation } from '@/hooks/useTranslation';
import Logger from '@/utils/logger';

const Settings = () => {
  const { db } = useIndexedDB();
  const { pdfLayout, setPdfLayout, pdfConfig, setPdfConfig } = usePdfConfig();
  const { quoteData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const {
    viewMode,
    setViewMode,
    performanceMode,
    setPerformanceMode,
    compactMode,
    setCompactMode,
    appFontSize,
    setAppFontSize,
    appLayout,
    setAppLayout,
    appTheme,
    setAppTheme,
    appColor,
    setAppColor,
  } = useUI();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    defaultTitle: "",
    defaultDescription: "",
    defaultValidity: 7,
    defaultDeliveryTerms: "",
    defaultWarrantyTerms: "",
    defaultTaxRate: 20,
    currency: "TRY",
    defaultNote: "",
  });
  const [companySettings, setCompanySettings] = useState({
    name: "",
    authorized: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    logo: null,
    signature: null,
    stamp: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!db) return;
      try {
        const savedSettings = await db.get<Partial<typeof settings>>("settings", "global");
        if (savedSettings) {
          setSettings((prev) => ({ ...prev, ...savedSettings }));
        }
        const savedCompanyDefaults = await db.get<{ id: string; key?: string; value: typeof companySettings }>(
          "settings",
          "company_defaults",
        );
        if (savedCompanyDefaults && savedCompanyDefaults.value) {
          setCompanySettings((prev) => ({ ...prev, ...savedCompanyDefaults.value }));
        }
        setLoading(false);
      } catch (error) {
        Logger.error("Error loading settings:", error);
        setLoading(false);
      }
    };
    loadSettings();
  }, [db]);

  const handleSettingsChange = (name: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (name: string, value: string | null) => {
    setCompanySettings((prev) => ({ ...prev, [name]: value ?? null }));
  };

  const handleSave = async () => {
    if (!db) return;
    try {
      await db.put("settings", { id: "global", key: "global", ...settings });
      await db.put("settings", { id: "company_defaults", key: "company_defaults", value: companySettings });
      toast.success(t('settingsSaved'));
    } catch (error) {
      Logger.error("Error saving settings:", error);
      toast.error(t('settingsSaveError'));
    }
  };

  useEffect(() => {
    if (pdfLayout) {
      localStorage.setItem("pdfLayout", JSON.stringify(pdfLayout));
    }
  }, [pdfLayout]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] text-sm">
        {t('loading')}
      </div>
    );

  const tabs = [
    { id: "general", label: t('generalSettings') },
    { id: "company", label: t('companyDefaults') },
    { id: "pdf", label: t('pdfLayout') },
    { id: "watermark", label: t('watermarkTab') },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
          <Settings2 size={17} className="text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          {t('appSettings')}
        </h1>
      </div>
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button type="button"
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "general" && (
        <GeneralSettings
          viewMode={viewMode}
          setViewMode={setViewMode}
          performanceMode={performanceMode}
          setPerformanceMode={setPerformanceMode}
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          appFontSize={appFontSize}
          setAppFontSize={setAppFontSize}
          appLayout={appLayout}
          setAppLayout={setAppLayout}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
          appColor={appColor}
          setAppColor={setAppColor}
          onSave={handleSave}
        />
      )}
      {activeTab === "company" && (
        <CompanyDefaults
          settings={settings}
          companySettings={companySettings}
          onSettingsChange={handleSettingsChange}
          onCompanyChange={handleCompanyChange}
          onSave={handleSave}
        />
      )}
      {activeTab === "pdf" && (
        <PdfLayoutSettings
          pdfLayout={pdfLayout}
          setPdfLayout={setPdfLayout}
        />
      )}
      {activeTab === "watermark" && (
        <WatermarkSettings
          pdfConfig={pdfConfig}
          setPdfConfig={setPdfConfig}
        />
      )}
    </div>
  );
};

export default Settings;
