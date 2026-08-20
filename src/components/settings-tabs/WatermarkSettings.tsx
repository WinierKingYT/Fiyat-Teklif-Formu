import { Settings2 } from "lucide-react";
import React from "react";
import { PdfConfig } from '@/context/quote/types';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';

interface WatermarkSettingsProps {
  pdfConfig: PdfConfig;
  setPdfConfig: React.Dispatch<React.SetStateAction<PdfConfig>>;
}

const WatermarkSettings = ({ pdfConfig, setPdfConfig }: WatermarkSettingsProps) => {
  const { quoteData } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <Settings2 size={13} className="text-[var(--color-primary)]" />
          </div>
          <span className="card-title">{t('watermarkSettings')}</span>
        </div>
      </div>
      <div className="card-body">
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          {t('watermarkSettingsDesc')}
        </p>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-muted)]">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text)]">
                {t('showWatermarkLabel')}
              </h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                {t('showWatermarkDesc')}
              </p>
            </div>
            <div className="form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={pdfConfig.showWatermark}
                onChange={(e) =>
                  setPdfConfig({
                    ...pdfConfig,
                    showWatermark: e.target.checked,
                  })
                }
              />
            </div>
          </div>
          {pdfConfig.showWatermark && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0">{t('watermarkTextLabel')}</label>
                  <div className="flex gap-1">
                    {['TASLAK', 'ÖN TEKLİF', 'GİZLİ', 'ONAYLANDI'].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setPdfConfig(prev => ({ ...prev, watermarkText: preset }))}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-bg-muted)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] text-[var(--color-text-secondary)] font-semibold border border-[var(--color-border)] transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  className="form-control"
                  value={pdfConfig.watermarkText}
                  onChange={(e) =>
                    setPdfConfig({
                      ...pdfConfig,
                      watermarkText: e.target.value,
                    })
                  }
                  placeholder={t('watermarkPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('watermarkColorLabel')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pdfConfig.watermarkColor}
                    onChange={(e) =>
                      setPdfConfig({
                        ...pdfConfig,
                        watermarkColor: e.target.value,
                      })
                    }
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {pdfConfig.watermarkColor}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <div className="flex justify-between mb-2">
                  <label className="form-label">
                    {t('watermarkOpacityLabel')}
                  </label>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    %{Math.round((pdfConfig.watermarkOpacity ?? 0.15) * 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={pdfConfig.watermarkOpacity ?? 0.15}
                  onChange={(e) =>
                    setPdfConfig({
                      ...pdfConfig,
                      watermarkOpacity: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <div className="flex justify-between mb-2">
                  <label className="form-label">
                    {t('watermarkRotationLabel')}
                  </label>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    {pdfConfig.watermarkRotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={pdfConfig.watermarkRotation}
                  onChange={(e) =>
                    setPdfConfig({
                      ...pdfConfig,
                      watermarkRotation: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('watermarkFontSizeLabel')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={pdfConfig.watermarkFontSize}
                  onChange={(e) =>
                    setPdfConfig({
                      ...pdfConfig,
                      watermarkFontSize: parseInt(e.target.value),
                    })
                  }
                  min="20"
                  max="300"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatermarkSettings;
