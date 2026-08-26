import { CheckSquare, Square, Trash2, Image as ImageIcon } from 'lucide-react';
import React from 'react';
import type { Product } from './types';

interface ProductListViewProps {
    products: Product[];
    selectedProducts: Set<string | number>;
    currentProductId?: string | number | null;
    onSelectAll: () => void;
    onToggleSelect: (id: string | number) => void;
    onEdit: (product: Product) => void;
    onDelete: (id: string | number) => void;
    onSelect?: (product: Product) => void;
    t: (key: string) => string;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
    products,
    selectedProducts,
    currentProductId,
    onSelectAll,
    onToggleSelect,
    onEdit,
    onDelete,
    onSelect,
    t
}) => {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <button
                    type="button"
                    onClick={onSelectAll}
                    className="hover:text-[var(--color-primary)]"
                    aria-label={t('selectAllProducts')}
                >
                    {selectedProducts.size === products.length && products.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <span className="flex-1">{t('productName')}</span>
                <span className="w-24 text-right">{t('unitPrice')}</span>
                <span className="w-8"></span>
            </div>
            {products.map(product => (
                <div
                    key={product.id}
                    className={`p-3 border rounded-lg flex justify-between items-center group transition-colors cursor-pointer ${currentProductId === product.id
                        ? 'bg-[var(--color-bg-hover)] border-[var(--color-primary)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                    onClick={() => onEdit(product)}
                >
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleSelect(product.id); }}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                            aria-label={`${t('selectItem')}: ${product.name}`}
                            aria-pressed={selectedProducts.has(product.id)}
                        >
                            {selectedProducts.has(product.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                            <div className="w-10 h-10 bg-[var(--color-bg-muted)] rounded flex items-center justify-center text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                <ImageIcon size={20} />
                            </div>
                        )}
                        <div>
                            <div className="font-medium text-[var(--color-text)]">{product.name}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">{product.category || 'Genel'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="font-semibold text-[var(--color-text)]">{product.price} ₺</div>
                        {onSelect && (
                            <button
                                type="button"
                                className="btn btn-xs btn-primary font-semibold"
                                onClick={(e) => { e.stopPropagation(); onSelect(product); }}
                            >
                                {t('select') || 'Seç'}
                            </button>
                        )}
                        <button
                            type="button"
                            className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-full transition-colors md:opacity-0 md:group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                            aria-label={`${t('deleteProduct')}: ${product.name}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
