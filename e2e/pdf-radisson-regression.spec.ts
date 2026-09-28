import { expect, test, type Page } from '@playwright/test';
import { PANEL, measurePages, logGeometry, assertSheetFit, waitPageNodesStable, realSheetBudgetPx } from './fixtures/geometry';
import { RADISSON_16, RADISSON_TITLE } from './fixtures/radisson';

/**
 * Radisson Blu Hotel regression suite.
 *
 * Three defects are locked down here:
 *  1. The first page of a split quote collapsed toward a handful of rows while
 *     staying visually "full", because the items wrapper's `flex: 1` stretch was
 *     charged to `belowTable`. A sparser page produced a bigger phantom overhead,
 *     which produced an even sparser page.
 *  2. The export normalized each page element to the A4 reference width inside a
 *     narrower padded root, overflowing the root by the full padding pair and
 *     pushing the page's right padding off the exported canvas.
 *  3. A long quote title was rendered as one line inside a `flex-shrink: 0`
 *     box, which grew to the title's max-content width and crushed the company
 *     column to nothing.
 */

async function seed(page: Page, cfg: Record<string, unknown>) {
    await page.addInitScript((c) => {
        localStorage.setItem('pdfConfig', JSON.stringify(c));
    }, cfg);
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
    await page.getByLabel('Teklif Numarası').fill('E2E-RADISSON');
    await page.locator('#customerName').fill('Radisson Blu Hotel');
    await page.locator('#customerCompany').fill('Radisson Blu Hotel');
}

async function addItems(page: Page, n: number) {
    for (let i = 0; i < n; i++) {
        const p = RADISSON_16[i % RADISSON_16.length];
        await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
        await page.locator(`[data-row="${i}"][data-field="name"]`).fill(p.name);
        await page.locator(`[data-row="${i}"][data-field="description"]`).fill(p.description ?? '');
        await page.locator(`[data-row="${i}"][data-field="quantity"]`).fill(String(p.quantity));
        await page.locator(`[data-row="${i}"][data-field="price"]`).fill(String(p.price));
        await page.locator(`[data-row="${i}"][data-field="taxRate"]`).selectOption(String(p.taxRate));
    }
}

async function setTitle(page: Page, title: string) {
    const dlg = page.getByRole('dialog');
    if (!(await dlg.isVisible().catch(() => false))) {
        await page.locator(`${PANEL} .quote-title`).first().click();
        await expect(dlg).toBeVisible();
    }
    await dlg.locator('input').first().fill(title);
    await dlg.locator('input').first().press('Enter');
    await expect(dlg).toBeHidden();
}

async function openLivePreview(page: Page) {
    await page.getByRole('button', { name: 'PDF', exact: true }).first().click();
    await expect(page.locator(PANEL)).toBeVisible({ timeout: 20000 });
    await expect(page.locator(`${PANEL} .pdf-page`).first()).toBeVisible({ timeout: 20000 });
    await waitPageNodesStable(page);
}

/** Page-relative geometry of the sections the title fix is about. */
async function headerGeometry(page: Page) {
    return page.evaluate((panel) => {
        const root = document.querySelector(panel) as HTMLElement;
        const page = root.querySelector('.pdf-page') as HTMLElement;
        const pr = page.getBoundingClientRect();
        const box = (sel: string) => {
            const el = page.querySelector(sel) as HTMLElement | null;
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: r.left - pr.left, right: r.right - pr.left, width: r.width };
        };
        const lead = page.querySelector('.quote-title-lead') as HTMLElement | null;
        const detail = page.querySelector('.quote-title-detail') as HTMLElement | null;
        return {
            pageWidth: page.offsetWidth,
            rootOffsetW: root.offsetWidth,
            rootScrollW: root.scrollWidth,
            header: box('.pdf-header'),
            headerLeft: box('.header-left'),
            infoBox: box('.quote-info-box'),
            headerH: (page.querySelector('.pdf-header') as HTMLElement | null)?.offsetHeight ?? null,
            titleH: (page.querySelector('.quote-title') as HTMLElement | null)?.offsetHeight ?? null,
            infoBoxH: (page.querySelector('.quote-info-box') as HTMLElement | null)?.offsetHeight ?? null,
            lead: lead ? { top: lead.offsetTop, height: lead.offsetHeight, text: lead.textContent?.trim() ?? '' } : null,
            detail: detail ? { top: detail.offsetTop, height: detail.offsetHeight, text: detail.textContent?.trim() ?? '' } : null,
        };
    }, PANEL);
}

