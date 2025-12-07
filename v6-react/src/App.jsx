import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import QuoteInfoForm from './components/QuoteInfoForm';
import CustomerInfoForm from './components/CustomerInfoForm';
import CompanyInfoForm from './components/CompanyInfoForm';
import ItemsTable from './components/ItemsTable';
import SummarySection from './components/SummarySection';
import StatusBar from './components/StatusBar';
import CustomerSelectModal from './components/CustomerSelectModal';
import ProductSelectModal from './components/ProductSelectModal';
import SavedQuotesModal from './components/SavedQuotesModal';
import AnalyticsModal from './components/AnalyticsModal';

import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import TermsAndNotes from './components/TermsAndNotes';
import BankInfoForm from './components/BankInfoForm';
import BankManagerModal from './components/BankManagerModal';
import DatabaseManagerModal from './components/DatabaseManagerModal';
import { QuoteProvider, useQuote } from './context/QuoteContext';
import { Save, FileText, PlusCircle, CheckCircle2, ChevronDown, ChevronUp, Columns, LayoutTemplate } from 'lucide-react';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { Toaster, toast } from 'react-hot-toast';

import CustomerManagerModal from './components/CustomerManagerModal';
import ProductManagerModal from './components/ProductManagerModal';
import TemplateManagerModal from './components/TemplateManagerModal';
import PdfPreviewPanel from './components/PdfPreviewPanel';

import RecycleBinModal from './components/RecycleBinModal';

