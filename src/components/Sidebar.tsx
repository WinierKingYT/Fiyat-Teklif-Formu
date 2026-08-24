import {
  FileText, PlusCircle, List,
  Users, Package, LayoutTemplate, Database, Landmark, Trash2,
  Settings, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useQuoteData } from '@/context/QuoteContext';
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
  const { quoteData, customerData, companyData, items } = useQuoteData();

  const completion = useMemo(() => {
    const check = (v: unknown) => v !== undefined && v !== null && v !== '';
    // Teklif bilgileri: title, number, date, validUntil, currency
    const quoteFields = [quoteData.title, quoteData.number, quoteData.date, quoteData.validUntil, quoteData.currency];
    const quoteFilled = quoteFields.filter(check).length;
    // Müşteri: name, company, email, phone
    const custFields = [customerData.name, customerData.company, customerData.email, customerData.phone];
    const custFilled = custFields.filter(check).length;
    // Firma: name, authorized, phone, email
    const compFields = [companyData.name, companyData.authorized, companyData.phone, companyData.email];
    const compFilled = compFields.filter(check).length;
    // Kalemler: en az 1 kalem ve tamamının ismi var mı
    const itemsFilled = items.length > 0 ? items.filter(i => check(i.name)).length : 0;
    const itemsTotal = Math.max(items.length, 1);
    // Şartlar & notlar: terms, notes
    const termsFields = [quoteData.terms, quoteData.notes];
    const termsFilled = termsFields.filter(check).length;

    const totalFilled = quoteFilled + custFilled + compFilled + itemsFilled + termsFilled;
    const totalFields = quoteFields.length + custFields.length + compFields.length + itemsTotal + termsFields.length;
    const pct = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

    return {
      quote: { filled: quoteFilled, total: quoteFields.length },
      customer: { filled: custFilled, total: custFields.length },
      company: { filled: compFilled, total: compFields.length },
      items: { filled: itemsFilled, total: itemsTotal },
      terms: { filled: termsFilled, total: termsFields.length },
      pct,
    };
  }, [quoteData, customerData, companyData, items]);

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
            title={t('collapseMenu') || 'Menüyü Daralt'}
            aria-label={t('collapseMenu') || 'Menüyü Daralt'}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── Section 1: Ana Menü ── */}
      <div className="sidebar-nav">
        {!isCollapsed && <div className="sidebar-section-label">{t('navMainMenu') || 'Ana Menü'}</div>}
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
        {!isCollapsed && <div className="sidebar-section-label">{t('navCatalog') || 'Tanımlar & Katalog'}</div>}
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
        {!isCollapsed && <div className="sidebar-section-label">{t('navSystem') || 'Sistem & Araçlar'}</div>}
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

      {/* Faz4: Sidebar completion indicator — gerçek form doluluk rozetleri */}
      {!isCollapsed && currentView === 'builder' && (
        <div className="px-3 pb-2 space-y-1.5" aria-label={t('completionRate') || 'Doluluk göstergesi'}>
          <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            {t('completionRate') || 'Doluluk'} — {completion.pct}%
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completion.pct}%`,
                backgroundColor: completion.pct === 100 ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            />
          </div>
          {/* Section mini badges */}
          <div className="space-y-0.5" role="status" aria-live="polite">
            {([
              { key: 'quoteInfoCompletion', data: completion.quote },
              { key: 'customerCompletion', data: completion.customer },
              { key: 'companyCompletion', data: completion.company },
              { key: 'itemsCompletion', data: completion.items },
              { key: 'termsCompletion', data: completion.terms },
            ] as const).map(({ key, data }) => (
              <div key={key} className="flex items-center justify-between text-[9px] text-[var(--color-text-muted)]">
                <span>{t(key)}</span>
                {data.filled === data.total ? (
                  <span className="text-[var(--color-success)] font-semibold">✓</span>
                ) : (
                  <span className="font-mono tabular-nums">{data.filled}/{data.total}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
            title={t('expandMenu') || 'Menüyü Genişlet'}
            aria-label={t('expandMenu') || 'Menüyü Genişlet'}
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
