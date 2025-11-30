import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import QuoteInfoForm from './components/QuoteInfoForm';
import CustomerInfoForm from './components/CustomerInfoForm';
import CompanyInfoForm from './components/CompanyInfoForm';
import ItemsTable from './components/ItemsTable';
import SummarySection from './components/SummarySection';
import QuickActions from './components/QuickActions';
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
import { Save, FileText, PlusCircle } from 'lucide-react';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { Toaster, toast } from 'react-hot-toast';

import CustomerManagerModal from './components/CustomerManagerModal';
import ProductManagerModal from './components/ProductManagerModal';
import TemplateManagerModal from './components/TemplateManagerModal';

import RecycleBinModal from './components/RecycleBinModal';

const QuoteBuilder = ({
  onNavigate,
  onOpenProductManager,
  onOpenCustomerManager,
  onOpenTemplateManager,
  onOpenDatabaseManager,
  onOpenBankManager,
  onOpenRecycleBin
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
    focusMode
  } = useQuote();

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Keyboard Shortcuts Handlers
  const handleSaveShortcut = () => {
    saveQuote();
  };

  const handlePdfShortcut = () => {
    setIsLivePreviewMode(prev => !prev);
  };

  const handleNewQuote = async () => {
    if (window.confirm('Mevcut teklif temizlenecek. Emin misiniz?')) {
      // Reset Quote Data
      updateQuoteData('title', '');
      updateQuoteData('number', '');
      updateQuoteData('date', new Date().toISOString().split('T')[0]);
      updateQuoteData('validUntilDays', '10');
      updateQuoteData('description', '');
      updateQuoteData('terms', '');
      updateQuoteData('deliveryTerms', '');
      updateQuoteData('warrantyTerms', '');
      updateQuoteData('notes', '');

      // Reset Currency from Settings
      if (db) {
        try {
          const settings = await db.get('settings', 'global');
          updateQuoteData('currency', settings?.currency || 'TRY');
        } catch (error) {
          console.error('Error loading default currency:', error);
          updateQuoteData('currency', 'TRY');
        }
      } else {
        updateQuoteData('currency', 'TRY');
      }

      // Reset Customer Data
      updateCustomerData('name', '');
      updateCustomerData('company', '');
      updateCustomerData('email', '');
      updateCustomerData('phone', '');
      updateCustomerData('address', '');

      // Reset Company Data
      updateCompanyData('name', '');
      updateCompanyData('address', '');
      updateCompanyData('taxId', '');
      updateCompanyData('phone', '');
      updateCompanyData('email', '');
      updateCompanyData('website', '');
      updateCompanyData('signature', null);
      updateCompanyData('stamp', null);

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
  };

  const handleProductSelect = (product) => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure ID for drag & drop
      name: product.name,
      description: product.description || '',
      quantity: 1,
      unit: product.unit || 'Adet',
      price: product.price,
      taxRate: product.taxRate || 20,
      total: product.price, // 1 * price
      image: product.image
    }]);
    toast.success('Ürün eklendi');
  };

  const handleLoadQuote = (quote) => {
    if (quote.quoteData) {
      Object.entries(quote.quoteData).forEach(([key, value]) => updateQuoteData(key, value));
    }
    if (quote.customerData) {
      Object.entries(quote.customerData).forEach(([key, value]) => updateCustomerData(key, value));
    }
    if (quote.companyData) {
      Object.entries(quote.companyData).forEach(([key, value]) => updateCompanyData(key, value));
    }
    if (quote.bankData) {
      Object.entries(quote.bankData).forEach(([key, value]) => updateBankData(key, value));
    }
    if (quote.items) setItems(quote.items);
    if (quote.discount) setDiscount(quote.discount);
    else if (quote.discountRate) setDiscount({ type: 'percentage', value: quote.discountRate });

    toast.success('Teklif yüklendi');
  };

  return (
    <>
      {!focusMode && (
        <>
          <QuickActions
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
            onOpenCustomerManager={onOpenCustomerManager}
            onOpenProductManager={onOpenProductManager}
            onOpenTemplateManager={onOpenTemplateManager}
            onOpenDatabaseManager={onOpenDatabaseManager}
            onOpenBankManager={onOpenBankManager}
            onOpenRecycleBin={onOpenRecycleBin}
          />
          <StatusBar />
        </>
      )}

      <div className="card" id="quote-content">
        <div className="card-header">
          <h2 className="card-title">Yeni Teklif Oluştur</h2>
          <div className="card-actions">
            <button className="btn btn-outline btn-sm" onClick={handleNewQuote} title="Yeni Teklif (Ctrl+N)">
              <PlusCircle size={16} /> Yeni
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setIsHistoryModalOpen(true)}>
              <FileText size={16} /> Geçmiş
            </button>
            <button className="btn btn-primary btn-sm" onClick={saveQuote} title="Kaydet (Ctrl+S)">
              <Save size={16} /> Kaydet
            </button>
          </div>
        </div>

        <div className="card-body">
          <QuoteInfoForm data={quoteData} onChange={updateQuoteData} />

          <div className="grid-2">
            <CustomerInfoForm
              data={customerData}
              onChange={updateCustomerData}
              onSelectCustomer={() => setIsCustomerModalOpen(true)}
            />
            <CompanyInfoForm data={companyData} onChange={updateCompanyData} />
          </div>

          <BankInfoForm
            data={bankData}
            onChange={updateBankData}
            onOpenManager={onOpenBankManager}
          />

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
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />


    </>
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

  return (
    <QuoteProvider>
      <Layout
        currentView={currentView}
        onNavigate={setCurrentView}
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
          />
        )}
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'settings' && <Settings />}
      </Layout>

      {/* Global Modals - Rendered outside Layout to avoid stacking context issues */}
      <CustomerManagerModal
        isOpen={isCustomerManagerOpen}
        onClose={() => setIsCustomerManagerOpen(false)}
      />

      <ProductManagerModal
        isOpen={isProductManagerOpen}
        onClose={() => setIsProductManagerOpen(false)}
      />

      <TemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
      />

      <DatabaseManagerModal
        isOpen={isDatabaseManagerOpen}
        onClose={() => setIsDatabaseManagerOpen(false)}
      />

      <BankManagerModal
        isOpen={isBankManagerOpen}
        onClose={() => setIsBankManagerOpen(false)}
      />

      <RecycleBinModal
        isOpen={isRecycleBinModalOpen}
        onClose={() => setIsRecycleBinModalOpen(false)}
      />

      <Toaster position="top-right" />
    </QuoteProvider>
  );
}

export default App;
