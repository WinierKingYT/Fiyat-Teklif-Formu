import {
  ArrowUp,
  ArrowDown,
  Package,
  Trash,
  X
} from 'lucide-react';
import React from 'react';

interface ItemsBatchBarProps {
  selectedCount: number;
  onApplyBulkDiscount: (rate: number) => void;
  onApplyBulkVAT: (vat: number) => void;
  onMoveSelectedUp: () => void;
  onMoveSelectedDown: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  t: (key: string) => string;
}

export const ItemsBatchBar: React.FC<ItemsBatchBarProps> = ({
  selectedCount,
  onApplyBulkDiscount,
  onApplyBulkVAT,
  onMoveSelectedUp,
  onMoveSelectedDown,
  onDuplicateSelected,
  onDeleteSelected,
  onClearSelection,
  t
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-[var(--color-primary-muted)] px-3 py-1.5 rounded-lg text-xs flex-wrap border border-[var(--color-primary)]/20 animate-in fade-in">
      <span className="font-semibold text-[var(--color-primary)]">{selectedCount} {t('selected')}</span>

      <div className="flex items-center gap-1 border-l border-r border-[var(--color-primary)]/30 px-2">
        <span className="text-[10px] text-[var(--color-text-muted)]">Toplu % İndirim:</span>
        {[0, 5, 10, 20].map(rate => (
          <button
            key={rate}
            type="button"
            onClick={() => onApplyBulkDiscount(rate)}
            className="px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border)] text-[10px] font-medium transition-colors"
          >
            %{rate}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-r border-[var(--color-primary)]/30 pr-2">
        <span className="text-[10px] text-[var(--color-text-muted)]">Toplu KDV:</span>
        {[20, 10, 1, 0].map(vat => (
          <button
            key={vat}
            type="button"
            onClick={() => onApplyBulkVAT(vat)}
            className="px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border)] text-[10px] font-medium transition-colors"
          >
            %{vat}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onMoveSelectedUp}
        className="p-1 hover:bg-[var(--color-bg-hover)] rounded"
        title={t('moveUp')}
        aria-label={t('moveUp')}
      >
        <ArrowUp size={13} />
      </button>
      <button
        type="button"
        onClick={onMoveSelectedDown}
        className="p-1 hover:bg-[var(--color-bg-hover)] rounded"
        title={t('moveDown')}
        aria-label={t('moveDown')}
      >
        <ArrowDown size={13} />
      </button>
      <button
        type="button"
        onClick={onDuplicateSelected}
        className="p-1 hover:bg-[var(--color-bg-hover)] rounded text-[var(--color-primary)]"
        title="Seçilenleri Çoğalt"
        aria-label="Seçilenleri Çoğalt"
      >
        <Package size={13} />
      </button>
      <button
        type="button"
        onClick={onDeleteSelected}
        className="p-1 hover:bg-[var(--color-error-muted)] rounded text-[var(--color-error)]"
        title={t('delete')}
        aria-label={t('delete')}
      >
        <Trash size={13} />
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 hover:bg-[var(--color-bg-hover)] rounded ml-auto text-[var(--color-text-muted)]"
        title={t('clearSelection')}
        aria-label={t('clearSelection')}
      >
        <X size={13} />
      </button>
    </div>
  );
};
