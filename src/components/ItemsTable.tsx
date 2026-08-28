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
} from 'lucide-react';
import React, { useCallback } from 'react';
import { ItemsBatchBar } from '@/components/items/ItemsBatchBar';
import { ItemsHeaderControls } from '@/components/items/ItemsHeaderControls';
import SortableRow from '@/components/items/SortableRow';
import SortableRowCard from '@/components/items/SortableRowCard';
import { useItemsTableCatalog } from '@/components/items/useItemsTableCatalog';
import { useItemsTableImport } from '@/components/items/useItemsTableImport';
import { useItemsTablePreferences } from '@/components/items/useItemsTablePreferences';
import { useItemsTableSelection } from '@/components/items/useItemsTableSelection';
import { useItemsTableValidation } from '@/components/items/useItemsTableValidation';
import { useQuoteData } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { ItemsTableProps } from '@/components/items/itemsTableTypes';

const ItemsTable = ({
  items,
  onItemsChange,
  currency = 'TRY',
  onAddProduct,
}: ItemsTableProps) => {
  const { quoteData, updateQuoteData, db } = useQuoteData();
  const { t } = useTranslation();
  const {
    viewMode, visibleColumns, toggleColumn, taxMode, toggleTaxMode,
    totalQuantity, sortItems, formatItemCurrency,
  } = useItemsTablePreferences({ items, onItemsChange, quoteData, updateQuoteData, currency, t });
  const { getFieldClass, handleRowBlur, allRowErrors, hasErrors } = useItemsTableValidation(items, t);
  const { allCatalogProducts, handleProductSelect, handleCreateProduct } = useItemsTableCatalog({ db, items, onItemsChange });
  const {
    selectedItems, toggleSelectItem, selectAll, deleteSelected, duplicateSelected,
    moveSelectedUp, moveSelectedDown, applyBulkDiscount, applyBulkVAT, clearSelection,
  } = useItemsTableSelection({ items, onItemsChange });
  const { handlePaste, handleExcelUpload } = useItemsTableImport({ onItemsChange, t });

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
        onClearSelection={clearSelection}
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
