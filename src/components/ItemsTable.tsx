import React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Plus,
  Trash,
  Package,
  Upload,
  Search,
  X,
  Table,
  Grid3X3,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import SortableRow from "./items/SortableRow";
import SortableRowCard from "./items/SortableRowCard";
import ContextMenu from "./items/ContextMenu";
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
} from "@dnd-kit/sortable";
import Logger from "../utils/logger";
import { useQuoteData } from "../context/QuoteContext";
import type { QuoteItem } from "../context/quote/types";
import { useTranslation } from "../hooks/useTranslation";
import { sanitizeInput } from "../utils/sanitize";
import { evaluateMathExpression } from "../utils/smartCalc";
import { formatCurrency } from "../utils/calculations";
import toast from "react-hot-toast";

interface ItemsTableProps {
  items: QuoteItem[];
  onItemsChange: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  currency?: string;
  onAddProduct?: () => void;
}

interface ProductRow {
  id?: string | number;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  image?: string | null;
}

const ItemsTable = ({
  items,
  onItemsChange,
  currency = "TRY",
  onAddProduct,
}: ItemsTableProps) => {
  const { quoteData, db } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState(
    window.innerWidth < 768 ? "card" : "table",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductRow[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [touchedRows, setTouchedRows] = useState<Record<string, Record<string, boolean>>>({});

  const getRowErrors = useCallback((item: QuoteItem) => {
    const errs: Record<string, string> = {};
    if (!item.name) errs.name = t('productNameRequired');
    if (!item.quantity || item.quantity <= 0) errs.quantity = 'Miktar > 0 olmalı';
    if (item.price === undefined || item.price < 0) errs.price = 'Geçersiz fiyat';
    if (item.taxRate < 0 || item.taxRate > 100) errs.taxRate = 'KDV 0-100 arası';
    return errs;
  }, [t]);

  const handleRowBlur = useCallback((itemId: string, field: string) => {
    setTouchedRows(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: true }
    }));
  }, []);

  const getFieldClass = useCallback((itemId: string, field: string, item: QuoteItem) => {
    const rowTouched = touchedRows[itemId];
    const rowErrors = getRowErrors(item);
    if (rowTouched?.[field] && rowErrors[field]) return 'form-control field-error text-sm';
    return 'form-control text-sm';
  }, [touchedRows, getRowErrors]);

  const allRowErrors = useMemo(() => {
    const map = new Map<string, Record<string, string>>();
    for (const item of items) map.set(item.id, getRowErrors(item));
    return map;
  }, [items, getRowErrors]);

  const hasErrors = useMemo(() => {
    return items.some((item) => Object.keys(getRowErrors(item)).length > 0);
  }, [items, getRowErrors]);
  useEffect(() => {
    if (!db || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const allProducts = await db.getAll<ProductRow>("products");
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
  const [recentProducts, setRecentProducts] = useState<ProductRow[]>(() => {
    try {
      const saved = localStorage.getItem("recentProducts");
      return saved ? (JSON.parse(saved) as ProductRow[]) : [];
    } catch {
      return [];
    }
  });
  const addToRecentProducts = useCallback((product: ProductRow) => {
    setRecentProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 5);
      localStorage.setItem("recentProducts", JSON.stringify(updated));
      return updated;
    });
  }, []);
  const addProductFromSearch = useCallback((product: ProductRow) => {
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
      image: product.image ?? undefined,
    };
    onItemsChange(prev => [...prev, newItem]);
    addToRecentProducts(product);
    setSearchQuery("");
    setSearchResults([]);
    searchRef.current?.focus();
  }, [onItemsChange, addToRecentProducts]);
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
      setShowSearch(false);
    }
  };
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const toggleSelectItem = useCallback((index: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((_, i) => i)));
    }
  }, [items, selectedItems.size]);
  const deleteSelected = useCallback(() => {
    onItemsChange(prev => prev.filter((_, i) => !selectedItems.has(i)));
    setSelectedItems(new Set());
  }, [selectedItems, onItemsChange]);
  const duplicateSelected = useCallback(() => {
    onItemsChange(prev => {
      const duplicates = Array.from(selectedItems)
        .sort((a, b) => b - a)
        .map((i) => ({
          ...(prev[i] as QuoteItem),
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
      return [...prev, ...duplicates];
    });
    setSelectedItems(new Set());
  }, [selectedItems, onItemsChange]);
  const moveSelectedUp = useCallback(() => {
    if (selectedItems.size === 0) return;
    onItemsChange(prev => {
      const newItems = [...prev];
      const indices = Array.from(selectedItems).sort((a, b) => a - b);
      if (indices[0] === 0) return prev;
      for (const i of indices) {
        [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
      }
      return newItems;
    });
    setSelectedItems(new Set(Array.from(selectedItems).map((i) => i - 1)));
  }, [selectedItems, onItemsChange]);
  const moveSelectedDown = useCallback(() => {
    if (selectedItems.size === 0) return;
    onItemsChange(prev => {
      const newItems = [...prev];
      const indices = Array.from(selectedItems).sort((a, b) => b - a);
      if (indices[0] === prev.length - 1) return prev;
      for (const i of indices) {
        [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
      }
      return newItems;
    });
    setSelectedItems(new Set(Array.from(selectedItems).map((i) => i + 1)));
  }, [selectedItems, onItemsChange]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleItemChange = useCallback((index, field, value) => {
    onItemsChange(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, [onItemsChange]);
  const removeItem = useCallback((index) => {
    onItemsChange(prev => prev.filter((_, i) => i !== index));
  }, [onItemsChange]);
  const duplicateItem = useCallback((index) => {
    onItemsChange(prev => {
      const duplicate = {
        ...prev[index],
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      const newItems = [...prev];
      newItems.splice(index + 1, 0, duplicate);
      return newItems;
    });
  }, [onItemsChange]);
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      onItemsChange(prev => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [onItemsChange]);
  const addNewItem = useCallback(() => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      description: "",
      quantity: 1,
      unit: "Adet",
      price: 0,
      taxRate: 20,
      discountRate: 0,
      total: 0,
      image: undefined,
    };
    onItemsChange(prev => [...prev, newItem]);
  }, [onItemsChange]);
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const XLSX = await import('xlsx').then(m => m.default || m);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array((e.currentTarget as FileReader).result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const newItems: QuoteItem[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = (jsonData[i] ?? []) as unknown[];
          if (row.length === 0) continue;
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: String(row[0] ?? ""),
            description: String(row[1] ?? ""),
            quantity: parseFloat(String(row[2])) || 1,
            unit: String(row[3] ?? "Adet"),
            price: parseFloat(String(row[4])) || 0,
            taxRate: parseFloat(String(row[5])) || 20,
            discountRate: parseFloat(String(row[6])) || 0,
            total: 0,
            image: undefined,
          });
        }
        if (newItems.length > 0) {
          onItemsChange(prev => [...prev, ...newItems]);
          toast.success(t('excelItemsAdded').replace('{count}', String(newItems.length)));
        }
      } catch (err) {
        toast.error(t('excelReadErrorItems'));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };
  const handleKeyDown = useCallback((e, index, field) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const fields = ["name", "description", "quantity", "unit", "price", "taxRate", "discountRate"];
      const currentFieldIndex = fields.indexOf(field);
      if (e.shiftKey) {
        if (currentFieldIndex > 0) {
          const prevField = fields[currentFieldIndex - 1];
          const prevEl = document.querySelector(`[data-row="${index}"][data-field="${prevField}"]`) as HTMLElement;
          if (prevEl) prevEl.focus();
        } else if (index > 0) {
          const lastField = fields[fields.length - 1];
          const prevEl = document.querySelector(`[data-row="${index - 1}"][data-field="${lastField}"]`) as HTMLElement;
          if (prevEl) prevEl.focus();
        }
      } else {
        if (currentFieldIndex < fields.length - 1) {
          const nextField = fields[currentFieldIndex + 1];
          const nextEl = document.querySelector(`[data-row="${index}"][data-field="${nextField}"]`) as HTMLElement;
          if (nextEl) nextEl.focus();
        } else if (index < items.length - 1) {
          const nextEl = document.querySelector(`[data-row="${index + 1}"][data-field="name"]`) as HTMLElement;
          if (nextEl) nextEl.focus();
        }
      }
    }
  }, [items.length]);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, index: -1 });
  const handleContextMenu = useCallback((e, index) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  }, []);
  const contextMenuItems = useMemo(() => {
    if (contextMenu.index < 0) return [];
    return [
      { icon: <Package size={13} />, label: t('saveAsProduct'), onClick: async () => {
        const item = items[contextMenu.index];
        if (!item?.name) { toast.error(t('productNameRequired')); return; }
        try {
          await db.add("products", { id: `prod-${Date.now()}`, name: item.name, description: item.description || "", price: parseFloat(String(item.price)) || 0, taxRate: parseFloat(String(item.taxRate)) || 20, unit: item.unit || "Adet", image: item.image || null, createdAt: new Date().toISOString() });
          toast.success(t('productSavedToCatalog'));
        } catch (err) { Logger.error("Error saving product", err); }
      }},
      { icon: <AlertCircle size={13} />, label: t('validationStatus'), onClick: () => {
        const item = items[contextMenu.index];
        const errs = getRowErrors(item);
        if (Object.keys(errs).length === 0) toast.success(t('noRowErrors'));
        else toast.error(t('rowErrors').replace('{errors}', Object.values(errs).join(", ")));
      }},
      { separator: true, label: "", onClick: () => {} },
      { icon: <Trash size={13} />, label: t('deleteRow'), onClick: () => removeItem(contextMenu.index) },
    ];
  }, [contextMenu.index, items, db, getRowErrors, removeItem, t]);
  const formatItemCurrency = useCallback((amount) => formatCurrency(amount, currency), [currency]);
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <Package size={16} className="text-[var(--color-primary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            {t("items")} ({items.length})
          </h3>
          {hasErrors && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-error)]">
              <AlertCircle size={12} /> {t('errorsExist')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-1.5 bg-[var(--color-primary-muted)] px-2 py-1 rounded-lg text-xs">
              <span className="font-medium text-[var(--color-primary)]">{selectedItems.size} {t('selected')}</span>
              <button type="button" onClick={moveSelectedUp} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title={t('moveUp')} aria-label={t('moveUp')}><ArrowUp size={12} /></button>
              <button type="button" onClick={moveSelectedDown} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title={t('moveDown')} aria-label={t('moveDown')}><ArrowDown size={12} /></button>
              <button type="button" onClick={duplicateSelected} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title={t('duplicateRow')} aria-label={t('duplicateRow')}><Package size={12} /></button>
              <button type="button" onClick={deleteSelected} className="p-1 hover:bg-[var(--color-error-muted)] rounded text-[var(--color-error)]" title={t('delete')} aria-label={t('delete')}><Trash size={12} /></button>
              <button type="button" onClick={() => setSelectedItems(new Set())} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title={t('clearSelection')} aria-label={t('clearSelection')}><X size={12} /></button>
            </div>
          )}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button type="button" onClick={selectAll} className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]" title={selectedItems.size === items.length ? t('deselectAll') : t('selectAllItems')} aria-label={selectedItems.size === items.length ? t('deselectAll') : t('selectAllItems')}>
              {selectedItems.size === items.length && items.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
          </div>
          <div className="flex border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button type="button" onClick={() => setViewMode("table")} className={`p-1.5 ${viewMode === "table" ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"}`} title={t('tableViewMode')} aria-label={t('tableViewMode')}><Table size={14} /></button>
            <button type="button" onClick={() => setViewMode("card")} className={`p-1.5 ${viewMode === "card" ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"}`} title={t('cardViewMode')} aria-label={t('cardViewMode')}><Grid3X3 size={14} /></button>
          </div>
          <label className="btn btn-outline btn-sm cursor-pointer" title={t('importFromExcel')}>
            <Upload size={13} /> Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
          </label>
          {onAddProduct && (
            <button type="button" onClick={onAddProduct} className="btn btn-outline btn-sm" title={t('addFromCatalogItems')}>
              <Package size={13} /> {t('addFromCatalogItems')}
            </button>
          )}
          <button type="button" onClick={addNewItem} className="btn btn-primary btn-sm">
            <Plus size={13} /> {t("addItem")}
          </button>
        </div>
      </div>
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            className="form-control pl-9"
            placeholder={t('searchProducts')}
            aria-label={t('searchProducts')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label={t('clearSearch')}>
              <X size={14} />
            </button>
          )}
        </div>
        {showSearch && searchQuery.length >= 2 && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((product, idx) => (
                <button key={product.id || idx} type="button"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${idx === searchIndex ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]" : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"}`}
                  onMouseDown={() => addProductFromSearch(product)}>
                  <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-bg-muted)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-[var(--color-text-muted)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    {product.description && <div className="text-xs text-[var(--color-text-muted)] truncate">{product.description}</div>}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">{formatCurrency(product.price || 0, currency)}</span>
                </button>
              ))
            ) : (
              <div className="px-3.5 py-3 text-sm text-[var(--color-text-muted)]">{t('noResultsFound')}</div>
            )}
          </div>
        )}
      </div>
      {recentProducts.length > 0 && items.length === 0 && (
        <div className="text-xs text-[var(--color-text-muted)]">
          <span className="font-medium">{t('recentProducts')}</span>{" "}
          {recentProducts.map((p, i) => (
            <button type="button" key={p.id || i} onClick={() => addProductFromSearch(p)} className="hover:text-[var(--color-primary)] transition-colors">
              {p.name}{i < recentProducts.length - 1 ? ", " : ""}
            </button>
          ))}
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="w-6 px-1"></th>
                    <th className="w-8"></th>
                    <th className="w-16">{t("image")}</th>
                    <th className="min-w-[200px]">{t("productName")}</th>
                    <th className="w-20">{t("quantity")}</th>
                    <th className="w-24">{t("unit")}</th>
                    <th className="w-28">{t("unitPrice")}</th>
                    <th className="w-16">{t("vatRate")}</th>
                    <th className="w-16">{t("discountRate")}</th>
                    <th className="w-28">{t("total")}</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      handleItemChange={handleItemChange}
                      removeItem={removeItem}
                      duplicateItem={duplicateItem}
                      formatCurrency={formatItemCurrency}
                      onKeyDown={handleKeyDown}
                      t={t}
                      getFieldClass={getFieldClass}
                      handleRowBlur={handleRowBlur}
                      rowErrors={allRowErrors.get(item.id)}
                      selected={selectedItems.has(index)}
                      toggleSelectItem={toggleSelectItem}
                      onContextMenu={(e) => handleContextMenu(e, index)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, index) => (
                <SortableRowCard
                  key={item.id}
                  item={item}
                  index={index}
                  handleItemChange={handleItemChange}
                  removeItem={removeItem}
                  duplicateItem={duplicateItem}
                  formatCurrency={formatItemCurrency}
                  t={t}
                  getFieldClass={getFieldClass}
                  handleRowBlur={handleRowBlur}
                  rowErrors={allRowErrors.get(item.id)}
                  selected={selectedItems.has(index)}
                  toggleSelectItem={toggleSelectItem}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("noItems")}</p>
          <p className="text-xs mt-1">{t('noItemsHintItems')}</p>
        </div>
      )}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextMenuItems}
        onClose={() => setContextMenu({ x: 0, y: 0, index: -1 })}
      />
    </div>
  );
};
export default React.memo(ItemsTable);
