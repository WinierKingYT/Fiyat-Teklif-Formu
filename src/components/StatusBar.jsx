import React from 'react';
import { useQuote } from '../context/QuoteContext';

const StatusBar = () => {
  const { items, quoteData, saveStatus } = useQuote();

  const itemCount = items?.length || 0;
  const subtotal = items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0) || 0;
  const total = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: quoteData?.currency || 'TRY' }).format(subtotal);
  const quoteNumber = quoteData?.number || '-';

  const statusText = saveStatus?.status === 'saving' ? 'Kaydediliyor...'
    : saveStatus?.status === 'saved' ? 'Kaydedildi'
    : saveStatus?.status === 'error' ? 'Kaydedilemedi'
    : '';

  const statusClass = saveStatus?.status === 'saving' ? 'status-saving'
    : saveStatus?.status === 'saved' ? 'status-saved'
    : saveStatus?.status === 'error' ? 'status-error'
    : '';

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {statusText && (
          <span className={`status-indicator ${statusClass}`}>
            <span className="status-dot" />
            {statusText}
          </span>
        )}
      </div>
      <div className="status-bar-right">
        <span className="status-item">Teklif: {quoteNumber}</span>
        <span className="status-item">{itemCount} kalem</span>
        <span className="status-item status-total">{total}</span>
      </div>
    </div>
  );
};

export default StatusBar;
