import {
  Landmark, Building2, Tag, LogOut,
  StickyNote, Columns2, Calendar, Hash, Clock, Sparkles, Settings2
} from 'lucide-react';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { toast } from 'react-hot-toast';
import CompanyInfoForm from '@/components/CompanyInfoForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import CustomerInfoForm from '@/components/CustomerInfoForm';
import CustomFieldsSection from '@/components/CustomFieldsSection';
import ItemsTable from '@/components/ItemsTable';
import { QuoteNumberConfigModal } from '@/components/quote-number';
import SummarySection from '@/components/SummarySection';
import { getDefaultQuoteNumberConfig } from '@/context/quote/initialState';
import { useQuoteData, useTab } from '@/context/QuoteContext';
import { useUI } from '@/context/UIContext';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import Logger from '@/utils/logger';
import { generateNextQuoteNumber } from '@/utils/numberGenerator';
import type { Customer, Product, QuoteItem, QuoteNumberConfig } from '@/context/quote/types';

const TermsAndNotes = lazy(() => import('@/components/TermsAndNotes'));
const BankInfoForm = lazy(() => import('@/components/BankInfoForm'));
const CustomerManagerModal = lazy(() => import('@/components/CustomerManagerModal'));
const ProductManagerModal = lazy(() => import('@/components/ProductManagerModal'));
const PdfPreviewPanel = lazy(() => import('@/components/PdfPreviewPanel'));

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-lg)] flex flex-col items-center gap-3 shadow-lg">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"></div>
      <p className="text-sm text-[var(--color-text-muted)]">Yükleniyor...</p>
    </div>
  </div>
);

export interface QuoteBuilderProps {
  onOpenBankManager?: () => void;
}

