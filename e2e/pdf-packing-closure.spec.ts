import { expect, test, type Page } from '@playwright/test';
import {
    PANEL,
    A4_PX,
    measurePages,
    assertSheetFit,
    logGeometry,
    countPhysicalPages,
    downloadPdf,
    PRODUCTS,
} from './fixtures/geometry';
import { productImagePng } from './fixtures/product-images';

/**
 * §PDF-PACKING-CLOSURE — multi-page row geometry coordinate closure.
 *
 * Validates the row-coordinate fix in pdfLayoutMeasurement.ts:
 *   • offsetTopRelativeToPage accumulates through the offsetParent chain so
 *     every measured coordinate lives in the SAME page-relative space as
 *     scrollHeight/clientHeight.
 *   • Row height = offsetHeight (own box), NOT offsetBottom − offsetTop
 *     (which previously inflated rows by the table's page offset).
 *   • capsFromPages derives real first/continuation/final budgets from the
 *     freshly rendered split DOM, not bootstrap estimates.
 *   • planChunkRowCounts with minPages=2 prevents collapse into the single
 *     overflowing page the split caller already rejected.
 *
 * Regression: before the fix, 16 items with images in corporate/dense
 * produced a [6, 10] split — page 1 was underutilized (~40% of capacity)
 * because measured row heights were ~204px instead of the real ~38px.
 *
 * After the fix the packer fills pages greedily against REAL budgets, and a
 * lone 1-item final page is rebalanced (14+1 → 13+2) when geometry allows.
 *
 * With the current PRODUCTS (short descriptions, 38px rows in dense mode):
 *   • 13-15 items fit ONE page (scrollHeight ≤ 1122.5)
 *   • 16 items overflow (scrollHeight ≈ 1136 > 1122.5) → split
 *   • 20 items overflow → split into 2+ pages
 * The first page of a split gets ~14-15 rows (greedy fill against the real
 * measured first-page budget), never the [6, 10] pattern.
 */

