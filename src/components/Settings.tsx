import React from "react";
import { useState, useEffect } from "react";
import { useIndexedDB } from "../hooks/useIndexedDB";
import { useQuote } from "../context/QuoteContext";
import { useUI } from "../context/UIContext";
import { useTranslation } from "../hooks/useTranslation";
import { Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import Logger from '../utils/logger';
import { GeneralSettings, CompanyDefaults, PdfLayoutSettings, WatermarkSettings } from "./settings-tabs";

const Settings = () => {
  const { db } = useIndexedDB();
  const { pdfLayout, setPdfLayout, pdfConfig, setPdfConfig, quoteData } =
    useQuote();
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
        const savedSettings = await db.get("settings", "global");
        if (savedSettings) {
          setSettings((prev) => ({ ...prev, ...(savedSettings as any) }));
        }
        const savedCompanyDefaults = await db.get(
          "company_defaults",
          "default",
        );
        if (savedCompanyDefaults) {
          setCompanySettings(savedCompanyDefaults as any);
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

  const handleCompanyChange = (name: string, value: string) => {
    setCompanySettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!db) return;
    try {
      await db.put("settings", { id: "global", ...settings });
      await db.put("company_defaults", { id: "default", ...companySettings });
      toast.success("Ayarlar başarıyla kaydedildi!");
    } catch (error) {
      Logger.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    localStorage.setItem("pdfLayout", JSON.stringify(pdfLayout));
  }, [pdfLayout]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] text-sm">
        Yükleniyor...
      </div>
    );

  const tabs = [
    { id: "general", label: "Genel Ayarlar" },
    { id: "company", label: "Varsayılan Bilgiler" },
    { id: "pdf", label: "PDF Düzeni" },
    { id: "watermark", label: "Filigran" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
          <Settings2 size={17} className="text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          Uygulama Ayarları
        </h1>
      </div>
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
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
