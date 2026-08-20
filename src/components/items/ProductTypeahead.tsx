import { Package, Tag } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { formatCurrency } from '@/utils/calculations';

export interface ProductTypeaheadItem {
  id?: string | number;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  category?: string;
  image?: string | null;
}

export interface ProductTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct: (product: ProductTypeaheadItem) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  dataRow?: number;
  dataField?: string;
  products?: ProductTypeaheadItem[];
  currency?: string;
  disabled?: boolean;
}

export const ProductTypeahead: React.FC<ProductTypeaheadProps> = ({
  value = '',
  onChange,
  onSelectProduct,
  onBlur,
  onFocus,
  onKeyDown,
  placeholder,
  ariaLabel,
  className = '',
  dataRow,
  dataField = 'name',
  products = [],
  currency = 'TRY',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and sort products based on input value
  const suggestions = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    if (!query || !products || products.length === 0) return [];

    const matches = products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || cat.includes(query);
    });

    // Sort: Starts-with matches first, then contains
    return matches
      .sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName, 'tr');
      })
      .slice(0, 6);
  }, [value, products]);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = useCallback(
    (product: ProductTypeaheadItem) => {
      onSelectProduct(product);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelectProduct]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if ((value || '').trim().length > 0 && suggestions.length > 0) {
      setIsOpen(true);
    }
    onFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay closing so mousedown/click on dropdown works cleanly
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
    onBlur?.(e);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }
      if (e.key === 'Tab') {
        setIsOpen(false);
      }
    }

    onKeyDown?.(e);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className={className}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        data-row={dataRow}
        data-field={dataField}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 w-full min-w-[280px] sm:min-w-[340px] max-w-[420px] bg-[var(--color-bg-card,#ffffff)] border border-[var(--color-border,#e2e8f0)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in-50 duration-100"
          style={{
            backgroundColor: 'var(--color-bg-card, #ffffff)',
            borderColor: 'var(--color-border, #e2e8f0)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 bg-[var(--color-bg-muted,#f8fafc)] border-b border-[var(--color-border,#e2e8f0)] flex items-center justify-between text-[11px] text-[var(--color-text-muted,#64748b)]">
            <span className="flex items-center gap-1 font-semibold">
              <Package size={12} className="text-[var(--color-primary,#3b82f6)]" />
              Kayıtlı Ürün Önerileri ({suggestions.length})
            </span>
            <span className="text-[10px] opacity-70">↑↓ Gezin • ↵ Seç</span>
          </div>

          {/* Suggestions List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[var(--color-border,#f1f5f9)]">
            {suggestions.map((product, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={product.id || idx}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleSelect(product);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors text-left ${
                    isHighlighted
                      ? 'bg-[var(--color-primary,#3b82f6)]/10 text-[var(--color-primary,#3b82f6)]'
                      : 'hover:bg-[var(--color-bg-muted,#f8fafc)] text-[var(--color-text,#0f172a)]'
                  }`}
                  role="option"
                  aria-selected={isHighlighted}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Thumbnail or Icon */}
                    <div className="w-7 h-7 rounded bg-[var(--color-bg-muted,#f1f5f9)] border border-[var(--color-border,#e2e8f0)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={13} className="text-[var(--color-text-muted,#94a3b8)]" />
                      )}
                    </div>

                    {/* Name & Details */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{product.name}</span>
                        {product.category && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-normal bg-[var(--color-bg-muted,#f1f5f9)] text-[var(--color-text-muted,#64748b)] border border-[var(--color-border,#e2e8f0)] flex items-center gap-0.5">
                            <Tag size={8} />
                            {product.category}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <div className="text-[10px] text-[var(--color-text-muted,#64748b)] truncate mt-0.5 opacity-90">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Unit */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-xs text-[var(--color-text,#0f172a)]">
                      {formatCurrency(product.price || 0, currency)}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted,#64748b)]">
                      {product.unit || 'Adet'}{product.taxRate ? ` • %${product.taxRate} KDV` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTypeahead;
