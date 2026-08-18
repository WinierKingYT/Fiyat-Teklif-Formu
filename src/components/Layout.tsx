import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import StatusBar from './StatusBar';

const PdfPreviewPanel = lazy(() => import('./PdfPreviewPanel'));
import { useQuoteData, useTab } from '../context/QuoteContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../hooks/useTranslation';
import { Sun, Moon, Smartphone, Monitor, Download, Menu } from 'lucide-react';
import AutoSaveIndicator from './AutoSaveIndicator';

interface TopBarProps {
  currentView: string;
  onToggleMobile: () => void;
}

const TopBar = React.memo(({ currentView, onToggleMobile }: TopBarProps) => {
  const { viewMode, setViewMode, isLivePreviewMode, setIsLivePreviewMode, appTheme, setAppTheme } = useUI();
  const { saveQuote } = useQuoteData();
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button type="button" onClick={onToggleMobile} className="top-bar-mobile-toggle" aria-label="Menüyü Aç/Kapat">
          <Menu size={18} />
        </button>
        {currentView === 'builder' && <TabBar />}
      </div>
      <div className="top-bar-right">
        <AutoSaveIndicator />
        <div className="top-bar-divider" />
        <button type="button"
          onClick={() => setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile')}
          className="top-bar-btn" title={viewMode === 'mobile' ? 'Masaüstü Görünümü' : 'Mobil Görünüm'}
          aria-label={viewMode === 'mobile' ? 'Masaüstü Görünümü' : 'Mobil Görünüm'}
        >
          {viewMode === 'mobile' ? <Monitor size={15} /> : <Smartphone size={15} />}
        </button>
        <button type="button"
          onClick={() => setAppTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="top-bar-btn" title={appTheme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
          aria-label={appTheme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
        >
          {appTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button type="button"
          onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
          className={`top-bar-btn ${isLivePreviewMode ? 'top-bar-btn-active' : ''}`}
          title={t('pdfButton')}
          aria-label={t('pdfButton') || 'PDF Önizleme'}
        >
          <Download size={15} />
        </button>
        {isOffline && (
          <span className="top-bar-btn text-[var(--color-warning)] text-xs font-semibold" title="Çevrimdışı mod">
            ⚡ Çevrimdışı
          </span>
        )}
      </div>
    </div>
  );
});

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCustomerManager: () => void;
  onOpenProductManager: () => void;
  onOpenTemplateManager: () => void;
  onOpenDatabaseManager: () => void;
  onOpenBankManager: () => void;
  onOpenRecycleBin: () => void;
  onOpenAnalytics: () => void;
}

const Layout = React.memo(({
  children, currentView, onNavigate,
  onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
  onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin, onOpenAnalytics,
}: LayoutProps) => {
  const { viewMode, focusMode, setFocusMode, isLivePreviewMode } = useUI();
  const { addTab } = useTab();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNewQuote = () => {
    addTab();
    onNavigate('builder');
  };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        İçeriğe atla
      </a>
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenCustomerManager={onOpenCustomerManager}
        onOpenProductManager={onOpenProductManager}
        onOpenTemplateManager={onOpenTemplateManager}
        onOpenDatabaseManager={onOpenDatabaseManager}
        onOpenBankManager={onOpenBankManager}
        onOpenRecycleBin={onOpenRecycleBin}
        onOpenAnalytics={onOpenAnalytics}
        onNewQuote={handleNewQuote}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-area">
        {!focusMode && (
          <TopBar
            currentView={currentView}
            onToggleMobile={() => setIsMobileSidebarOpen(prev => !prev)}
          />
        )}

        {focusMode && (
          <div className="focus-mode-bar">
            <button type="button" onClick={() => setFocusMode(false)} className="focus-mode-exit-btn">
              Odak Modundan Çık
            </button>
          </div>
        )}

        <div className="content-area" id="main-content">
          <div style={{ display: isLivePreviewMode ? 'none' : 'block' }}>
            {children}
          </div>

          {isLivePreviewMode && (
            <Suspense fallback={
              <div className="live-preview-container flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"></div>
              </div>
            }>
              <div className="live-preview-container">
                <PdfPreviewPanel />
              </div>
            </Suspense>
          )}
        </div>

        <StatusBar />
      </div>
    </div>
  );
});
TopBar.displayName = 'TopBar';
Layout.displayName = 'Layout';

export default Layout;
