import {
  Package,
  AlertCircle,
  Settings2,
  Upload,
  CheckSquare,
  Square,
  Plus
} from 'lucide-react';
import React, { useState } from 'react';

interface VisibleColumns {
  image: boolean;
  description: boolean;
  unit: boolean;
  discount: boolean;
}

interface ItemsHeaderControlsProps {
  itemCount: number;
  totalQuantity: number;
  hasErrors: boolean;
  taxMode: 'exclusive' | 'inclusive';
  onToggleTaxMode: () => void;
  onSortItems: (mode: 'price-desc' | 'price-asc' | 'name-asc') => void;
  visibleColumns: VisibleColumns;
  onToggleColumn: (key: keyof VisibleColumns) => void;
  onExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCount: number;
  onSelectAll: () => void;
  onAddProduct?: () => void;
  onAddNewItem: () => void;
  t: (key: string) => string;
}

export const ItemsHeaderControls: React.FC<ItemsHeaderControlsProps> = ({
  itemCount,
  totalQuantity,
  hasErrors,
  taxMode,
  onToggleTaxMode,
  onSortItems,
  visibleColumns,
  onToggleColumn,
  onExcelUpload,
  selectedCount,
  onSelectAll,
  onAddProduct,
  onAddNewItem,
  t
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const toolsMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    if (showToolsMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showToolsMenu]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-primary-muted)] flex items-center justify-center">
          <Package size={16} className="text-[var(--color-primary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          {t('items')}
        </h3>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
          {itemCount} {t('itemsCount') || 'Kalem'} • {totalQuantity} {t('unitPiece') || 'Adet'}
        </span>
        {hasErrors && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-error)]">
            <AlertCircle size={12} /> {t('errorsExist')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Tools & Options Dropdown */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setShowToolsMenu(prev => !prev)}
            className={`btn btn-xs flex items-center gap-1 ${showToolsMenu ? 'bg-[var(--color-bg-hover)]' : 'btn-outline'}`}
            title={t('toolsMenuTitle') || 'Tablo Araçları ve Seçenekler'}
          >
            <Settings2 size={13} />
            <span>{t('tools') || 'Araçlar'}</span>
          </button>
          {showToolsMenu && (
            <div className="absolute right-0 mt-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-xl p-2.5 min-w-[200px] z-50 space-y-2 text-xs">
              {/* Tax Mode */}
              <div>
                <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider mb-1">{t('pricingSection') || 'Fiyatlandırma'}</div>
                <button
                  type="button"
                  onClick={() => { onToggleTaxMode(); setShowToolsMenu(false); }}
                  className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--color-bg-hover)] text-left transition-colors"
                >
                  <span className="text-[var(--color-text)]">{t('vat') || 'KDV Modu'}</span>
                  <span className="font-semibold text-[var(--color-primary)]">{taxMode === 'inclusive' ? (t('inclusive') || 'Dahil') : (t('exclusive') || 'Hariç')}</span>
                </button>
              </div>

              <div className="border-t border-[var(--color-border)]" />

              {/* Fast Sort */}
              <div>
                <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider mb-1">{t('sortSection') || 'Sırala'}</div>
                <div className="space-y-0.5">
                  <button type="button" onClick={() => { onSortItems('price-desc'); setShowToolsMenu(false); }} className="w-full text-left px-2 py-1 rounded text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]">{t('sortPriceDesc') || 'Pahalıdan Ucuza'}</button>
                  <button type="button" onClick={() => { onSortItems('price-asc'); setShowToolsMenu(false); }} className="w-full text-left px-2 py-1 rounded text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]">{t('sortPriceAsc') || 'Ucuzdan Pahalıya'}</button>
                  <button type="button" onClick={() => { onSortItems('name-asc'); setShowToolsMenu(false); }} className="w-full text-left px-2 py-1 rounded text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]">{t('sortNameAsc') || 'İsim (A-Z)'}</button>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)]" />

              {/* Column Visibility */}
              <div>
                <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider mb-1">{t('columnsSection') || 'Sütunlar'}</div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)] px-1">
                    <input type="checkbox" checked={visibleColumns.image !== false} onChange={() => onToggleColumn('image')} />
                    <span>{t('image') || 'Görsel'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)] px-1">
                    <input type="checkbox" checked={visibleColumns.description !== false} onChange={() => onToggleColumn('description')} />
                    <span>{t('description') || 'Açıklama'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)] px-1">
                    <input type="checkbox" checked={visibleColumns.unit !== false} onChange={() => onToggleColumn('unit')} />
                    <span>{t('unit') || 'Birim'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text)] px-1">
                    <input type="checkbox" checked={visibleColumns.discount !== false} onChange={() => onToggleColumn('discount')} />
                    <span>{t('discount') || 'İskonto'}</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)]" />

              {/* Excel Import */}
              <label className="w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] transition-colors">
                <Upload size={13} className="text-[var(--color-primary)]" />
                <span>{t('importExcel') || "Excel'den Yükle (.xlsx)"}</span>
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { onExcelUpload(e); setShowToolsMenu(false); }} />
              </label>
            </div>
          )}
        </div>

        {/* Select All */}
        <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={onSelectAll}
            className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
            title={selectedCount === itemCount && itemCount > 0 ? t('deselectAll') : t('selectAllItems')}
            aria-label={selectedCount === itemCount && itemCount > 0 ? t('deselectAll') : t('selectAllItems')}
          >
            {selectedCount === itemCount && itemCount > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
        </div>

        {onAddProduct && (
          <button type="button" onClick={onAddProduct} className="btn btn-outline btn-xs" title={t('addFromCatalogItems')}>
            <Package size={12} /> {t('addFromCatalogItems')}
          </button>
        )}

        <button type="button" onClick={onAddNewItem} className="btn btn-primary btn-xs">
          <Plus size={12} /> {t('addItem')}
        </button>
      </div>
    </div>
  );
};
