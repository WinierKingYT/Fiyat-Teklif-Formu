import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const PANEL = '#printable-quote-container-panel';
const A4_PX = 1122.5;
// Same 24px rule as usePdfPageObserver (preview sélectionnez marker ::after).
const TOLERANCE_PX = 24;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Realistic Turkish catalog products (§24) — normal names with short descriptions.
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
  { name: 'Anestezi Derinlik Monitörü', desc: 'BIS sensör uyumlu' },
];

const THEME_CONTAINER: Record<string, string> = {
  modern: '.modern-theme-container',
  corporate: '.corporate-theme-container',
  classic: '.classic-theme-container',
  minimal: '.minimal-theme-container',
  pro: '.pro-theme-container',
  bold: '.bold-theme-container',
  invoice: '.invoice-theme-container',
};

async function seedTheme(page: Page, theme: string) {
  await page.addInitScript(({ t }) => {
    localStorage.setItem('pdfConfig', JSON.stringify({ theme: t }));
  }, { t: theme });
}

async function seedQuote(page: Page, n: number, opts: { images?: boolean; descs?: boolean; longDescs?: boolean } = {}) {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await page.getByLabel('Teklif Numarası').fill('E2E-MATRIX');
  await page.locator('#customerName').fill('E2E Müşteri');
  await page.locator('#customerCompany').fill('E2E Müşteri A.Ş.');

  await page.getByRole('button', { name: 'Banka', exact: true }).click();
  await page.locator('#bankName').fill('E2E Bank');
  await page.locator('#iban').fill('TR120006200000012345678901');

  for (let i = 0; i < n; i++) {
    const p = PRODUCTS[i % PRODUCTS.length];
    await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
    await page.locator(`[data-row="${i}"][data-field="name"]`).fill(`${p.name} ${i + 1}`);
    await page.locator(`[data-row="${i}"][data-field="price"]`).fill('250');
    if (opts.descs) {
      await page.locator(`[data-row="${i}"][data-field="description"]`).fill(p.desc);
    }
    if (opts.longDescs) {
      await page.locator(`[data-row="${i}"][data-field="description"]`).fill(`${p.desc}. `.repeat(12));
    }
    if (opts.images) {
      await page.locator('tbody input[type="file"][accept="image/*"]').nth(i)
        .setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: PNG_1X1 });
    }
  }
}

async function openPreview(page: Page) {
  await page.getByRole('button', { name: 'PDF Önizle & İndir', exact: true }).click();
  await expect(page.locator(`${PANEL} .pdf-page`).first()).toBeVisible({ timeout: 15000 });
}

async function settlePages(page: Page, expected: number) {
  await expect
    .poll(async () => page.locator(`${PANEL} .pdf-page`).count(), { timeout: 25000 })
    .toBe(expected);
}

// Counts ITEM rows only. Every theme renders exactly one <thead> (the items
// table); headerless totals/summary tables (classic, pro, etc.) are excluded.
async function measurePages(page: Page) {
  return page.evaluate(
    ({ panel, tol }) => {
      const pages = Array.from(document.querySelectorAll(`${panel} .pdf-page`)) as HTMLElement[];
      const itemRows = (p: HTMLElement) => {
        const itemTable = p.querySelector('table thead')?.closest('table');
        return itemTable ? itemTable.querySelectorAll('tbody tr').length : 0;
      };
      return {
        pages: pages.length,
        heights: pages.map((p) => p.offsetHeight),
        overflows: pages
          .map((p, i) => (p.scrollHeight > p.clientHeight + tol ? i + 1 : -1))
          .filter((i) => i > 0),
        rows: pages.map(itemRows),
      };
    },
    { panel: PANEL, tol: TOLERANCE_PX }
  );
}

function countPhysicalPages(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
}

async function downloadPdf(page: Page) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF İNDİR', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const pdf = await readFile(path!);
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  return pdf;
}

