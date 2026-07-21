import React from 'react';
import { Users, Package, LayoutTemplate, Database, Landmark, History, Trash2, LayoutGrid, X } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useTranslation } from '../hooks/useTranslation';

const QuickActions = ({
    onOpenHistory,
    onOpenAnalytics,
    onOpenCustomerManager,
    onOpenProductManager,
    onOpenTemplateManager,
    onOpenDatabaseManager,
    onOpenBankManager,
    onOpenRecycleBin,
    onFillTestData,
    extraActions
}) => {
    const { quoteData } = useQuote();
    const { t } = useTranslation(quoteData?.language);
    const [isOpen, setIsOpen] = React.useState(false);

    const actions = [
        { icon: Users, labelKey: 'customerManager', count: null, onClick: onOpenCustomerManager },
        { icon: Package, labelKey: 'productCatalog', count: null, onClick: onOpenProductManager },
        { icon: LayoutTemplate, labelKey: 'templates', count: null, onClick: onOpenTemplateManager },
        { icon: Database, labelKey: 'database', count: null, onClick: onOpenDatabaseManager },
        { icon: Landmark, labelKey: 'bankInfo', count: null, onClick: onOpenBankManager },
        { icon: History, labelKey: 'myQuotes', count: null, onClick: onOpenHistory },
        { icon: Trash2, labelKey: 'recycleBin', count: null, onClick: onOpenRecycleBin },
        { icon: Database, labelKey: 'testData', count: null, onClick: onFillTestData, className: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20' },
    ];

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 font-medium text-sm ${isOpen
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-300 dark:shadow-none'
                    : 'bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] shadow-sm'
                    }`}
            >
                {isOpen ? <X size={18} /> : <LayoutGrid size={18} />}
                <span>{isOpen ? t('close') : t('tools')}</span>
            </button>

            {/* Collapsible Slider Container */}
            <div
                className={`flex items-center gap-2 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-w-[1200px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-4'
                    }`}
            >
                <div className="quick-actions flex items-center gap-2 p-1">
                    {actions.map((action, index) => (
                        <div key={index} className={`quick-action ${action.className || ''}`} onClick={action.onClick} style={{ minWidth: 'max-content' }}>
                            <action.icon size={20} />
                            <div className="text-sm">{t(action.labelKey)}</div>
                            {action.count !== null && (
                                <span className="quick-action-badge">{action.count}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider if actions are open or if extra actions exist */}
            {extraActions && (
                <div className="h-8 w-px bg-[var(--color-border)] mx-1"></div>
            )}

            {/* Extra Actions (Always Visible, e.g. Split View) */}
            {extraActions && (
                <div className="flex gap-2 items-center">
                    {extraActions}
                </div>
            )}
        </div>
    );
};

export default QuickActions;
