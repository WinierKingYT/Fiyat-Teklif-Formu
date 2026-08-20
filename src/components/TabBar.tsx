import { X, Plus, FileText } from 'lucide-react';
import React, { useRef } from 'react';
import { useTab } from '@/context/QuoteContext';

const TabBar = React.memo(() => {
    const { tabs, activeTabId, switchTab, closeTab, addTab } = useTab();
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        const count = tabs.length;
        let next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % count;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + count) % count;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = count - 1;
        if (next >= 0) {
            e.preventDefault();
            switchTab(tabs[next].id);
            tabRefs.current[next]?.focus();
        }
    };

    return (
        <div
            role="tablist"
            aria-label="Teklif sekmeleri"
            className="flex items-center gap-1 overflow-x-auto py-0.5"
            onKeyDown={(e) => {
                const activeIndex = tabs.findIndex(tab => tab.id === activeTabId);
                if (activeIndex >= 0) handleKeyDown(e, activeIndex);
            }}
        >
            {tabs.map((tab, index) => {
                const isActive = activeTabId === tab.id;
                return (
                    <div
                        key={tab.id}
                        className={`group flex items-center px-2.5 py-1 rounded-[var(--radius)] select-none transition-all max-w-[170px] text-xs border ${
                            isActive
                                ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] font-semibold border-[var(--color-border)] shadow-xs'
                                : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] border-transparent'
                        }`}
                    >
                        <button
                            type="button"
                            role="tab"
                            id={`tab-${tab.id}`}
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            ref={el => { tabRefs.current[index] = el; }}
                            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer text-left"
                            onClick={() => switchTab(tab.id)}
                        >
                            <FileText size={12} className={isActive ? 'text-[var(--color-primary)] shrink-0' : 'text-[var(--color-text-muted)] shrink-0'} />
                            <span className="truncate text-xs flex-1">{tab.title || 'Yeni Teklif'}</span>
                        </button>
                        {tabs.length > 1 && (
                            <button
                                type="button"
                                className="p-0.5 ml-1 rounded-full opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-hover)] transition-all"
                                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                title="Kapat"
                                aria-label={`${tab.title || 'Yeni Teklif'} sekmesini kapat`}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                );
            })}
            <button
                type="button"
                onClick={addTab}
                className="p-1 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                title="Yeni Teklif Sekmesi"
                aria-label="Yeni Sekme"
            >
                <Plus size={14} />
            </button>
        </div>
    );
});
TabBar.displayName = 'TabBar';

export default TabBar;