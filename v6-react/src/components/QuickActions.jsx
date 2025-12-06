import React from 'react';
import { Users, Package, LayoutTemplate, Database, Landmark, History, Trash2, LayoutGrid, X } from 'lucide-react';

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
    const [isOpen, setIsOpen] = React.useState(false);

    const actions = [
        { icon: Users, label: 'Müşteri Yönetimi', count: null, onClick: onOpenCustomerManager },
        { icon: Package, label: 'Ürün Kataloğu', count: null, onClick: onOpenProductManager },
        { icon: LayoutTemplate, label: 'Şablonlar', count: null, onClick: onOpenTemplateManager },
        { icon: Database, label: 'Veritabanı', count: null, onClick: onOpenDatabaseManager },
        { icon: Landmark, label: 'Banka Bilgileri', count: null, onClick: onOpenBankManager },
        { icon: History, label: 'Tekliflerim', count: null, onClick: onOpenHistory },
        { icon: Trash2, label: 'Geri Dönüşüm', count: null, onClick: onOpenRecycleBin },
        { icon: Database, label: 'Test Verisi', count: null, onClick: onFillTestData, className: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
    ];

    return (
        <div className="flex items-center gap-3">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isOpen
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-300 dark:shadow-none'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                    }`}
            >
                {isOpen ? <X size={20} /> : <LayoutGrid size={20} />}
                <span>{isOpen ? 'Kapat' : 'Araçlar'}</span>
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
                            <div className="text-sm">{action.label}</div>
                            {action.count !== null && (
                                <span className="quick-action-badge">{action.count}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider if actions are open or if extra actions exist */}
            {extraActions && (
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
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
