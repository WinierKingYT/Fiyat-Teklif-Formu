import React from "react";
import { Settings2 } from "lucide-react";
import { PdfConfig } from "../../context/quote/types";

interface WatermarkSettingsProps {
  pdfConfig: PdfConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPdfConfig: (config: any) => void;
}

const WatermarkSettings = ({ pdfConfig, setPdfConfig }: WatermarkSettingsProps) => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <Settings2 size={13} className="text-[var(--color-primary)]" />
          </div>
          <span className="card-title">Filigran Ayarları</span>
        </div>
      </div>
      <div className="card-body">
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          PDF çıktılarına eklenecek filigranı buradan
          özelleştirebilirsiniz.
        </p>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-muted)]">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text)]">
                Filigran Göster
              </h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                PDF sayfalarının arka planında filigran görüntülenir.
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
                <label className="form-label">Filigran Metni</label>
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
                  placeholder="Örn: TASLAK"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Renk</label>
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
                    Opaklık (Saydamlık)
                  </label>
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    %{Math.round(pdfConfig.watermarkOpacity * 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={pdfConfig.watermarkOpacity}
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
                    Döndürme Açısı
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
                <label className="form-label">Yazı Boyutu (px)</label>
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
