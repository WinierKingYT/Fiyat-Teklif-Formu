import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, Trash, Copy, CheckSquare, Square } from "lucide-react";
import React, { useRef, memo } from "react";
import ProductTypeahead, { type ProductTypeaheadItem } from '@/components/items/ProductTypeahead';
import { UNIT_OPTIONS, handleImageUpload as handleImageUploadFn } from '@/components/items/shared';
import { calculateLineTotal } from '@/utils/calculations';
import { evaluateMathExpression } from '@/utils/smartCalc';
import type { QuoteItem } from '@/context/quote/types';

interface SortableRowProps {
  item: QuoteItem;
  index: number;
  handleItemChange: (index: number, field: string, value: unknown) => void;
  onSelectProduct?: (index: number, product: ProductTypeaheadItem) => void;
  removeItem: (index: number) => void;
  duplicateItem: (index: number) => void;
  formatCurrency: (amount: number) => string;
  onKeyDown: (e: React.KeyboardEvent, index: number, field: string) => void;
  t: (key: string) => string;
  getFieldClass: (itemId: string, field: string, item: QuoteItem) => string;
  handleRowBlur: (itemId: string, field: string) => void;
  rowErrors?: Record<string, string>;
  selected?: boolean;
  toggleSelectItem: (index: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  visibleColumns?: {
    image?: boolean;
    description?: boolean;
    unit?: boolean;
    discount?: boolean;
  };
  taxMode?: 'exclusive' | 'inclusive';
  products?: ProductTypeaheadItem[];
  currency?: string;
}

const SortableRow = memo(
  ({
    item,
    index,
    handleItemChange,
    onSelectProduct,
    removeItem,
    duplicateItem,
    formatCurrency,
    onKeyDown,
    t,
    getFieldClass,
    handleRowBlur,
    rowErrors,
    selected,
    toggleSelectItem,
    onContextMenu,
    visibleColumns = { image: true, description: true, unit: true, discount: true },
    taxMode = 'exclusive',
    products = [],
    currency = 'TRY',
  }: SortableRowProps) => {
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
    const handleCalc = (field: string, value: unknown) => {
      const calculatedValue = evaluateMathExpression(value);
      if (calculatedValue !== value)
        handleItemChange(index, field, calculatedValue);
    };

    const handleImageDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => handleItemChange(index, 'image', reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    const discountType = (item as unknown as { discountType?: 'percentage' | 'fixed' }).discountType || 'percentage';

    return (
      <tr
        ref={setNodeRef}
        style={style as React.CSSProperties}
        className="group hover:bg-[var(--color-bg-muted)]/40"
        onContextMenu={onContextMenu}
      >
        <td className="w-6 px-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleSelectItem(index); }}
            className={`p-0.5 rounded transition-colors ${selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-60'}`}
            aria-label={selected ? t('selectItem') + ' (seçili)' : t('selectItem')}
            aria-pressed={selected}
          >
            {selected ? <CheckSquare size={13} /> : <Square size={13} />}
          </button>
        </td>
        <td
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing w-7 text-center ${rowErrors && Object.keys(rowErrors).length > 0 ? 'relative' : ''}`}
        >
          <div className="flex items-center justify-center w-full">
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] group-hover:hidden select-none">{index + 1}</span>
            <GripVertical
              size={13}
              className="text-[var(--color-text-muted)] opacity-70 hidden group-hover:block transition-opacity"
            />
          </div>
          {rowErrors && Object.keys(rowErrors).length > 0 && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-error)] text-white text-[8px] font-bold flex items-center justify-center" title={`${Object.keys(rowErrors).length} hata`}>
              {Object.keys(rowErrors).length}
            </div>
          )}
        </td>

        {/* Image Column (optional) */}
        {visibleColumns.image !== false && (
          <td className="w-12 text-center">
            <div
              className="w-8 h-8 mx-auto rounded bg-[var(--color-bg-muted)] flex items-center justify-center cursor-pointer overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleImageDrop}
              role="button"
              title="Görsel yükle"
              aria-label="Ürün görseli yükle"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={13} className="text-[var(--color-text-muted)] opacity-60" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImage}
                accept="image/*"
                className="hidden"
              />
            </div>
          </td>
        )}

        {/* Name & Description Column */}
        <td className="min-w-[200px]">
          <ProductTypeahead
            className={getFieldClass(item.id, "name", item) + (visibleColumns.description !== false ? " mb-1" : "")}
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
            onKeyDown={(e) => onKeyDown(e, index, "name")}
            dataRow={index}
            dataField="name"
            products={products}
            currency={currency}
          />
          {rowErrors?.name && <div className="field-error-text" style={{marginBottom: '4px'}}>{rowErrors.name}</div>}
          {visibleColumns.description !== false && (
            <textarea
              className={getFieldClass(item.id, "description", item) + " resize-none text-xs py-1 min-h-[26px] leading-tight"}
              placeholder={t("description")}
              aria-label={t("description")}
              rows={item.description && (item.description.length > 35 || item.description.includes('\n')) ? 2 : 1}
              value={item.description}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
              onBlur={() => handleRowBlur(item.id, "description")}
              onKeyDown={(e) => onKeyDown(e, index, "description")}
              data-row={index}
              data-field="description"
              autoComplete="off"
            />
          )}
        </td>

        {/* Quantity Column */}
        <td className="w-20">
          <input
            type="text"
            inputMode="decimal"
            className={getFieldClass(item.id, "quantity", item) + " text-center"}
            aria-label={t("quantity")}
            value={item.quantity}
            onChange={(e) =>
              handleItemChange(index, "quantity", e.target.value)
            }
            onBlur={(e) => { handleRowBlur(item.id, "quantity"); handleCalc("quantity", e.target.value); }}
            onKeyDown={(e) => onKeyDown(e, index, "quantity")}
            data-row={index}
            data-field="quantity"
            autoComplete="off"
          />
          {rowErrors?.quantity && <div className="field-error-text">{rowErrors.quantity}</div>}
        </td>

        {/* Unit Column (optional) */}
        {visibleColumns.unit !== false && (
          <td className="w-24">
            <select
              className="form-control form-select text-sm"
              value={item.unit}
              onChange={(e) => handleItemChange(index, "unit", e.target.value)}
              onKeyDown={(e) => onKeyDown(e, index, "unit")}
              data-row={index}
              data-field="unit"
              autoComplete="off"
              aria-label="Birim"
            >
              {UNIT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
          </td>
        )}

        {/* Unit Price Column */}
        <td className="w-28">
          <input
            type="text"
            inputMode="decimal"
            className={getFieldClass(item.id, "price", item) + " text-right"}
            aria-label={t("unitPrice")}
            value={item.price}
            onChange={(e) => handleItemChange(index, "price", e.target.value)}
            onBlur={(e) => { handleRowBlur(item.id, "price"); handleCalc("price", e.target.value); }}
            onKeyDown={(e) => onKeyDown(e, index, "price")}
            data-row={index}
            data-field="price"
            autoComplete="off"
          />
          {rowErrors?.price && <div className="field-error-text">{rowErrors.price}</div>}
        </td>

        {/* VAT Rate Column */}
        <td className="w-18">
          <select
            className={getFieldClass(item.id, "taxRate", item) + " text-center text-xs font-medium cursor-pointer"}
            aria-label={t("vat")}
            value={item.taxRate}
            onChange={(e) => handleItemChange(index, "taxRate", parseFloat(e.target.value) || 0)}
            onBlur={() => handleRowBlur(item.id, "taxRate")}
            onKeyDown={(e) => onKeyDown(e, index, "taxRate")}
            data-row={index}
            data-field="taxRate"
          >
            <option value={20}>%20</option>
            <option value={10}>%10</option>
            <option value={1}>%1</option>
            <option value={0}>%0</option>
            {![20, 10, 1, 0].includes(Number(item.taxRate)) && (
              <option value={item.taxRate}>%{item.taxRate}</option>
            )}
          </select>
          {rowErrors?.taxRate && <div className="field-error-text">{rowErrors.taxRate}</div>}
        </td>

        {/* Line Discount Column (optional) */}
        {visibleColumns.discount !== false && (
          <td className="w-22">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleItemChange(index, "discountType", discountType === 'fixed' ? 'percentage' : 'fixed')}
                className="text-[10px] font-bold text-[var(--color-primary)] px-1 py-1 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)]"
                title="İskonto Tipi (% veya Sabit Tutar)"
                aria-label="İskonto Tipi"
              >
                {discountType === 'fixed' ? '₺' : '%'}
              </button>
              <input
                type="text"
                inputMode="decimal"
                className="form-control text-sm text-center w-14"
                aria-label={t("discount")}
                value={item.discountRate || 0}
                onChange={(e) =>
                  handleItemChange(index, "discountRate", e.target.value)
                }
                onBlur={(e) => handleCalc("discountRate", e.target.value)}
                onKeyDown={(e) => onKeyDown(e, index, "discountRate")}
                data-row={index}
                data-field="discountRate"
                autoComplete="off"
              />
            </div>
          </td>
        )}

        {/* Total Column */}
        <td className="text-right font-semibold text-sm w-28 text-[var(--color-text)]">
          {formatCurrency(
            calculateLineTotal({
              quantity: item.quantity,
              price: item.price,
              discountRate: item.discountRate,
              discountType,
              taxRate: item.taxRate,
              taxMode
            }),
          )}
        </td>

        {/* Actions Column */}
        <td className="w-16">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="btn btn-ghost btn-sm p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => duplicateItem(index)}
              title="Çoğalt"
              aria-label={t('duplicateItem')}
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeItem(index)}
              title={t('deleteItem')}
              aria-label={t('deleteItem')}
            >
              <Trash size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);
SortableRow.displayName = "SortableRow";
export default SortableRow;
