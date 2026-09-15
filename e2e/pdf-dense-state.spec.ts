import { expect, test, type Page } from '@playwright/test';
import {
    PANEL,
    A4_PX,
    TOLERANCE_PX,
    measurePages,
    assertSheetFit,
    logGeometry,
    countPhysicalPages,
    downloadPdf,
    PRODUCTS,
} from './fixtures/geometry';
import { productImagePng } from './fixtures/product-images';

// §4/§6/§12 — STATE-TRANSITION REGRESSIONS
//
// These tests exercise the measurement-authority FSM AFTER a plan reached
// 'done', i.e. the exact paths two fixed bugs used to break:
//  1. stale CSS useMemo deps: dense was measured but normal CSS rendered
//     (image box stayed 36px while the plan said dense → wrong geometry).
//  2. invalidation ordering: a plan frozen at 'done' never re-measured when
//     items appeared/disappeared after it settled.

test.describe('§4/§6/§12 dense-state transitions', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.describe.configure({ timeout: 240_000 });

    async function seedTheme(page: Page, theme: string) {
        await page.addInitScript(({ t }) => {
            localStorage.setItem('pdfConfig', JSON.stringify({ theme: t }));
        }, { t: theme });
    }

    async function seedQuote(page: Page, n: number, opts: { images?: boolean; longDescs?: boolean } = {}) {
        await page.goto('/');
        await expect(page.locator('#main-content')).toBeVisible();
        await page.getByLabel('Teklif Numarası').fill('E2E-STATE');
        await page.locator('#customerName').fill('E2E Müşteri');
        await page.locator('#customerCompany').fill('E2E Müşteri A.Ş.');

        await page.getByRole('button', { name: 'Banka', exact: true }).click();
        await page.locator('#bankName').fill('E2E Bank');
        await page.locator('#iban').fill('TR120006200000012345678901');

        for (let i = 0; i < n; i++) {
            await addRow(page, i, opts);
        }
    }

    async function addRow(page: Page, i: number, opts: { images?: boolean; longDescs?: boolean } = {}) {
        const p = PRODUCTS[i % PRODUCTS.length];
        await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
        await page.locator(`[data-row="${i}"][data-field="name"]`).fill(`${p.name} ${i + 1}`);
        await page.locator(`[data-row="${i}"][data-field="price"]`).fill('250');
        if (opts.longDescs) {
            await page.locator(`[data-row="${i}"][data-field="description"]`).fill(`${p.desc}. `.repeat(12));
        }
        if (opts.images) {
            await page.locator('tbody input[type="file"][accept="image/*"]').nth(i)
                .setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: productImagePng(i) });
        }
    }

