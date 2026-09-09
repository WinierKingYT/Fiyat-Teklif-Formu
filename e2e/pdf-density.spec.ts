import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// 1x1 red PNG — exercises the image pipeline (upload, preview, raster)
// without depending on network or fixture files.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const PANEL = '#printable-quote-container-panel';
// Physical A4 height at 96 CSS dpi, plus a small rounding tolerance.
const A4_PX = 1122.5;
// Same 24px rule as usePdfPageObserver: the preview draws a 24px-tall
// "A4 Sayfa Kırılımı" marker below each non-last page (::after at bottom:
// -24px), which inflates scrollHeight without overflowing real content.
const TOLERANCE_PX = 24;

interface PageGeometry {
  pages: number;
  heights: number[];
  overflows: number[];
  rows: number[];
  imageBoxWidth: string | null;
}

async function seedQuote(page: Page, n: number, opts: { images?: boolean; descs?: boolean } = {}) {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await page.getByLabel('Teklif Numarası').fill('E2E-DENSITY');
  await page.locator('#customerName').fill('E2E Müşteri');
  await page.locator('#customerCompany').fill('E2E Müşteri A.Ş.');

  // Bank block so the full bottom section (summary + bank + signatures) renders.
  await page.getByRole('button', { name: 'Banka', exact: true }).click();
  await page.locator('#bankName').fill('E2E Bank');
  await page.locator('#iban').fill('TR120006200000012345678901');

  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
    await page.locator(`[data-row="${i}"][data-field="name"]`).fill(`E2E Ürün ${i + 1}`);
    await page.locator(`[data-row="${i}"][data-field="price"]`).fill('100');
    if (opts.descs) {
      await page.locator(`[data-row="${i}"][data-field="description"]`).fill('Kısa tek satır açıklama');
    }
  }

  if (opts.images) {
    const inputs = page.locator('tbody input[type="file"][accept="image/*"]');
    await expect(inputs).toHaveCount(n);
    for (let i = 0; i < n; i++) {
      await inputs.nth(i).setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: PNG_1X1 });
    }
    // Image thumbnails must actually render before measuring.
    await expect(page.locator('tbody td img').first()).toBeVisible();
  }
}

async function openPreview(page: Page) {
  await page.getByRole('button', { name: 'PDF Önizle & İndir', exact: true }).click();
  await expect(page.locator(`${PANEL} .pdf-page`).first()).toBeVisible({ timeout: 15000 });
}

async function settlePages(page: Page, expected: number) {
  // Chunking debounces after edits; poll until the page count stabilizes.
  await expect
    .poll(async () => page.locator(`${PANEL} .pdf-page`).count(), { timeout: 20000 })
    .toBe(expected);
}

async function measurePages(page: Page): Promise<PageGeometry> {
  return page.evaluate(
    ({ panel, tol }) => {
      const pages = Array.from(document.querySelectorAll(`${panel} .pdf-page`)) as HTMLElement[];
      const box = document.querySelector('.modern-theme-container .item-image') as HTMLElement | null;
      return {
        pages: pages.length,
        heights: pages.map((p) => p.offsetHeight),
        overflows: pages
          .map((p, i) => (p.scrollHeight > p.clientHeight + tol ? i + 1 : -1))
          .filter((i) => i > 0),
        rows: pages.map((p) => p.querySelectorAll('tbody tr').length),
        imageBoxWidth: box ? getComputedStyle(box).width : null,
      };
    },
    { panel: PANEL, tol: TOLERANCE_PX }
  );
}

test.describe('PDF 14-item single-page density (real DOM geometry)', () => {
  test('Fixture A: 14 plain products fit exactly one A4 page', async ({ page }) => {
    await seedQuote(page, 14);
    await openPreview(page);
    await settlePages(page, 1);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(1);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }
    // Imageless quote renders no image boxes at all (column hidden).
    expect(geo.imageBoxWidth).toBeNull();

    await page.locator(PANEL).screenshot({ path: 'e2e/shots/density-fixture-a.png' });
  });

  test('Fixture B: 14 products with images fit exactly one A4 page', async ({ page }) => {
    await seedQuote(page, 14, { images: true });
    await openPreview(page);
    await settlePages(page, 1);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(1);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }
    // Dense-image profile demonstrably reached the renderer (26px compact box).
    expect(geo.imageBoxWidth).toBe('26px');

    await page.locator(PANEL).screenshot({ path: 'e2e/shots/density-fixture-b.png' });
  });

  test('downloaded 14-item PDF has exactly 1 physical page', async ({ page }) => {
    test.setTimeout(120_000);
    await seedQuote(page, 14);
    await openPreview(page);
    await settlePages(page, 1);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF İNDİR', exact: true }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).not.toBeNull();
    const pdf = await readFile(path!);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    // Page tree nodes are uncompressed in jsPDF output; content streams are
    // FlateDecode-compressed, so a literal scan counts real pages only.
    const physicalPages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(physicalPages).toBe(1);
  });

  test('15 plain products paginate with every row retained exactly once', async ({ page }) => {
    await seedQuote(page, 15);
    await openPreview(page);
    await settlePages(page, 2);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(2);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(15);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }
  });

  test('downloaded 14-image PDF has exactly 1 physical page', async ({ page }) => {
    test.setTimeout(180_000);
    await seedQuote(page, 14, { images: true });
    await openPreview(page);
    await settlePages(page, 1);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF İNDİR', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const path = await download.path();
    expect(path).not.toBeNull();
    const { readFile } = await import('node:fs/promises');
    const pdf = await readFile(path!);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    // Page objects stay uncompressed in jsPDF output: /Type /Page (but not /Pages) counts physical pages.
    const text = pdf.toString('latin1');
    const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(pageCount).toBe(1);
  });

  test('12 described products fit a single dense page without overflow', async ({ page }) => {
    await seedQuote(page, 12, { descs: true });
    await openPreview(page);
    await settlePages(page, 1);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(1);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(12);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }
  });
});
