import React from "react";
import type { PdfConfig } from "../../context/quote/types";

interface PdfSectionsTabProps {
  pdfConfig: PdfConfig;
  handleConfigChange: (key: string, value: any) => void;
}

const PdfSectionsTab: React.FC<PdfSectionsTabProps> = ({ pdfConfig, handleConfigChange }) => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Üst Bilgi (Header)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Boyutu</label>
            <select value={pdfConfig.headerTitleFontSize || '1rem'} onChange={(e) => handleConfigChange('headerTitleFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.8rem">Küçük</option>
              <option value="1rem">Normal</option>
              <option value="1.2rem">Büyük</option>
              <option value="1.5rem">Çok Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Kalınlığı</label>
            <select value={pdfConfig.headerTitleFontWeight || '700'} onChange={(e) => handleConfigChange('headerTitleFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">Normal</option>
              <option value="600">Orta</option>
              <option value="700">Kalın</option>
              <option value="800">Çok Kalın</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Bilgi Yazı Boyutu</label>
            <select value={pdfConfig.headerInfoFontSize || '0.7rem'} onChange={(e) => handleConfigChange('headerInfoFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.6rem">Küçük</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer/Seller Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Müşteri & Satıcı</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Boyutu</label>
            <select value={pdfConfig.customerTitleFontSize || '0.8rem'} onChange={(e) => handleConfigChange('customerTitleFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.7rem">Küçük</option>
              <option value="0.8rem">Normal</option>
              <option value="0.9rem">Büyük</option>
              <option value="1rem">Çok Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Kalınlığı</label>
            <select value={pdfConfig.customerTitleFontWeight || '600'} onChange={(e) => handleConfigChange('customerTitleFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">Normal</option>
              <option value="600">Orta</option>
              <option value="700">Kalın</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Boyutu</label>
            <select value={pdfConfig.customerLabelFontSize || 'inherit'} onChange={(e) => handleConfigChange('customerLabelFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">Otomatik</option>
              <option value="0.6rem">Küçük</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Kalınlığı</label>
            <select value={pdfConfig.customerLabelFontWeight || '500'} onChange={(e) => handleConfigChange('customerLabelFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
              <option value="700">Çok Kalın</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Değer Boyutu</label>
            <select value={pdfConfig.customerValueFontSize || 'inherit'} onChange={(e) => handleConfigChange('customerValueFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">Otomatik</option>
              <option value="0.6rem">Küçük</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Değer Kalınlığı</label>
            <select value={pdfConfig.customerValueFontWeight || 'normal'} onChange={(e) => handleConfigChange('customerValueFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quote Meta Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Teklif Bilgileri (Sağ Üst)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Boyutu</label>
            <select value={pdfConfig.quoteMetaLabelFontSize || '0.7rem'} onChange={(e) => handleConfigChange('quoteMetaLabelFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.6rem">Küçük</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Kalınlığı</label>
            <select value={pdfConfig.quoteMetaLabelFontWeight || 'normal'} onChange={(e) => handleConfigChange('quoteMetaLabelFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Değer Boyutu</label>
            <select value={pdfConfig.quoteMetaValueFontSize || 'inherit'} onChange={(e) => handleConfigChange('quoteMetaValueFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">Otomatik</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
              <option value="0.9rem">Çok Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Değer Kalınlığı</label>
            <select value={pdfConfig.quoteMetaValueFontWeight || '600'} onChange={(e) => handleConfigChange('quoteMetaValueFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">Normal</option>
              <option value="600">Orta</option>
              <option value="700">Kalın</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Ürünler Tablosu</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Boyutu</label>
            <input type="range" min="10" max="30" step="1" value={pdfConfig.tableHeaderFontSize || 14} onChange={(e) => handleConfigChange('tableHeaderFontSize', parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer" />
            <div className="text-[10px] text-right text-[var(--color-text-muted)]">{pdfConfig.tableHeaderFontSize || 14}px</div>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Başlık Kalınlığı</label>
            <select value={pdfConfig.tableHeaderFontWeight || '600'} onChange={(e) => handleConfigChange('tableHeaderFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">Normal</option>
              <option value="600">Kalın</option>
              <option value="700">Çok Kalın</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">İçerik Boyutu</label>
            <select value={pdfConfig.tableBodyFontSize || '0.7rem'} onChange={(e) => handleConfigChange('tableBodyFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.6rem">Küçük</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
              <option value="0.9rem">Çok Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">İçerik Kalınlığı</label>
            <select value={pdfConfig.tableBodyFontWeight || 'normal'} onChange={(e) => handleConfigChange('tableBodyFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Özet Alanı</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Boyutu</label>
            <select value={pdfConfig.summaryLabelFontSize || '0.75rem'} onChange={(e) => handleConfigChange('summaryLabelFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.65rem">Küçük</option>
              <option value="0.75rem">Normal</option>
              <option value="0.85rem">Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Etiket Kalınlığı</label>
            <select value={pdfConfig.summaryLabelFontWeight || 'normal'} onChange={(e) => handleConfigChange('summaryLabelFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Değer Boyutu</label>
            <select value={pdfConfig.summaryValueFontSize || 'inherit'} onChange={(e) => handleConfigChange('summaryValueFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">Otomatik</option>
              <option value="0.75rem">Normal</option>
              <option value="0.85rem">Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Değer Kalınlığı</label>
            <select value={pdfConfig.summaryValueFontWeight || '500'} onChange={(e) => handleConfigChange('summaryValueFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Genel Toplam Boyutu</label>
            <select value={pdfConfig.summaryTotalFontSize || '0.9rem'} onChange={(e) => handleConfigChange('summaryTotalFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.8rem">Küçük</option>
              <option value="0.9rem">Normal</option>
              <option value="1rem">Büyük</option>
              <option value="1.2rem">Çok Büyük</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">Footer</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Yazı Boyutu</label>
            <select value={pdfConfig.footerFontSize || '0.7rem'} onChange={(e) => handleConfigChange('footerFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="0.6rem">Küçük</option>
              <option value="0.7rem">Normal</option>
              <option value="0.8rem">Büyük</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Yazı Kalınlığı</label>
            <select value={pdfConfig.footerFontWeight || 'normal'} onChange={(e) => handleConfigChange('footerFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">Normal</option>
              <option value="500">Orta</option>
              <option value="600">Kalın</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfSectionsTab;
