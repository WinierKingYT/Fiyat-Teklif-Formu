import React, { useRef } from 'react';
import { useTab } from '../context/QuoteContext';
import { X, Plus, FileText } from 'lucide-react';

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
            className="flex items-center gap-0.5 px-3 pt-1.5 bg-[var(--color-bg-muted)] border-b border-[var(--color-border)] overflow-x-auto"
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
                        className={`group flex items-center px-3 py-1.5 rounded-t-[var(--radius)] select-none transition-colors min-w-[120px] max-w-[180px] text-sm border-t border-x border-[var(--color-border)] -mb-px ${
                            isActive
                                ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] font-medium z-10'
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
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                            onClick={() => switchTab(tab.id)}
                        >
                            <FileText size={13} className={isActive ? 'text-[var(--color-primary)] shrink-0' : 'shrink-0'} />
                            <span className="truncate text-xs flex-1">{tab.title || 'Yeni Teklif'}</span>
                        </button>
                        <button
                            type="button"
                            className={`p-0.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--color-bg-hover)] transition-all ${
                                tabs.length === 1 ? 'hidden' : ''
                            }`}
                            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                            title="Kapat"
                            aria-label={`${tab.title || 'Yeni Teklif'} sekmesini kapat`}
                        >
                            <X size={11} />
                        </button>
                    </div>
                );
            })}
            <button
                type="button"
                onClick={addTab}
                className="ml-0.5 p-1 rounded-[var(--radius)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors"
                title="Yeni Sekme"
                aria-label="Yeni Sekme"
            >
                <Plus size={16} />
            </button>
        </div>
    );
});
TabBar.displayName = 'TabBar';

export default TabBar;