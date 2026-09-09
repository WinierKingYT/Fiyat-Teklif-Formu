import { useState, useEffect, useCallback, type RefObject } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { PAGE_SIZES } from '@/utils/pdfGenerator';
import { measurePdfPages } from '@/utils/pdfLayoutMeasurement';
import { estimateAutoItemsPerPage } from '@/utils/themeHelpers';
import type { PdfConfig, QuoteItem } from '@/context/quote/types';

interface UsePdfPageObserverProps {
    contentRef: RefObject<HTMLDivElement | null>;
    scrollRef: RefObject<HTMLDivElement | null>;
    thumbnailsRef: RefObject<HTMLDivElement | null>;
    marginGuidesRef: RefObject<HTMLDivElement | null>;
    pdfConfig: PdfConfig;
    renderedConfig: PdfConfig;
    items: QuoteItem[];
    zoomLevel: number;
    showMarginGuides: boolean;
    t: (key: string) => string;
}

export const usePdfPageObserver = ({
    contentRef,
    scrollRef,
    thumbnailsRef,
    marginGuidesRef,
    pdfConfig,
    renderedConfig,
    items,
    zoomLevel,
    showMarginGuides,
    t
}: UsePdfPageObserverProps) => {
    const [estimatedPages, setEstimatedPages] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [activePage, setActivePage] = useState(1);
    const [overflowPages, setOverflowPages] = useState<number[]>([]);
    const [autoItemsPerPage, setAutoItemsPerPage] = useState<number>(14);

    // Estimate page count from content height and auto itemsPerPage (max 20 cap) via themeHelpers
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => {
            const isLandscape = pdfConfig.pageOrientation === 'landscape';
            const baseSize = PAGE_SIZES[pdfConfig.pageSize || 'a4'] || PAGE_SIZES.a4;
            const pageWidthMm = isLandscape ? baseSize.height : baseSize.width;
            const pageHeightMm = isLandscape ? baseSize.width : baseSize.height;
            const pxPerMm = el.offsetWidth / pageWidthMm;
            const pageHeightPx = pageHeightMm * pxPerMm;
            setEstimatedPages(Math.max(1, Math.ceil(el.scrollHeight / pageHeightPx)));
            // B10: itemsPerPage auto – ölçülmüş içerik yüksekliği ile max 20 cap, themeHelpers ile entegre
            const rawItemsPerPage = (pdfConfig as Record<string, unknown>).itemsPerPage;
            if (rawItemsPerPage === 'auto') {
                const rowH = typeof (pdfConfig as Record<string, unknown>).tableRowHeight === 'number' ? (pdfConfig as Record<string, unknown>).tableRowHeight as number : 35;
                // usable height approx 55-60% of page after header/customer/summary; estimate via measured pageHeight
                const usable = pageHeightPx * 0.55;
                const auto = estimateAutoItemsPerPage(usable, rowH);
                setAutoItemsPerPage(Math.min(20, auto));
            } else if (typeof rawItemsPerPage === 'number' && rawItemsPerPage > 0) {
                setAutoItemsPerPage(Math.min(20, Math.max(4, Math.floor(rawItemsPerPage))));
            } else {
                // when not auto, still expose height-derived estimate capped 20 for optional use
                const rowH2 = typeof (pdfConfig as Record<string, unknown>).tableRowHeight === 'number' ? (pdfConfig as Record<string, unknown>).tableRowHeight as number : 35;
                setAutoItemsPerPage(estimateAutoItemsPerPage(pageHeightPx * 0.5, rowH2));
            }
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, [pdfConfig.pageOrientation, pdfConfig.pageSize, pdfConfig.tableRowHeight, (pdfConfig as Record<string, unknown>).itemsPerPage, items.length, renderedConfig, contentRef]);

    // Real page count from rendered .pdf-page blocks
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const count = el.querySelectorAll('.pdf-page').length;
        setPageCount(Math.max(1, count));
    }, [renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, contentRef]);

    // Track active page while scrolling
    useEffect(() => {
        const el = contentRef.current;
        const root = scrollRef.current;
        if (!el || !root) return;
        const pages = el.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    const topEntry = visible.reduce((a, b) =>
                        a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
                    );
                    const idx = Array.prototype.indexOf.call(pages, topEntry.target);
                    if (idx >= 0) setActivePage(idx + 1);
                }
            },
            { root, threshold: 0.2 }
        );
        pages.forEach((p) => observer.observe(p));
        return () => observer.disconnect();
    }, [pageCount, renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, zoomLevel, contentRef, scrollRef]);

    const scrollToPage = useCallback((n: number) => {
        const pages = contentRef.current?.querySelectorAll('.pdf-page');
        const page = pages?.[n - 1] as HTMLElement | undefined;
        if (page) {
            page.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActivePage(n);
        }
    }, [contentRef]);

    // Detect pages whose content overflows the page height.
    // Re-checks when images inside settle: late-loading product images change
    // scrollHeight after the first measurement, which caused stale overflow banners.
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const checkOverflow = () => {
            // Single shared overflow definition — see pdfLayoutMeasurement.
            const overflow = measurePdfPages(el)
                .filter((m) => !m.fits)
                .map((m) => m.pageIndex);
            setOverflowPages((prev) => {
                if (prev.length === overflow.length && prev.every((p, i) => p === overflow[i])) return prev;
                return overflow;
            });
        };
        const scheduleRecheck = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(checkOverflow, 300);
        };
        checkOverflow();
        // Capture phase: img load/error events bubble through the container.
        el.addEventListener('load', scheduleRecheck, true);
        el.addEventListener('error', scheduleRecheck, true);
        return () => {
            el.removeEventListener('load', scheduleRecheck, true);
            el.removeEventListener('error', scheduleRecheck, true);
            if (timer) clearTimeout(timer);
        };
    }, [renderedConfig, items.length, pageCount, pdfConfig.theme, pdfConfig.color, pdfConfig.margins, pdfConfig.tableRowHeight, zoomLevel, contentRef]);

    // Margin guide overlay (preview only, not included in PDF output)
    useEffect(() => {
        const overlay = marginGuidesRef.current;
        const src = contentRef.current;
        if (!overlay || !src) return;
        overlay.innerHTML = '';
        if (!showMarginGuides) return;
        const pages = src.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        const marginMm = pdfConfig.margins === 'compact' ? 5 : pdfConfig.margins === 'wide' ? 15 : 10;
        const first = pages[0] as HTMLElement;
        const pageWidth = first.offsetWidth || 794;
        const isLandscape = pdfConfig.pageOrientation === 'landscape';
        const baseSize = PAGE_SIZES[pdfConfig.pageSize || 'a4'] || PAGE_SIZES.a4;
        const pageWidthMm = isLandscape ? baseSize.height : baseSize.width;
        const pxPerMm = pageWidth / pageWidthMm;
        const marginPx = marginMm * pxPerMm;
        pages.forEach((page) => {
            const el = page as HTMLElement;
            const guide = document.createElement('div');
            guide.style.cssText = `position:absolute;left:${marginPx}px;top:${el.offsetTop + marginPx}px;width:${pageWidth - marginPx * 2}px;height:${el.offsetHeight - marginPx * 2}px;border:1px dashed var(--color-info);opacity:0.55;pointer-events:none;border-radius:2px;`;
            overlay.appendChild(guide);
        });
    }, [showMarginGuides, pageCount, renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, pdfConfig.margins, pdfConfig.pageSize, marginGuidesRef, contentRef]);

    // Build scaled thumbnail clones of each page
    const debouncedItems = useDebounce(items, 500);
    useEffect(() => {
        const container = thumbnailsRef.current;
        const src = contentRef.current;
        if (!container || !src) return;
        const pages = src.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        container.innerHTML = '';
        const pageWidth = (pages[0] as HTMLElement).offsetWidth || 794;
        const thumbWidth = 56;
        const scale = thumbWidth / pageWidth;
        const isLandscape = pdfConfig.pageOrientation === 'landscape';
        const baseSize = PAGE_SIZES[pdfConfig.pageSize || 'a4'] || PAGE_SIZES.a4;
        const aspectRatio = isLandscape ? baseSize.width / baseSize.height : baseSize.height / baseSize.width;
        const thumbHeight = Math.round(pageWidth * aspectRatio * scale);
        pages.forEach((page, i) => {
            const box = document.createElement('div');
            box.className = 'relative overflow-hidden rounded border border-[var(--color-border)] bg-white shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-[var(--color-info)]';
            box.style.width = `${thumbWidth}px`;
            box.style.height = `${thumbHeight}px`;
            box.title = `${t('page')} ${i + 1}`;
            box.setAttribute('aria-label', `${t('page')} ${i + 1}`);
            box.setAttribute('role', 'button');
            box.tabIndex = 0;
            const clone = page.cloneNode(true) as HTMLElement;
            clone.style.position = 'absolute';
            clone.style.top = '0';
            clone.style.left = '0';
            clone.style.width = `${pageWidth}px`;
            clone.style.transform = `scale(${scale})`;
            clone.style.transformOrigin = 'top left';
            clone.style.pointerEvents = 'none';
            clone.style.margin = '0';
            box.appendChild(clone);
            const label = document.createElement('div');
            label.className = 'absolute bottom-0 inset-x-0 text-center text-[9px] font-semibold text-white bg-black/60 py-0.5';
            label.textContent = String(i + 1);
            box.appendChild(label);
            box.addEventListener('click', () => scrollToPage(i + 1));
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToPage(i + 1);
                }
            });
            container.appendChild(box);
        });
    }, [pageCount, renderedConfig, debouncedItems, pdfConfig.theme, pdfConfig.color, pdfConfig.pageSize, scrollToPage, t, thumbnailsRef, contentRef]);

    return {
        estimatedPages,
        pageCount,
        activePage,
        overflowPages,
        autoItemsPerPage,
        scrollToPage
    };
};
