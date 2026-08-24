import { Ruler } from 'lucide-react';
import React from 'react';
import type { PageSize } from '@/utils/pdfGenerator';

interface PdfZoomToolbarProps {
    pageSize: PageSize;
    estimatedPages: number;
    t: (key: string) => string;
    zoomLevel: number;
    setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
    showMarginGuides: boolean;
    setShowMarginGuides: React.Dispatch<React.SetStateAction<boolean>>;
    isGenerating: boolean;
}

const PdfZoomToolbar: React.FC<PdfZoomToolbarProps> = ({
    pageSize,
    estimatedPages,
    t,
    zoomLevel,
    setZoomLevel,
    showMarginGuides,
    setShowMarginGuides,
    isGenerating
}) => {
    return (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg-card)]/90 backdrop-blur-md rounded-full shadow-lg border border-[var(--color-border)] text-xs">
            <span className="text-[10px] font-medium text-[var(--color-text-muted)] pr-1">{pageSize.toUpperCase()} • {estimatedPages} {t('page')}</span>
            <div className="w-[1px] h-3 bg-[var(--color-border)] mr-0.5"></div>
            <button type="button" onClick={() => setZoomLevel(z => Math.max(0.3, z - 0.1))} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] font-bold text-xs" aria-label={t('zoomOut')}>−</button>
            <span className="text-[11px] font-mono font-semibold text-[var(--color-text)] w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button type="button" onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] font-bold text-xs" aria-label={t('zoomIn')}>+</button>
            <div className="w-[1px] h-3 bg-[var(--color-border)] mx-0.5"></div>
            <button type="button" onClick={() => setZoomLevel(0.7)} className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors ${zoomLevel === 0.7 ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`} title={t('defaultZoom')}>%70</button>
            <button type="button" onClick={() => setZoomLevel(1)} className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors ${zoomLevel === 1 ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`} title={t('actualSize')}>%100</button>
            <button type="button" onClick={() => setShowMarginGuides(v => !v)} aria-pressed={showMarginGuides} title={t('marginGuides')} className={`p-1 rounded transition-colors ${showMarginGuides ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}><Ruler size={11} /></button>
            {isGenerating && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--color-info)] pl-1">
                    <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-[var(--color-border)] border-t-[var(--color-info)]"></div>
                </div>
            )}
        </div>
    );
};

export default PdfZoomToolbar;
