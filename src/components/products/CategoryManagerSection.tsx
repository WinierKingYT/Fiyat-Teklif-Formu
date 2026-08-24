import { X } from 'lucide-react';
import React from 'react';

interface CategoryManagerSectionProps {
    categories: string[];
    newCategoryName: string;
    onNewCategoryNameChange: (val: string) => void;
    onAddCategory: () => void;
    onDeleteCategory: (cat: string) => void;
    t: (key: string) => string;
}

export const CategoryManagerSection: React.FC<CategoryManagerSectionProps> = ({
    categories,
    newCategoryName,
    onNewCategoryNameChange,
    onAddCategory,
    onDeleteCategory,
    t
}) => {
    return (
        <div className="mb-3 p-3 bg-[var(--color-bg-muted)] rounded-lg border border-[var(--color-border)]">
            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    className="form-control text-sm"
                    placeholder="Yeni Kategori..."
                    value={newCategoryName}
                    onChange={(e) => onNewCategoryNameChange(e.target.value)}
                />
                <button type="button" className="btn btn-sm btn-primary" onClick={onAddCategory}>
                    {t('add')}
                </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-1 bg-[var(--color-bg-card)] px-2 py-1 rounded text-xs border border-[var(--color-border)]">
                        <span>{cat}</span>
                        {cat !== 'Genel' && (
                            <button
                                type="button"
                                onClick={() => onDeleteCategory(cat)}
                                className="text-[var(--color-error)] hover:text-[var(--color-error)]"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
