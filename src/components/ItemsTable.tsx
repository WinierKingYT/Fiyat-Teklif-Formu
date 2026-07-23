import React from "react";
import { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import {
  Plus,
  Trash,
  GripVertical,
  Image as ImageIcon,
  Package,
  Upload,
  Search,
  X,
  Table,
  Grid3X3,
  AlertCircle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Logger from "../utils/logger";
import { useQuote } from "../context/QuoteContext";
import { useTranslation } from "../hooks/useTranslation";
import { sanitizeInput } from "../utils/sanitize";
import { evaluateMathExpression } from "../utils/smartCalc";
import * as XLSX from "xlsx";
const SortableRow = memo(
  ({
    item,
    index,
    handleItemChange,
    removeItem,
    formatCurrency,
    onKeyDown,
    t,
    getFieldClass,
    handleRowBlur,
    rowErrors,
  }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });
    const fileInputRef = useRef(null);
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
      >
        {" "}
        <td
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing w-10 ${rowErrors && Object.keys(rowErrors).length > 0 ? 'relative' : ''}`}
        >
          {" "}
          <GripVertical
            size={15}
            className="text-[var(--color-text-muted)] opacity-40 group-hover:opacity-70 transition-opacity"
          />{" "}
          {rowErrors && Object.keys(rowErrors).length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-error)] text-white text-[9px] font-bold flex items-center justify-center" title={`${Object.keys(rowErrors).length} hata`}>
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
            (parseFloat(item.quantity) || 0) *
              (parseFloat(item.price) || 0) *
              (1 - (parseFloat(item.discountRate) || 0) / 100),
          )}{" "}
        </td>{" "}
        <td className="w-10">
          {" "}
          <button
            type="button"
            className="btn btn-ghost btn-sm p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeItem(index)}
          >
            {" "}
            <Trash size={14} />{" "}
          </button>{" "}
        </td>{" "}
      </tr>
    );
  },
);
SortableRow.displayName = "SortableRow";
const SortableRowCard = memo(
  ({ item, index, handleItemChange, removeItem, formatCurrency, t, getFieldClass, handleRowBlur, rowErrors }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });
    const fileInputRef = useRef(null);
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
                (parseFloat(item.quantity) || 0) *
                  (parseFloat(item.price) || 0) *
                  (1 - (parseFloat(item.discountRate) || 0) / 100),
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <button
          type="button"
          className="btn btn-danger btn-sm w-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeItem(index)}
        >
          {" "}
          <Trash size={13} /> {t("deleteProduct")}{" "}
        </button>{" "}
      </div>
    );
  },
);
SortableRowCard.displayName = "SortableRowCard";
const ItemsTable = ({
  items,
  onItemsChange,
  currency = "TRY",
  onAddProduct,
}) => {
  const { quoteData, db } = useQuote();
  const { t } = useTranslation(quoteData?.language);
  const fileInputRef = useRef(null);
  const searchRef = useRef(null);
  const [viewMode, setViewMode] = useState(
    window.innerWidth < 768 ? "card" : "table",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [touchedRows, setTouchedRows] = useState<Record<string, Record<string, boolean>>>({});

  const getRowErrors = useCallback((item: any) => {
    const errs: Record<string, string> = {};
    if (!item.name) errs.name = 'Ürün adı gerekli';
    if (!item.quantity || parseFloat(item.quantity) <= 0) errs.quantity = 'Miktar > 0 olmalı';
    if (item.price === undefined || item.price === '' || parseFloat(item.price) < 0) errs.price = 'Geçersiz fiyat';
    const tax = parseFloat(item.taxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) errs.taxRate = 'KDV 0-100 arası';
    return errs;
  }, []);

  const handleRowBlur = useCallback((itemId: string, field: string) => {
    setTouchedRows(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: true }
    }));
  }, []);

  const getFieldClass = useCallback((itemId: string, field: string, item: any) => {
    const rowTouched = touchedRows[itemId];
    const rowErrors = getRowErrors(item);
    if (rowTouched?.[field] && rowErrors[field]) return 'form-control field-error text-sm';
    return 'form-control text-sm';
  }, [touchedRows, getRowErrors]);

  const hasErrors = useMemo(() => {
    return items.some((item: any) => Object.keys(getRowErrors(item)).length > 0);
  }, [items, getRowErrors]);
  useEffect(() => {
    if (!db || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const allProducts = await db.getAll("products");
        const q = searchQuery.toLowerCase();
        const filtered = allProducts.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q),
        );
        setSearchResults(filtered.slice(0, 10));
        setSearchIndex(-1);
      } catch (e) {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, db]);
  const addProductFromSearch = (product) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: product.name,
      description: product.description || "",
      quantity: 1,
      unit: product.unit || "Adet",
      price: product.price || 0,
      taxRate: product.taxRate || 20,
      discountRate: 0,
      total: product.price || 0,
      image: product.image,
    };
    onItemsChange([...items, newItem]);
    setSearchQuery("");
    setSearchResults([]);
    searchRef.current?.focus();
  };
  const handleSearchKeyDown = (e) => {
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && searchIndex >= 0) {
      e.preventDefault();
      addProductFromSearch(searchResults[searchIndex]);
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setSearchResults([]);
    }
  };
  useEffect(() => {
    const handleResize = () =>
      setViewMode(window.innerWidth < 768 ? "card" : "table");
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    const itemsWithIds = items.map((item) =>
      item.id
        ? item
        : {
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
    );
    const hasChanges = items.some(
      (item, index) => item.id !== itemsWithIds[index].id,
    );
    if (hasChanges) onItemsChange(itemsWithIds);
  }, [items, onItemsChange]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    onItemsChange(arrayMove(items, oldIndex, newIndex));
  };
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: sanitizeInput(value) };
    if (field === "quantity" || field === "price" || field === "discountRate") {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      const discountRate = parseFloat(newItems[index].discountRate) || 0;
      newItems[index].total = qty * price * (1 - discountRate / 100);
    }
    onItemsChange(newItems);
  };
  const addItem = () =>
    onItemsChange([
      ...items,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: "",
        description: "",
        quantity: 1,
        unit: "Adet",
        price: 0,
        taxRate: 20,
        discountRate: 0,
        total: 0,
        image: null,
      },
    ]);
  const removeItem = (index) =>
    onItemsChange(items.filter((_, i) => i !== index));
  const formatCurrency = useMemo(
    () => (amount) =>
      new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(
        amount,
      ),
    [currency],
  );
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let startIndex = 0;
        if (jsonData.length > 0 && typeof jsonData[0][0] === "string")
          startIndex = 1;
        const newItems = [];
        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || (row as any[]).length === 0) continue;
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
            name: row[0] || "",
            description: row[1] || "",
            quantity: parseFloat(row[2]) || 1,
            unit: row[3] || "Adet",
            price: parseFloat(row[4]) || 0,
            taxRate: parseFloat(row[5]) || 20,
            total: (parseFloat(row[2]) || 1) * (parseFloat(row[4]) || 0),
            image: null,
          });
        }
        if (newItems.length > 0) {
          onItemsChange([...items, ...newItems]);
          Logger.log(`${newItems.length} items imported from Excel.`);
          alert(`${newItems.length} ${t("itemsAddedSuccessfully")}`);
        } else {
          alert(t("noValidExcelData"));
        }
      } catch (error) {
        Logger.error("Excel import error:", error);
        alert(t("excelReadError"));
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleKeyDown = (e, index, field) => {
    if (e.key === "Enter") {
      e.target.blur();
      return;
    }
    const fields = [
      "name",
      "description",
      "quantity",
      "unit",
      "price",
      "taxRate",
      "discountRate",
    ];
    const fieldIndex = fields.indexOf(field);
    let nextRow = index;
    let nextField = field;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (fieldIndex < fields.length - 1) {
        nextField = fields[fieldIndex + 1];
      } else if (index < items.length - 1) {
        nextRow = index + 1;
        nextField = fields[0];
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (fieldIndex > 0) {
        nextField = fields[fieldIndex - 1];
      } else if (index > 0) {
        nextRow = index - 1;
        nextField = fields[fields.length - 1];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index < items.length - 1) nextRow = index + 1;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index > 0) nextRow = index - 1;
    } else return;
    const el = document.querySelector(
      `[data-row="${nextRow}"][data-field="${nextField}"]`,
    );
    if (el) {
      (el as HTMLElement).focus();
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
        setTimeout(() => (el as HTMLInputElement).select(), 0);
    }
  };
  return (
    <div className="card">
      {" "}
      <div className="card-header">
        {" "}
        <div className="flex items-center gap-2.5">
          {" "}
          <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            {" "}
            <Package size={16} className="text-[var(--color-primary)]" />{" "}
          </div>{" "}
          <span className="card-title">{t("itemsAndServices")}</span>{" "}
        </div>{" "}
        <div className="flex items-center gap-1.5">
          {" "}
          <div className="bg-[var(--color-bg-muted)] p-0.5 rounded-[var(--radius)] flex">
            {" "}
            <button
              className={`p-1.5 rounded-[var(--radius-sm)] transition-all ${viewMode === "table" ? "bg-[var(--color-bg-card)] shadow-sm text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
              onClick={() => setViewMode("table")}
              title={t("tableView")}
            >
              {" "}
              <Table size={15} />{" "}
            </button>{" "}
            <button
              className={`p-1.5 rounded-[var(--radius-sm)] transition-all ${viewMode === "card" ? "bg-[var(--color-bg-card)] shadow-sm text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
              onClick={() => setViewMode("card")}
              title={t("galleryView")}
            >
              {" "}
              <Grid3X3 size={15} />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="card-body">
        {" "}
        <div className="relative mb-4" ref={searchRef}>
          {" "}
          <div className="relative">
            {" "}
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />{" "}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Ürün ara ve ekle... (en az 2 harf)"
              className="form-control pl-9 pr-8 py-2 text-sm"
            />{" "}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {" "}
                <X size={14} />{" "}
              </button>
            )}{" "}
          </div>{" "}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg max-h-60 overflow-y-auto">
              {" "}
              {searchResults.map((product, idx) => (
                <button
                  key={product.id || idx}
                  onMouseDown={() => addProductFromSearch(product)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${idx === searchIndex ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]" : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"}`}
                >
                  {" "}
                  <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                    {" "}
                    <Package
                      size={14}
                      className="text-[var(--color-primary)]"
                    />{" "}
                  </div>{" "}
                  <div className="flex-1 min-w-0">
                    {" "}
                    <div className="font-medium truncate">
                      {product.name}
                    </div>{" "}
                    {product.description && (
                      <div className="text-xs text-[var(--color-text-muted)] truncate">
                        {product.description}
                      </div>
                    )}{" "}
                  </div>{" "}
                  <div className="text-sm font-semibold text-[var(--color-text)] flex-shrink-0">
                    {" "}
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency,
                    }).format(product.price || 0)}{" "}
                  </div>{" "}
                </button>
              ))}{" "}
            </div>
          )}{" "}
        </div>{" "}
        {hasErrors && items.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-[var(--radius)] text-xs text-[var(--color-error)]">
            <AlertCircle size={14} />
            <span>Bazı satırlarda hatalı alanlar var. Lütfen kırmızı işaretli alanları düzeltin.</span>
          </div>
        )}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-bg-muted)]/30">
            {" "}
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center mb-4">
              {" "}
              <Package size={28} className="text-[var(--color-primary)]" />{" "}
            </div>{" "}
            <h3 className="text-base font-bold text-[var(--color-text)] mb-1.5">
              {t("noItemsAdded")}
            </h3>{" "}
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-6">
              {t("noItemsHint")}
            </p>{" "}
            <div className="flex gap-3">
              {" "}
              <button
                type="button"
                className="btn btn-primary"
                onClick={addItem}
              >
                {" "}
                <Plus size={16} /> {t("addFirstRow")}{" "}
              </button>{" "}
              {onAddProduct && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onAddProduct}
                >
                  {" "}
                  <Package size={16} /> {t("selectFromCatalog")}{" "}
                </button>
              )}{" "}
            </div>{" "}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {" "}
            {viewMode === "table" ? (
              <div className="overflow-x-auto -mx-1">
                {" "}
                <table className="items-table w-full">
                  {" "}
                  <thead>
                    {" "}
                    <tr>
                      {" "}
                      <th className="w-10"></th>{" "}
                      <th className="w-16 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                        {t("image")}
                      </th>{" "}
                      <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide min-w-[200px]">
                        {t("productService")}
                      </th>{" "}
                      <th className="w-20 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide text-center">
                        {t("quantity")}
                      </th>{" "}
                      <th className="w-24 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                        {t("unit")}
                      </th>{" "}
                      <th className="w-28 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide text-right">
                        {t("unitPrice")}
                      </th>{" "}
                      <th className="w-16 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide text-center">
                        KDV
                      </th>{" "}
                      <th className="w-16 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide text-center">
                        İsk.
                      </th>{" "}
                      <th className="w-28 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide text-right">
                        {t("total")}
                      </th>{" "}
                      <th className="w-10"></th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {" "}
                    <tbody>
                      {" "}
                      {items.map((item, index) => (
                        <SortableRow
                          key={item.id || index}
                          item={item}
                          index={index}
                          handleItemChange={handleItemChange}
                          removeItem={removeItem}
                          formatCurrency={formatCurrency}
                          onKeyDown={handleKeyDown}
                          t={t}
                          getFieldClass={getFieldClass}
                          handleRowBlur={handleRowBlur}
                          rowErrors={getRowErrors(item)}
                        />
                      ))}{" "}
                    </tbody>{" "}
                  </SortableContext>{" "}
                </table>{" "}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {" "}
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {" "}
                  {items.map((item, index) => (
                    <SortableRowCard
                      key={item.id || index}
                      item={item}
                      index={index}
                      handleItemChange={handleItemChange}
                      removeItem={removeItem}
                      formatCurrency={formatCurrency}
                      t={t}
                      getFieldClass={getFieldClass}
                      handleRowBlur={handleRowBlur}
                      rowErrors={getRowErrors(item)}
                    />
                  ))}{" "}
                </SortableContext>{" "}
              </div>
            )}{" "}
          </DndContext>
        )}{" "}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
            {" "}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={addItem}
            >
              {" "}
              <Plus size={14} /> {t("addRow")}{" "}
            </button>{" "}
            <div className="flex gap-2 ml-auto">
              {" "}
              {onAddProduct && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onAddProduct}
                >
                  {" "}
                  <Package size={14} /> {t("selectFromCatalog")}{" "}
                </button>
              )}{" "}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {" "}
                <Upload size={14} /> Excel{" "}
              </button>{" "}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleExcelUpload}
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                title={t("selectExcelFile")}
              />{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
};
export default ItemsTable;





