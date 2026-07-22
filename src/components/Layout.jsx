import React from 'react';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import StatusBar from './StatusBar';
import PdfPreviewPanel from './PdfPreviewPanel';
import { useQuote } from '../context/QuoteContext';
import { useUI } from '../context/UIContext';
import { useTranslation } from '../hooks/useTranslation';
import { Sun, Moon, Smartphone, Monitor, Download, Menu } from 'lucide-react';
import AutoSaveIndicator from './AutoSaveIndicator';

const TopBar = ({ currentView, onToggleMobile }) => {
  const { viewMode, setViewMode, isLivePreviewMode, setIsLivePreviewMode, appTheme, setAppTheme } = useUI();
  const { saveQuote } = useQuote();
  const { t } = useTranslation();

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button onClick={onToggleMobile} className="top-bar-mobile-toggle">
          <Menu size={18} />
        </button>
        {currentView === 'builder' && <TabBar />}
      </div>
      <div className="top-bar-right">
        <AutoSaveIndicator />
        <div className="top-bar-divider" />
        <button
          onClick={() => setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile')}
          className="top-bar-btn" title={viewMode === 'mobile' ? 'Masaüstü Görünümü' : 'Mobil Görünüm'}
        >
          {viewMode === 'mobile' ? <Monitor size={15} /> : <Smartphone size={15} />}
        </button>
        <button
          onClick={() => setAppTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="top-bar-btn" title={appTheme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
        >
          {appTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
          className={`top-bar-btn ${isLivePreviewMode ? 'top-bar-btn-active' : ''}`}
          title={t('pdfButton')}
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
};

const Layout = ({
  children, currentView, onNavigate,
  onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
  onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin, onOpenAnalytics,
}) => {
  const { viewMode, focusMode, setFocusMode, isLivePreviewMode } = useUI();
  const { addTab } = useQuote();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNewQuote = () => {
    addTab();
    onNavigate('builder');
  };

  return (
    <div className="app-shell">
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
            <button onClick={() => setFocusMode(false)} className="focus-mode-exit-btn">
              Odak Modundan Çık
            </button>
          </div>
        )}

        <div className="content-area">
          <div style={{ display: isLivePreviewMode ? 'none' : 'block' }}>
            {children}
          </div>

          {isLivePreviewMode && (
            <div className="live-preview-container">
              <PdfPreviewPanel />
            </div>
          )}
        </div>

        <StatusBar />
      </div>
    </div>
  );
};

export default Layout;