const QuoteBuilder = ({
  onNavigate,
  onOpenProductManager,
  onOpenCustomerManager,
  onOpenTemplateManager,
  onOpenDatabaseManager,
  onOpenBankManager,
  onOpenRecycleBin,
  isMobileMenuOpen,
  onToggleMobileMenu,
  isSplitView,
  setIsSplitView
}) => {
  const {
    quoteData, updateQuoteData,
    customerData, updateCustomerData,
    companyData, updateCompanyData,
    items, setItems,
    discount, setDiscount,
    bankData, updateBankData,
    saveQuote,
    undo, redo,
    isLivePreviewMode, setIsLivePreviewMode,
    db,
    focusMode,
    setCurrentQuoteId,
    loadQuote,
    appLayout,
    fillTestData,
    companyDefaults,
    viewMode
  } = useQuote();

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  // isSplitView passed as prop

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        // Left-Sidebar Logic: Width = Mouse X
        let newWidth = mouseMoveEvent.clientX - 16;

        // Constrain width
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

  // Collapsible Sections State
  const [sections, setSections] = useState({
    customer: true,
    company: false, // Collapsed by default to save space
    settings: false,
    bank: false
  });

  const toggleSection = (section) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const handleOpenHistory = () => setIsHistoryModalOpen(true);
    document.addEventListener('open-history-modal', handleOpenHistory);
    return () => document.removeEventListener('open-history-modal', handleOpenHistory);
  }, []);

  // Keyboard Shortcuts Handlers
  const handleSaveShortcut = () => {
    saveQuote();
  };

  const handlePdfShortcut = () => {
    setIsLivePreviewMode(prev => !prev);
  };

  const handleNewQuote = async () => {
    if (window.confirm('Mevcut teklif temizlenecek. Emin misiniz?')) {
      setCurrentQuoteId(null); // Reset current quote ID

      // Reset Quote Data with Defaults
      try {
        let settings = { currency: 'TRY' };
        if (db) {
          settings = await db.get('settings', 'global') || settings;
        }

        updateQuoteData('title', settings.defaultTitle || '');
        updateQuoteData('number', '');
        updateQuoteData('date', new Date().toISOString().split('T')[0]);
        updateQuoteData('validUntilDays', settings.defaultValidity || '10');
        updateQuoteData('description', settings.defaultDescription || '');
        updateQuoteData('terms', settings.defaultTerms || '');
        updateQuoteData('deliveryTerms', settings.defaultDeliveryTerms || '');
        updateQuoteData('warrantyTerms', settings.defaultWarrantyTerms || '');
        updateQuoteData('notes', settings.defaultNote || '');
        updateQuoteData('currency', settings.currency || 'TRY');

      } catch (error) {
        console.error('Error loading defaults:', error);
        // Fallback defaults
        updateQuoteData('title', '');
        updateQuoteData('validUntilDays', '10');
        updateQuoteData('currency', 'TRY');
      }

      // Reset Currency logic merged above

      // Reset Customer Data
      updateCustomerData('name', '');
      updateCustomerData('company', '');
      updateCustomerData('email', '');
      updateCustomerData('phone', '');
      updateCustomerData('address', '');

      // Reset Company Data
      // Reset Company Data (Use defaults if available)
      if (companyDefaults) {
        updateCompanyData('name', companyDefaults.name || '');
        updateCompanyData('address', companyDefaults.address || '');
        updateCompanyData('taxId', companyDefaults.taxId || '');
        updateCompanyData('phone', companyDefaults.phone || '');
        updateCompanyData('email', companyDefaults.email || '');
        updateCompanyData('website', companyDefaults.website || '');
        updateCompanyData('signature', companyDefaults.signature || null);
        updateCompanyData('stamp', companyDefaults.stamp || null);
        updateCompanyData('authorized', companyDefaults.authorized || '');
      } else {
        updateCompanyData('name', '');
        updateCompanyData('address', '');
        updateCompanyData('taxId', '');
        updateCompanyData('phone', '');
        updateCompanyData('email', '');
        updateCompanyData('website', '');
        updateCompanyData('signature', null);
        updateCompanyData('stamp', null);
        updateCompanyData('authorized', '');
      }

      // Reset Bank Data
      updateBankData('bankName', '');
      updateBankData('branch', '');
      updateBankData('accountNumber', '');
      updateBankData('iban', '');
      updateBankData('accountHolder', '');

      // Clear draft from IndexedDB
      if (db) {
        db.delete('drafts', 'current_draft').catch(err => console.error('Error clearing draft:', err));
      }
      localStorage.removeItem('currentDraft'); // Cleanup legacy localstorage if exists

      // Reset Items
      setItems([]);
      setDiscount({ type: 'percentage', value: 0 });
      toast.success('Yeni teklif oluşturuldu');
    }
  };

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
    // Auto-expand customer section if collapsed
    if (!sections.customer) toggleSection('customer');
  };

  const handleProductSelect = (products) => {
    // Handle both single product (legacy) and array of products
    const productList = Array.isArray(products) ? products : [products];

    const newItems = productList.map(product => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure ID for drag & drop
      name: product.name,
      description: product.description || '',
      quantity: 1,
      unit: product.unit || 'Adet',
      price: product.price,
      taxRate: product.taxRate || 20,
      discountRate: 0,
      total: product.price, // 1 * price
      image: product.image
    }));

    setItems(prev => [...prev, ...newItems]);
    toast.success(`${newItems.length} ürün eklendi`);
  };

  const handleLoadQuote = (quote) => {
    loadQuote(quote);
  };

  // Helper component for collapsible section headers
  const SectionHeader = ({ title, isOpen, onToggle, icon: Icon }) => (
    <div
      className="collapsible-header p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-t-lg cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-blue-500" />}
          <div className="font-semibold text-gray-700 dark:text-gray-200">{title}</div>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in-up">
      {!focusMode && appLayout === 'modern' && (
        <>
          {/* Sticky Header Removed - Moved to App Drawer */}
        </>
      )}

      {appLayout === 'modern' ? (
        <>
          {/* Dashboard Hero Removed */}
          <div
            className="dashboard-grid"
            style={{
              gridTemplateColumns: viewMode === 'mobile'
                ? '1fr'
                : (isSplitView ? '1fr 1fr' : `${sidebarWidth}px 16px minmax(800px, 1fr)`),
              gap: isSplitView || viewMode === 'mobile' ? '24px' : '0',
              display: viewMode === 'mobile' ? 'flex' : 'grid',
              flexDirection: 'column'
            }}
          >
            {/* LEFT COLUMN - SIDEBAR / EDITOR */}
            <div
              className={`dashboard-sidebar space-y-4 ${isMobileMenuOpen ? 'mobile-open' : ''}`}
              style={{ width: viewMode === 'mobile' ? '100%' : 'auto' }}
            >

              {/* Customer Info Card */}
              <div className="glass-card bg-white/80 dark:bg-slate-800/80">
                <SectionHeader
                  title="Müşteri Bilgileri"
                  isOpen={sections.customer}
                  onToggle={() => toggleSection('customer')}
                  icon={props => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                />
                <div className={`collapsible-content ${sections.customer ? 'expanded' : 'collapsed'}`}>
                  <div className="p-4 pt-0">
                    <CustomerInfoForm
                      data={customerData}
                      onChange={updateCustomerData}
                      onSelectCustomer={() => setIsCustomerModalOpen(true)}
                      compact={true} // Pass compact prop for tighter layout
                    />
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              <div className="glass-card bg-white/80 dark:bg-slate-800/80">
                <SectionHeader
                  title="Firma Bilgileri"
                  isOpen={sections.company}
                  onToggle={() => toggleSection('company')}
                  icon={props => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8H7v8" /></svg>}
                />
                <div className={`collapsible-content ${sections.company ? 'expanded' : 'collapsed'}`}>
                  <div className="p-4 pt-0">
                    <CompanyInfoForm data={companyData} onChange={updateCompanyData} />
                  </div>
                </div>
              </div>

              {/* Quote Settings Card */}
              <div className="glass-card bg-white/80 dark:bg-slate-800/80">
                <SectionHeader
                  title="Teklif Detayları"
                  isOpen={sections.settings}
                  onToggle={() => toggleSection('settings')}
                  icon={props => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>}
                />
                <div className={`collapsible-content ${sections.settings ? 'expanded' : 'collapsed'}`}>
                  <div className="p-4 pt-0">
                    <QuoteInfoForm data={quoteData} onChange={updateQuoteData} />
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h5 className="text-sm font-medium mb-2 text-gray-500">Banka Bilgileri</h5>
                      <BankInfoForm
                        data={bankData}
                        onChange={updateBankData}
                        onOpenManager={onOpenBankManager}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* In Split View, Move Products and Summary Here */}
              {isSplitView && (
                <>
                  {/* Items Table in Split View */}
                  <div className="glass-card bg-white/90 dark:bg-slate-800/90 p-1 shadow-lg border-t-4 border-blue-500">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900 dark:text-blue-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        </span>
                        Ürün ve Hizmetler
                      </h3>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setIsProductModalOpen(true)}
                      >
                        <PlusCircle size={16} /> Ürün Ekle
                      </button>
                    </div>
                    <div className="p-4">
                      <ItemsTable
                        items={items}
                        onItemsChange={setItems}
                        onAddProduct={() => setIsProductModalOpen(true)}
                        currency={quoteData.currency}
                      />
                    </div>
                  </div>

                  {/* Summary Section in Split View */}
                  <div className="glass-card bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-6">
                    <SummarySection
                      items={items}
                      discount={discount}
                      onDiscountChange={setDiscount}
                      currency={quoteData.currency}
                    />
                  </div>

                  {/* Terms in Split View */}
                  <div className="glass-card bg-white/80 dark:bg-slate-800/80 p-6">
                    <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">Notlar ve Şartlar</h4>
                    <TermsAndNotes data={quoteData} onChange={updateQuoteData} />
                  </div>
                </>
              )}

            </div>

            {/* RESIZER HANDLE (Only in Sidebar Mode) */}
            {!isSplitView && viewMode !== 'mobile' && (
              <div
                className={`resizer ${isResizing ? 'active' : ''}`}
                onMouseDown={startResizing}
              />
            )}

            {/* RIGHT COLUMN - MAIN CONTENT */}
            <div className="space-y-6 overflow-x-auto p-1">

              {/* RIGHT COLUMN - MAIN CONTENT or PREVIEW */}
              <div className={`space-y-6 ${isSplitView ? 'h-[calc(100vh-140px)]' : 'overflow-x-auto p-1'}`}>

                {isSplitView ? (
                  /* SPLIT VIEW: Layout Preview */
                  <div className="h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-slate-900">
                    <PdfPreviewPanel />
                  </div>
                ) : (
                  /* NORMAL VIEW: Items & Summary */
                  <>
                    {/* Items Table - The Star of the Show */}
                    <div className="glass-card bg-white/90 dark:bg-slate-800/90 p-1 shadow-lg border-t-4 border-blue-500">
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900 dark:text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                          </span>
                          Ürün ve Hizmetler
                        </h3>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setIsProductModalOpen(true)}
                        >
                          <PlusCircle size={16} /> Ürün Ekle
                        </button>
                      </div>
                      <div className="p-4">
                        <ItemsTable
                          items={items}
                          onItemsChange={setItems}
                          onAddProduct={() => setIsProductModalOpen(true)}
                          currency={quoteData.currency}
                        />
                      </div>
                    </div>

                    {/* Summary Section */}
                    <div className="glass-card bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-6">
                      <SummarySection
                        items={items}
                        discount={discount}
                        onDiscountChange={setDiscount}
                        currency={quoteData.currency}
                      />
                    </div>

                    {/* Terms and Notes */}
                    <div className="glass-card bg-white/80 dark:bg-slate-800/80 p-6">
                      <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">Notlar ve Şartlar</h4>
                      <TermsAndNotes data={quoteData} onChange={updateQuoteData} />
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        </>
      ) : (
        /* CLASSIC LAYOUT (Single Column) */
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Classic Quick Actions */}
          <QuickActions
            onSave={saveQuote}
            onNew={handleNewQuote}
            onHistory={() => setIsHistoryModalOpen(true)}
            onPreview={() => setIsLivePreviewMode(true)}
          />

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Müşteri Bilgileri</h3>
              <CustomerInfoForm
                data={customerData}
                onChange={updateCustomerData}
                onSelectCustomer={() => setIsCustomerModalOpen(true)}
              />
            </div>

            <div className="card p-6 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Firma Bilgileri</h3>
              <CompanyInfoForm data={companyData} onChange={updateCompanyData} />
            </div>
          </div>

          <div className="card p-6 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Teklif Detayları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuoteInfoForm data={quoteData} onChange={updateQuoteData} />
              <BankInfoForm
                data={bankData}
                onChange={updateBankData}
                onOpenManager={onOpenBankManager}
              />
            </div>
          </div>

          <div className="card p-6 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ürün ve Hizmetler</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsProductModalOpen(true)}
              >
                <PlusCircle size={16} /> Ürün Ekle
              </button>
            </div>
            <ItemsTable
              items={items}
              onItemsChange={setItems}
              onAddProduct={() => setIsProductModalOpen(true)}
              currency={quoteData.currency}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white border-b pb-2">Notlar ve Şartlar</h3>
              <TermsAndNotes data={quoteData} onChange={updateQuoteData} />
            </div>

            <div className="card p-6 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700">
              <SummarySection
                items={items}
                discount={discount}
                onDiscountChange={setDiscount}
                currency={quoteData.currency}
              />
            </div>
          </div>
        </div>
      )
      }

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

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />
    </div >
  );
};

