import React, { useMemo } from 'react';
import { Save, Download, Plus, FileSpreadsheet } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import { exportQuoteToExcel } from '../utils/excelExporter';
import { calculateQuoteTotals } from '../utils/calculations';

const StatusBar = () => {
  const { items, quoteData, companyData, customerData, discount, saveStatus, saveQuote, setItems } = useQuote();
  const { isLivePreviewMode, setIsLivePreviewMode } = useUI();
  const { t } = useTranslation();

  const itemCount = items?.length || 0;
  const calc = useMemo(() => calculateQuoteTotals(items || [], discount || {}, { currency: quoteData?.currency || 'TRY' }), [items, discount, quoteData?.currency]);
  const total = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: quoteData?.currency || 'TRY' }).format(itemCount > 0 ? calc.grandTotal : 0);

  const isSaving = saveStatus?.status === 'saving';

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      description: '',
      quantity: 1,
      unit: 'Adet',
      price: 0,
      taxRate: 20,
      discountRate: 0,
      total: 0,
      image: null,
    };
    setItems([...items, newItem]);
  };

  const handleExcelExport = async () => {
    try {
      const calc = calculateQuoteTotals(items || [], discount || {}, { currency: quoteData?.currency || 'TRY' });
      const fullQuoteData = {
        quoteData: quoteData || {},
        customerData: customerData || {},
        companyData: companyData || {},
        items: calc.items,
        subTotal: calc.subtotal,
        taxAmount: calc.taxTotal,
        grandTotal: calc.grandTotal,
        globalDiscountAmount: calc.globalDiscountAmount,
        discount: discount
      };
      await exportQuoteToExcel(fullQuoteData, calc.items);
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Excel oluşturulurken hata oluştu');
    }
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {itemCount > 0 && (
          <span className="status-item">{itemCount} kalem</span>
        )}
        {saveStatus?.status && (
          <span className={`status-item status-${saveStatus.status}`} aria-live="polite" aria-atomic="true">
            <span className="status-dot" />
            {saveStatus.status === 'saving' ? 'Kaydediliyor...'
              : saveStatus.status === 'saved' ? 'Kaydedildi'
              : saveStatus.status === 'error' ? 'Hata' : ''}
          </span>
        )}
      </div>
      <div className="status-bar-center">
        {itemCount > 0 && (
          <span className="status-total desktop-only">{total}</span>
        )}
      </div>
      <div className="status-bar-right">
        <div className="status-bar-mobile-actions mobile-only">
          <button onClick={handleAddItem} className="status-action-btn status-pdf-btn" title="Kalem Ekle">
            <Plus size={14} />
          </button>
          <button onClick={handleExcelExport} className="status-action-btn status-pdf-btn" title="Excel">
            <FileSpreadsheet size={14} />
          </button>
        </div>
        <button
          onClick={saveQuote}
          disabled={isSaving}
          className="status-action-btn status-save-btn"
        >
          <Save size={14} />
          <span className="desktop-only">{t('saveQuote')}</span>
        </button>
        <button
          onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
          className={`status-action-btn ${isLivePreviewMode ? 'status-pdf-btn-active' : 'status-pdf-btn'}`}
        >
          <Download size={14} />
          <span className="desktop-only">{t('pdfButton')}</span>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