export const QuoteBuilder = React.memo(({
  onOpenBankManager,
}: QuoteBuilderProps) => {
  const {
    quoteData, updateQuoteData,
    customerData, updateCustomerData, setCustomerData,
    companyData, updateCompanyData,
    items, setItems,
    discount, setDiscount,
    bankData, updateBankData,
    saveQuote,
    resetQuote,
    db
  } = useQuoteData();
  const { undo, redo, addTab } = useTab();

  const { setIsLivePreviewMode, splitPreviewMode, setSplitPreviewMode } = useUI();

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isNumberConfigModalOpen, setIsNumberConfigModalOpen] = useState(false);
  const [numberConfig, setNumberConfig] = useState<QuoteNumberConfig>(getDefaultQuoteNumberConfig);
  const [activeSideTab, setActiveSideTab] = useState<'terms' | 'bank' | 'company' | 'custom'>('terms');
  const [confirmReset, setConfirmReset] = useState(false);

  // Load quote number config from IndexedDB
  useEffect(() => {
    if (!db) return;
    const loadConfig = async () => {
      try {
        const saved = await db.get<QuoteNumberConfig>('settings', 'quote_number_config');
        if (saved) {
          setNumberConfig(saved);
        }
      } catch (err) {
        Logger.error('Error loading quote number config:', err);
      }
    };
    loadConfig();
  }, [db]);

  const handleSaveShortcut = () => { saveQuote(); };
  const handlePdfShortcut = () => { setIsLivePreviewMode(prev => !prev); };
  const handleNewQuote = async () => { addTab(); };

  const handleAutoGenerateQuoteNumber = async () => {
    try {
      const { formattedNumber, updatedConfig } = generateNextQuoteNumber(numberConfig);
      updateQuoteData('number', formattedNumber);
      setNumberConfig(updatedConfig);
      if (db) {
        await db.put('settings', { id: 'quote_number_config', key: 'quote_number_config', ...updatedConfig });
      }
      toast.success(`Teklif No oluşturuldu: ${formattedNumber}`);
    } catch (err) {
      Logger.error('Error generating quote number:', err);
      toast.error('Teklif numarası oluşturulamadı');
    }
  };

  const handleSaveNumberConfig = async (newConfig: QuoteNumberConfig) => {
    setNumberConfig(newConfig);
    if (db) {
      try {
        await db.put('settings', { id: 'quote_number_config', key: 'quote_number_config', ...newConfig });
      } catch (err) {
        Logger.error('Error saving quote number config:', err);
      }
    }
  };

  useKeyboardShortcuts({
    onSave: handleSaveShortcut,
    onPdf: handlePdfShortcut,
    onNew: handleNewQuote,
    onUndo: undo,
    onRedo: redo
  });

  const handleCustomerSelect = (customer: Partial<Customer> & { taxOffice?: string; taxNumber?: string; taxNo?: string }) => {
    setCustomerData({
      name: customer.name || '',
      company: customer.company || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxOffice: customer.taxOffice || '',
      taxNumber: customer.taxNumber || customer.taxNo || ''
    });
    toast.success('Müşteri bilgileri yüklendi');
  };

  const handleProductSelect = (products: Product | Product[]) => {
    const productList = Array.isArray(products) ? products : [products];
    const newItems: QuoteItem[] = productList.map(product => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: product.name || '',
      description: product.description || '',
      quantity: 1,
      unit: product.unit || 'Adet',
      price: Number(product.price) || 0,
      taxRate: product.taxRate !== undefined && product.taxRate !== null && !isNaN(Number(product.taxRate)) ? Number(product.taxRate) : 20,
      discountRate: 0,
      total: Number(product.price) || 0,
      image: product.image ?? undefined
    }));
    setItems(prev => [...prev, ...newItems]);
    toast.success(`${newItems.length} ürün eklendi`);
  };

  return (
    <div className="fade-in-up">
      {/* ─── HEADER BAR (Ultra-sleek Meta Strip) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)]">
        {/* Metadata Inputs (Teklif No, Tarih, Vade) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Teklif No + Auto Generate */}
          <div className="flex items-center gap-1 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius)] px-2 py-1 text-xs">
            <Hash size={12} className="text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={quoteData.number || ''}
              onChange={(e) => updateQuoteData('number', e.target.value)}
              placeholder="Teklif No"
              className="bg-transparent border-0 outline-none w-24 text-xs font-mono font-bold text-[var(--color-text)]"
              aria-label="Teklif Numarası"
            />
            <button
              type="button"
              onClick={handleAutoGenerateQuoteNumber}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-0.5 transition-colors"
              title="Otomatik Numara Üret"
              aria-label="Otomatik Numara Üret"
            >
              <Sparkles size={11} />
            </button>
            <button
              type="button"
              onClick={() => setIsNumberConfigModalOpen(true)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] p-0.5 transition-colors"
              title="Numaratör Ayarları (Şablon & Sayaç)"
              aria-label="Numaratör Ayarları"
            >
              <Settings2 size={11} />
            </button>
          </div>

          {/* Tarih */}
          <div className="flex items-center gap-1 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius)] px-2 py-1 text-xs">
            <Calendar size={12} className="text-[var(--color-text-muted)]" />
            <input
              type="date"
              value={quoteData.date || ''}
              onChange={(e) => updateQuoteData('date', e.target.value)}
              className="bg-transparent border-0 outline-none text-xs font-medium text-[var(--color-text)] cursor-pointer"
              aria-label="Teklif Tarihi"
            />
          </div>

          {/* Vade / Geçerlilik Gün Sayısı + Quick Presets */}
          <div className="flex items-center gap-1 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius)] px-1.5 py-1 text-xs">
            <Clock size={12} className="text-[var(--color-text-muted)]" />
            <input
              type="number"
              min="1"
              max="365"
              value={quoteData.validUntilDays || '10'}
              onChange={(e) => updateQuoteData('validUntilDays', e.target.value)}
              className="bg-transparent border-0 outline-none w-7 text-xs font-semibold text-[var(--color-text)] text-center"
              aria-label="Geçerlilik Gün Sayısı"
            />
            <span className="text-[var(--color-text-muted)] text-[10px] mr-1">gün</span>
            <div className="flex gap-0.5 border-l border-[var(--color-border)] pl-1">
              {[7, 15, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => updateQuoteData('validUntilDays', String(days))}
                  className={`px-1 py-0.2 text-[9px] rounded font-medium transition-colors ${String(quoteData.validUntilDays) === String(days) ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'}`}
                  title={`${days} gün geçerli`}
                >
                  +{days}
                </button>
              ))}
            </div>
          </div>

          {/* Para Birimi Pills */}
          <div className="flex items-center bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-[var(--radius)] p-0.5 text-xs font-semibold">
            {[
              { code: 'TRY', symbol: '₺' },
              { code: 'USD', symbol: '$' },
              { code: 'EUR', symbol: '€' },
              { code: 'GBP', symbol: '£' },
            ].map(({ code, symbol }) => (
              <button
                key={code}
                type="button"
                onClick={() => updateQuoteData('currency', code)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${(quoteData.currency || 'TRY') === code ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-2xs' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                title={code}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Split Screen Button (Large Screens) */}
          <button
            type="button"
            onClick={() => setSplitPreviewMode(prev => !prev)}
            className={`top-bar-btn hidden xl:flex items-center gap-1 text-xs px-2.5 ${splitPreviewMode ? 'top-bar-btn-active bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold' : ''}`}
            title="Canlı Yan Yana PDF Önizleme"
            aria-label="Canlı Yan Yana PDF Önizleme"
          >
            <Columns2 size={14} />
            <span>Canlı PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="top-bar-btn text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
            title="Teklifi Sıfırla"
            aria-label="Teklifi Sıfırla"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* ─── MAIN BUILDER CONTAINER ─── */}
      <div className={splitPreviewMode ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 items-start' : 'grid grid-cols-1 gap-3'}>
        {/* Forms Area – Faz4: lg grid desteği */}
        <div className={splitPreviewMode ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-3 gap-3 items-start'}>
          {/* ── LEFT COLUMN ── */}
          <div className={splitPreviewMode ? 'space-y-3' : 'lg:col-span-2 space-y-3'}>
            {/* Müşteri Bilgisi */}
            <CustomerInfoForm
              data={customerData}
              onChange={updateCustomerData}
              onSelectCustomer={() => setIsCustomerModalOpen(true)}
            />

            {/* Kalemler */}
            <ItemsTable
              items={items}
              onItemsChange={setItems}
              onAddProduct={() => setIsProductModalOpen(true)}
              currency={quoteData.currency}
            />

            {/* ─── EK BİLGİLER & ŞARTLAR (Under items table) ─── */}
            <div className="card">
              <div className="card-header border-b border-[var(--color-border)] p-1.5">
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => setActiveSideTab('terms')}
                    className={`flex-1 py-1 px-2 text-xs font-semibold rounded-[var(--radius)] transition-colors flex items-center justify-center gap-1.5 ${
                      activeSideTab === 'terms'
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <StickyNote size={13} />
                    <span>Şartlar & Notlar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSideTab('bank')}
                    className={`flex-1 py-1 px-2 text-xs font-semibold rounded-[var(--radius)] transition-colors flex items-center justify-center gap-1.5 ${
                      activeSideTab === 'bank'
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <Landmark size={13} />
                    <span>Banka</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSideTab('company')}
                    className={`flex-1 py-1 px-2 text-xs font-semibold rounded-[var(--radius)] transition-colors flex items-center justify-center gap-1.5 ${
                      activeSideTab === 'company'
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <Building2 size={13} />
                    <span>Firma</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSideTab('custom')}
                    className={`flex-1 py-1 px-2 text-xs font-semibold rounded-[var(--radius)] transition-colors flex items-center justify-center gap-1.5 ${
                      activeSideTab === 'custom'
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <Tag size={13} />
                    <span>Özel Alanlar</span>
                  </button>
                </div>
              </div>

              <div className="card-body p-3">
                {activeSideTab === 'terms' && (
                  <Suspense fallback={<div className="text-sm text-[var(--color-text-muted)]">Yükleniyor...</div>}>
                    <TermsAndNotes data={quoteData} onChange={updateQuoteData} />
                  </Suspense>
                )}
                {activeSideTab === 'bank' && (
                  <Suspense fallback={<div className="text-sm text-[var(--color-text-muted)]">Yükleniyor...</div>}>
                    <BankInfoForm data={bankData} onChange={updateBankData} onOpenManager={onOpenBankManager} />
                  </Suspense>
                )}
                {activeSideTab === 'company' && (
                  <CompanyInfoForm data={companyData} onChange={updateCompanyData} />
                )}
                {activeSideTab === 'custom' && <CustomFieldsSection />}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (Financial Summary + CTAs + Live Preview) ── */}
          <div className={splitPreviewMode ? 'space-y-3' : 'lg:sticky lg:top-3 space-y-3'}>
            <SummarySection
              items={items}
              discount={discount}
              onDiscountChange={setDiscount}
              currency={quoteData.currency}
              showAmountInWords={quoteData.showAmountInWords}
              onToggleAmountInWords={(val) => updateQuoteData('showAmountInWords', val)}
              onSaveQuote={saveQuote}
              onPreviewPdf={() => setIsLivePreviewMode(true)}
            />
          </div>
        </div>

        {/* ── SPLIT-SCREEN LIVE PDF PREVIEW (Right Side on XL) ── */}
        {splitPreviewMode && (
          <div className="hidden xl:block xl:sticky xl:top-3 h-[calc(100vh-80px)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-card)]">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"></div>
              </div>
            }>
              <PdfPreviewPanel />
            </Suspense>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        title="Teklifi Sıfırla"
        message="Tüm veriler silinecek ve yeni bir teklif başlatılacak. Devam etmek istediğinize emin misiniz?"
        onConfirm={async () => { setConfirmReset(false); await resetQuote(); }}
        onCancel={() => setConfirmReset(false)}
        variant="danger"
      />
      <Suspense fallback={<ModalLoadingFallback />}>
        <CustomerManagerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSelect={handleCustomerSelect}
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <ProductManagerModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSelect={handleProductSelect}
        />
      </Suspense>

      <QuoteNumberConfigModal
        isOpen={isNumberConfigModalOpen}
        onClose={() => setIsNumberConfigModalOpen(false)}
        config={numberConfig}
        onSaveConfig={handleSaveNumberConfig}
        onApplyNumber={(newNum) => updateQuoteData('number', newNum)}
      />
    </div>
  );
});

QuoteBuilder.displayName = 'QuoteBuilder';
export default QuoteBuilder;
