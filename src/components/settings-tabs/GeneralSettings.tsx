import React from "react";
import { Save, Settings2, Check } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useQuoteData } from "../../context/QuoteContext";

interface GeneralSettingsProps {
  viewMode: string;
  setViewMode: (value: 'desktop' | 'mobile') => void;
  performanceMode: boolean;
  setPerformanceMode: (value: boolean) => void;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  appFontSize: number;
  setAppFontSize: (value: number) => void;
  appLayout: string;
  setAppLayout: (value: 'modern' | 'classic') => void;
  appTheme: string;
  setAppTheme: (value: 'light' | 'dark') => void;
  appColor: string;
  setAppColor: (value: 'blue' | 'purple' | 'green' | 'red' | 'orange') => void;
  onSave: () => void;
}

const GeneralSettings = ({
  viewMode, setViewMode,
  performanceMode, setPerformanceMode,
  compactMode, setCompactMode,
  appFontSize, setAppFontSize,
  appLayout, setAppLayout,
  appTheme, setAppTheme,
  appColor, setAppColor,
  onSave,
}: GeneralSettingsProps) => {
  const { quoteData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const appColors = [
    { id: "blue", name: t('oceanBlue'), color: "#2563eb" },
    { id: "emerald", name: t('emeraldGreen'), color: "#10b981" },
    { id: "violet", name: t('royalPurple'), color: "#8b5cf6" },
    { id: "amber", name: t('sunset'), color: "#f59e0b" },
    { id: "rose", name: t('rosePink'), color: "#f43f5e" },
    { id: "slate", name: t('corporateGray'), color: "#475569" },
  ];
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
        <div className="form-group">
          <label className="form-label">{t('themeMode')}</label>
          <div className="flex gap-3">
            {["light", "dark"].map((mode) => (
              <label
                key={mode}
                className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appTheme === mode ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]" : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"}`}
              >
                <input
                  type="radio"
                  name="appTheme"
                  value={mode}
                  checked={appTheme === mode}
                  onChange={(e) => setAppTheme(e.target.value as 'light' | 'dark')}
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
        <div className="form-group">
          <label className="form-label">{t('appColor')}</label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {appColors.map((color) => (
              <button type="button"
                key={color.id}
                onClick={() => setAppColor(color.id as 'blue' | 'purple' | 'green' | 'red' | 'orange')}
                className={`flex items-center gap-3 p-2.5 rounded-[var(--radius)] border transition-all ${appColor === color.id ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]" : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"}`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: color.color }}
                >
                  {appColor === color.id && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('interfaceDesign')}</label>
          <div className="flex gap-3">
            {[
              { id: "modern", label: t('modernDashboard'), desc: t('modernDashboardDesc') },
              { id: "classic", label: t('classicView'), desc: t('classicViewDesc') },
            ].map((layout) => (
              <label
                key={layout.id}
                className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${appLayout === layout.id ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]" : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"}`}
              >
                <input
                  type="radio"
                  name="appLayout"
                  value={layout.id}
                  checked={appLayout === layout.id}
                  onChange={(e) => setAppLayout(e.target.value as 'modern' | 'classic')}
                  className="form-radio"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {layout.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {layout.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('deviceView')}</label>
          <div className="flex gap-3">
            {[
              { id: "desktop", label: t('desktop'), desc: t('desktopDesc') },
              { id: "mobile", label: t('mobile'), desc: t('mobileDesc') },
            ].map((mode) => (
              <label
                key={mode.id}
                className={`flex items-center gap-3 cursor-pointer p-3 border rounded-[var(--radius)] transition-colors flex-1 ${viewMode === mode.id ? "bg-[var(--color-primary-muted)] border-[var(--color-primary)]" : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"}`}
              >
                <input
                  type="radio"
                  name="viewMode"
                  value={mode.id}
                  checked={viewMode === mode.id}
                  onChange={(e) => setViewMode(e.target.value as 'desktop' | 'mobile')}
                  className="form-radio"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {mode.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {mode.desc}
                  </span>
                </div>
              </label>
            ))}
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
