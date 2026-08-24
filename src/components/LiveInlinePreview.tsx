import { Eye, EyeOff, Maximize2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import PrintableQuoteV2 from '@/components/PrintableQuoteV2';
import { useQuoteData, usePdfConfig } from '@/context/QuoteContext';
import useDebounce from '@/hooks/useDebounce';
import type { PdfLayoutItem } from '@/context/quote/types';

const LiveInlinePreview = React.memo(() => {
    const {
        quoteData,
        customerData,
        companyData,
        bankData,
        items,
        discount,
    } = useQuoteData();
    const { pdfConfig, pdfLayout } = usePdfConfig();

    const [isExpanded, setIsExpanded] = useState(() => {
        try {
            return localStorage.getItem('live_inline_preview_expanded') !== 'false';
        } catch {
            return true;
        }
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.45);
    const [contentHeight, setContentHeight] = useState(520);

    // Debounce items for smoother preview
    const debouncedItems = useDebounce(items, 300);

    useEffect(() => {
        try {
            localStorage.setItem('live_inline_preview_expanded', String(isExpanded));
        } catch { /* ignore */ }
    }, [isExpanded]);

    // Auto-fit scale based on container width
    useEffect(() => {
        if (!containerRef.current || !isExpanded || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const newScale = Math.min(Math.max((width - 24) / 794, 0.28), 1);
                setScale(newScale);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isExpanded]);

    // Track content height so scaled wrapper reserves correct visual height (fix clipping)
    useEffect(() => {
        if (!contentRef.current || !isExpanded || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContentHeight(entry.contentRect.height);
            }
        });
        ro.observe(contentRef.current);
        return () => ro.disconnect();
    }, [isExpanded, debouncedItems, pdfConfig, pdfLayout]);

    return (
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-card)] overflow-hidden shadow-2xs">
            <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full p-2.5 flex items-center justify-between hover:bg-[var(--color-bg-hover)] transition-colors select-none"
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[var(--color-primary-muted)] flex items-center justify-center">
                        <Eye size={13} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text)]">
                        Canlı PDF Önizleme
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] px-1.5 py-0.5 rounded-full">
                        {isExpanded ? 'Açık' : 'Kapalı'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {isExpanded && (
                        <Maximize2 size={12} className="text-[var(--color-text-muted)]" />
                    )}
                    {isExpanded ? <EyeOff size={14} className="text-[var(--color-text-muted)]" /> : <Eye size={14} className="text-[var(--color-text-muted)]" />}
                </div>
            </button>

            {isExpanded && (
                <div
                    ref={containerRef}
                    className="border-t border-[var(--color-border)] bg-[var(--color-bg-muted)]/20 overflow-auto custom-scrollbar"
                    style={{ maxHeight: '70vh' }}
                    aria-label="Canlı PDF Önizleme Alanı"
                >
                    <div className="p-3 flex justify-center" style={{ minHeight: `${Math.ceil(contentHeight * scale + 24)}px` }}>
                        <div
                            ref={contentRef}
                            className="origin-top shadow-lg rounded-[var(--radius)] overflow-hidden bg-white shrink-0"
                            style={{
                                width: '794px',
                                transform: `scale(${scale})`,
                                transformOrigin: 'top center',
                                // reserve visual space already handled by parent minHeight; prevent extra layout overflow
                            } as React.CSSProperties}
                        >
                            <PrintableQuoteV2
                                id="live-inline-pdf"
                                theme={pdfConfig.theme}
                                color={pdfConfig.color}
                                quoteData={quoteData}
                                customerData={customerData}
                                companyData={companyData}
                                bankData={bankData}
                                items={debouncedItems}
                                discount={discount}
                                config={pdfConfig}
                                layout={pdfLayout as PdfLayoutItem[]}
                                signature={(companyData as Record<string, unknown>).signature as string | null || null}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

LiveInlinePreview.displayName = 'LiveInlinePreview';
export default LiveInlinePreview;
