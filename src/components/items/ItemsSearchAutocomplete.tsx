import { Search, X, Package, Plus } from 'lucide-react';
import React, { type RefObject } from 'react';
import { formatCurrency } from '@/utils/calculations';

interface ProductRow {
  id?: string | number;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  category?: string;
  image?: string | null;
  createdAt?: string;
}

interface ItemsSearchAutocompleteProps {
  searchRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  showSearch: boolean;
  onShowSearchChange: (show: boolean) => void;
  searchResults: ProductRow[];
  searchIndex: number;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddProductFromSearch: (product: ProductRow) => void;
  recentProducts: ProductRow[];
  itemsCount: number;
  currency: string;
  t: (key: string) => string;
}

export const ItemsSearchAutocomplete: React.FC<ItemsSearchAutocompleteProps> = ({
  searchRef,
  searchQuery,
  onSearchQueryChange,
  showSearch,
  onShowSearchChange,
  searchResults,
  searchIndex,
  onSearchKeyDown,
  onAddProductFromSearch,
  recentProducts,
  itemsCount,
  currency,
  t
}) => {
  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
        <input
          type="text"
          className="form-control pl-9"
          placeholder={t('searchProducts')}
          aria-label={t('searchProducts')}
          value={searchQuery}
          onChange={(e) => { onSearchQueryChange(e.target.value); onShowSearchChange(true); }}
          onFocus={() => searchQuery.length >= 2 && onShowSearchChange(true)}
          onKeyDown={onSearchKeyDown}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => { onSearchQueryChange(''); onShowSearchChange(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label={t('clearSearch')}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {showSearch && searchQuery.length >= 2 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((product, idx) => (
              <button
                key={product.id || idx}
                type="button"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${idx === searchIndex ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : 'text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'}`}
                onMouseDown={() => onAddProductFromSearch(product)}
              >
                <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-bg-muted)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={14} className="text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  {product.description && <div className="text-xs text-[var(--color-text-muted)] truncate">{product.description}</div>}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
                  {formatCurrency(product.price || 0, currency)}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 text-center">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">{t('noResultsFound')}</div>
              <button
                type="button"
                className="btn btn-xs btn-primary inline-flex items-center gap-1.5 mx-auto"
                onMouseDown={() => {
                  onAddProductFromSearch({
                    name: searchQuery.trim(),
                    price: 0,
                    unit: 'Adet',
                    taxRate: 20
                  });
                  onSearchQueryChange('');
                  onShowSearchChange(false);
                }}
              >
                <Plus size={12} />
                <span>"{searchQuery.trim()}" {t('addNewItemQuick') || 'ürününü ekle'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {recentProducts.length > 0 && itemsCount === 0 && (
        <div className="text-xs text-[var(--color-text-muted)] mt-1">
          <span className="font-medium">{t('recentProducts')}</span>{' '}
          {recentProducts.map((p, i) => (
            <button
              type="button"
              key={p.id || i}
              onClick={() => onAddProductFromSearch(p)}
              className="hover:text-[var(--color-primary)] transition-colors"
            >
              {p.name}{i < recentProducts.length - 1 ? ', ' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
