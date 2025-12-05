import React from 'react';
import { Users, Package, LayoutTemplate, Database, Landmark, History, BarChart3, Trash2 } from 'lucide-react';

const QuickActions = ({
    onOpenHistory,
    onOpenAnalytics,
    onOpenCustomerManager,
    onOpenProductManager,
    onOpenTemplateManager,
    onOpenDatabaseManager,
    onOpenBankManager,
    onOpenRecycleBin
}) => {
    const actions = [
        { icon: Users, label: 'Müşteri Yönetimi', count: null, onClick: onOpenCustomerManager },
        { icon: Package, label: 'Ürün Kataloğu', count: null, onClick: onOpenProductManager },
        { icon: LayoutTemplate, label: 'Şablonlar', count: null, onClick: onOpenTemplateManager },
        { icon: Database, label: 'Veritabanı', count: null, onClick: onOpenDatabaseManager },
        { icon: Landmark, label: 'Banka Bilgileri', count: null, onClick: onOpenBankManager },
        { icon: History, label: 'Tekliflerim', count: null, onClick: onOpenHistory },
        { icon: Trash2, label: 'Geri Dönüşüm', count: null, onClick: onOpenRecycleBin },
    ];

    return (
        <div className="quick-actions">
            {actions.map((action, index) => (
                <div key={index} className="quick-action" onClick={action.onClick}>
                    <action.icon size={24} />
                    <div>{action.label}</div>
                    {action.count !== null && (
                        <span className="quick-action-badge">{action.count}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default QuickActions;
