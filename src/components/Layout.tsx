import { Sun, Moon, Download, Menu } from 'lucide-react';
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import AutoSaveIndicator from '@/components/AutoSaveIndicator';
import Sidebar from '@/components/Sidebar';
import TabBar from '@/components/TabBar';
import { useQuoteData, useTab } from '@/context/QuoteContext';
import { useUI } from '@/context/UIContext';
import { useTranslation } from '@/hooks/useTranslation';

const PdfPreviewPanel = lazy(() => import('@/components/PdfPreviewPanel'));

interface TopBarProps {
  currentView: string;
  onToggleMobile: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const TopBar = React.memo(({ currentView, onToggleMobile }: TopBarProps) => {
  const { isLivePreviewMode, setIsLivePreviewMode, appTheme, setAppTheme } = useUI();
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button type="button" onClick={onToggleMobile} className="top-bar-mobile-toggle" aria-label="Menüyü Aç/Kapat">
          <Menu size={18} />
        </button>
        {currentView === 'builder' && <TabBar />}
      </div>
      <div className="top-bar-right">
        {installPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="top-bar-btn flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-semibold border border-[var(--color-primary)]/30 rounded px-2 py-1 bg-[var(--color-primary-muted)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            title={t('installApp') || 'Uygulamayı Yükle'}
          >
            <Download size={13} />
            <span className="hidden sm:inline">{t('installApp') || 'Uygulamayı Yükle'}</span>
          </button>
        )}
        <AutoSaveIndicator />
        <div className="top-bar-divider" />
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
}

const Layout = React.memo(({
  children, currentView, onNavigate,
  onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
  onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin,
}: LayoutProps) => {
  const { focusMode, setFocusMode, isLivePreviewMode } = useUI();
  const { addTab } = useTab();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

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
        onNewQuote={handleNewQuote}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
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
      </div>
    </div>
  );
});
TopBar.displayName = 'TopBar';
Layout.displayName = 'Layout';

export default Layout;
