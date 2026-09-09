/**
 * Canonical PDF page measurement contract.
 *
 * ONE shared definition of "FITS A4" used by:
 * - usePdfPageObserver (preview overflow detection),
 * - Playwright geometry assertions (same numbers, see e2e/pdf-density.spec.ts),
 * - pagination calibration.
 *
 * The preview draws a 24px-tall "A4 Sayfa Kırılımı" marker below every
 * non-last page (::after at bottom: -24px). Absolutely-positioned content
 * contributes to scrollHeight but is NOT real overflow, hence the tolerance.
 * Keep this value in sync with PdfPreviewCanvas marker CSS and the E2E specs.
 */

/** Physical A4 portrait height at 96 CSS px/inch. */
export const A4_HEIGHT_PX = 1122.5;

/** Rounding + preview-marker tolerance. Small by design: must not hide real overflow. */
export const OVERFLOW_TOLERANCE_PX = 24;

export interface PdfPageMeasurement {
    pageIndex: number;
    /** Border-box layout height (transform-immune). */
    clientHeight: number;
    /** Full scrollable content height. */
    scrollHeight: number;
    /** Usable content height: the physical sheet minus this tolerance. */
    availableHeight: number;
    /** Pixels of real content past the usable height (<= 0 fits). */
    overflowPx: number;
    fits: boolean;
    /** Number of item rows rendered on this page. */
    rowCount: number;
    /** offsetTop of the first item row relative to the page, or null. */
    firstRowTop: number | null;
    /** Bottom edge (offsetTop + height) of the last item row, or null. */
    lastRowBottom: number | null;
}

function offsetBottom(el: Element, page: HTMLElement): number {
    const e = el as HTMLElement;
    let top = e.offsetTop;
    let node: HTMLElement | null = e.offsetParent as HTMLElement | null;
    while (node && node !== page) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
    }
    return top + e.offsetHeight;
}

export function measurePdfPage(page: HTMLElement, pageIndex: number): PdfPageMeasurement {
    const clientHeight = page.clientHeight;
    const scrollHeight = page.scrollHeight;
    const rows = Array.from(page.querySelectorAll('tbody tr')) as HTMLElement[];
    const firstRowTop = rows.length > 0 ? rows[0].offsetTop : null;
    const lastRowBottom = rows.length > 0 ? offsetBottom(rows[rows.length - 1], page) : null;
    const overflowPx = scrollHeight - clientHeight - OVERFLOW_TOLERANCE_PX;
    return {
        pageIndex,
        clientHeight,
        scrollHeight,
        availableHeight: A4_HEIGHT_PX,
        overflowPx,
        fits: overflowPx <= 0,
        rowCount: rows.length,
        firstRowTop,
        lastRowBottom,
    };
}

export function measurePdfPages(container: ParentNode): PdfPageMeasurement[] {
    const pages = Array.from(container.querySelectorAll('.pdf-page')) as HTMLElement[];
    return pages.map((page, i) => measurePdfPage(page, i + 1));
}
