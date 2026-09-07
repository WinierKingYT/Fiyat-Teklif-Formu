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
import { GripVertical } from "lucide-react";
import React from "react";
import { useQuoteData, usePdfConfig } from '@/context/QuoteContext';
import { useTranslation } from '@/hooks/useTranslation';

interface SortableItemProps {
  id: string;
  label: string;
  enabled: boolean;
  onToggle: (id: string) => void;
}

const SortableItem = ({ id, label, enabled, onToggle }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] mb-2"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
        >
          <GripVertical size={20} />
        </div>
        <span className="font-medium text-[var(--color-text)]">
          {label}
        </span>
      </div>
      <div className="form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          checked={enabled}
          onChange={() => onToggle(id)}
        />
      </div>
    </div>
  );
};

interface PdfLayoutItem {
  id: string;
  label: string;
  enabled: boolean;
}

interface PdfLayoutSettingsProps {
  pdfLayout: PdfLayoutItem[];
  setPdfLayout: React.Dispatch<React.SetStateAction<PdfLayoutItem[]>>;
}

const PdfLayoutSettings = ({ pdfLayout, setPdfLayout }: PdfLayoutSettingsProps) => {
  const { quoteData } = useQuoteData();
  const { pdfConfig, setPdfConfig } = usePdfConfig();
  const { t } = useTranslation(quoteData?.language);
  const density = ((pdfConfig as Record<string, unknown>).tableDensity as string) || 'comfortable';
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setPdfLayout((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleSection = (id: string) => {
    setPdfLayout((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
            <GripVertical size={13} className="text-[var(--color-primary)]" />
          </div>
          <span className="card-title">{t('pdfSectionOrder')}</span>
        </div>
      </div>
      <div className="card-body">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {t('pdfSectionOrderDesc')}
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={(pdfLayout || []).map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {(pdfLayout || []).map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                label={item.label}
                enabled={item.enabled}
                onToggle={handleToggleSection}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
          <h4 className="font-semibold text-sm mb-2">{t('density') || 'Yoğunluk'}</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'compact', label: 'Sıkışık' },
              { val: 'comfortable', label: 'Rahat' },
              { val: 'spacious', label: 'Ferah' }
            ].map(opt => (
              <button
                type="button"
                key={opt.val}
                onClick={() => setPdfConfig(prev => ({ ...prev, tableDensity: opt.val as never }))}
                className={`py-2 text-sm rounded border font-medium ${density === opt.val ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-[var(--color-bg-muted)]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfLayoutSettings;
