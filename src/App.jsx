import React from 'react';
import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import QuoteInfoForm from './components/QuoteInfoForm';
import CustomerInfoForm from './components/CustomerInfoForm';
import CompanyInfoForm from './components/CompanyInfoForm';
import ItemsTable from './components/ItemsTable';
import SummarySection from './components/SummarySection';
import DashboardHero from './components/DashboardHero';
import CustomerSelectModal from './components/CustomerSelectModal';
import ProductSelectModal from './components/ProductSelectModal';
import SavedQuotesModal from './components/SavedQuotesModal';
import AnalyticsModal from './components/AnalyticsModal';

import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import HistoryList from './components/HistoryList';
import TermsAndNotes from './components/TermsAndNotes';
import BankInfoForm from './components/BankInfoForm';
import { QuoteProvider, useQuote } from './context/QuoteContext';
import { UIProvider, useUI } from './context/UIContext';
import { FileText, Landmark, Undo2, Redo2, FlaskConical } from 'lucide-react';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { useTranslation } from './hooks/useTranslation';
import { Toaster, toast } from 'react-hot-toast';

const CustomerManagerModal = lazy(() => import('./components/CustomerManagerModal'));
const ProductManagerModal = lazy(() => import('./components/ProductManagerModal'));
const TemplateManagerModal = lazy(() => import('./components/TemplateManagerModal'));
const BankManagerModal = lazy(() => import('./components/BankManagerModal'));
const DatabaseManagerModal = lazy(() => import('./components/DatabaseManagerModal'));
const RecycleBinModal = lazy(() => import('./components/RecycleBinModal'));

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-lg)] flex flex-col items-center gap-3 shadow-lg">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"></div>
      <p className="text-sm text-[var(--color-text-muted)]">Yükleniyor...</p>
    </div>
  </div>
);

const QuoteBuilder = ({
  onNavigate,
  onOpenProductManager,
  onOpenCustomerManager,
  onOpenTemplateManager,
  onOpenDatabaseManager,
  onOpenBankManager,
  onOpenRecycleBin,
  onOpenAnalytics,
}) => {
  const {
    quoteData, updateQuoteData,
    customerData, updateCustomerData,
    companyData, updateCompanyData,
    items, setItems,
    discount, setDiscount,
    bankData, updateBankData,
    saveQuote,
    undo, redo, canUndo, canRedo,
    currentQuoteId,
    loadQuote,
    fillTestData,
    addTab,
    resetQuote
  } = useQuote();

  const { viewMode, setIsLivePreviewMode } = useUI();
  const { t } = useTranslation(quoteData?.language);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        let newWidth = mouseMoveEvent.clientX - 16;
        if (newWidth < 280) newWidth = 280;
        if (newWidth > 800) newWidth = 800;
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const totalAmount = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: quoteData?.currency || 'TRY' }).format(subtotal);
  }, [items, quoteData?.currency]);

  useEffect(() => {
    const handleOpenHistory = () => setIsHistoryModalOpen(true);
    document.addEventListener('open-history-modal', handleOpenHistory);
    return () => document.removeEventListener('open-history-modal', handleOpenHistory);
  }, []);

  const handleSaveShortcut = () => { saveQuote(); };
  const handlePdfShortcut = () => { setIsLivePreviewMode(prev => !prev); };
  const handleNewQuote = async () => { addTab(); };

  useKeyboardShortcuts({
    onSave: handleSaveShortcut,
    onPdf: handlePdfShortcut,
    onNew: handleNewQuote,
    onUndo: undo,
    onRedo: redo
  });

  const handleCustomerSelect = (customer) => {
    updateCustomerData('name', customer.name);
    updateCustomerData('company', customer.company);
    updateCustomerData('email', customer.email);
    updateCustomerData('phone', customer.phone);
    updateCustomerData('address', customer.address);
    toast.success('Müşteri bilgileri yüklendi');
  };

  const handleProductSelect = (products) => {
    const productList = Array.isArray(products) ? products : [products];
    const newItems = productList.map(product => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: product.name,
      description: product.description || '',
      quantity: 1,
      unit: product.unit || 'Adet',
      price: product.price,
      taxRate: product.taxRate || 20,
      discountRate: 0,
      total: product.price,
      image: product.image
    }));
    setItems(prev => [...prev, ...newItems]);
    toast.success(`${newItems.length} ürün eklendi`);
  };

  const handleLoadQuote = (quote) => {
    loadQuote(quote);
  };

  return (
    <div className="fade-in-up">
      <DashboardHero
        quoteData={quoteData}
        items={items}
        totalAmount={totalAmount}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 py-2 px-1 mb-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Geri Al (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="İleri Al (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
        <button
          onClick={fillTestData}
          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-warning)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
          title="Test Verileriyle Doldur"
        >
          <FlaskConical size={18} />
        </button>
      </div>

      <div
        className="builder-grid"
        style={{
          gridTemplateColumns: viewMode === 'mobile' ? '1fr' : `${sidebarWidth}px 16px 1fr`,
          gap: '24px',
        }}
      >
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('customerInfo')}</h3>
            </div>
            <div className="card-body">
              <CustomerInfoForm
                data={customerData}
                onChange={updateCustomerData}
                onSelectCustomer={() => setIsCustomerModalOpen(true)}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('companyInfo')}</h3>
            </div>
            <div className="card-body">
              <CompanyInfoForm data={companyData} onChange={updateCompanyData} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                  <FileText size={16} className="text-[var(--color-primary)]" />
                </div>
                <span className="card-title">{t('quoteDetails')}</span>
              </div>
            </div>
            <div className="card-body">
              <QuoteInfoForm data={quoteData} onChange={updateQuoteData} />
              <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[var(--color-bg-muted)] flex items-center justify-center">
                      <Landmark size={13} className="text-[var(--color-text-secondary)]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">{t('bankInfo')}</span>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenBankManager}>
                    <Landmark size={14} /> {t('bankManagement')}
                  </button>
                </div>
                <BankInfoForm data={bankData} onChange={updateBankData} onOpenManager={onOpenBankManager} />
              </div>
            </div>
          </div>
        </div>

        {viewMode !== 'mobile' && (
          <div
            className={`builder-resizer ${isResizing ? 'active' : ''}`}
            onMouseDown={startResizing}
          />
        )}

        <div className="space-y-6 min-w-0">
          <ItemsTable
            items={items}
            onItemsChange={setItems}
            onAddProduct={() => setIsProductModalOpen(true)}
            currency={quoteData.currency}
          />

          <SummarySection
            items={items}
            discount={discount}
            onDiscountChange={setDiscount}
            currency={quoteData.currency}
          />

          <TermsAndNotes data={quoteData} onChange={updateQuoteData} />
        </div>
      </div>

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={handleCustomerSelect}
      />

      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
      />

      <SavedQuotesModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onLoadQuote={handleLoadQuote}
        onNewQuote={handleNewQuote}
      />
    </div>
  );
};

