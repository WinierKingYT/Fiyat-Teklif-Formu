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
import { useQuote } from "../context/QuoteContext";
import { useTranslation } from "../hooks/useTranslation";
import { sanitizeInput } from "../utils/sanitize";
import { evaluateMathExpression } from "../utils/smartCalc";
import { formatCurrency } from "../utils/calculations";
import toast from "react-hot-toast";

const ItemsTable = ({
  items,
  onItemsChange,
  currency = "TRY",
  onAddProduct,
}) => {
  const { quoteData, db } = useQuote();
  const { t } = useTranslation(quoteData?.language);
  const fileInputRef = useRef<any>(null);
  const searchRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState(
    window.innerWidth < 768 ? "card" : "table",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
  const addProductFromSearch = useCallback((product) => {
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
    addToRecentProducts(product);
    setSearchQuery("");
    setSearchResults([]);
    searchRef.current?.focus();
  }, [items, onItemsChange]);
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
  const [recentProducts, setRecentProducts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("recentProducts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const addToRecentProducts = useCallback((product) => {
    setRecentProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 5);
      localStorage.setItem("recentProducts", JSON.stringify(updated));
      return updated;
    });
  }, []);
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
    const newItems = items.filter((_, i) => !selectedItems.has(i));
    onItemsChange(newItems);
    setSelectedItems(new Set());
  }, [selectedItems, items, onItemsChange]);
  const duplicateSelected = useCallback(() => {
    const newItems = [...items];
    const duplicates = Array.from(selectedItems)
      .sort((a, b) => b - a)
      .map((i) => ({
        ...newItems[i],
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));
    const result = [...newItems, ...duplicates];
    onItemsChange(result);
    setSelectedItems(new Set());
  }, [selectedItems, items, onItemsChange]);
  const moveSelectedUp = useCallback(() => {
    if (selectedItems.size === 0) return;
    const newItems = [...items];
    const indices = Array.from(selectedItems).sort((a, b) => a - b);
    if (indices[0] === 0) return;
    for (const i of indices) {
      [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
    }
    onItemsChange(newItems);
    setSelectedItems(new Set(indices.map((i) => i - 1)));
  }, [selectedItems, items, onItemsChange]);
  const moveSelectedDown = useCallback(() => {
    if (selectedItems.size === 0) return;
    const newItems = [...items];
    const indices = Array.from(selectedItems).sort((a, b) => b - a);
    if (indices[0] === items.length - 1) return;
    for (const i of indices) {
      [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
    }
    onItemsChange(newItems);
    setSelectedItems(new Set(indices.map((i) => i + 1)));
  }, [selectedItems, items, onItemsChange]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleItemChange = useCallback((index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  }, [items, onItemsChange]);
  const removeItem = useCallback((index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  }, [items, onItemsChange]);
  const duplicateItem = useCallback((index) => {
    const duplicate = {
      ...items[index],
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const newItems = [...items];
    newItems.splice(index + 1, 0, duplicate);
    onItemsChange(newItems);
  }, [items, onItemsChange]);
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onItemsChange(arrayMove(items, oldIndex, newIndex));
    }
  }, [items, onItemsChange]);
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
      image: null,
    };
    onItemsChange([...items, newItem]);
  }, [items, onItemsChange]);
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
        const newItems: any[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: row[0] || "",
            description: row[1] || "",
            quantity: parseFloat(row[2]) || 1,
            unit: row[3] || "Adet",
            price: parseFloat(row[4]) || 0,
            taxRate: parseFloat(row[5]) || 20,
            discountRate: parseFloat(row[6]) || 0,
            total: 0,
            image: null,
          });
        }
        if (newItems.length > 0) {
          onItemsChange([...items, ...newItems]);
          toast.success(`${newItems.length} ürün eklendi`);
        }
      } catch (err) {
        toast.error("Excel dosyası okunamadı");
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
      { icon: <Package size={13} />, label: "Ürün olarak kaydet", onClick: async () => {
        const item = items[contextMenu.index];
        if (!item?.name) { toast.error("Ürün adı gerekli"); return; }
        try {
          await db.add("products", { id: `prod-${Date.now()}`, name: item.name, description: item.description || "", price: parseFloat(item.price) || 0, taxRate: parseFloat(item.taxRate) || 20, unit: item.unit || "Adet", image: item.image || null, createdAt: new Date().toISOString() });
          toast.success("Ürün kataloğa kaydedildi");
        } catch (err) { Logger.error("Error saving product", err); }
      }},
      { icon: <AlertCircle size={13} />, label: "Doğrulama durumu", onClick: () => {
        const item = items[contextMenu.index];
        const errs = getRowErrors(item);
        if (Object.keys(errs).length === 0) toast.success("Bu satırda hata yok");
        else toast.error("Hatalar: " + Object.values(errs).join(", "));
      }},
      { separator: true, label: "", onClick: () => {} },
      { icon: <Trash size={13} />, label: "Satırı sil", onClick: () => removeItem(contextMenu.index) },
    ];
  }, [contextMenu.index, items, db, getRowErrors, removeItem]);
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
              <AlertCircle size={12} /> Hatalar var
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-1.5 bg-[var(--color-primary-muted)] px-2 py-1 rounded-lg text-xs">
              <span className="font-medium text-[var(--color-primary)]">{selectedItems.size} seçili</span>
              <button onClick={moveSelectedUp} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title="Yukarı taşı"><ArrowUp size={12} /></button>
              <button onClick={moveSelectedDown} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title="Aşağı taşı"><ArrowDown size={12} /></button>
              <button onClick={duplicateSelected} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title="Çoğalt"><Package size={12} /></button>
              <button onClick={deleteSelected} className="p-1 hover:bg-[var(--color-error-muted)] rounded text-[var(--color-error)]" title="Sil"><Trash size={12} /></button>
              <button onClick={() => setSelectedItems(new Set())} className="p-1 hover:bg-[var(--color-bg-hover)] rounded" title="Seçimi kaldır"><X size={12} /></button>
            </div>
          )}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button onClick={selectAll} className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]" title={selectedItems.size === items.length ? "Tüm seçimleri kaldır" : "Tümünü seç"}>
              {selectedItems.size === items.length && items.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
          </div>
          <div className="flex border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("table")} className={`p-1.5 ${viewMode === "table" ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"}`} title="Tablo görünümü"><Table size={14} /></button>
            <button onClick={() => setViewMode("card")} className={`p-1.5 ${viewMode === "card" ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"}`} title="Kart görünümü"><Grid3X3 size={14} /></button>
          </div>
          <label className="btn btn-outline btn-sm cursor-pointer" title="Excel'den içe aktar">
            <Upload size={13} /> Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
          </label>
          {onAddProduct && (
            <button onClick={onAddProduct} className="btn btn-outline btn-sm" title="Ürün kataloğundan ekle">
              <Package size={13} /> {t("addFromCatalog") || "Katalog"}
            </button>
          )}
          <button onClick={addNewItem} className="btn btn-primary btn-sm">
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
            placeholder="Ürün ara... (en az 2 karakter)"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
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
              <div className="px-3.5 py-3 text-sm text-[var(--color-text-muted)]">Sonuç bulunamadı</div>
            )}
          </div>
        )}
      </div>
      {recentProducts.length > 0 && items.length === 0 && (
        <div className="text-xs text-[var(--color-text-muted)]">
          <span className="font-medium">Son ürünler:</span>{" "}
          {recentProducts.map((p, i) => (
            <button key={p.id || i} onClick={() => addProductFromSearch(p)} className="hover:text-[var(--color-primary)] transition-colors">
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
                      rowErrors={getRowErrors(item)}
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
                  rowErrors={getRowErrors(item)}
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
          <p className="text-xs mt-1">Excel'den içe aktarın veya ürün ekleyin</p>
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
export default ItemsTable;
