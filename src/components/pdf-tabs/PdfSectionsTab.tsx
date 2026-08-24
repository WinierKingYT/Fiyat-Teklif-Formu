import React from "react";
import type { PdfConfig } from '@/context/quote/types';

interface PdfSectionsTabProps {
  pdfConfig: PdfConfig;
  handleConfigChange: (key: string, value: unknown) => void;
  t: (key: string) => string;
}

const PdfSectionsTab: React.FC<PdfSectionsTabProps> = ({ pdfConfig, handleConfigChange, t }) => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('headerSection')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('titleSize')}</label>
            <select value={pdfConfig.headerTitleFontSize || '13pt'} onChange={(e) => handleConfigChange('headerTitleFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="10pt">{t('small')}</option>
              <option value="13pt">{t('normal')}</option>
              <option value="15pt">{t('large')}</option>
              <option value="18pt">{t('veryLarge')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('titleWeight')}</label>
            <select value={pdfConfig.headerTitleFontWeight || '700'} onChange={(e) => handleConfigChange('headerTitleFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">{t('normal')}</option>
              <option value="600">{t('medium')}</option>
              <option value="700">{t('bold')}</option>
              <option value="800">{t('extraBold')}</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('infoTextSize')}</label>
            <select value={pdfConfig.headerInfoFontSize || '8.5pt'} onChange={(e) => handleConfigChange('headerInfoFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="7pt">{t('small')}</option>
              <option value="8.5pt">{t('normal')}</option>
              <option value="10pt">{t('large')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer/Seller Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('customerSection')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('titleSize')}</label>
            <select value={pdfConfig.customerTitleFontSize || '8.5pt'} onChange={(e) => handleConfigChange('customerTitleFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="7pt">{t('small')}</option>
              <option value="8.5pt">{t('normal')}</option>
              <option value="10pt">{t('large')}</option>
              <option value="12pt">{t('veryLarge')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('titleWeight')}</label>
            <select value={pdfConfig.customerTitleFontWeight || '600'} onChange={(e) => handleConfigChange('customerTitleFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">{t('normal')}</option>
              <option value="600">{t('medium')}</option>
              <option value="700">{t('bold')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('labelSize')}</label>
            <select value={pdfConfig.customerLabelFontSize || 'inherit'} onChange={(e) => handleConfigChange('customerLabelFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">{t('auto')}</option>
              <option value="7pt">{t('small')}</option>
              <option value="8pt">{t('normal')}</option>
              <option value="9pt">{t('large')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('labelWeight')}</label>
            <select value={pdfConfig.customerLabelFontWeight || '500'} onChange={(e) => handleConfigChange('customerLabelFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
              <option value="700">{t('extraBold')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('valueSize')}</label>
            <select value={pdfConfig.customerValueFontSize || 'inherit'} onChange={(e) => handleConfigChange('customerValueFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">{t('auto')}</option>
              <option value="7pt">{t('small')}</option>
              <option value="8.5pt">{t('normal')}</option>
              <option value="10pt">{t('large')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('valueWeight')}</label>
            <select value={pdfConfig.customerValueFontWeight || 'normal'} onChange={(e) => handleConfigChange('customerValueFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quote Meta Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('quoteMetaSection')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('labelSize')}</label>
            <select value={pdfConfig.quoteMetaLabelFontSize || '7.5pt'} onChange={(e) => handleConfigChange('quoteMetaLabelFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="6.5pt">{t('small')}</option>
              <option value="7.5pt">{t('normal')}</option>
              <option value="9pt">{t('large')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('labelWeight')}</label>
            <select value={pdfConfig.quoteMetaLabelFontWeight || 'normal'} onChange={(e) => handleConfigChange('quoteMetaLabelFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('valueSize')}</label>
            <select value={pdfConfig.quoteMetaValueFontSize || 'inherit'} onChange={(e) => handleConfigChange('quoteMetaValueFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">{t('auto')}</option>
              <option value="7.5pt">{t('normal')}</option>
              <option value="8.5pt">{t('large')}</option>
              <option value="10pt">{t('veryLarge')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('valueWeight')}</label>
            <select value={pdfConfig.quoteMetaValueFontWeight || '600'} onChange={(e) => handleConfigChange('quoteMetaValueFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">{t('normal')}</option>
              <option value="600">{t('medium')}</option>
              <option value="700">{t('bold')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('productsTableSection')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('titleSize')}</label>
            <input type="range" min="10" max="30" step="1" value={pdfConfig.tableHeaderFontSize || 14} onChange={(e) => handleConfigChange('tableHeaderFontSize', parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer" />
            <div className="text-[10px] text-right text-[var(--color-text-muted)]">{pdfConfig.tableHeaderFontSize || 14}px</div>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('titleWeight')}</label>
            <select value={pdfConfig.tableHeaderFontWeight || '600'} onChange={(e) => handleConfigChange('tableHeaderFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">{t('normal')}</option>
              <option value="600">{t('bold')}</option>
              <option value="700">{t('extraBold')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('contentSize')}</label>
            <select value={pdfConfig.tableBodyFontSize || '8pt'} onChange={(e) => handleConfigChange('tableBodyFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="7pt">{t('small')}</option>
              <option value="8pt">{t('normal')}</option>
              <option value="9pt">{t('large')}</option>
              <option value="10pt">{t('veryLarge')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('contentWeight')}</label>
            <select value={pdfConfig.tableBodyFontWeight || 'normal'} onChange={(e) => handleConfigChange('tableBodyFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('summarySection')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('labelSize')}</label>
            <select value={pdfConfig.summaryLabelFontSize || '8pt'} onChange={(e) => handleConfigChange('summaryLabelFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="7pt">{t('small')}</option>
              <option value="8pt">{t('normal')}</option>
              <option value="9.5pt">{t('large')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('labelWeight')}</label>
            <select value={pdfConfig.summaryLabelFontWeight || 'normal'} onChange={(e) => handleConfigChange('summaryLabelFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('valueSize')}</label>
            <select value={pdfConfig.summaryValueFontSize || 'inherit'} onChange={(e) => handleConfigChange('summaryValueFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="inherit">{t('auto')}</option>
              <option value="7.5pt">{t('normal')}</option>
              <option value="8.5pt">{t('large')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('valueWeight')}</label>
            <select value={pdfConfig.summaryValueFontWeight || '500'} onChange={(e) => handleConfigChange('summaryValueFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="400">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('totalSize')}</label>
            <select value={pdfConfig.summaryTotalFontSize || '10pt'} onChange={(e) => handleConfigChange('summaryTotalFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="8.5pt">{t('small')}</option>
              <option value="10pt">{t('normal')}</option>
              <option value="12pt">{t('large')}</option>
              <option value="14pt">{t('veryLarge')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('signatureField')}</h4>
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(pdfConfig.showCustomerSignature)}
            onChange={(e) => handleConfigChange('showCustomerSignature', e.target.checked)}
            className="accent-[var(--color-info)]"
          />
          {t('customerSignature')}
        </label>
      </div>

      {/* Footer */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('footerSection')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('footerTextSize')}</label>
            <select value={pdfConfig.footerFontSize || '7.5pt'} onChange={(e) => handleConfigChange('footerFontSize', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="6.5pt">{t('small')}</option>
              <option value="7.5pt">{t('normal')}</option>
              <option value="8.5pt">{t('large')}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">{t('footerTextWeight')}</label>
            <select value={pdfConfig.footerFontWeight || 'normal'} onChange={(e) => handleConfigChange('footerFontWeight', e.target.value)} className="w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded">
              <option value="normal">{t('normal')}</option>
              <option value="500">{t('medium')}</option>
              <option value="600">{t('bold')}</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(pdfConfig.showPageNumbers)}
            onChange={(e) => handleConfigChange('showPageNumbers', e.target.checked)}
            className="accent-[var(--color-info)]"
          />
          {t('showPageNumbers')}
        </label>
      </div>
    </div>
  );
};

export default PdfSectionsTab;