async function removeRow(page: Page, index: number) {
    // The builder table can interleave PDF page-break marker `<tr>`s, so never
    // address rows by position — target the row holding the item's name input.
    await page
        .locator('tbody tr')
        .filter({ has: page.locator(`[data-row="${index}"][data-field="name"]`) })
        .getByRole('button', { name: 'Satırı sil' })
        .click();
}

    /**
     * Split-screen live preview: builder and measured panel both stay mounted,
     * so a 'done' plan stays mounted while items/config mutate around it.
     * The app's styles/utilities.css hardcodes `.hidden { display:none !important }`,
     * which beats Tailwind's `hidden xl:*` responsive variant — at any width the
     * split toggle never becomes visible. We re-apply what the `xl:` media query
     * WOULD do (this e2e viewport is 1440px >= 1280px xl), with a more specific
     * `!important` override, so the real split behaviour is exercised.
     */
    async function enableSplitPreview(page: Page) {
        await page.addStyleTag({
            content: `
                @media (min-width: 0px) {
                    .hidden.xl\\:block { display: block !important; }
                    .hidden.xl\\:inline-flex { display: inline-flex !important; }
                    .hidden.xl\\:flex { display: flex !important; }
                    .hidden.xl\\:grid { display: grid !important; }
                    .hidden.xl\\:inline { display: inline !important; }
                }
            `,
        });
        await page.getByRole('button', { name: 'Bölünmüş Ekran' }).click();
        await expect(panel(page).locator('.pdf-page').first()).toBeVisible({ timeout: 15000 });
    }

    /**
     * Split mode mounts TWO in-sync PdfPreviewPanel copies; scope every panel
     * query/interaction to the FIRST copy so rows are never counted twice.
     */
    function panel(page: Page) {
        return page.locator(PANEL).first();
    }

    async function settlePages(page: Page, expected: number) {
        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBe(expected);
    }

    // Corporate image box geometry: 36px normal, 26px dense.
    async function snapshot(page: Page) {
        return page.evaluate(() => {
            const panelEl = document.querySelector('#printable-quote-container-panel') as HTMLElement | null;
            const box = panelEl?.querySelector('.corporate-item-image') as HTMLElement | null;
            const pages = Array.from(panelEl?.querySelectorAll('.pdf-page') ?? []);
            const rows = pages.reduce((sum, p) => {
                const table = p.querySelector('table thead')?.closest('table');
                return sum + (table ? table.querySelectorAll('tbody tr').length : 0);
            }, 0);
            return {
                denseProfile: panelEl?.classList.contains('pdf-dense-profile') ? 1 : 0,
                boxW: box ? box.offsetWidth : -1,
                pages: pages.length,
                rows,
            };
        });
    }

    test('§4 dense CSS truly renders (26px); removing items flips dense -> normal 36px', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 14, { images: true });
        await enableSplitPreview(page);
        await settlePages(page, 1);

        // The plan is dense — and now the CSS must match it (stale-deps bug
        // rendered normal 36px boxes while measuring dense geometry).
        const dense = await snapshot(page);
        expect(dense, 'dense profile must be applied').toEqual({ denseProfile: 1, boxW: 26, pages: 1, rows: 14 });

        const geo = await measurePages(page);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('§4 dense', geo);

        // Remove 6 image rows (dangerous while the plan is 'done'). The plan
        // must invalidate, re-measure as NORMAL (8 image rows fit), and re-render
        // the normal 36px image box — the done-freeze bug would stay dense/26px.
        for (let i = 13; i >= 8; i--) {
            await removeRow(page, i);
        }
        await expect
            .poll(
                async () => {
                    const s = await snapshot(page);
                    return `${s.denseProfile}|${s.boxW}|${s.pages}|${s.rows}`;
                },
                { timeout: 25000 }
            )
            .toBe('0|36|1|8');

        const geo2 = await measurePages(page);
        expect(geo2.overflows).toEqual([]);
        assertSheetFit(geo2);
        logGeometry('§4 dense->normal', geo2);
        await panel(page).screenshot({ path: 'e2e/shots/state-dense-collapse.png' });
    });

    test('§6 done(1-page) -> add items re-measures and spills to fitted pages', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 8);
        await enableSplitPreview(page);
        await settlePages(page, 1);

        const before = await snapshot(page);
        // Plain quote: no image column renders, so no `.corporate-item-image` box.
        expect(before).toEqual({ denseProfile: 0, boxW: -1, pages: 1, rows: 8 });

        // Long-description rows are guaranteed to spill off one sheet (the
        // matrix long-desc spec already proves 14 such rows need >= 2 pages).
        for (let i = 8; i < 25; i++) {
            await addRow(page, i, { longDescs: true });
        }

        await expect
            .poll(
                async () => {
                    const g = await measurePages(page);
                    return g.pages >= 2 && g.rows.reduce((a, b) => a + b, 0) === 25 ? 'ok' : 'measuring';
                },
                { timeout: 40000 }
            )
            .toBe('ok');

        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(25);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('§6 add->spill', geo);
    });

    test('§6 split-done -> removing items collapses to a single fitted page', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 17, { longDescs: true });
        await enableSplitPreview(page);

        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 30000 })
            .toBeGreaterThanOrEqual(2);
        const geo0 = await measurePages(page);
        expect(geo0.rows.reduce((a, b) => a + b, 0)).toBe(17);
        expect(geo0.overflows).toEqual([]);
        assertSheetFit(geo0);
        logGeometry('§6 split start', geo0);

        // Remove 15 rows highest-first, leaving 2 — must re-measure back to 1 sheet
        // (long-description rows stay tall, so a 4-row plan legitimately keeps
        // 2 fitted pages; 2 rows can never exceed one sheet).
        for (let i = 16; i >= 2; i--) {
            await removeRow(page, i);
        }
        await expect
            .poll(
                async () => {
                    const s = await snapshot(page);
                    return `${s.pages}|${s.rows}`;
                },
                { timeout: 30000 }
            )
            .toBe('1|2');

        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(2);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('§6 collapse', geo);
    });

    test('§6 done -> config change still fits, rows preserved, sheet not overflown', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 14, { images: true });
        await enableSplitPreview(page);
        await settlePages(page, 1);

        const before = await snapshot(page);
        expect(before.denseProfile).toBe(1);

        // Open the design controls (left column of the split panel) and widen
        // the page margins — a config change that MUST re-measure. The header
        // and controls live OUTSIDE the canvas panel element; split mode mounts
        // two in-sync panels, so act on the first copy of each button.
        const toggle = page.getByRole('button', { name: 'Kontrolleri Göster' }).first();
        if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
            await toggle.click();
        }
        await page.getByRole('button', { name: 'Düzen', exact: true }).first().click();
        await page.getByRole('button', { name: 'Geniş', exact: true }).first().click();

        await expect
            .poll(
                async () => {
                    const s = await snapshot(page);
                    return s.rows === 14 && s.pages >= 1 ? 'ok' : 'measuring';
                },
                { timeout: 25000 }
            )
            .toBe('ok');

        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('§6 config-change', geo);
    });

    test('§12 REAL-13: corporate 13 realistic products+images -> 1 preview page + 1 physical page', async ({ page }) => {
        test.setTimeout(300_000);
        await seedTheme(page, 'corporate');
        await seedQuote(page, 13, { images: true });
        await enableSplitPreview(page);
        await settlePages(page, 1);

        const s = await snapshot(page);
        expect(s).toEqual({ denseProfile: 1, boxW: 26, pages: 1, rows: 13 });

        const geo = await measurePages(page);
        for (const h of geo.heights) {
            expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
        }
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('§12 real-13', geo);
        await panel(page).screenshot({ path: 'e2e/shots/state-real-13.png' });

        // Preview/export parity: the downloaded PDF is exactly one physical page.
        const pdf = await downloadPdf(page);
        expect(countPhysicalPages(pdf)).toBe(1);
    });
});