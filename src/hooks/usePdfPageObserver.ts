import { useState, useEffect, useCallback, type RefObject } from 'react';
import useDebounce from '@/hooks/useDebounce';
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

    // Estimate page count from content height
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => {
            const isLandscape = pdfConfig.pageOrientation === 'landscape';
            const pageWidthMm = isLandscape ? 297 : 210;
            const pageHeightMm = isLandscape ? 210 : 297;
            const pxPerMm = el.offsetWidth / pageWidthMm;
            const pageHeightPx = pageHeightMm * pxPerMm;
            setEstimatedPages(Math.max(1, Math.ceil(el.scrollHeight / pageHeightPx)));
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, [pdfConfig.pageOrientation, items.length, renderedConfig, contentRef]);

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

    // Detect pages whose content overflows the page height
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const pages = el.querySelectorAll('.pdf-page');
        const overflow: number[] = [];
        pages.forEach((p, i) => {
            const pageEl = p as HTMLElement;
            if (pageEl.scrollHeight > pageEl.clientHeight + 8) overflow.push(i + 1);
        });
        setOverflowPages(overflow);
    }, [renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, pdfConfig.margins, pdfConfig.tableRowHeight, zoomLevel, contentRef]);

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
        const pageWidthMm = isLandscape ? 297 : 210;
        const pxPerMm = pageWidth / pageWidthMm;
        const marginPx = marginMm * pxPerMm;
        pages.forEach((page) => {
            const el = page as HTMLElement;
            const guide = document.createElement('div');
            guide.style.cssText = `position:absolute;left:${marginPx}px;top:${el.offsetTop + marginPx}px;width:${pageWidth - marginPx * 2}px;height:${el.offsetHeight - marginPx * 2}px;border:1px dashed var(--color-info);opacity:0.55;pointer-events:none;border-radius:2px;`;
            overlay.appendChild(guide);
        });
    }, [showMarginGuides, pageCount, renderedConfig, items.length, pdfConfig.theme, pdfConfig.color, pdfConfig.margins, marginGuidesRef, contentRef]);

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
        const aspectRatio = isLandscape ? 210 / 297 : 297 / 210;
        const thumbHeight = Math.round(pageWidth * aspectRatio * scale);
        pages.forEach((page, i) => {
            const box = document.createElement('div');
            box.className = 'relative overflow-hidden rounded border border-[var(--color-border)] bg-white shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-[var(--color-info)]';
            box.style.width = `${thumbWidth}px`;
            box.style.height = `${thumbHeight}px`;
            box.title = `${t('page')} ${i + 1}`;
            box.setAttribute('aria-label', `${t('page')} ${i + 1}`);
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
            container.appendChild(box);
        });
    }, [pageCount, renderedConfig, debouncedItems, pdfConfig.theme, pdfConfig.color, scrollToPage, t, thumbnailsRef, contentRef]);

    return {
        estimatedPages,
        pageCount,
        activePage,
        overflowPages,
        scrollToPage
    };
};
