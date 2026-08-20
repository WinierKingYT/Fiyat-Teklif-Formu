import {
  FileText, PlusCircle, List,
  Users, Package, LayoutTemplate, Database, Landmark, Trash2,
  Settings, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const navItems = [
  { id: 'builder', icon: PlusCircle, labelKey: 'newQuote' },
  { id: 'history', icon: List, labelKey: 'myQuotes' },
];

const catalogItems = [
  { icon: Users, labelKey: 'customerManager', handlerIndex: 0 },
  { icon: Package, labelKey: 'productCatalog', handlerIndex: 1 },
  { icon: Landmark, labelKey: 'bankInfo', handlerIndex: 4 },
  { icon: LayoutTemplate, labelKey: 'templates', handlerIndex: 2 },
];

const systemItems = [
  { icon: Database, labelKey: 'database', handlerIndex: 3 },
  { icon: Trash2, labelKey: 'recycleBin', handlerIndex: 5 },
];

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCustomerManager: () => void;
  onOpenProductManager: () => void;
  onOpenTemplateManager: () => void;
  onOpenDatabaseManager: () => void;
  onOpenBankManager: () => void;
  onOpenRecycleBin: () => void;
  onNewQuote: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = React.memo(({
  currentView, onNavigate,
  onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
  onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin,
  onNewQuote,
  isMobileOpen, onMobileClose,
  isCollapsed = false, onToggleCollapse
}: SidebarProps) => {
  const { t } = useTranslation();

  const handleNav = (id: string) => {
    if (id === 'builder') { onNewQuote(); }
    onNavigate(id);
  };

  const handlers = [
    onOpenCustomerManager, onOpenProductManager, onOpenTemplateManager,
    onOpenDatabaseManager, onOpenBankManager, onOpenRecycleBin
  ];

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo" title={t('appName')}>
          <div className="sidebar-logo-icon">
            <FileText size={18} />
          </div>
          {!isCollapsed && (
            <div>
              <span className="sidebar-logo-text">{t('appName')}</span>
              <span className="sidebar-logo-version">v2.4</span>
            </div>
          )}
        </div>
        {onToggleCollapse && !isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
            title="Menüyü Daralt"
            aria-label="Menüyü Daralt"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── Section 1: Ana Menü ── */}
      <div className="sidebar-nav">
        {!isCollapsed && <div className="sidebar-section-label">Ana Menü</div>}
        {navItems.map(item => (
          <button type="button"
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`sidebar-nav-item ${currentView === item.id ? 'sidebar-nav-item-active' : ''}`}
            title={t(item.labelKey)}
            aria-label={t(item.labelKey)}
          >
            <item.icon size={17} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* ── Section 2: Tanımlar & Katalog ── */}
      <div className="sidebar-nav">
        {!isCollapsed && <div className="sidebar-section-label">Tanımlar & Katalog</div>}
        {catalogItems.map((item) => (
          <button type="button"
            key={item.labelKey}
            onClick={handlers[item.handlerIndex]}
            className="sidebar-nav-item"
            title={t(item.labelKey)}
            aria-label={t(item.labelKey)}
          >
            <item.icon size={17} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      {/* ── Section 3: Sistem & Araçlar ── */}
      <div className="sidebar-nav">
        {!isCollapsed && <div className="sidebar-section-label">Sistem & Araçlar</div>}
        {systemItems.map((item) => (
          <button type="button"
            key={item.labelKey}
            onClick={handlers[item.handlerIndex]}
            className="sidebar-nav-item"
            title={t(item.labelKey)}
            aria-label={t(item.labelKey)}
          >
            <item.icon size={17} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-nav">
        <button type="button"
          onClick={() => onNavigate('settings')}
          className={`sidebar-nav-item ${currentView === 'settings' ? 'sidebar-nav-item-active' : ''}`}
          title={t('settings')}
          aria-label={t('settings')}
        >
          <Settings size={17} />
          <span>{t('settings')}</span>
        </button>

        {onToggleCollapse && isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="sidebar-nav-item mt-2 text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]"
            title="Menüyü Genişlet"
            aria-label="Menüyü Genişlet"
          >
            <ChevronRight size={17} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="sidebar-footer">
          &copy; 2026 {t('appName')}
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                  <span className="sidebar-logo-version">v2.4</span>
                </div>
              </div>
              <button type="button" onClick={onMobileClose} className="sidebar-close-btn" aria-label={t('close')}>
                <X size={20} />
              </button>
            </div>
            <div className="sidebar-mobile-body">
              <div className="sidebar-nav">
                <div className="sidebar-section-label">Ana Menü</div>
                {navItems.map(item => (
                  <button type="button"
                    key={item.id}
                    onClick={() => { handleNav(item.id); onMobileClose(); }}
                    className={`sidebar-nav-item ${currentView === item.id ? 'sidebar-nav-item-active' : ''}`}
                  >
                    <item.icon size={17} />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>

              <div className="sidebar-divider" />

              <div className="sidebar-nav">
                <div className="sidebar-section-label">Tanımlar & Katalog</div>
                {catalogItems.map((item) => (
                  <button type="button"
                    key={item.labelKey}
                    onClick={() => { handlers[item.handlerIndex](); onMobileClose(); }}
                    className="sidebar-nav-item"
                  >
                    <item.icon size={17} />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>

              <div className="sidebar-divider" />

              <div className="sidebar-nav">
                <div className="sidebar-section-label">Sistem & Araçlar</div>
                {systemItems.map((item) => (
                  <button type="button"
                    key={item.labelKey}
                    onClick={() => { handlers[item.handlerIndex](); onMobileClose(); }}
                    className="sidebar-nav-item"
                  >
                    <item.icon size={17} />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>

              <div className="sidebar-divider" />

              <div className="sidebar-nav">
                <button type="button"
                  onClick={() => { onNavigate('settings'); onMobileClose(); }}
                  className="sidebar-nav-item"
                >
                  <Settings size={17} />
                  <span>{t('settings')}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
});
Sidebar.displayName = 'Sidebar';

export default Sidebar;
