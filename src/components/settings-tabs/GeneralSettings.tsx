import { Save, Settings2, Check, Sparkles, Palette } from "lucide-react";
import { useState } from "react";
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppColor, AppTheme } from '@/context/UIContext';

interface GeneralSettingsProps {
  performanceMode: boolean;
  setPerformanceMode: (value: boolean) => void;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  appFontSize: number;
  setAppFontSize: (value: number) => void;
  appTheme: string;
  setAppTheme: (value: AppTheme) => void;
  appColor: string;
  setAppColor: (value: AppColor) => void;
  onSave: () => void;
}

interface ColorOption {
  id: AppColor;
  nameKey: string;
  descKey: string;
  primary: string;
  hover: string;
  light: string;
  category: 'corporate' | 'fresh' | 'creative';
}

const GeneralSettings = ({
  performanceMode, setPerformanceMode,
  compactMode, setCompactMode,
  appFontSize, setAppFontSize,
  appTheme, setAppTheme,
  appColor, setAppColor,
  onSave,
}: GeneralSettingsProps) => {
  const { quoteData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const [hoveredColor, setHoveredColor] = useState<AppColor | null>(null);

  const colorOptions: ColorOption[] = [
    // Kurumsal & Profesyonel
    { id: "blue", nameKey: "oceanBlue", descKey: "oceanBlueDesc", primary: "#2563eb", hover: "#1d4ed8", light: "#dbeafe", category: 'corporate' },
    { id: "indigo", nameKey: "modernIndigo", descKey: "modernIndigoDesc", primary: "#4f46e5", hover: "#4338ca", light: "#eef2ff", category: 'corporate' },
    { id: "slate", nameKey: "corporateGray", descKey: "corporateGrayDesc", primary: "#475569", hover: "#334155", light: "#f1f5f9", category: 'corporate' },
    // Ferah & Modern
    { id: "emerald", nameKey: "emeraldGreen", descKey: "emeraldGreenDesc", primary: "#10b981", hover: "#059669", light: "#d1fae5", category: 'fresh' },
    { id: "teal", nameKey: "petrolTeal", descKey: "petrolTealDesc", primary: "#0d9488", hover: "#0f766e", light: "#ccfbf1", category: 'fresh' },
    { id: "cyan", nameKey: "skyCyan", descKey: "skyCyanDesc", primary: "#0284c7", hover: "#0369a1", light: "#e0f2fe", category: 'fresh' },
    // Yaratıcı & Dinamik
    { id: "violet", nameKey: "royalPurple", descKey: "royalPurpleDesc", primary: "#8b5cf6", hover: "#7c3aed", light: "#ede9fe", category: 'creative' },
    { id: "amber", nameKey: "sunset", descKey: "sunsetDesc", primary: "#f59e0b", hover: "#d97706", light: "#fef3c7", category: 'creative' },
    { id: "rose", nameKey: "rosePink", descKey: "rosePinkDesc", primary: "#f43f5e", hover: "#e11d48", light: "#ffe4e6", category: 'creative' },
  ];

  const categories = [
    { id: 'corporate', labelKey: 'categoryCorporate', icon: '🏢' },
    { id: 'fresh', labelKey: 'categoryFresh', icon: '🌿' },
    { id: 'creative', labelKey: 'categoryCreative', icon: '⚡' },
  ];

  const activeColorObj = colorOptions.find(c => c.id === (hoveredColor || appColor)) || colorOptions[0];

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <Settings2 size={13} className="text-[var(--color-primary)]" />
          </div>
          <span className="card-title">{t('appearanceSettings')}</span>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>
          <Save size={14} /> {t('saveSettings')}
        </button>
      </div>
      <div className="card-body space-y-6">
        {/* Theme Mode Selection */}
        <div className="form-group">
          <label className="form-label">{t('themeMode')}</label>
          <div className="flex gap-3">
            {["light", "dark"].map((mode) => (
              <label
                key={mode}
                className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appTheme === mode ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"}`}
              >
                <input
                  type="radio"
                  name="appTheme"
                  value={mode}
                  checked={appTheme === mode}
                  onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                  className="form-radio"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text)] capitalize">
                    {mode === "light" ? t('lightMode') : t('darkMode')}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {mode === "light" ? t('lightDesc') : t('darkDesc')}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Color Palette Section */}
        <div className="form-group space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="form-label mb-0.5 flex items-center gap-1.5">
                <Palette size={15} className="text-[var(--color-primary)]" />
                {t('appColor')}
              </label>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t('liveUiPreviewDesc')}
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]">
              {t(activeColorObj.nameKey)}
            </span>
          </div>

          {/* Interactive Live UI Preview Banner */}
          <div
            className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs transition-all duration-200"
            style={{ borderLeftWidth: '4px', borderLeftColor: activeColorObj.primary }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                <Sparkles size={13} style={{ color: activeColorObj.primary }} />
                <span>{t('liveUiPreview')}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
                {activeColorObj.primary.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md font-semibold text-white shadow-xs transition-transform hover:scale-105"
                style={{ backgroundColor: activeColorObj.primary }}
              >
                {t('sampleButton')}
              </button>

              <span
                className="px-2.5 py-1 rounded-full font-semibold border text-xs"
                style={{
                  backgroundColor: appTheme === 'dark' ? 'rgba(255,255,255,0.06)' : activeColorObj.light,
                  borderColor: activeColorObj.primary,
                  color: activeColorObj.primary
                }}
              >
                ● {t('sampleBadge')}
              </span>

              <div
                className="px-2.5 py-1 rounded-md border font-medium bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs"
                style={{ borderColor: activeColorObj.primary, outline: `2px solid ${activeColorObj.light}` }}
              >
                {t('sampleInput')}
              </div>

              <div className="flex items-center gap-1 border-b-2 font-semibold pb-1" style={{ borderColor: activeColorObj.primary, color: activeColorObj.primary }}>
                {t('sampleTab')}
              </div>
            </div>
          </div>

          {/* Categorized Color Cards */}
          <div className="space-y-4 pt-1">
            {categories.map((cat) => {
              const catColors = colorOptions.filter(c => c.category === cat.id);
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                    <span>{cat.icon}</span>
                    <span>{t(cat.labelKey)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {catColors.map((color) => {
                      const isSelected = appColor === color.id;
                      return (
                        <button
                          type="button"
                          key={color.id}
                          onClick={() => setAppColor(color.id)}
                          onMouseEnter={() => setHoveredColor(color.id)}
                          onMouseLeave={() => setHoveredColor(null)}
                          className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                            isSelected
                              ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary-ring)] shadow-xs"
                              : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                          }`}
                        >
                          {/* Top row: Color circle & name */}
                          <div className="flex items-center justify-between w-full mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: color.primary }}
                              >
                                {isSelected && <Check size={13} className="text-white stroke-[3]" />}
                              </div>
                              <span className="text-xs font-bold text-[var(--color-text)] leading-tight">
                                {t(color.nameKey)}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                              {color.primary}
                            </span>
                          </div>

                          {/* Subtitle / Description */}
                          <p className="text-[11px] text-[var(--color-text-muted)] mb-2.5 line-clamp-1">
                            {t(color.descKey)}
                          </p>

                          {/* Mini Palette Bar */}
                          <div className="flex h-1.5 w-full rounded-full overflow-hidden opacity-85 group-hover:opacity-100 transition-opacity">
                            <div className="flex-1" style={{ backgroundColor: color.primary }} />
                            <div className="flex-1" style={{ backgroundColor: color.hover }} />
                            <div className="flex-1" style={{ backgroundColor: color.light }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('performance')}</label>
          <label className="flex items-center gap-3 p-3 border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
            <div className="form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.checked)}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {t('performanceModeLabel')}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {t('performanceModeDesc')}
              </span>
            </div>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">{t('viewDensity')}</label>
          <label className="flex items-center gap-3 p-3 border border-[var(--color-border)] rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
            <div className="form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {t('compactModeLabel')}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {t('compactModeDesc')}
              </span>
            </div>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">{t('appFontSize')}</label>
          <div className="p-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-muted)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                {t('small')}
              </span>
              <span className="text-sm font-bold text-[var(--color-primary)]">
                {appFontSize}px
              </span>
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                {t('large')}
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="20"
              step="1"
              value={appFontSize}
              onChange={(e) => setAppFontSize(parseInt(e.target.value))}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
              {t('fontSizeDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
