import { CheckSquare, Square, Trash2, Image as ImageIcon } from 'lucide-react';
import React from 'react';
import type { Product } from './types';

interface ProductGridViewProps {
    products: Product[];
    selectedProducts: Set<string | number>;
    currentProductId?: string | number | null;
    onToggleSelect: (id: string | number) => void;
    onEdit: (product: Product) => void;
    onDelete: (id: string | number) => void;
    t: (key: string) => string;
}

export const ProductGridView: React.FC<ProductGridViewProps> = ({
    products,
    selectedProducts,
    currentProductId,
    onToggleSelect,
    onEdit,
    onDelete,
    t
}) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(product => (
                <div
                    key={product.id}
                    className={`border rounded-lg overflow-hidden group transition-all cursor-pointer flex flex-col ${currentProductId === product.id
                        ? 'ring-2 ring-[var(--color-primary)] border-transparent'
                        : 'border-[var(--color-border)] hover:shadow-md'
                        }`}
                    onClick={() => onEdit(product)}
                >
                    <div className="relative aspect-square bg-[var(--color-bg-muted)]">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                                <ImageIcon size={32} />
                            </div>
                        )}
                        <button
                            type="button"
                            className="absolute top-2 left-2"
                            onClick={(e) => { e.stopPropagation(); onToggleSelect(product.id); }}
                            aria-label={`${t('selectItem')}: ${product.name}`}
                            aria-pressed={selectedProducts.has(product.id)}
                        >
                            <div className={`bg-[var(--color-bg-card)] rounded p-1 ${selectedProducts.has(product.id) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                                {selectedProducts.has(product.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                            </div>
                        </button>
                        <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                className="p-1.5 bg-[var(--color-bg-card)] text-[var(--color-error)] hover:text-[var(--color-error)] rounded shadow-sm"
                                onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                                aria-label={`${t('deleteProduct')}: ${product.name}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                        <div className="font-medium text-[var(--color-text)] line-clamp-1" title={product.name}>{product.name}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mb-2">{product.category || 'Genel'}</div>
                        <div className="mt-auto font-bold text-[var(--color-primary)]">{product.price} ₺</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
