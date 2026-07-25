import React from 'react';
import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import QuoteInfoForm from './components/QuoteInfoForm';
import CustomerInfoForm from './components/CustomerInfoForm';
import CompanyInfoForm from './components/CompanyInfoForm';
import ItemsTable from './components/ItemsTable';
import SummarySection from './components/SummarySection';
import CustomerSelectModal from './components/CustomerSelectModal';
import ProductSelectModal from './components/ProductSelectModal';
import SavedQuotesModal from './components/SavedQuotesModal';
import AnalyticsModal from './components/AnalyticsModal';

import Settings from './components/Settings';
import HistoryList from './components/HistoryList';
import TermsAndNotes from './components/TermsAndNotes';
import BankInfoForm from './components/BankInfoForm';
import ConfirmDialog from './components/ConfirmDialog';
import CollapsiblePanel from './components/CollapsiblePanel';
import { QuoteProvider, useQuote } from './context/QuoteContext';
import { UIProvider, useUI } from './context/UIContext';
import {
  FileText, Landmark, Undo2, Redo2, FlaskConical, ChevronDown,
  ChevronUp, Save, Plus, Building2, MoreHorizontal, LogOut,
  StickyNote,
} from 'lucide-react';
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

  const { setIsLivePreviewMode } = useUI();
  const { t } = useTranslation(quoteData?.language);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [rightCollapsed, setRightCollapsed] = useState<Record<string, boolean>>({
    company: true, bank: true, terms: true, quoteDetails: true,
  });
  const toggleRight = (key: string) => setRightCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const handleOpenHistory = () => setIsHistoryModalOpen(true);
    document.addEventListener('open-history-modal', handleOpenHistory);
    return () => document.removeEventListener('open-history-modal', handleOpenHistory);
  }, []);

  const handleSaveShortcut = () => { toast.success('Teklif kaydediliyor...'); saveQuote(); };
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

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
  const itemCount = items.length;

  return (
    <div className="fade-in-up">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0 flex-1">
          <input
            type="text"
            value={quoteData.title || ''}
            onChange={(e) => updateQuoteData('title', e.target.value)}
            placeholder="Teklif Başlığı"
            className="text-base sm:text-lg font-bold bg-transparent border-0 outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/30 min-w-[140px] sm:min-w-[160px] p-0"
          />
          <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{today}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 flex-wrap sm:flex-nowrap">
          <select
            value={quoteData.currency || 'TRY'}
            onChange={(e) => updateQuoteData('currency', e.target.value)}
            className="text-xs font-semibold bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius)] px-2 py-1.5 text-[var(--color-text)] outline-none cursor-pointer"
          >
            <option value="TRY">₺ TRY</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
          <div className="w-px h-4 bg-[var(--color-border)] mx-1 hidden sm:block" />
          <button onClick={undo} disabled={!canUndo} className="top-bar-btn" title="Geri Al (Ctrl+Z)" aria-label="Geri Al (Ctrl+Z)"><Undo2 size={15} /></button>
          <button onClick={redo} disabled={!canRedo} className="top-bar-btn" title="İleri Al (Ctrl+Y)" aria-label="İleri Al (Ctrl+Y)"><Redo2 size={15} /></button>
          <div className="w-px h-4 bg-[var(--color-border)] mx-1 hidden sm:block" />
          <button onClick={() => saveQuote()} className="top-bar-btn" title="Kaydet (Ctrl+S)" aria-label="Kaydet (Ctrl+S)"><Save size={15} /></button>
          <button onClick={handlePdfShortcut} className="top-bar-btn" title="PDF Önizleme (Ctrl+P)" aria-label="PDF Önizleme (Ctrl+P)"><FileText size={15} /></button>
          <button onClick={handleNewQuote} className="top-bar-btn" title="Yeni Teklif (Ctrl+N)" aria-label="Yeni Teklif (Ctrl+N)"><Plus size={15} /></button>
          <div className="w-px h-4 bg-[var(--color-border)] mx-1 hidden sm:block" />
          <div className="relative group">
            <button className="top-bar-btn" aria-label="Diğer İşlemler"><MoreHorizontal size={15} /></button>
            <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-lg py-1 min-w-[160px] z-50 hidden group-hover:block">
              <button onClick={fillTestData} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"><FlaskConical size={13} /> Test Verisi Doldur</button>
              <button onClick={() => setConfirmReset(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"><LogOut size={13} /> Sıfırla</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN GRID: Left 2/3 + Right 1/3 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-3">
          {/* Müşteri Bilgisi (always visible, compact) */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                  <Building2 size={14} className="text-[var(--color-primary)]" />
                </div>
                <span className="card-title text-sm">{t('customerInfo')}</span>
                {customerData.name && (
                  <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[200px]">{customerData.name}{customerData.company ? ` — ${customerData.company}` : ''}</span>
                )}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsCustomerModalOpen(true)}>
                <Building2 size={13} /> Seç
              </button>
            </div>
            <div className="card-body">
              <CustomerInfoForm
                data={customerData}
                onChange={updateCustomerData}
                onSelectCustomer={() => setIsCustomerModalOpen(true)}
              />
            </div>
          </div>

          {/* Kalemler */}
          <ItemsTable
            items={items}
            onItemsChange={setItems}
            onAddProduct={() => setIsProductModalOpen(true)}
            currency={quoteData.currency}
          />
        </div>

        {/* ── RIGHT COLUMN (sticky) ── */}
        <div className="lg:sticky lg:top-3 space-y-3">
          {/* Özet (always visible) */}
          <SummarySection
            items={items}
            discount={discount}
            onDiscountChange={setDiscount}
            currency={quoteData.currency}
          />

          {/* Firma Bilgisi (collapsible) */}
          <CollapsiblePanel
            title={t('companyInfo')}
            icon={<Building2 size={13} className="text-[var(--color-text-secondary)]" />}
            defaultCollapsed={rightCollapsed.company}
          >
            <CompanyInfoForm data={companyData} onChange={updateCompanyData} />
          </CollapsiblePanel>

          {/* Banka Bilgisi (collapsible) */}
          <CollapsiblePanel
            title={t('bankInfo')}
            icon={<Landmark size={13} className="text-[var(--color-text-secondary)]" />}
            defaultCollapsed={rightCollapsed.bank}
            actions={
              <button type="button" className="btn btn-ghost btn-xs" onClick={onOpenBankManager} title="Banka Yönetimi" aria-label="Banka Yönetimi">
                <Landmark size={12} />
              </button>
            }
          >
            <BankInfoForm data={bankData} onChange={updateBankData} onOpenManager={onOpenBankManager} />
          </CollapsiblePanel>

          {/* Şartlar & Notlar (collapsible) */}
          <CollapsiblePanel
            title={t('conditionsAndNotes')}
            icon={<StickyNote size={13} className="text-[var(--color-text-secondary)]" />}
            defaultCollapsed={rightCollapsed.terms}
          >
            <TermsAndNotes data={quoteData} onChange={updateQuoteData} />
          </CollapsiblePanel>

          {/* Teklif Detayları (collapsible) */}
          <CollapsiblePanel
            title="Teklif Detayları"
            icon={<FileText size={13} className="text-[var(--color-text-secondary)]" />}
            defaultCollapsed={rightCollapsed.quoteDetails}
          >
            <QuoteInfoForm data={quoteData} onChange={updateQuoteData} />
          </CollapsiblePanel>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        title="Teklifi Sıfırla"
        message="Tüm veriler silinecek ve yeni bir teklif başlatılacak. Devam etmek istediğinize emin misiniz?"
        onConfirm={async () => { setConfirmReset(false); await resetQuote(); }}
        onCancel={() => setConfirmReset(false)}
        variant="danger"
      />
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={handleCustomerSelect}
        onCreateNew={onOpenCustomerManager}
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

function getInitialView() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'history' || view === 'settings') return view;
  return 'builder';
}

function App() {
  const [currentView, setCurrentView] = useState(getInitialView);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (currentView === 'builder') params.delete('view');
    else params.set('view', currentView);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [currentView]);

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
            <div className="page-enter" key="builder">
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
            </div>
          )}
          {currentView === 'history' && <div className="page-enter" key="history"><HistoryList onNavigate={setCurrentView} /></div>}
          {currentView === 'settings' && <div className="page-enter" key="settings"><Settings /></div>}
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
