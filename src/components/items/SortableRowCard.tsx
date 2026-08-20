import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, Trash, Copy, CheckSquare, Square } from "lucide-react";
import React, { useRef, memo } from "react";
import ProductTypeahead, { type ProductTypeaheadItem } from '@/components/items/ProductTypeahead';
import { UNIT_OPTIONS, handleImageUpload as handleImageUploadFn } from '@/components/items/shared';
import { calculateLineTotal, getCurrencySymbol } from '@/utils/calculations';
import type { QuoteItem } from '@/context/quote/types';

interface SortableRowCardProps {
  item: QuoteItem;
  index: number;
  handleItemChange: (index: number, field: string, value: unknown) => void;
  onSelectProduct?: (index: number, product: ProductTypeaheadItem) => void;
  removeItem: (index: number) => void;
  duplicateItem: (index: number) => void;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
  getFieldClass: (itemId: string, field: string, item: QuoteItem) => string;
  handleRowBlur: (itemId: string, field: string) => void;
  rowErrors?: Record<string, string>;
  selected?: boolean;
  toggleSelectItem: (index: number) => void;
  products?: ProductTypeaheadItem[];
  currency?: string;
}

const SortableRowCard = memo(
  ({ item, index, handleItemChange, onSelectProduct, removeItem, duplicateItem, formatCurrency, t, getFieldClass, handleRowBlur, rowErrors, selected, toggleSelectItem, products = [], currency = 'TRY' }: SortableRowCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: "relative",
      zIndex: isDragging ? 999 : "auto",
    };
    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => handleImageUploadFn(e, index, handleItemChange);
    return (
      <div
        ref={setNodeRef}
        style={style as React.CSSProperties}
        className="card p-3 relative group space-y-2.5 border border-[var(--color-border)] shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[var(--color-border)]/40">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleSelectItem(index); }}
              className={`p-0.5 rounded transition-colors ${selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
              aria-label={selected ? t('selectItem') + ' (seçili)' : t('selectItem')}
              aria-pressed={selected}
            >
              {selected ? <CheckSquare size={13} /> : <Square size={13} />}
            </button>
            <span className="text-xs font-mono font-bold text-[var(--color-text-muted)]">#{index + 1}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-xs p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              onClick={() => duplicateItem(index)}
              title="Çoğalt"
              aria-label={t('duplicateItem')}
            >
              <Copy size={12} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
              onClick={() => removeItem(index)}
              title={t('deleteItem')}
              aria-label={t('deleteItem')}
            >
              <Trash size={12} />
            </button>
            <div
              {...attributes}
              {...listeners}
              className="p-1 cursor-grab active:cursor-grabbing text-[var(--color-text-muted)]"
            >
              <GripVertical size={13} />
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 items-start">
          <div
            className="w-10 h-10 rounded-[var(--radius)] bg-[var(--color-bg-muted)] flex items-center justify-center cursor-pointer overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Ürün görseli yükle"
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={14} className="text-[var(--color-text-muted)]" />
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImage}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <ProductTypeahead
              className={getFieldClass(item.id, "name", item) + " mb-1 text-sm font-semibold"}
              placeholder={t("productName")}
              ariaLabel={t("productName")}
              value={item.name}
              onChange={(val) => handleItemChange(index, "name", val)}
              onSelectProduct={(product) => {
                if (onSelectProduct) {
                  onSelectProduct(index, product);
                } else {
                  handleItemChange(index, "name", product.name);
                  if (product.price !== undefined) handleItemChange(index, "price", product.price);
                  if (product.unit) handleItemChange(index, "unit", product.unit);
                  if (product.taxRate !== undefined) handleItemChange(index, "taxRate", product.taxRate);
                  if (product.description) handleItemChange(index, "description", product.description);
                  if (product.image) handleItemChange(index, "image", product.image);
                }
              }}
              onBlur={() => handleRowBlur(item.id, "name")}
              dataRow={index}
              dataField="name"
              products={products}
              currency={currency}
            />
            {rowErrors?.name && <div className="field-error-text mb-1">{rowErrors.name}</div>}
            <textarea
              className="form-control text-xs resize-none py-1 min-h-[26px]"
              placeholder={t("description")}
              aria-label={t("description")}
              rows={item.description && item.description.length > 30 ? 2 : 1}
              value={item.description}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block" htmlFor={`card-qty-${index}`}>
              {t("quantity")}
            </label>
            <div className="flex gap-1">
              <input
                id={`card-qty-${index}`}
                type="text"
                inputMode="decimal"
                className={getFieldClass(item.id, "quantity", item) + " flex-1"}
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                onBlur={() => handleRowBlur(item.id, "quantity")}
              />
              {rowErrors?.quantity && <div className="field-error-text">{rowErrors.quantity}</div>}
              <select
                className="form-control form-select text-sm w-20"
                value={item.unit}
                onChange={(e) =>
                  handleItemChange(index, "unit", e.target.value)
                }
                aria-label="Birim"
              >
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block" htmlFor={`card-price-${index}`}>
              {t("unitPrice")}
            </label>
            <input
              id={`card-price-${index}`}
              type="text"
              inputMode="decimal"
              className={getFieldClass(item.id, "price", item)}
              value={item.price}
              onChange={(e) => handleItemChange(index, "price", e.target.value)}
              onBlur={() => handleRowBlur(item.id, "price")}
            />
            {rowErrors?.price && <div className="field-error-text">{rowErrors.price}</div>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--color-border)]/40 items-center">
          <div>
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-0.5 block" htmlFor={`card-tax-${index}`}>
              {t("vatRate")}
            </label>
            <input
              id={`card-tax-${index}`}
              type="text"
              inputMode="decimal"
              className={getFieldClass(item.id, "taxRate", item) + " text-center"}
              value={item.taxRate}
              onChange={(e) =>
                handleItemChange(index, "taxRate", e.target.value)
              }
              onBlur={() => handleRowBlur(item.id, "taxRate")}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block" htmlFor={`card-disc-${index}`}>
                {t("discountRate")}
              </label>
              <button
                type="button"
                onClick={() => handleItemChange(index, "discountType", (item as unknown as { discountType?: string }).discountType === 'fixed' ? 'percentage' : 'fixed')}
                className="text-[9px] font-bold text-[var(--color-primary)] px-1 py-0.5 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)]"
                title="İskonto Tipi"
              >
                {(item as unknown as { discountType?: string }).discountType === 'fixed' ? getCurrencySymbol(currency) : '%'}
              </button>
            </div>
            <input
              id={`card-disc-${index}`}
              type="text"
              inputMode="decimal"
              className="form-control text-sm text-center"
              value={item.discountRate || 0}
              onChange={(e) =>
                handleItemChange(index, "discountRate", e.target.value)
              }
            />
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide block">
              {t("total")}
            </span>
            <span className="text-sm font-bold text-[var(--color-primary)]">
              {formatCurrency(
                calculateLineTotal({ quantity: item.quantity, price: item.price, discountRate: item.discountRate }),
              )}
            </span>
          </div>
        </div>
      </div>
    );
  },
);
SortableRowCard.displayName = "SortableRowCard";
export default SortableRowCard;
