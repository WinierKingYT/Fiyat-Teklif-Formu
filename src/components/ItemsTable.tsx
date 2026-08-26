import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Package,
  Trash,
  AlertCircle,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ItemsBatchBar } from '@/components/items/ItemsBatchBar';
import { ItemsHeaderControls } from '@/components/items/ItemsHeaderControls';
import SortableRow from '@/components/items/SortableRow';
import SortableRowCard from '@/components/items/SortableRowCard';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/utils/calculations';
import Logger from '@/utils/logger';
import { sanitizeInput } from '@/utils/sanitize';
import type { QuoteItem } from '@/context/quote/types';

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
  category?: string;
  image?: string | null;
  createdAt?: string;
}

const ItemsTable = ({
  items,
  onItemsChange,
  currency = 'TRY',
  onAddProduct,
}: ItemsTableProps) => {
  const { quoteData, updateQuoteData, db } = useQuoteData();
  const { t } = useTranslation(quoteData?.language);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table',
  );

  useEffect(() => {
    // Faz4: viewMode resize throttle (100ms)
    let throttleTimer: number | null = null;
    const handleResize = () => {
      if (throttleTimer !== null) return;
      throttleTimer = window.setTimeout(() => {
        setViewMode(window.innerWidth < 768 ? 'card' : 'table');
        throttleTimer = null;
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (throttleTimer !== null) window.clearTimeout(throttleTimer);
    };
  }, []);
  const [touchedRows, setTouchedRows] = useState<Record<string, Record<string, boolean>>>({});

  // Column Visibility Customization
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('quote_visible_cols');
      return saved ? JSON.parse(saved) : { image: true, description: true, unit: true, discount: true };
    } catch {
      return { image: true, description: true, unit: true, discount: true };
    }
  });

  const toggleColumn = (key: 'image' | 'description' | 'unit' | 'discount') => {
    setVisibleColumns((prev: typeof visibleColumns) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('quote_visible_cols', JSON.stringify(next));
      return next;
    });
  };

  // Tax Mode
  const taxMode: 'exclusive' | 'inclusive' = (quoteData as Record<string, unknown>).taxMode === 'inclusive' ? 'inclusive' : 'exclusive';
  const toggleTaxMode = () => {
    const next = taxMode === 'exclusive' ? 'inclusive' : 'exclusive';
    updateQuoteData('taxMode', next);
    toast.success(next === 'inclusive' ? (t('taxModeToastInclusive') || 'Fiyatlandırma: KDV Dahil Modu') : (t('taxModeToastExclusive') || 'Fiyatlandırma: KDV Hariç Modu'));
  };

  // Live item count & quantity calculations
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  // Fast Sort
  const sortItems = (mode: 'price-desc' | 'price-asc' | 'name-asc') => {
    onItemsChange(prev => {
      const list = [...prev];
      if (mode === 'price-desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      else if (mode === 'price-asc') list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      else if (mode === 'name-asc') list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
      return list;
    });
    toast.success(t('itemsSorted') || 'Kalemler sıralandı');
  };

  const parseTr = (v: unknown) => {
    const s = String(v ?? '').trim().replace(/[^\d.,-]/g, '');
    if (!s) return NaN;
    const hasDot = s.includes('.'), hasComma = s.includes(',');
    let o = s;
    if (hasDot && hasComma) o = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (hasComma) o = (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
    else if (hasDot && (s.match(/\./g) || []).length > 1) o = s.replace(/\./g, '');
    const n = Number(o); return Number.isFinite(n) ? n : NaN;
  };
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && !text.includes('\t'))) return;
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 100);
    if (lines.length === 0) return;
    const ALLOWED_TAX = new Set([0,1,10,20]);
    const parsedItems: QuoteItem[] = [];
    for (const line of lines) {
      const cols = line.split('\t');
      if (cols.length >= 1 && cols[0].trim()) {
        const rawQty = parseTr(cols[2]); const qty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
        const rawPrice = parseTr(cols[4]); const price = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;
        const rawTax = parseTr(cols[5]); const taxRate = Number.isFinite(rawTax) && ALLOWED_TAX.has(rawTax) ? rawTax : Number.isFinite(rawTax) && rawTax >=0 && rawTax <=100 ? rawTax : 20;
        parsedItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: String(sanitizeInput(cols[0].trim().slice(0,200)) || ''),
          description: String(sanitizeInput((cols[1] || '').trim().slice(0,500)) || ''),
          quantity: qty,
          unit: (cols[3] || '').trim().slice(0,20) || 'Adet',
          price, taxRate, discountRate: 0, total: 0,
        });
      }
    }
    if (parsedItems.length > 0) {
      e.preventDefault();
      onItemsChange(prev => [...prev, ...parsedItems]);
      toast.success(t('pastedItemsCount').replace('{count}', String(parsedItems.length)) || `${parsedItems.length} kalem panodan yapıştırıldı`);
    }
  }, [onItemsChange, t]);

  const getRowErrors = useCallback((item: QuoteItem) => {
    const errs: Record<string, string> = {};
    const qty = Number(item.quantity);
    const price = Number(item.price);
    const tax = Number(item.taxRate);
    if (!item.name) errs.name = t('productNameRequired');
    if (!Number.isFinite(qty) || qty <= 0) errs.quantity = t('quantityMustBePositive') || 'Miktar > 0 olmalı';
    if (!Number.isFinite(price) || price < 0) errs.price = t('invalidPrice') || 'Geçersiz fiyat';
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) errs.taxRate = t('vatRateRange') || 'KDV 0-100 arası';
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

  const [allCatalogProducts, setAllCatalogProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    if (!db) return;
    const fetchCatalog = async () => {
      try {
        const prods = await db.getAll<ProductRow>('products');
        setAllCatalogProducts(prods || []);
      } catch {
        setAllCatalogProducts([]);
      }
    };
    fetchCatalog();
  }, [db]);

  const handleProductSelect = useCallback((index: number, product: ProductRow) => {
    onItemsChange(prev => {
      const newItems = [...prev];
      if (!newItems[index]) return prev;
      const quantity = newItems[index].quantity || 1;
      const price = product.price !== undefined ? product.price : newItems[index].price;
      const discountRate = newItems[index].discountRate || 0;
      const total = quantity * price * (1 - discountRate / 100);
      newItems[index] = {
        ...newItems[index],
        name: product.name,
        description: product.description !== undefined ? product.description : (newItems[index].description || ''),
        unit: product.unit || newItems[index].unit || 'Adet',
        price: price,
        taxRate: product.taxRate !== undefined ? product.taxRate : (newItems[index].taxRate || 20),
        total: total,
        image: product.image ?? newItems[index].image,
      };
      return newItems;
    });
  }, [onItemsChange]);

  const handleCreateProduct = useCallback(async (index: number, name: string) => {
    if (!name.trim() || !db) return;
    const trimmed = name.trim();
    const currentRow = items[index];
    const newProduct: ProductRow = {
      id: `prod-${Date.now()}`,
      name: trimmed,
      description: currentRow?.description || '',
      price: currentRow?.price || 0,
      unit: currentRow?.unit || 'Adet',
      taxRate: currentRow?.taxRate || 20,
      image: currentRow?.image || null,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.add('products', newProduct);
      toast.success(`"${trimmed}" ürünü kataloğa kaydedildi`);
      setAllCatalogProducts((prev) => [...prev, newProduct]);
      handleProductSelect(index, newProduct);
    } catch (err) {
      Logger.error('Ürün kaydedilemedi:', err);
      toast.error('Ürün kataloğa kaydedilemedi');
    }
  }, [db, items, handleProductSelect]);

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
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        }));
      return [...prev, ...duplicates];
    });
    setSelectedItems(new Set());
  }, [selectedItems, onItemsChange]);

  const moveSelectedUp = useCallback(() => {
    if (selectedItems.size === 0) return;
    const indices = Array.from(selectedItems).sort((a, b) => a - b);
    if (indices[0] <= 0) return;
    onItemsChange(prev => {
      const newItems = [...prev];
      for (const i of indices) {
        if (i > 0 && !selectedItems.has(i - 1)) {
          [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
        }
      }
      return newItems;
    });
    setSelectedItems(new Set(indices.map((i) => selectedItems.has(i - 1) ? i : i - 1)));
  }, [selectedItems, onItemsChange]);

  const moveSelectedDown = useCallback(() => {
    if (selectedItems.size === 0) return;
    const indices = Array.from(selectedItems).sort((a, b) => b - a);
    if (indices[0] >= items.length - 1) return;
    onItemsChange(prev => {
      const newItems = [...prev];
      for (const i of indices) {
        if (i < newItems.length - 1 && !selectedItems.has(i + 1)) {
          [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
        }
      }
      return newItems;
    });
    setSelectedItems(new Set(indices.map((i) => selectedItems.has(i + 1) ? i : i + 1)));
  }, [selectedItems, items.length, onItemsChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleItemChange = useCallback((index: number, field: string, value: unknown) => {
    onItemsChange(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, [onItemsChange]);

  const removeItem = useCallback((index: number) => {
    onItemsChange(prev => prev.filter((_, i) => i !== index));
  }, [onItemsChange]);

  const duplicateItem = useCallback((index: number) => {
    onItemsChange(prev => {
      const duplicate = {
        ...prev[index],
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      };
      const newItems = [...prev];
      newItems.splice(index + 1, 0, duplicate);
      return newItems;
    });
  }, [onItemsChange]);

  const handleDragEnd = useCallback((event: { active: { id: unknown }; over: { id: unknown } | null }) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      onItemsChange(prev => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over?.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [onItemsChange]);

  const addNewItem = useCallback(() => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      description: '',
      quantity: 1,
      unit: 'Adet',
      price: 0,
      taxRate: 20,
      discountRate: 0,
      total: 0,
      image: undefined,
    };
    onItemsChange(prev => [...prev, newItem]);
  }, [onItemsChange]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const XLSX = await import('xlsx').then(m => m.default || m);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array((event.currentTarget as FileReader).result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const newItems: QuoteItem[] = [];
        const ALLOWED_TAX_XL = new Set([0,1,10,20]);
        for (let i = 1; i < jsonData.length; i++) {
          const row = (jsonData[i] ?? []) as unknown[];
          if (row.length === 0) continue;
          const q2 = parseTr(String(row[2])); const p4 = parseTr(String(row[4])); const t5 = parseTr(String(row[5])); const d6 = parseTr(String(row[6]));
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: String(sanitizeInput(String(row[0] ?? '').slice(0,200)) || ''),
            description: String(sanitizeInput(String(row[1] ?? '').slice(0,500)) || ''),
            quantity: Number.isFinite(q2) && q2 > 0 ? q2 : 1,
            unit: String(row[3] ?? 'Adet').slice(0,20),
            price: Number.isFinite(p4) && p4 >=0 ? p4 : 0,
            taxRate: Number.isFinite(t5) && ALLOWED_TAX_XL.has(t5) ? t5 : Number.isFinite(t5) && t5>=0 && t5<=100 ? t5 : 20,
            discountRate: Number.isFinite(d6) && d6>=0 ? Math.min(d6, 1000000) : 0,
            total: 0,
            image: undefined,
          });
        }
        if (newItems.length > 0) {
          onItemsChange(prev => [...prev, ...newItems]);
          toast.success(t('excelItemsAdded').replace('{count}', String(newItems.length)));
        }
      } catch {
        toast.error(t('excelReadErrorItems'));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, field: string) => {
    const fields = ['name', 'description', 'quantity', 'unit', 'price', 'taxRate', 'discountRate'];
    const currentFieldIndex = fields.indexOf(field);

    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === items.length - 1) {
        addNewItem();
        setTimeout(() => {
          const nextEl = document.querySelector(`[data-row="${index + 1}"][data-field="name"]`) as HTMLElement;
          if (nextEl) nextEl.focus();
        }, 50);
      } else {
        const nextEl = (document.querySelector(`[data-row="${index + 1}"][data-field="${field}"]`) as HTMLElement)
          || (document.querySelector(`[data-row="${index + 1}"][data-field="name"]`) as HTMLElement);
        if (nextEl) nextEl.focus();
      }
    } else if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (currentFieldIndex > 0) {
          e.preventDefault();
          const prevField = fields[currentFieldIndex - 1];
          const prevEl = document.querySelector(`[data-row="${index}"][data-field="${prevField}"]`) as HTMLElement;
          if (prevEl) prevEl.focus();
        } else if (index > 0) {
          e.preventDefault();
          const lastField = fields[fields.length - 1];
          const prevEl = document.querySelector(`[data-row="${index - 1}"][data-field="${lastField}"]`) as HTMLElement;
          if (prevEl) prevEl.focus();
        }
      } else {
        if (currentFieldIndex < fields.length - 1) {
          e.preventDefault();
          const nextField = fields[currentFieldIndex + 1];
          const nextEl = document.querySelector(`[data-row="${index}"][data-field="${nextField}"]`) as HTMLElement;
          if (nextEl) nextEl.focus();
        } else if (index < items.length - 1) {
          e.preventDefault();
          const nextEl = document.querySelector(`[data-row="${index + 1}"][data-field="name"]`) as HTMLElement;
          if (nextEl) nextEl.focus();
        } else if (index === items.length - 1) {
          e.preventDefault();
          addNewItem();
          setTimeout(() => {
            const nextEl = document.querySelector(`[data-row="${index + 1}"][data-field="name"]`) as HTMLElement;
            if (nextEl) nextEl.focus();
          }, 50);
        }
      }
    }
  }, [items.length, addNewItem]);

  const applyBulkDiscount = (rate: number) => {
    onItemsChange(prev => prev.map((item, idx) => selectedItems.has(idx) ? { ...item, discountRate: rate } : item));
    toast.success(`Seçili kalemlere %${rate} iskonto uygulandı`);
  };

  const applyBulkVAT = (vat: number) => {
    onItemsChange(prev => prev.map((item, idx) => selectedItems.has(idx) ? { ...item, taxRate: vat } : item));
    toast.success(`Seçili kalemlerin KDV oranı %${vat} yapıldı`);
  };

  const formatItemCurrency = useCallback((amount: number) => formatCurrency(amount, currency), [currency]);

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      {/* ─── CONTROLS HEADER ─── */}
      <ItemsHeaderControls
        itemCount={items.length}
        totalQuantity={totalQuantity}
        hasErrors={hasErrors}
        taxMode={taxMode}
        onToggleTaxMode={toggleTaxMode}
        onSortItems={sortItems}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onExcelUpload={handleExcelUpload}
        selectedCount={selectedItems.size}
        onSelectAll={selectAll}
        onAddProduct={onAddProduct}
        onAddNewItem={addNewItem}
        t={t}
      />

      {/* ─── BATCH OPERATIONS TOOLBAR ─── */}
      <ItemsBatchBar
        selectedCount={selectedItems.size}
        onApplyBulkDiscount={applyBulkDiscount}
        onApplyBulkVAT={applyBulkVAT}
        onMoveSelectedUp={moveSelectedUp}
        onMoveSelectedDown={moveSelectedDown}
        onDuplicateSelected={duplicateSelected}
        onDeleteSelected={deleteSelected}
        onClearSelection={() => setSelectedItems(new Set())}
        t={t}
      />

      {/* ─── DND CONTEXT & ROWS ─── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                    <th className="w-6 px-1"></th>
                    <th className="w-7 text-center">#</th>
                    {visibleColumns.image !== false && <th className="w-16">{t('image')}</th>}
                    <th className="min-w-[200px]">{t('productName')}</th>
                    {visibleColumns.description !== false && <th className="min-w-[140px]">{t('description')}</th>}
                    <th className="w-20">{t('quantity')}</th>
                    {visibleColumns.unit !== false && <th className="w-24">{t('unit')}</th>}
                    <th className="w-28">{t('unitPrice')}</th>
                    <th className="w-16">{t('vatRate')}</th>
                    {visibleColumns.discount !== false && <th className="w-22">{t('discountRate')}</th>}
                    <th className="w-28">{t('total')}</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {/* A4 Page Break Indicator guideline after 20th row (tek sayfa 20) */}
                      {index === 20 && (
                        <tr className="bg-[var(--color-primary-muted)]/20 border-y-2 border-dashed border-[var(--color-primary)]/40 text-center select-none">
                          <td colSpan={11} className="py-1.5 text-[11px] font-semibold text-[var(--color-primary)] tracking-wide">
                            📄 1. Sayfa Sonu (A4 Baskı Sınırı — Aşağıdaki Kalemler 2. Sayfaya Taşar)
                          </td>
                        </tr>
                      )}
                      <SortableRow
                        item={item}
                        index={index}
                        handleItemChange={handleItemChange}
                        onSelectProduct={handleProductSelect}
                        onCreateProduct={handleCreateProduct}
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
                        visibleColumns={visibleColumns}
                        taxMode={taxMode}
                        products={allCatalogProducts}
                        currency={currency}
                      />
                    </React.Fragment>
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
                  onSelectProduct={handleProductSelect}
                  onCreateProduct={handleCreateProduct}
                  removeItem={removeItem}
                  duplicateItem={duplicateItem}
                  formatCurrency={formatItemCurrency}
                  t={t}
                  getFieldClass={getFieldClass}
                  handleRowBlur={handleRowBlur}
                  rowErrors={allRowErrors.get(item.id)}
                  selected={selectedItems.has(index)}
                  toggleSelectItem={toggleSelectItem}
                  products={allCatalogProducts}
                  currency={currency}
                  taxMode={taxMode}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('noItems')}</p>
          <p className="text-xs mt-1">{t('noItemsHintItems')}</p>
        </div>
      )}
      {/* Faz2: Klavye kısayol ipuçları */}
      {items.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-2 text-[10px] text-[var(--color-text-muted)] select-none" aria-label="Klavye kısayolları">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)] font-mono text-[9px] font-medium shadow-xs">
              Enter ↵
            </kbd>
            <span>{t('keyboardHintEnter') ? t('keyboardHintEnter').replace('Enter ↵ ', '') : 'yeni satır'}</span>
          </span>
          <span className="text-[var(--color-border)]">|</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)] font-mono text-[9px] font-medium shadow-xs">
              Tab ⇥
            </kbd>
            <span>{t('keyboardHintTab') ? t('keyboardHintTab').replace('Tab ⇥ ', '') : 'sonraki alan'}</span>
          </span>
          <span className="text-[var(--color-border)]">|</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] border border-[var(--color-border)] font-mono text-[9px] font-medium shadow-xs">
              Ctrl+V
            </kbd>
            <span>{t('keyboardHintPaste') ? t('keyboardHintPaste').replace('Ctrl+V ', '') : 'tablodan yapıştır'}</span>
          </span>
        </div>
      )}
    </div>
  );
};
export default React.memo(ItemsTable);
