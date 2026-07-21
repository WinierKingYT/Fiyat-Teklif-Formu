import React from 'react';
import { useQuote } from '../context/QuoteContext';
import { X, Plus, FileText } from 'lucide-react';

const TabBar = () => {
    const { tabs, activeTabId, switchTab, closeTab, addTab } = useQuote();

    return (
        <div className="flex items-center gap-0.5 px-3 pt-1.5 bg-[var(--color-bg-muted)] border-b border-[var(--color-border)] overflow-x-auto">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-[var(--radius)] cursor-pointer select-none transition-colors min-w-[120px] max-w-[180px] text-sm border-t border-x border-[var(--color-border)] -mb-px ${
                        activeTabId === tab.id
                            ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] font-medium z-10'
                            : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] border-transparent'
                    }`}
                    onClick={() => switchTab(tab.id)}
                >
                    <FileText size={13} className={activeTabId === tab.id ? 'text-[var(--color-primary)]' : ''} />
                    <span className="truncate text-xs flex-1">{tab.title || 'Yeni Teklif'}</span>
                    <button
                        className={`p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-hover)] transition-all ${
                            tabs.length === 1 ? 'hidden' : ''
                        }`}
                        onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                        title="Kapat"
                    >
                        <X size={11} />
                    </button>
                </div>
            ))}
            <button
                onClick={addTab}
                className="ml-0.5 p-1 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors"
                title="Yeni Sekme"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};

export default TabBar;
