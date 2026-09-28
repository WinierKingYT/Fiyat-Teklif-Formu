import { describe, it, expect } from 'vitest';
import { findItemsTable, itemRowElements, measurePdfPageGeometry, ITEMS_TABLE_SELECTOR } from '@/utils/pdfLayoutMeasurement';

/**
 * Minimal DOM stand-in for the Modern theme's page: a flex column whose items
 * wrapper is `flex: 1`, with the continuation note pinned to the wrapper's
 * bottom by the same elastic stretch that makes a sparse page look "full".
 */
function buildContinuationPage(opts: { rowCount: number; rowHeight: number; above: number; noteHeight: number; noteMarginTop: number; pageHeight: number }): HTMLElement {
    const page = document.createElement('div');
    page.className = 'pdf-page';
    Object.defineProperty(page, 'offsetHeight', { value: opts.pageHeight, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: opts.pageHeight, configurable: true });
    Object.defineProperty(page, 'offsetWidth', { value: 746, configurable: true });
    Object.defineProperty(page, 'scrollHeight', { value: opts.pageHeight + 24, configurable: true });

    const spacer = document.createElement('div');
    Object.defineProperty(spacer, 'offsetHeight', { value: opts.above, configurable: true });
    Object.defineProperty(spacer, 'offsetTop', { value: 20, configurable: true });
    page.appendChild(spacer);

    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetTop', { value: 20 + opts.above, configurable: true });
    // The wrapper stretches to fill the page: this is the phantom space.
    Object.defineProperty(wrapper, 'offsetHeight', { value: opts.pageHeight - 40 - opts.above, configurable: true });

    const table = document.createElement('table');
    table.setAttribute('data-pdf-items-table', 'true');
    const thead = document.createElement('thead');
    Object.defineProperty(thead, 'offsetHeight', { value: 26, configurable: true });
    const headRow = document.createElement('tr');
    Object.defineProperty(headRow, 'offsetHeight', { value: 26, configurable: true });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    let top = 0;
    for (let i = 0; i < opts.rowCount; i++) {
        const tr = document.createElement('tr');
        Object.defineProperty(tr, 'offsetHeight', { value: opts.rowHeight, configurable: true });
        Object.defineProperty(tr, 'offsetTop', { value: 26 + top, configurable: true });
        Object.defineProperty(tr, 'offsetParent', { value: table, configurable: true });
        top += opts.rowHeight;
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    Object.defineProperty(table, 'offsetHeight', { value: 26 + top, configurable: true });
    Object.defineProperty(table, 'offsetTop', { value: 0, configurable: true });
    Object.defineProperty(table, 'offsetParent', { value: wrapper, configurable: true });
    wrapper.appendChild(table);

    const note = document.createElement('div');
    note.textContent = 'Teklif devamı sonraki sayfadadır';
    note.style.marginTop = `${opts.noteMarginTop}px`;
    Object.defineProperty(note, 'offsetHeight', { value: opts.noteHeight, configurable: true });
    Object.defineProperty(note, 'offsetTop', { value: 26 + top + opts.noteMarginTop, configurable: true });
    Object.defineProperty(note, 'offsetParent', { value: wrapper, configurable: true });
    wrapper.appendChild(note);

    page.appendChild(wrapper);
    return page;
}

describe('findItemsTable', () => {
    it('prefers the explicit items-table marker', () => {
        const page = document.createElement('div');
        const decoy = document.createElement('table');
        decoy.innerHTML = '<thead><tr><th>Toplam</th></tr></thead>';
        const marked = document.createElement('table');
        marked.setAttribute('data-pdf-items-table', 'true');
        page.append(decoy, marked);
        expect(findItemsTable(page)).toBe(marked);
    });

    it('falls back to the first table with a thead when unmarked', () => {
        const page = document.createElement('div');
        const t = document.createElement('table');
        t.innerHTML = '<thead><tr><th>x</th></tr></thead>';
        page.appendChild(t);
        expect(findItemsTable(page)).toBe(t);
    });

    it('returns null when the page has no table', () => {
        expect(findItemsTable(document.createElement('div'))).toBeNull();
        expect(itemRowElements(document.createElement('div'))).toEqual([]);
    });

    it('exposes a stable marker selector', () => {
        expect(ITEMS_TABLE_SELECTOR).toBe('[data-pdf-items-table="true"]');
    });
});

describe('measurePdfPageGeometry', () => {
    it('charges the note block\'s own height, not the elastic wrapper stretch', () => {
        // 14 rows of 36px = 504px of table on a 998px page: ~400px of the gap
        // between the last row and the note is free space the rows would consume.
        const page = buildContinuationPage({ rowCount: 14, rowHeight: 36, above: 179, noteHeight: 17, noteMarginTop: 10, pageHeight: 998 });
        const g = measurePdfPageGeometry(page, 1);

        expect(g.rowCount).toBe(14);
        // note own box = marginTop(10) + height(17) + marginBottom(0) = 27.
        expect(g.belowTable).toBe(27);
        // The old position-based maths returned ~251px here (the stretch).
        expect(g.belowTable!).toBeLessThan(60);
    });
    it('keeps belowTable stable as the page gets sparser (no self-reinforcing collapse)', () => {
        const dense = measurePdfPageGeometry(buildContinuationPage({ rowCount: 14, rowHeight: 36, above: 179, noteHeight: 17, noteMarginTop: 10, pageHeight: 998 }), 1);
        const sparse = measurePdfPageGeometry(buildContinuationPage({ rowCount: 4, rowHeight: 36, above: 179, noteHeight: 17, noteMarginTop: 10, pageHeight: 998 }), 1);
        expect(sparse.belowTable).toBe(dense.belowTable);
        expect(sparse.aboveTable).toBe(dense.aboveTable);
    });

    it('measures aboveTable and thead from the same page-relative space', () => {
        const page = buildContinuationPage({ rowCount: 6, rowHeight: 36, above: 179, noteHeight: 17, noteMarginTop: 10, pageHeight: 998 });
        const g = measurePdfPageGeometry(page, 1);
        // page padding-top(20) + header(179) + thead(26)
        const tableTop = 20 + 179 + 26;
        expect(g.aboveTable).toBe(tableTop);
        expect(g.theadHeight).toBe(26);
        expect(g.rows[0]!.top).toBe(tableTop);
        expect(g.rows[5]!.bottom).toBe(tableTop + 6 * 36);
        expect(g.pageWidthPx).toBe(746);
    });

    it('returns zero overhead when there is no note block', () => {
        const page = buildContinuationPage({ rowCount: 3, rowHeight: 36, above: 100, noteHeight: 0, noteMarginTop: 0, pageHeight: 998 });
        page.querySelector('div > div:last-child')!.remove();
        const g = measurePdfPageGeometry(page, 1);
        expect(g.belowTable).toBe(0);
    });
});
