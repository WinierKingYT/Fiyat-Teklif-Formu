import React from 'react';
import {
  FileText, PlusCircle, List,
  Users, Package, LayoutTemplate, Database, Landmark, Trash2, TrendingUp,
  Settings, X
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const navItems = [
  { id: 'builder', icon: PlusCircle, labelKey: 'newQuote' },
  { id: 'history', icon: List, labelKey: 'myQuotes' },
];

const managerItems = [
  { icon: Users, labelKey: 'customerManager' },
  { icon: Package, labelKey: 'productCatalog' },
  { icon: LayoutTemplate, labelKey: 'templates' },
  { icon: Database, labelKey: 'database' },
  { icon: Landmark, labelKey: 'bankInfo' },
  { icon: Trash2, labelKey: 'recycleBin' },
  { icon: TrendingUp, labelKey: 'analytics' },
];

const Sidebar = ({
  currentView, onNavigate,
  onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
  onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin, onOpenAnalytics,
  onNewQuote,
  isMobileOpen, onMobileClose
}) => {
  const { t } = useTranslation();

  const handleNav = (id) => {
    if (id === 'builder') { onNewQuote(); }
    onNavigate(id);
  };

  const handlers = [
    onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
    onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin, onOpenAnalytics
  ];

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <FileText size={20} />
          </div>
          <div>
            <span className="sidebar-logo-text">{t('appName')}</span>
            <span className="sidebar-logo-version">v2.3</span>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`sidebar-nav-item ${currentView === item.id ? 'sidebar-nav-item-active' : ''}`}
          >
            <item.icon size={18} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Yönetim</div>
        {managerItems.map((item, i) => (
          <button
            key={i}
            onClick={handlers[i]}
            className="sidebar-nav-item"
          >
            <item.icon size={18} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-nav">
        <button
          onClick={() => onNavigate('settings')}
          className={`sidebar-nav-item ${currentView === 'settings' ? 'sidebar-nav-item-active' : ''}`}
        >
          <Settings size={18} />
          <span>{t('settings')}</span>
        </button>
      </div>

      <div className="sidebar-footer">
        &copy; 2024 {t('appName')}
      </div>
    </>
  );

  return (
    <>
      <aside className="sidebar">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={onMobileClose}>
          <aside className="sidebar-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="sidebar-mobile-header">
              <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="sidebar-logo-text">{t('appName')}</span>
                  <span className="sidebar-logo-version">v2.3</span>
                </div>
              </div>
              <button onClick={onMobileClose} className="sidebar-close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="sidebar-mobile-body">
              <div className="sidebar-nav">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { handleNav(item.id); onMobileClose(); }}
                    className={`sidebar-nav-item ${currentView === item.id ? 'sidebar-nav-item-active' : ''}`}
                  >
                    <item.icon size={18} />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
              <div className="sidebar-divider" />
              <div className="sidebar-nav">
                {managerItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { handlers[i](); onMobileClose(); }}
                    className="sidebar-nav-item"
                  >
                    <item.icon size={18} />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
              <div className="sidebar-divider" />
              <div className="sidebar-nav">
                <button
                  onClick={() => { onNavigate('settings'); onMobileClose(); }}
                  className="sidebar-nav-item"
                >
                  <Settings size={18} />
                  <span>{t('settings')}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