function App() {
  const [currentView, setCurrentView] = useState('builder'); // 'builder', 'dashboard', 'settings'

  // Manager Modals State (Lifted Up)
  const [isCustomerManagerOpen, setIsCustomerManagerOpen] = useState(false);
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);
  const [isRecycleBinModalOpen, setIsRecycleBinModalOpen] = useState(false);
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Split View State
  const [isSplitView, setIsSplitView] = useState(false);

  // Auto-disable split view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSplitView(false);
      }
    };

    // Check initially
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QuoteProvider>


      <Layout
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenCustomerManager={() => setIsCustomerManagerOpen(true)}
        onOpenProductManager={() => setIsProductManagerOpen(true)}
        onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
        onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
        onOpenBankManager={() => setIsBankManagerOpen(true)}
        onOpenRecycleBin={() => setIsRecycleBinModalOpen(true)}
        isSplitView={isSplitView}
        setIsSplitView={setIsSplitView}
      >
        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {currentView === 'builder' && (
          <QuoteBuilder
            onNavigate={setCurrentView}
            onOpenProductManager={() => setIsProductManagerOpen(true)}
            onOpenCustomerManager={() => setIsCustomerManagerOpen(true)}
            onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
            onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
            onOpenBankManager={() => setIsBankManagerOpen(true)}
            onOpenRecycleBin={() => setIsRecycleBinModalOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isSplitView={isSplitView}
            setIsSplitView={setIsSplitView}
          />
        )}
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'settings' && <Settings />}
      </Layout >

      {/* Global Modals - Rendered outside Layout to avoid stacking context issues */}
      < CustomerManagerModal
        isOpen={isCustomerManagerOpen}
        onClose={() => setIsCustomerManagerOpen(false)
        }
      />

      < ProductManagerModal
        isOpen={isProductManagerOpen}
        onClose={() => setIsProductManagerOpen(false)}
      />

      < TemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
      />

      < DatabaseManagerModal
        isOpen={isDatabaseManagerOpen}
        onClose={() => setIsDatabaseManagerOpen(false)}
      />

      < BankManagerModal
        isOpen={isBankManagerOpen}
        onClose={() => setIsBankManagerOpen(false)}
      />

      < RecycleBinModal
        isOpen={isRecycleBinModalOpen}
        onClose={() => setIsRecycleBinModalOpen(false)}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#334155',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },
        }}
      />
    </QuoteProvider >
  );
}

export default App;
// Force refresh 2
