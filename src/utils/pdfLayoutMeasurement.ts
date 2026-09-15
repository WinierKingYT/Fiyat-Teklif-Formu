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
    /** Top edge of the first item row relative to the page, or null. */
    firstRowTop: number | null;
    /** Bottom edge (top + height) of the last item row, or null. */
    lastRowBottom: number | null;
}

/**
 * Vertical position of `el` relative to the page, accumulated through the
 * offsetParent chain (offsetTop is relative to the offsetParent, NOT the page).
 * This keeps every measured coordinate in the SAME page-relative space as
 * scrollHeight/clientHeight, so heights such as `bottom - top` are never
 * inflated by the header blocks above the items table.
 */
export function offsetTopRelativeToPage(el: Element, page: HTMLElement): number {
    const e = el as HTMLElement;
    let top = e.offsetTop;
    let node: HTMLElement | null = e.offsetParent as HTMLElement | null;
    while (node && node !== page) {
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
    }
    return top;
}

/** The quote's ITEMS table (the one with a <thead>), or null. Measurement must
 *  never fall back to blind `tbody tr`: summary/totals tables also carry rows. */
export function findItemsTable(page: HTMLElement): HTMLTableElement | null {
    const thead = page.querySelector('table thead');
    return thead ? (thead.closest('table') as HTMLTableElement | null) : null;
}

/** Item rows only — descendants of the items table's tbody. */
export function itemRowElements(page: HTMLElement): HTMLElement[] {
    const table = findItemsTable(page);
    if (!table) return [];
    return Array.from(table.querySelectorAll('tbody > tr')) as HTMLElement[];
}

function rowTopBottom(row: HTMLElement, page: HTMLElement): { top: number; bottom: number; height: number } {
    const top = offsetTopRelativeToPage(row, page);
    const height = row.offsetHeight;
    return { top, bottom: top + height, height };
}

export function measurePdfPage(page: HTMLElement, pageIndex: number): PdfPageMeasurement {
    const clientHeight = page.clientHeight;
    const scrollHeight = page.scrollHeight;
    const rows = itemRowElements(page);
    const first = rows.length > 0 ? rowTopBottom(rows[0], page) : null;
    const last = rows.length > 0 ? rowTopBottom(rows[rows.length - 1], page) : null;
    const overflowPx = scrollHeight - clientHeight - OVERFLOW_TOLERANCE_PX;
    return {
        pageIndex,
        clientHeight,
        scrollHeight,
        availableHeight: A4_HEIGHT_PX,
        overflowPx,
        fits: overflowPx <= 0,
        rowCount: rows.length,
        firstRowTop: first ? first.top : null,
        lastRowBottom: last ? last.bottom : null,
    };
}

export function measurePdfPages(container: ParentNode): PdfPageMeasurement[] {
    const pages = Array.from(container.querySelectorAll('.pdf-page')) as HTMLElement[];
    return pages.map((page, i) => measurePdfPage(page, i + 1));
}

// ─── Geometry (measurement-authority pagination) ──────────────────────────────
// The paginator consumes these to break pages at REAL row heights and REAL
// section heights — never the legacy heuristic budgets (340/420/250 + 50px floor).

export interface PdfRowMeasure {
    /** offsetTop relative to the page. */
    top: number;
    /** bottom edge (top + height) relative to the page. */
    bottom: number;
    height: number;
}

export interface PdfPageGeometry extends PdfPageMeasurement {
    /** Per-item-row geometry, in render order (maps 1:1 to the chunk's items). */
    rows: PdfRowMeasure[];
    /** <thead> height, or null when the page has no items table. */
    theadHeight: number | null;
    /** Page height consumed above the first item row (header blocks + thead). */
    aboveTable: number | null;
    /** Page height consumed below the last item row.
     *  Final page (has `.bottom-section`): the section's own height (it is
     *  flex-pinned via margin-top:auto, so position-based math would count the
     *  elastic blank). Continuation page: the note block that follows the table
     *  (table.nextElementSibling), measured position-based from the last row. */
    belowTable: number | null;
}

function belowRowsOverhead(page: HTMLElement, lastRowBottom: number | null): number {
    if (lastRowBottom == null) return 0;
    const bottomSection = page.querySelector('.bottom-section') as HTMLElement | null;
    if (bottomSection) return bottomSection.offsetHeight;
    const table = findItemsTable(page);
    const note = table ? (table.nextElementSibling as HTMLElement | null) : null;
    if (note && note.textContent && note.textContent.trim()) {
        return Math.max(0, offsetTopRelativeToPage(note, page) + note.offsetHeight - lastRowBottom);
    }
    return 0;
}

export function measurePdfPageGeometry(page: HTMLElement, pageIndex: number): PdfPageGeometry {
    const base = measurePdfPage(page, pageIndex);
    const rowEls = itemRowElements(page);
    const rows = rowEls.map((r) => rowTopBottom(r, page));
    const firstRowTop = rows.length > 0 ? rows[0].top : null;
    const lastRowBottom = rows.length > 0 ? rows[rows.length - 1].bottom : null;
    let theadHeight: number | null = null;
    if (rows.length > 0) {
        const thead = page.querySelector('table thead');
        theadHeight = thead ? (thead as HTMLElement).offsetHeight : null;
    }
    return {
        ...base,
        rows,
        theadHeight,
        aboveTable: firstRowTop,
        belowTable: belowRowsOverhead(page, lastRowBottom),
    };
}

export function measurePdfPageGeometries(container: ParentNode): PdfPageGeometry[] {
    const pages = Array.from(container.querySelectorAll('.pdf-page')) as HTMLElement[];
    return pages.map((page, i) => measurePdfPageGeometry(page, i + 1));
}