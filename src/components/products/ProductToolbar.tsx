import { Search, Grid, List, Download, Upload, Trash2 } from 'lucide-react';
import React from 'react';

interface ProductToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    viewMode: string;
    onViewModeChange: (mode: 'list' | 'grid') => void;
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (cat: string) => void;
    selectedCount: number;
    onBulkDelete: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    t: (key: string) => string;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
    searchTerm,
    onSearchChange,
    viewMode,
    onViewModeChange,
    categories,
    selectedCategory,
    onSelectCategory,
    selectedCount,
    onBulkDelete,
    onImport,
    onExport,
    t
}) => {
    return (
        <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                    <input
                        type="text"
                        className="form-control pl-8 text-xs"
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex bg-[var(--color-bg-muted)] rounded p-0.5 border border-[var(--color-border)]">
                    <button
                        type="button"
                        className={`p-1 rounded ${viewMode === 'list' ? 'bg-[var(--color-bg-card)] shadow-2xs' : 'text-[var(--color-text-muted)]'}`}
                        onClick={() => onViewModeChange('list')}
                        title={t('tableView')}
                    >
                        <List size={14} />
                    </button>
                    <button
                        type="button"
                        className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[var(--color-bg-card)] shadow-2xs' : 'text-[var(--color-text-muted)]'}`}
                        onClick={() => onViewModeChange('grid')}
                        title={t('galleryView')}
                    >
                        <Grid size={14} />
                    </button>
                </div>

                <label className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-pointer transition-colors" title={t('importExcel')}>
                    <Upload size={14} />
                    <input type="file" className="hidden" accept=".json, .xlsx, .xls, .csv" onChange={onImport} />
                </label>
                <button
                    type="button"
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    onClick={onExport}
                    title={t('exportExcel')}
                >
                    <Download size={14} />
                </button>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                        type="button"
                        className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${selectedCategory === 'Tümü' || selectedCategory === t('all') ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`}
                        onClick={() => onSelectCategory('Tümü')}
                    >
                        {t('all') || 'Tümü'}
                    </button>
                    {categories.map(cat => (
                        <button
                            type="button"
                            key={cat}
                            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`}
                            onClick={() => onSelectCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCount > 0 && (
                <div className="flex justify-between items-center bg-[var(--color-error)]/10 p-2 rounded-lg border border-[var(--color-error)]/20">
                    <span className="text-sm text-[var(--color-error)] font-medium px-2">
                        {selectedCount} {t('itemsSelected') || 'ürün seçildi'}
                    </span>
                    <button
                        type="button"
                        className="btn btn-sm btn-danger flex items-center gap-1"
                        onClick={onBulkDelete}
                    >
                        <Trash2 size={14} /> {t('delete')}
                    </button>
                </div>
            )}
        </div>
    );
};
