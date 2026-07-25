import React, { useRef, memo } from "react";
import { GripVertical, ImageIcon, Trash, Copy, CheckSquare, Square } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { calculateLineTotal } from "../../utils/calculations";

const SortableRowCard = memo(
  ({ item, index, handleItemChange, removeItem, duplicateItem, formatCurrency, t, getFieldClass, handleRowBlur, rowErrors, selected, toggleSelectItem }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });
    const fileInputRef = useRef<any>(null);
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: "relative",
      zIndex: isDragging ? 999 : "auto",
    };
    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () =>
          handleItemChange(index, "image", reader.result);
        reader.readAsDataURL(file);
      }
    };
    return (
      <div
        ref={setNodeRef}
        style={style as React.CSSProperties}
        className="card p-4 relative group"
      >
        {" "}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 p-1.5 cursor-grab active:cursor-grabbing rounded-[var(--radius)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          {" "}
          <GripVertical size={15} />{" "}
        </div>{" "}
        <div className="flex gap-3 mb-3">
          {" "}
          <div
            className="w-16 h-16 rounded-[var(--radius)] bg-[var(--color-bg-muted)] flex items-center justify-center cursor-pointer overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {" "}
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={20} className="text-[var(--color-text-muted)]" />
            )}{" "}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />{" "}
          </div>{" "}
          <div className="flex-1 min-w-0">
            {" "}
            <input
              type="text"
              className={getFieldClass(item.id, "name", item) + " mb-1.5 font-semibold"}
              placeholder={t("productName")}
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
              onBlur={() => handleRowBlur(item.id, "name")}
            />{" "}
            {rowErrors?.name && <div className="field-error-text mb-1">{rowErrors.name}</div>}
            <textarea
              className="form-control text-xs resize-none"
              placeholder={t("description")}
              rows={2}
              value={item.description}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {" "}
          <div>
            {" "}
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block">
              {t("quantity")}
            </label>{" "}
            <div className="flex gap-1">
              {" "}
          <input
                type="text"
                className={(getFieldClass(item.id, "quantity", item)) + " flex-1"}
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                onBlur={() => handleRowBlur(item.id, "quantity")}
              />{" "}
              {rowErrors?.quantity && <div className="field-error-text">{rowErrors.quantity}</div>}
              <select
                className="form-control form-select text-sm w-20"
                value={item.unit}
                onChange={(e) =>
                  handleItemChange(index, "unit", e.target.value)
                }
              >
                {" "}
                <option value="Adet">{t("unitPiece")}</option>{" "}
                <option value="Saat">{t("unitHour")}</option>{" "}
                <option value="Gün">{t("unitDay")}</option>{" "}
                <option value="Ay">{t("unitMonth")}</option>{" "}
                <option value="Kg">{t("unitKg")}</option>{" "}
                <option value="Mt">{t("unitMeter")}</option>{" "}
                <option value="M2">{t("unitM2")}</option>{" "}
                <option value="Kutu">{t("unitBox")}</option>{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block">
              {t("unitPrice")}
            </label>{" "}
            <input
              type="text"
              className={getFieldClass(item.id, "price", item)}
              value={item.price}
              onChange={(e) => handleItemChange(index, "price", e.target.value)}
              onBlur={() => handleRowBlur(item.id, "price")}
            />{" "}
            {rowErrors?.price && <div className="field-error-text">{rowErrors.price}</div>}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {" "}
          <div>
            {" "}
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block">
              {t("vatRate")}
            </label>{" "}
            <input
              type="text"
              className={getFieldClass(item.id, "taxRate", item)}
              value={item.taxRate}
              onChange={(e) =>
                handleItemChange(index, "taxRate", e.target.value)
              }
              onBlur={() => handleRowBlur(item.id, "taxRate")}
            />{" "}
            {rowErrors?.taxRate && <div className="field-error-text">{rowErrors.taxRate}</div>}
          </div>{" "}
          <div>
            {" "}
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block">
              {t("discountRate")}
            </label>{" "}
            <input
              type="text"
              className="form-control text-sm"
              value={item.discountRate || 0}
              onChange={(e) =>
                handleItemChange(index, "discountRate", e.target.value)
              }
            />{" "}
          </div>{" "}
          <div className="flex flex-col justify-end">
            {" "}
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1 block text-right">
              {t("total")}
            </label>{" "}
            <div className="text-right font-bold text-[var(--color-primary)] text-sm pt-1">
              {" "}
              {formatCurrency(
                calculateLineTotal({ quantity: item.quantity, price: item.price, discountRate: item.discountRate }),
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleSelectItem(index); }}
            className={`p-1.5 rounded-lg transition-colors ${selected ? 'text-[var(--color-primary)] bg-[var(--color-primary-muted)]' : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100'}`}
            title={selected ? 'Seçimi kaldır' : 'Seç'}
          >
            {selected ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => duplicateItem(index)}
            title="Çoğalt"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm flex-1 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeItem(index)}
          >
            <Trash size={13} /> {t("deleteProduct")}
          </button>
        </div>
      </div>
    );
  },
);
SortableRowCard.displayName = "SortableRowCard";
export default SortableRowCard;