test.describe('radisson quote regression', () => {
    test.use({ viewport: { width: 1900, height: 1200 } });
    test.describe.configure({ timeout: 900_000 });

    test('a split quote fills its first page instead of collapsing to a few rows', async ({ page }) => {
        await seed(page, { theme: 'modern', showCustomerSignature: true, tableStriped: true });
        await addItems(page, 16);
        await openLivePreview(page);

        const geo = await measurePages(page);
        logGeometry('radisson-16-split', geo);

        // No item may be lost.
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(16);
        // The first page must actually carry the bulk of the rows: the old
        // self-reinforcing overhead collapse produced first pages like 5/6.
        const first = geo.rows[0]!;
        expect(first).toBeGreaterThanOrEqual(geo.rows.length > 1 ? 12 : 16);
        // And it must not be a lone orphan page.
        expect(geo.rows.every((r) => r > 0)).toBe(true);
        assertSheetFit(geo);
    });

    test('the first page of a split quote is not left mostly empty', async ({ page }) => {
        await seed(page, { theme: 'modern', showCustomerSignature: true, tableStriped: true });
        await addItems(page, 16);
        await openLivePreview(page);

        const fill = await page.evaluate((panel) => {
            const root = document.querySelector(panel) as HTMLElement;
            const p = root.querySelector('.pdf-page') as HTMLElement;
            const table = p.querySelector('[data-pdf-items-table="true"]')?.closest('table') as HTMLElement | null;
            if (!table) return null;
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLElement[];
            if (rows.length === 0) return null;
            const last = rows[rows.length - 1]!;
            const chain = (el: HTMLElement) => {
                let t = 0;
                let n: HTMLElement | null = el;
                while (n && n !== p) {
                    t += n.offsetTop;
                    n = n.offsetParent as HTMLElement | null;
                }
                return t;
            };
            const lastRowBottom = chain(last) + last.offsetHeight;
            // Usable height is the page box as rendered, not the bare sheet: the
            // page carries its own min-height and the totals block may sit below.
            return { rows: rows.length, lastRowBottom, pageH: p.offsetHeight, ratio: lastRowBottom / p.offsetHeight };
        }, PANEL);

        expect(fill).not.toBeNull();
        // A page whose rows stop in the top half is the reported symptom.
        expect(
            fill!.ratio,
            `rows=${fill!.rows} lastRowBottom=${fill!.lastRowBottom} pageH=${fill!.pageH}`
        ).toBeGreaterThan(0.7);
    });

    test('a long title renders as two levels and never crushes the company column', async ({ page }) => {
        await seed(page, { theme: 'modern' });
        await addItems(page, 16);
        await openLivePreview(page);
        await setTitle(page, RADISSON_TITLE);
        await page.waitForTimeout(2500);

        const g = await headerGeometry(page);
        console.log(`[header] long-title ${JSON.stringify(g)}`);

        expect(g.lead, 'lead line missing').not.toBeNull();
        expect(g.detail, 'detail line missing').not.toBeNull();
        expect(g.lead!.text).toBe('KURTARMA SERVİSİ');
        expect(g.detail!.text).toBe('MALZEME VE TEÇHİZAT FİYAT TEKLİFİ');
        // The detail line must sit BELOW the lead line, not beside it.
        expect(g.detail!.top).toBeGreaterThan(g.lead!.top);
        // The company column keeps real width (it used to collapse to ~16px).
        expect(g.headerLeft!.width, `headerLeft=${JSON.stringify(g.headerLeft)}`).toBeGreaterThan(120);
        // The info box may never eat more than its share of the header.
        expect(g.infoBox!.width / g.header!.width).toBeLessThanOrEqual(0.58);
        // Nothing may spill past the page's own right edge.
        expect(g.infoBox!.right).toBeLessThanOrEqual(g.pageWidth);
    });

    test('a short title keeps the original single-line markup and geometry', async ({ page }) => {
        await seed(page, { theme: 'modern' });
        await addItems(page, 16);
        await openLivePreview(page);
        await setTitle(page, 'FİYAT TEKLİFİ');
        await page.waitForTimeout(2000);

        const g = await headerGeometry(page);
        console.log(`[header] short-title ${JSON.stringify(g)}`);
        // A short title must add NO extra box at all: single-page quotes clear
        // the A4 fit check by only a few pixels, so an extra block here would
        // push them onto a second page.
        expect(g.lead, 'a short title must not be split').toBeNull();
        expect(g.detail).toBeNull();
        expect(g.headerH).toBeGreaterThan(0);
    });

    test('export width normalization keeps the root free of horizontal overflow', async ({ page }) => {
        await seed(page, { theme: 'modern' });
        await addItems(page, 16);
        await openLivePreview(page);

        const norm = await page.evaluate((panel) => {
            const root = document.querySelector(panel) as HTMLElement;
            const pages = Array.from(root.querySelectorAll('.pdf-page')) as HTMLElement[];

            // Reproduce pdfGenerator's pageWidthNormalizer: the ROOT is widened to
            // the A4 reference width and the pages follow it.
            const savedRoot = [root.style.width, root.style.maxWidth];
            const savedPages = pages.map((p) => [p.style.width, p.style.maxWidth, p.style.boxSizing]);
            root.style.width = '794px';
            root.style.maxWidth = '794px';
            pages.forEach((p) => {
                p.style.width = '100%';
                p.style.maxWidth = '100%';
                p.style.boxSizing = 'border-box';
            });
            const out = {
                rootOffsetW: root.offsetWidth,
                rootScrollW: root.scrollWidth,
                pageWidths: pages.map((p) => p.offsetWidth),
                pageScrollW: pages.map((p) => p.scrollWidth),
            };
            root.style.width = savedRoot[0]!;
            root.style.maxWidth = savedRoot[1]!;
            pages.forEach((p, i) => {
                p.style.width = savedPages[i]![0]!;
                p.style.maxWidth = savedPages[i]![1]!;
                p.style.boxSizing = savedPages[i]![2]!;
            });
            return out;
        }, PANEL);

        console.log(`[export] normalized ${JSON.stringify(norm)}`);
        // The old normalization forced the PAGES to 794px inside a 746px content
        // box, which measured rootScrollW 818 on a 794px root (24px past the edge).
        expect(norm.rootScrollW, `rootScrollW=${norm.rootScrollW} rootOffsetW=${norm.rootOffsetW}`).toBeLessThanOrEqual(norm.rootOffsetW);
        norm.pageWidths.forEach((w, i) => {
            expect(norm.pageScrollW[i]!).toBeLessThanOrEqual(w);
        });
    });

    test('14 items still fit a single A4 page', async ({ page }) => {
        await seed(page, { theme: 'modern' });
        await addItems(page, 14);
        await openLivePreview(page);

        const geo = await measurePages(page);
        logGeometry('radisson-14-single', geo);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
        expect(geo.pages, `rows=[${geo.rows.join(',')}] scrolls=[${geo.scrolls.join(',')}]`).toBe(1);
        assertSheetFit(geo);
        expect(realSheetBudgetPx(geo.widths[0]!)).toBeLessThan(1122.5);
    });

    test('a genuinely overflowing quote splits without leaving page 1 mostly empty', async ({ page }) => {
        // Bank block + terms + notes + customer signature push 16 items past a
        // single sheet, which is the only way to exercise the continuation-page
        // `belowTable` path (the phantom flex-stretch overhead lived there).
        await seed(page, { theme: 'modern', showCustomerSignature: true, tableStriped: true });
        await page.getByRole('button', { name: 'Banka', exact: true }).click();
        await page.locator('#bankName').fill('KARAKÖY TEDARİK BANKA');
        await page.locator('#iban').fill('TR120006200000012345678901');
        await page.locator('#accountHolder').fill('KARAKÖY TEDARİK SAN. TİC. LTD. ŞTİ.');
        await page.getByRole('button', { name: 'Şartlar & Notlar', exact: true }).click();
        await page.locator('#deliveryTerms').fill(
            'Malzemeler teslimat tarihinden itibaren 5 (beş) iş günü içinde İstanbul Avrupa Yakası depomuzdan sevk edilir. Kargo ve teslimat bedeli alıcıya aittir.'
        );
        await page.locator('#warrantyTerms').fill('Tüm ürünler 24 ay üretici garantisi kapsamındadır.');
        await page.locator('#notes').fill('Fiyatlarımıza KDV dahil değildir. Ödeme: %50 peşin, %50 teslimatta.');
        await addItems(page, 16);
        await openLivePreview(page);

        const geo = await measurePages(page);
        logGeometry('radisson-16-overflow', geo);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(16);
        assertSheetFit(geo);

        const overhead = await page.evaluate((panel) => {
            const root = document.querySelector(panel) as HTMLElement;
            const p = root.querySelector('.pdf-page') as HTMLElement;
            const table = p.querySelector('[data-pdf-items-table="true"]')?.closest('table') as HTMLElement | null;
            if (!table) return null;
            const rows = Array.from(table.querySelectorAll('tbody > tr')) as HTMLElement[];
            if (rows.length === 0) return null;
            const last = rows[rows.length - 1]!;
            const note = table.nextElementSibling as HTMLElement | null;
            const chain = (el: HTMLElement) => {
                let t = 0;
                let n: HTMLElement | null = el;
                while (n && n !== p) {
                    t += n.offsetTop;
                    n = n.offsetParent as HTMLElement | null;
                }
                return t;
            };
            const lastRowBottom = chain(last) + last.offsetHeight;
            const noteBox = note ? note.offsetTop + note.offsetHeight - lastRowBottom : 0;
            const cs = note ? getComputedStyle(note) : null;
            const ownBox = note
                ? (parseFloat(cs?.marginTop || '0') || 0) + note.offsetHeight + (parseFloat(cs?.marginBottom || '0') || 0)
                : 0;
            return { rows: rows.length, lastRowBottom, noteBox, ownBox, usable: (297 * p.offsetWidth) / 210 };
        }, PANEL);

        expect(overhead).not.toBeNull();
        if (geo.pages > 1) {
            // The continuation note's own box is the real overhead; the residual
            // gap down to the page bottom is the wrapper's elastic stretch and
            // must NOT be charged to the budget (it measured ~250px and grew as
            // the page got sparser, which is what collapsed page 1).
            expect(overhead!.ownBox).toBeLessThan(80);
            expect(overhead!.noteBox).toBeGreaterThan(overhead!.ownBox);
            // Page 1 must carry the bulk of the rows. A mostly-empty first page
            // (the reported ~5/16) is the symptom; the blank strip above the page
            // bottom is normal here because the totals block lives on page 2.
            expect(geo.rows[0]!, `rows=[${geo.rows.join(',')}]`).toBeGreaterThanOrEqual(12);
            expect(geo.rows.every((r) => r > 0)).toBe(true);
        }
    });
});
