import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import QuoteBuilder from '@/components/QuoteBuilder';
import { QuoteProvider, useQuoteData } from '@/context/QuoteContext';
import { UIProvider } from '@/context/UIContext';
import type { BankData } from '@/context/quote/types';

const Settings = lazy(() => import('@/components/Settings'));
const HistoryList = lazy(() => import('@/components/HistoryList'));
const CustomerManagerModal = lazy(() => import('@/components/CustomerManagerModal'));
const ProductManagerModal = lazy(() => import('@/components/ProductManagerModal'));
const BankManagerModal = lazy(() => import('@/components/BankManagerModal'));
const RecycleBinModal = lazy(() => import('@/components/RecycleBinModal'));

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-lg)] flex flex-col items-center gap-3 shadow-lg">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"></div>
      <p className="text-sm text-[var(--color-text-muted)]">Yükleniyor...</p>
    </div>
  </div>
);

interface BankManagerModalWithSelectProps {
  isOpen: boolean;
  onClose: () => void;
}

function BankManagerModalWithSelect({ isOpen, onClose }: BankManagerModalWithSelectProps) {
  const { updateBankData } = useQuoteData();
  const handleSelect = (bank: BankData) => {
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
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);
  const [isRecycleBinModalOpen, setIsRecycleBinModalOpen] = useState(false);

  const openCustomerManager = useCallback(() => setIsCustomerManagerOpen(true), []);
  const openProductManager = useCallback(() => setIsProductManagerOpen(true), []);
  const openDatabaseManager = useCallback(() => setCurrentView('settings'), []);
  const openBankManager = useCallback(() => setIsBankManagerOpen(true), []);
  const openRecycleBin = useCallback(() => setIsRecycleBinModalOpen(true), []);

  const closeCustomerManager = useCallback(() => setIsCustomerManagerOpen(false), []);
  const closeProductManager = useCallback(() => setIsProductManagerOpen(false), []);
  const closeBankManager = useCallback(() => setIsBankManagerOpen(false), []);
  const closeRecycleBin = useCallback(() => setIsRecycleBinModalOpen(false), []);

  return (
    <QuoteProvider>
      <UIProvider>
        <Layout
          currentView={currentView}
          onNavigate={setCurrentView}
          onOpenCustomerManager={openCustomerManager}
          onOpenProductManager={openProductManager}
          onOpenDatabaseManager={openDatabaseManager}
          onOpenBankManager={openBankManager}
          onOpenRecycleBin={openRecycleBin}
        >
          {currentView === 'builder' && (
            <div className="page-enter" key="builder">
              <QuoteBuilder
                onOpenBankManager={openBankManager}
              />
            </div>
          )}
          {currentView === 'history' && <div className="page-enter" key="history"><Suspense fallback={<ModalLoadingFallback />}><HistoryList onNavigate={setCurrentView} /></Suspense></div>}
          {currentView === 'settings' && <div className="page-enter" key="settings"><Suspense fallback={<ModalLoadingFallback />}><Settings /></Suspense></div>}
        </Layout>

        <Suspense fallback={<ModalLoadingFallback />}>
          <CustomerManagerModal
            isOpen={isCustomerManagerOpen}
            onClose={closeCustomerManager}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <ProductManagerModal
            isOpen={isProductManagerOpen}
            onClose={closeProductManager}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <BankManagerModalWithSelect
            isOpen={isBankManagerOpen}
            onClose={closeBankManager}
          />
        </Suspense>

        <Suspense fallback={<ModalLoadingFallback />}>
          <RecycleBinModal
            isOpen={isRecycleBinModalOpen}
            onClose={closeRecycleBin}
          />
        </Suspense>

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
