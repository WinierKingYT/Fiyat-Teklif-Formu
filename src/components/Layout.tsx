import { Sun, Moon, Download, Menu, Palette, Check, Columns } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import AutoSaveIndicator from '@/components/AutoSaveIndicator';
import Sidebar from '@/components/Sidebar';
import { useTab } from '@/context/QuoteContext';
import { useUI, type AppColor } from '@/context/UIContext';
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

const QUICK_COLORS: { id: AppColor; nameKey: string; name: string; color: string }[] = [
  { id: 'blue', nameKey: 'oceanBlue', name: 'Okyanus Mavisi', color: '#2563eb' },
  { id: 'indigo', nameKey: 'modernIndigo', name: 'Modern İndigo', color: '#4f46e5' },
  { id: 'slate', nameKey: 'corporateGray', name: 'Kurumsal Gri', color: '#475569' },
  { id: 'emerald', nameKey: 'emeraldGreen', name: 'Zümrüt Yeşili', color: '#10b981' },
  { id: 'teal', nameKey: 'petrolTeal', name: 'Petrol Turkuazı', color: '#0d9488' },
  { id: 'cyan', nameKey: 'skyCyan', name: 'Gök Mavisi', color: '#0284c7' },
  { id: 'violet', nameKey: 'royalPurple', name: 'Asil Mor', color: '#8b5cf6' },
  { id: 'amber', nameKey: 'sunset', name: 'Gün Batımı', color: '#f59e0b' },
  { id: 'rose', nameKey: 'rosePink', name: 'Gül Kurusu', color: '#f43f5e' },
];

const TopBar = React.memo(({ currentView, onToggleMobile }: TopBarProps) => {
  const { isLivePreviewMode, setIsLivePreviewMode, splitPreviewMode, setSplitPreviewMode, appTheme, setAppTheme, appColor, setAppColor } = useUI();
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setColorMenuOpen(false);
      }
    };
    if (colorMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [colorMenuOpen]);

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
        <button type="button" onClick={onToggleMobile} className="top-bar-mobile-toggle" aria-label={t('menuToggle')}>
          <Menu size={18} />
        </button>
        {currentView === 'builder' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] inline-block"></span>
            <span className="hidden sm:inline">{t('quoteBuilder') || 'Teklif Oluşturucu'}</span>
          </div>
        )}
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
        
        {/* Quick Color Switcher */}
        <div className="relative" ref={colorMenuRef}>
          <button
            type="button"
            onClick={() => setColorMenuOpen(!colorMenuOpen)}
            className={`top-bar-btn ${colorMenuOpen ? 'top-bar-btn-active' : ''}`}
            title={t('quickThemeChange') || 'Hızlı Renk Değiştir'}
            aria-label={t('quickThemeChange') || 'Hızlı Renk Değiştir'}
          >
            <Palette size={15} />
          </button>
          {colorMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 p-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-lg z-50 w-52">
              <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-1">
                {t('appColor')}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => { setAppColor(c.id); setColorMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all hover:scale-105 ${
                      appColor === c.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)] ring-1 ring-[var(--color-primary)]'
                        : 'border-transparent hover:bg-[var(--color-bg-hover)]'
                    }`}
                    title={t(c.nameKey) || c.name}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: c.color }}
                    >
                      {appColor === c.id && <Check size={11} className="text-white stroke-[3]" />}
                    </div>
                    <span className="text-[9px] font-medium text-[var(--color-text)] mt-1 truncate w-full text-center">
                      {t(c.nameKey) || c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="button"
          onClick={() => setAppTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="top-bar-btn" title={appTheme === 'dark' ? t('lightMode') : t('darkMode')}
          aria-label={appTheme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {appTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button type="button"
          onClick={() => setSplitPreviewMode(prev => !prev)}
          className={`top-bar-btn hidden xl:inline-flex ${splitPreviewMode ? 'top-bar-btn-active' : ''}`}
          title={t('splitViewToggle') || 'Bölünmüş Ekran'}
          aria-label={t('splitViewToggle') || 'Bölünmüş Ekran'}
          aria-pressed={splitPreviewMode}
        >
          <Columns size={15} />
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
          <span className="top-bar-btn text-[var(--color-warning)] text-xs font-semibold" title={t('offlineMode')}>
            ⚡ {t('offline')}
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
  onOpenDatabaseManager: () => void;
  onOpenBankManager: () => void;
  onOpenRecycleBin: () => void;
}

const Layout = React.memo(({
  children, currentView, onNavigate,
  onOpenCustomerManager, onOpenProductManager,
  onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin,
}: LayoutProps) => {
  const { focusMode, setFocusMode, isLivePreviewMode, splitPreviewMode } = useUI();
  const { t } = useTranslation();
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

  const isSplitActive = splitPreviewMode && currentView === 'builder';

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenCustomerManager={onOpenCustomerManager}
        onOpenProductManager={onOpenProductManager}
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
              {t('exitFocusMode')}
            </button>
          </div>
        )}

        <div className="content-area" id="main-content">
          {isSplitActive ? (
            /* ── Split View: Form (sol) + PDF Preview (sağ) ── */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 h-full">
              <div className="overflow-y-auto border-r border-[var(--color-border)]">
                {children}
              </div>
              <div className="overflow-y-auto hidden xl:block">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-border)] border-t-[var(--color-primary)]"></div>
                  </div>
                }>
                  <div className="live-preview-container">
                    <PdfPreviewPanel />
                  </div>
                </Suspense>
              </div>
            </div>
          ) : (
            /* ── Normal Mode ── */
            <>
              {!isLivePreviewMode && children}

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
            </>
          )}
        </div>
      </div>
    </div>
  );
});
TopBar.displayName = 'TopBar';
Layout.displayName = 'Layout';

export default Layout;