test.describe('theme parity matrix: 14 items on one page', () => {
  test.describe.configure({ timeout: 180_000 });
  for (const theme of Object.keys(THEME_CONTAINER)) {
    test(`${theme}: 14 plain products fit one page`, async ({ page }) => {
      await seedTheme(page, theme);
      await seedQuote(page, 14);
      await openPreview(page);
      await settlePages(page, 1);

      // The theme container IS the panel element (id lands on the theme root),
      // so scope the class selector to the panel itself, not a descendant.
      await expect(page.locator(`${PANEL}${THEME_CONTAINER[theme]}`).first()).toBeVisible();
      const geo = await measurePages(page);
      expect(geo.pages).toBe(1);
      expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
      expect(geo.overflows).toEqual([]);
      for (const h of geo.heights) {
        expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
      }
    });

    test(`${theme}: 14 image products fit one page`, async ({ page }) => {
      await seedTheme(page, theme);
      await seedQuote(page, 14, { images: true });
      await openPreview(page);
      await settlePages(page, 1);

      // Theme container is the panel root element itself (see note above).
      await expect(page.locator(`${PANEL}${THEME_CONTAINER[theme]}`).first()).toBeVisible();
      const geo = await measurePages(page);
      expect(geo.pages).toBe(1);
      expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
      expect(geo.overflows).toEqual([]);
      for (const h of geo.heights) {
        expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
      }

      await page.locator(PANEL).screenshot({ path: `e2e/shots/matrix-${theme}-14image.png` });
    });
  }
});

test.describe('counts matrix: rows appear exactly once, no orphan pages', () => {
  for (const [theme, withImages] of [['modern', false], ['modern', true], ['corporate', false], ['corporate', true]] as const) {
    test(`${theme} ${withImages ? 'image' : 'plain'} counts 1..25`, async ({ page }) => {
      test.setTimeout(600_000);
      await seedTheme(page, theme);
      await page.goto('/');
      await expect(page.locator('#main-content')).toBeVisible();
      await page.getByLabel('Teklif Numarası').fill('E2E-COUNTS');
      await page.locator('#customerName').fill('E2E Müşteri');

      // Full-screen live preview hides the builder, so toggle it closed while
      // adding items, then open it again to measure. State survives in context.
      const setPreview = async (open: boolean) => {
        const openNow = (await page.locator(`${PANEL} .pdf-page`).count()) > 0;
        if (open !== openNow) {
          await page.getByRole('button', { name: 'PDF', exact: true }).click();
        }
      };

      for (const n of [1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25]) {
        await setPreview(false);
        const current = await page.locator('[data-field="name"]').count();
        for (let i = current; i < n; i++) {
          const p = PRODUCTS[i % PRODUCTS.length];
          await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
          await page.locator(`[data-row="${i}"][data-field="name"]`).fill(`${p.name} ${i + 1}`);
          await page.locator(`[data-row="${i}"][data-field="price"]`).fill('250');
          if (withImages) {
            await page.locator('tbody input[type="file"][accept="image/*"]').nth(i)
              .setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: PNG_1X1 });
          }
        }
        await setPreview(true);
        // Wait until the rendered item count catches up with the form.
        await expect
          .poll(async () => (await measurePages(page)).rows.reduce((a, b) => a + b, 0), { timeout: 25000 })
          .toBe(n);
        const geo = await measurePages(page);
        expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(n);
        expect(geo.overflows).toEqual([]);
        for (const r of geo.rows) {
          expect(r).toBeGreaterThanOrEqual(1);
        }
        // Last page is never a single orphan row.
        expect(geo.rows[geo.rows.length - 1]).toBeGreaterThanOrEqual(Math.min(2, n));
        if (n <= 14) {
          expect(geo.pages).toBe(1);
        } else {
          expect(geo.pages).toBeGreaterThanOrEqual(2);
        }
      }
    });
  }
});

test.describe('long content and downloads', () => {
  test('14 long-description items paginate safely without clipping', async ({ page }) => {
    test.setTimeout(300_000);
    await seedTheme(page, 'modern');
    await seedQuote(page, 14, { longDescs: true });
    await openPreview(page);
    await expect
      .poll(async () => page.locator(`${PANEL} .pdf-page`).count(), { timeout: 25000 })
      .toBeGreaterThanOrEqual(2);

    const geo = await measurePages(page);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }
  });

  test('corporate 14 plain download has exactly 1 physical page', async ({ page }) => {
    test.setTimeout(180_000);
    await seedTheme(page, 'corporate');
    await seedQuote(page, 14);
    await openPreview(page);
    await settlePages(page, 1);
    expect(countPhysicalPages(await downloadPdf(page))).toBe(1);
  });

  test('corporate 14 image download has exactly 1 physical page', async ({ page }) => {
    test.setTimeout(180_000);
    await seedTheme(page, 'corporate');
    await seedQuote(page, 14, { images: true });
    await openPreview(page);
    await settlePages(page, 1);
    expect(countPhysicalPages(await downloadPdf(page))).toBe(1);
  });
});
