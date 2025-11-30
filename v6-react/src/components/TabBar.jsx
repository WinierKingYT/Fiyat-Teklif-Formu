import React from 'react';
import { useQuote } from '../context/QuoteContext';
import { X, Plus, FileText } from 'lucide-react';

const TabBar = () => {
    const { tabs, activeTabId, switchTab, closeTab, addTab } = useQuote();

    return (
        <div className="flex items-center gap-1 px-4 pt-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`
                        group flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer select-none transition-colors
                        min-w-[150px] max-w-[200px] border-t border-x
                        ${activeTabId === tab.id
                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium relative top-[1px]'
                            : 'bg-slate-200 dark:bg-slate-950 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-900'}
                    `}
                    onClick={() => switchTab(tab.id)}
                >
                    <FileText size={14} className={activeTabId === tab.id ? 'text-blue-600 dark:text-blue-400' : ''} />
                    <span className="truncate text-sm flex-1">{tab.title || 'Yeni Teklif'}</span>

                    <button
                        className={`
                            p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all
                            ${tabs.length === 1 ? 'hidden' : ''}
                        `}
                        onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                        }}
                        title="Sekmeyi Kapat"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}

            <button
                onClick={addTab}
                className="ml-1 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title="Yeni Sekme"
            >
                <Plus size={18} />
            </button>
        </div>
    );
};

export default TabBar;
