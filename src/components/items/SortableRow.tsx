import React, { useRef, memo } from "react";
import { GripVertical, ImageIcon, Trash, Copy, CheckSquare, Square } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { evaluateMathExpression } from "../../utils/smartCalc";
import { calculateLineTotal } from "../../utils/calculations";

const SortableRow = memo(
  ({
    item,
    index,
    handleItemChange,
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
  }: any) => {
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
    const handleCalc = (field, value) => {
      const calculatedValue = evaluateMathExpression(value);
      if (calculatedValue !== value)
        handleItemChange(index, field, calculatedValue);
    };
    return (
      <tr
        ref={setNodeRef}
        style={style as React.CSSProperties}
        className="group hover:bg-[var(--color-bg-muted)]/40"
        onContextMenu={onContextMenu}
      >
        {" "}
        <td className="w-6 px-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleSelectItem(index); }}
            className={`p-0.5 rounded transition-colors ${selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-60'}`}
          >
            {selected ? <CheckSquare size={13} /> : <Square size={13} />}
          </button>
        </td>
        <td
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing w-8 ${rowErrors && Object.keys(rowErrors).length > 0 ? 'relative' : ''}`}
        >
          <GripVertical
            size={13}
            className="text-[var(--color-text-muted)] opacity-40 group-hover:opacity-70 transition-opacity"
          />
          {rowErrors && Object.keys(rowErrors).length > 0 && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-error)] text-white text-[8px] font-bold flex items-center justify-center" title={`${Object.keys(rowErrors).length} hata`}>
              {Object.keys(rowErrors).length}
            </div>
          )}
        </td>{" "}
        <td className="w-16">
          {" "}
          <div
            className="w-10 h-10 rounded-[var(--radius)] bg-[var(--color-bg-muted)] flex items-center justify-center cursor-pointer overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] transition-all"
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
              <ImageIcon size={16} className="text-[var(--color-text-muted)]" />
            )}{" "}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />{" "}
          </div>{" "}
        </td>{" "}
        <td className="min-w-[200px]">
          {" "}
          <input
            type="text"
            className={getFieldClass(item.id, "name", item) + " mb-1"}
            placeholder={t("productName")}
            value={item.name}
            onChange={(e) => handleItemChange(index, "name", e.target.value)}
            onBlur={() => handleRowBlur(item.id, "name")}
            onKeyDown={(e) => onKeyDown(e, index, "name")}
            data-row={index}
            data-field="name"
            autoComplete="off"
          />{" "}
          {rowErrors?.name && <div className="field-error-text" style={{marginBottom: '4px'}}>{rowErrors.name}</div>}
          <textarea
            className={getFieldClass(item.id, "description", item) + " resize-none"}
            placeholder={t("description")}
            rows={2}
            value={item.description}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
            onBlur={() => handleRowBlur(item.id, "description")}
            onKeyDown={(e) => onKeyDown(e, index, "description")}
            data-row={index}
            data-field="description"
            autoComplete="off"
          />{" "}
        </td>{" "}
        <td className="w-20">
          {" "}
          <input
            type="text"
            className={getFieldClass(item.id, "quantity", item) + " text-center"}
            value={item.quantity}
            onChange={(e) =>
              handleItemChange(index, "quantity", e.target.value)
            }
            onBlur={(e) => { handleRowBlur(item.id, "quantity"); handleCalc("quantity", e.target.value); }}
            onKeyDown={(e) => onKeyDown(e, index, "quantity")}
            data-row={index}
            data-field="quantity"
            autoComplete="off"
          />{" "}
          {rowErrors?.quantity && <div className="field-error-text">{rowErrors.quantity}</div>}
        </td>{" "}
        <td className="w-24">
          {" "}
          <select
            className="form-control form-select text-sm"
            value={item.unit}
            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
            onKeyDown={(e) => onKeyDown(e, index, "unit")}
            data-row={index}
            data-field="unit"
            autoComplete="off"
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
        </td>{" "}
        <td className="w-28">
          {" "}
          <input
            type="text"
            className={getFieldClass(item.id, "price", item) + " text-right"}
            value={item.price}
            onChange={(e) => handleItemChange(index, "price", e.target.value)}
            onBlur={(e) => { handleRowBlur(item.id, "price"); handleCalc("price", e.target.value); }}
            onKeyDown={(e) => onKeyDown(e, index, "price")}
            data-row={index}
            data-field="price"
            autoComplete="off"
          />{" "}
          {rowErrors?.price && <div className="field-error-text">{rowErrors.price}</div>}
        </td>{" "}
        <td className="w-16">
          {" "}
          <input
            type="text"
            className={getFieldClass(item.id, "taxRate", item) + " text-center"}
            value={item.taxRate}
            onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
            onBlur={(e) => { handleRowBlur(item.id, "taxRate"); handleCalc("taxRate", e.target.value); }}
            onKeyDown={(e) => onKeyDown(e, index, "taxRate")}
            data-row={index}
            data-field="taxRate"
            autoComplete="off"
          />{" "}
          {rowErrors?.taxRate && <div className="field-error-text">{rowErrors.taxRate}</div>}
        </td>{" "}
        <td className="w-16">
          {" "}
          <input
            type="text"
            className="form-control text-sm text-center"
            value={item.discountRate || 0}
            onChange={(e) =>
              handleItemChange(index, "discountRate", e.target.value)
            }
            onBlur={(e) => handleCalc("discountRate", e.target.value)}
            onKeyDown={(e) => onKeyDown(e, index, "discountRate")}
            data-row={index}
            data-field="discountRate"
            autoComplete="off"
          />{" "}
        </td>{" "}
        <td className="text-right font-semibold text-sm w-28 text-[var(--color-text)]">
          {" "}
          {formatCurrency(
            calculateLineTotal({ quantity: item.quantity, price: item.price, discountRate: item.discountRate }),
          )}{" "}
        </td>{" "}
        <td className="w-16">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="btn btn-ghost btn-sm p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => duplicateItem(index)}
              title="Çoğalt"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeItem(index)}
            >
              <Trash size={13} />
            </button>
          </div>
        </td>{" "}
      </tr>
    );
  },
);
SortableRow.displayName = "SortableRow";
export default SortableRow;
