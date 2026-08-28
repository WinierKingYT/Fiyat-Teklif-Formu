import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Layers, FileText, Gauge, RotateCw } from 'lucide-react';
import React from 'react';
import { usePdfConfig } from '@/context/QuoteContext';
import type { PdfConfig, PdfLayoutItem } from '@/context/quote/types';

interface SortableLayoutRowProps {
    item: PdfLayoutItem;
    onToggle: (id: string) => void;
    t: (key: string) => string;
}

const SortableLayoutRow: React.FC<SortableLayoutRowProps> = ({ item, onToggle, t }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : 1,
    };

    const localizedLabel = (t(item.id) !== item.id && t(item.id)) ? t(item.id) : item.label;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-2.5 rounded-md border transition-all ${
                item.enabled
                    ? 'bg-[var(--color-bg-card)] border-[var(--color-border)] shadow-xs'
                    : 'bg-[var(--color-bg-muted)] border-dashed border-[var(--color-border)] opacity-60'
            }`}
        >
            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    aria-label="Sırala"
                    className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 -m-1 rounded touch-none"
                >
                    <GripVertical size={16} />
                </button>
                <span className={`text-xs font-medium ${item.enabled ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] line-through'}`}>
                    {localizedLabel}
                </span>
            </div>

            <button
                type="button"
                onClick={() => onToggle(item.id)}
                title={item.enabled ? 'Gizle' : 'Göster'}
                className={`p-1.5 rounded transition-colors ${
                    item.enabled
                        ? 'text-[var(--color-info)] hover:bg-[var(--color-info-light,rgba(59,130,246,0.1))]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                }`}
            >
                {item.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
        </div>
    );
};

interface PdfLayoutTabProps {
    pdfConfig: PdfConfig;
    handleConfigChange: (key: string, value: unknown) => void;
    t: (key: string) => string;
}

const PdfLayoutTab: React.FC<PdfLayoutTabProps> = ({
    pdfConfig,
    handleConfigChange,
    t
}) => {
    const { pdfLayout, setPdfLayout } = usePdfConfig();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setPdfLayout((prev) => {
            const oldIndex = prev.findIndex((item) => item.id === active.id);
            const newIndex = prev.findIndex((item) => item.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    const handleToggleSection = (id: string) => {
        setPdfLayout((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, enabled: !item.enabled } : item
            )
        );
    };

    return (
        <div className="space-y-5">
            {/* Drag & Drop Section Ordering */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1">
                    <div className="flex items-center gap-1.5">
                        <Layers size={14} className="text-[var(--color-info)]" />
                        <h4 className="font-semibold text-xs text-[var(--color-text)]">
                            {t('layoutOrder') || 'PDF Bölüm Sıralaması ve Görünürlük'}
                        </h4>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                        {t('dragToReorder') || 'Sürükleyip sıralayın'}
                    </span>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pdfLayout.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1.5">
                            {pdfLayout.map((item) => (
                                <SortableLayoutRow
                                    key={item.id}
                                    item={item}
                                    onToggle={handleToggleSection}
                                    t={t}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Spacing & Margins */}
            <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('spacing')}</h4>
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text)] mb-1">{t('pageMargin')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { val: 'compact', label: t('marginCompact') || 'Dar' },
                            { val: 'normal', label: t('marginNormal') || 'Normal' },
                            { val: 'wide', label: t('marginWide') || 'Geniş' }
                        ].map(opt => (
                            <button
                                type="button"
                                key={opt.val}
                                onClick={() => handleConfigChange('margins', opt.val)}
                                className={`py-1.5 text-xs rounded border transition-colors font-medium ${
                                    pdfConfig.margins === opt.val
                                        ? 'bg-[var(--color-info)] text-white border-[var(--color-info)] shadow-xs'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-bg-muted)] text-[var(--color-text)]'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Output Quality & Page Format */}
            <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-1.5 border-b pb-1">
                    <FileText size={14} className="text-[var(--color-info)]" />
                    <h4 className="font-semibold text-xs text-[var(--color-text)]">{t('pdfOutputSettings') || 'PDF Çıktı Ayarları'}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-[var(--color-text)]">
                        <span className="mb-1 flex items-center gap-1"><FileText size={12} />{t('pageSize')}</span>
                        <select
                            value={pdfConfig.pageSize || 'a4'}
                            onChange={(event) => handleConfigChange('pageSize', event.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-normal border border-[var(--color-border)] rounded bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        >
                            <option value="a4">A4</option>
                            <option value="a5">A5</option>
                            <option value="letter">Letter</option>
                            <option value="legal">Legal</option>
                        </select>
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-text)]">
                        <span className="mb-1 flex items-center gap-1"><Gauge size={12} />{t('quality')}</span>
                        <select
                            value={pdfConfig.pdfQuality || 'high'}
                            onChange={(event) => handleConfigChange('pdfQuality', event.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-normal border border-[var(--color-border)] rounded bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                        >
                            <option value="draft">{t('draft')}</option>
                            <option value="normal">{t('normal')}</option>
                            <option value="high">{t('qualityHigh') || 'Yüksek'}</option>
                            <option value="print">{t('qualityPrint') || 'Baskı'}</option>
                            <option value="ultra">{t('qualityUltra') || 'Ultra'}</option>
                        </select>
                    </label>
                </div>
                <label className="block text-xs font-medium text-[var(--color-text)]">
                    <span className="mb-1 flex items-center gap-1"><RotateCw size={12} />{t('orientation')}</span>
                    <select
                        value={pdfConfig.pageOrientation || 'portrait'}
                        onChange={(event) => handleConfigChange('pageOrientation', event.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-normal border border-[var(--color-border)] rounded bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]"
                    >
                        <option value="portrait">{t('portrait')}</option>
                        <option value="landscape">{t('landscape')}</option>
                    </select>
                </label>
                <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">
                    {t('pdfOutputSettingsDesc') || 'Yüksek ve Baskı seçenekleri daha keskin görseller üretir; dosya boyutu artabilir.'}
                </p>
            </div>

            {/* Table Options */}
            <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-xs text-[var(--color-text)] border-b pb-1">{t('tableStyle')}</h4>
                <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                        <span className="text-[var(--color-text)]">{t('stripedRows')}</span>
                        <input
                            type="checkbox"
                            checked={Boolean(pdfConfig.tableStriped)}
                            onChange={(e) => handleConfigChange('tableStriped', e.target.checked)}
                            className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                        />
                    </label>
                    {[
                        { key: 'showTableImages', label: t('productImages') },
                        { key: 'showTableUnit', label: t('unitColumn') },
                        { key: 'showTableTax', label: t('vatColumn') }
                    ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-bg-muted)] cursor-pointer text-xs">
                            <span className="text-[var(--color-text)]">{item.label}</span>
                            <input
                                type="checkbox"
                                checked={Boolean((pdfConfig as Record<string, unknown>)[item.key])}
                                onChange={(e) => handleConfigChange(item.key, e.target.checked)}
                                className="rounded border-[var(--color-border)] text-[var(--color-info)] focus:ring-[var(--color-info)] w-4 h-4"
                            />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PdfLayoutTab;