function BankManagerModalWithSelect({ isOpen, onClose }) {
  const { updateBankData } = useQuote();
  const handleSelect = (bank) => {
    Object.entries(bank).forEach(([key, value]) => {
      if (key !== 'id') updateBankData(key, value);
    });
    onClose();
  };
  return <BankManagerModal isOpen={isOpen} onClose={onClose} onSelect={handleSelect} />;
}

function App() {
  const [currentView, setCurrentView] = useState('builder');

  const [isCustomerManagerOpen, setIsCustomerManagerOpen] = useState(false);
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);
  const [isRecycleBinModalOpen, setIsRecycleBinModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  return (
    <QuoteProvider>
      <UIProvider>
        <Layout
          currentView={currentView}
          onNavigate={setCurrentView}
          onOpenCustomerManager={() => setIsCustomerManagerOpen(true)}
          onOpenProductManager={() => setIsProductManagerOpen(true)}
          onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
          onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
          onOpenBankManager={() => setIsBankManagerOpen(true)}
          onOpenRecycleBin={() => setIsRecycleBinModalOpen(true)}
          onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        >
          {currentView === 'builder' && (
            <QuoteBuilder
              onNavigate={setCurrentView}
              onOpenProductManager={() => setIsProductManagerOpen(true)}
              onOpenCustomerManager={() => setIsCustomerManagerOpen(true)}
              onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
              onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
              onOpenBankManager={() => setIsBankManagerOpen(true)}
              onOpenRecycleBin={() => setIsRecycleBinModalOpen(true)}
              onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
            />
          )}
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
          {currentView === 'history' && <HistoryList onNavigate={setCurrentView} />}
          {currentView === 'settings' && <Settings />}
        </Layout>

        <Suspense fallback={<ModalLoadingFallback />}>
          <CustomerManagerModal
            isOpen={isCustomerManagerOpen}
            onClose={() => setIsCustomerManagerOpen(false)}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <ProductManagerModal
            isOpen={isProductManagerOpen}
            onClose={() => setIsProductManagerOpen(false)}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <TemplateManagerModal
            isOpen={isTemplateManagerOpen}
            onClose={() => setIsTemplateManagerOpen(false)}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <DatabaseManagerModal
            isOpen={isDatabaseManagerOpen}
            onClose={() => setIsDatabaseManagerOpen(false)}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <BankManagerModalWithSelect
            isOpen={isBankManagerOpen}
            onClose={() => setIsBankManagerOpen(false)}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <RecycleBinModal
            isOpen={isRecycleBinModalOpen}
            onClose={() => setIsRecycleBinModalOpen(false)}
          />
        </Suspense>

        <AnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
        />

        <Toaster
          position="top-right"
          toastOptions={{
            className: '',
            style: {
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '16px',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: '500',
            },
            success: {
              iconTheme: { primary: 'var(--color-success)', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: 'var(--color-error)', secondary: 'white' },
            },
          }}
        />
      </UIProvider>
    </QuoteProvider>
  );
}

export default App;
