import React from 'react';
import { Save, Download } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../hooks/useTranslation';

const StatusBar = () => {
  const { items, quoteData, saveStatus, saveQuote } = useQuote();
  const { isLivePreviewMode, setIsLivePreviewMode } = useUI();
  const { t } = useTranslation();

  const itemCount = items?.length || 0;
  const subtotal = items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0) || 0;
  const total = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: quoteData?.currency || 'TRY' }).format(subtotal);

  const isSaving = saveStatus?.status === 'saving';

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
          <span className="status-total">{total}</span>
        )}
      </div>
      <div className="status-bar-right">
        <button
          onClick={saveQuote}
          disabled={isSaving}
          className="status-action-btn status-save-btn"
        >
          <Save size={14} />
          <span>{t('saveQuote')}</span>
        </button>
        <button
          onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
          className={`status-action-btn ${isLivePreviewMode ? 'status-pdf-btn-active' : 'status-pdf-btn'}`}
        >
          <Download size={14} />
          <span>{t('pdfButton')}</span>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
