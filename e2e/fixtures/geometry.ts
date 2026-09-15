import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

export const PANEL = '#printable-quote-container-panel';
export const A4_PX = 1122.5;
// Same 24px rule as usePdfPageObserver (preview marker ::after on non-last pages).
export const TOLERANCE_PX = 24;

export interface PagesGeo {
    pages: number;
    heights: number[];
    /** Content height (scrollHeight) vs the physical sheet — the ONLY fit authority. */
    scrolls: number[];
    /** Preview pages whose CONTENT exceeds the 24px marker tolerance (index 1-based). */
    overflows: number[];
    /** Content height minus sheet height per page (negative = real headroom). */
    headroom: number[];
    /** Item rows rendered per page (sum must equal the quote item count). */
    rows: number[];
}

export async function measurePages(page: Page, panel: string = PANEL, tol: number = TOLERANCE_PX): Promise<PagesGeo> {
    return page.evaluate(
        ({ panel, tol }) => {
            // Split-screen live preview can mount two in-sync PdfPreviewPanel
            // copies; always measure the FIRST panel element (rows/pages would
            // otherwise be counted twice).
            const root = document.querySelector(panel) as HTMLElement | null;
            if (!root) return { pages: 0, heights: [], scrolls: [], overflows: [], headroom: [], rows: [] };
            const pages = Array.from(root.querySelectorAll('.pdf-page')) as HTMLElement[];
            const itemRows = (p: HTMLElement) => {
                const itemTable = p.querySelector('table thead')?.closest('table');
                return itemTable ? itemTable.querySelectorAll('tbody tr').length : 0;
            };
            const sheet = 1122.5;
            return {
                pages: pages.length,
                heights: pages.map((p) => p.offsetHeight),
                scrolls: pages.map((p) => p.scrollHeight),
                overflows: pages
                    .map((p, i) => (p.scrollHeight > p.clientHeight + tol ? i + 1 : -1))
                    .filter((i) => i > 0),
                headroom: pages.map((p) => p.scrollHeight - sheet),
                rows: pages.map(itemRows),
            };
        },
        { panel, tol }
    );
}

export function assertSheetFit(geo: PagesGeo) {
    geo.scrolls.forEach((scroll, i) => {
        const cap = A4_PX + (i < geo.pages - 1 ? TOLERANCE_PX : 0);
        expect(scroll).toBeLessThanOrEqual(cap);
    });
}

/** §19 — always print measured geometry so a failing fit is diagnosable in CI. */
export function logGeometry(label: string, geo: PagesGeo, sheet: number = A4_PX) {
    console.log(
        `[geometry] ${label}: pages=${geo.pages} rows=[${geo.rows.join(',')}] ` +
        `scrolls=[${geo.scrolls.join(',')}] ` +
        `headroom=[${geo.headroom.map((h) => `${h >= 0 ? '+' : ''}${Math.round(h)}px`).join(',')}] ` +
        `(sheet=${sheet}px)`
    );
    test.info().annotations.push({
        type: label,
        description: `pages=${geo.pages} rows=[${geo.rows.join(',')}] scrolls=[${geo.scrolls.join(',')}] headroom=[${geo.headroom.join(',')}]`,
    });
}

export function countPhysicalPages(pdf: Buffer): number {
    return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
}

export async function downloadPdf(page: Page) {
    const downloadPromise = page.waitForEvent('download');
    // The header 'PDF İNDİR' button lives OUTSIDE #printable-quote-container-panel
    // (panel = the canvas). Split live preview mounts two in-sync panels, so act
    // on the first header button only.
    await page.getByRole('button', { name: 'PDF İNDİR', exact: true }).first().click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).not.toBeNull();
    const pdf = await readFile(path!);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    return pdf;
}

export async function waitPageCount(page: Page, predicate: (n: number) => boolean, timeout = 25000): Promise<number> {
    const value = await expect
        .poll(async () => countPageNodes(page), { timeout })
        .toSatisfy(predicate);
    return value;
}

export async function countPageNodes(page: Page, panel: string = PANEL): Promise<number> {
    return page.locator(`${panel} .pdf-page`).count();
}

const PRODUCTS: Array<{ name: string; desc: string }> = [
    { name: 'Paslanmaz Çelik Endüstriyel Güvenlik Aynası', desc: '108 cm dış mekan trafik aynası' },
    { name: 'Otomatik Eksternal Defibrilatör', desc: 'Yarı otomatik AED cihazı' },
    { name: 'Profesyonel Tekerlekli Hasta Taşıma Sandalyesi', desc: 'Katlanabilir alüminyum gövde' },
    { name: 'Temassız Dijital Kızılötesi Ateş Ölçer', desc: '1 saniyede ölçüm' },
    { name: 'Endüstriyel Yağmur Tipi Duş Seti', desc: 'Krom kaplama batarya' },
    { name: 'Medikal Oksijen Konsantratörü 5L', desc: 'Sessiz çalışma 42dB' },
    { name: 'Hidrolik Hasta Yatağı', desc: '4 motorlu yoğun bakım' },
    { name: 'Dijital Tansiyon Aleti', desc: 'Koldan ölçüm hazneli' },
    { name: 'Cerrahi El Alet Seti 12 Parça', desc: 'Alman çeliği steril' },
    { name: 'Radyoloji Kurşun Önlük', desc: '0.5mm Pb eşdeğeri' },
    { name: 'Ameliyathane Laminer Hava Ünitesi', desc: 'HEPA H14 filtreli' },
    { name: 'Fetal Doppler Cihazı', desc: 'LCD ekranlı taşınabilir' },
    { name: 'Elektrokoter Cihazı 400W', desc: 'Monopolar bipolar mod' },
];
export { PRODUCTS };

/** Realistic 13-item catalog (the §12 production regression list). */
export const REAL_13 = PRODUCTS.slice(0, 13);