test.describe('§PDF-PACKING-CLOSURE multi-page packing', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.describe.configure({ timeout: 240_000 });

    async function seedTheme(page: Page, theme: string) {
        await page.addInitScript(({ t }) => {
            localStorage.setItem('pdfConfig', JSON.stringify({ theme: t }));
        }, { t: theme });
    }

    async function seedQuote(
        page: Page,
        n: number,
        opts: { images?: boolean; descRepeat?: number } = {},
    ) {
        await page.goto('/');
        await expect(page.locator('#main-content')).toBeVisible();
        await page.getByLabel('Teklif Numarası').fill('E2E-PACK');
        await page.locator('#customerName').fill('Packing Müşteri');
        await page.locator('#customerCompany').fill('Packing A.Ş.');

        await page.getByRole('button', { name: 'Banka', exact: true }).click();
        await page.locator('#bankName').fill('Packing Bank');
        await page.locator('#iban').fill('TR120006200000012345678901');

        for (let i = 0; i < n; i++) {
            await addRow(page, i, opts);
        }
    }

    async function addRow(
        page: Page,
        i: number,
        opts: { images?: boolean; descRepeat?: number } = {},
    ) {
        const p = PRODUCTS[i % PRODUCTS.length];
        await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
        await page.locator(`[data-row="${i}"][data-field="name"]`).fill(`${p.name} ${i + 1}`);
        await page.locator(`[data-row="${i}"][data-field="price"]`).fill('250');
        if (opts.descRepeat && opts.descRepeat > 0) {
            await page
                .locator(`[data-row="${i}"][data-field="description"]`)
                .fill(`${p.desc}. `.repeat(opts.descRepeat));
        }
        if (opts.images) {
            await page
                .locator('tbody input[type="file"][accept="image/*"]')
                .nth(i)
                .setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: productImagePng(i) });
        }
    }

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

    function panel(page: Page) {
        return page.locator(PANEL).first();
    }

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

    // ── Single-page acceptance (short descs: 38px rows, proven by §4) ────────
    // With the current PRODUCTS (no descRepeat), 14 items produce scrollH ≈ 1060
    // which fits the 1122.5px sheet.  15 items ≈ 1098 also fits.  16 items
    // ≈ 1136 overflows → triggers split.  These tests verify the single-page
    // path is unaffected by the geometry fix.

    test('13 image items → 1 fitted page (short descs)', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 13, { images: true });
        await enableSplitPreview(page);
        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBe(1);

        const geo = await measurePages(page);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('13-items-1page', geo);
    });

    test('14 image items → 1 fitted page (short descs)', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 14, { images: true });
        await enableSplitPreview(page);
        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBe(1);

        const geo = await measurePages(page);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('14-items-1page', geo);
    });

    test('15 image items → 1 fitted page (short descs, scrollH ≈ 1098)', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 15, { images: true });
        await enableSplitPreview(page);
        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBe(1);

        const geo = await measurePages(page);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('15-items-1page', geo);
    });

    // ── Split packing (short descs: 16+ items overflow, first page dense) ────
    // The regression: before the fix, 16 items with images produced [6, 10]
    // because measured row heights were inflated (~204px instead of ~38px).
    // After the fix, the first page gets ~14-15 rows (greedy fill against the
    // real first-page budget ≈ 862px / 38px ≈ 22 rows, capped at n−1 by
    // minPages=2, then rebalanced if lone tail).

    test('16 image items → 2+ pages, dense first page (no [6, 10] underfill)', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 16, { images: true });
        await enableSplitPreview(page);

        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBeGreaterThanOrEqual(2);

        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(16);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('16-items-split', geo);

        // First page must be densely packed — the forbidden pattern is [6, 10]
        // where page 1 gets only 6 rows (~38% of capacity).  With the fix, the
        // first page greedy-fills against the real ~862px budget at ~38px/row,
        // so it should get ≥ 14 rows.
        expect(geo.rows[0]).toBeGreaterThanOrEqual(10);
    });

    test('20 image items → 2+ pages, dense first page', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 20, { images: true });
        await enableSplitPreview(page);

        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBeGreaterThanOrEqual(2);

        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(20);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('20-items-split', geo);

        expect(geo.rows[0]).toBeGreaterThanOrEqual(10);
    });

    // ── Tall-row split packing (medium descs force split at lower counts) ────
    // descRepeat: 2 produces ~84px rows (3-4 line descriptions).  This makes
    // even 8 items overflow a single page, exercising the split path at lower
    // item counts where the "forbidden 6+9" pattern was most likely.

    test('15 tall items (descRepeat:2) → split, dense first page (no underfill)', async ({ page }) => {
        await seedTheme(page, 'corporate');
        await seedQuote(page, 15, { images: true, descRepeat: 2 });
        await enableSplitPreview(page);

        await expect
            .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
            .toBeGreaterThanOrEqual(2);

        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(15);
        expect(geo.overflows).toEqual([]);
        assertSheetFit(geo);
        logGeometry('15-tall-split', geo);

        // With ~84px rows, the first page budget (~862px) fits ~10 rows.
        // The packer should fill greedily — never produce [6, ...].
        expect(geo.rows[0]).toBeGreaterThanOrEqual(8);
    });

    // ── Preview / export parity ─────────────────────────────────────────────
    for (const n of [14, 20]) {
        test(`${n} items: preview pages match physical PDF pages`, async ({ page }) => {
            test.setTimeout(300_000);
            await seedTheme(page, 'corporate');
            await seedQuote(page, n, { images: true });
            await enableSplitPreview(page);

            await expect
                .poll(async () => panel(page).locator('.pdf-page').count(), { timeout: 25000 })
                .toBeGreaterThanOrEqual(1);

            const geo = await measurePages(page);
            expect(geo.overflows).toEqual([]);
            assertSheetFit(geo);
            const previewPages = geo.pages;

            const pdf = await downloadPdf(page);
            const physicalPages = countPhysicalPages(pdf);
            expect(physicalPages).toBe(previewPages);
            logGeometry(`${n}-parity`, geo);
        });
    }
});
