import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// AUTO-FIT MEASUREMENT AUTHORITY — regression fixture.
//
// The legacy greedy fallback (340/420/250px budgets + 50px image row floor) was
// reached whenever the old single-page heuristic rejected a dense profile. For a
// 13-row image quote that meant exactly [6,5,2]: page1 340/50=6, page2 5 (orphan
// guard), page3 2 + totals. That fingerprint is exactly what the user reported in
// production despite fresh-config tests passing.
//
// `sectionSpacing: 8` is the trap: the OLD dense guard rejected it ('custom-
// spacing') so the greedy fallback fired, yet the corporate theme never reads
// sectionSpacing — geometry is unchanged. These tests FAIL if the [6,5,2]
// fingerprint ever re-appears, and PASS only when the real DOM measurement (not
// the heuristic) decides the pagination.

const PANEL = '#printable-quote-container-panel';
const A4_PX = 1122.5;
const TOLERANCE_PX = 24;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

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

async function seedConfig(page: Page, config: Record<string, unknown>) {
  await page.addInitScript(({ c }) => {
    localStorage.setItem('pdfConfig', JSON.stringify(c));
  }, { c: config });
}

async function seedQuote(page: Page, opts: { images?: boolean; descs?: boolean; longDescs?: boolean } = {}) {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await page.getByLabel('Teklif Numarası').fill('E2E-MEASURE');
  await page.locator('#customerName').fill('E2E Müşteri');
  await page.locator('#customerCompany').fill('E2E Müşteri A.Ş.');

  for (let i = 0; i < 13; i++) {
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
        // Preview page boxes grow with content, so clientHeight is meaningless;
        // the ONLY sheet-fit authority is scrollHeight vs the physical sheet
        // (non-last pages carry the 24px preview-marker in scrollHeight).
        scrolls: pages.map((p) => p.scrollHeight),
        overflows: pages
          .map((p, i) => (p.scrollHeight > p.clientHeight + tol ? i + 1 : -1))
          .filter((i) => i > 0),
        rows: pages.map(itemRows),
      };
    },
    { panel: PANEL, tol: TOLERANCE_PX }
  );
}

function assertSheetFit(geo: { pages: number; scrolls: number[] }, sheet: number, tol: number) {
  geo.scrolls.forEach((scroll, i) => {
    const cap = sheet + (i < geo.pages - 1 ? tol : 0);
    expect(scroll).toBeLessThanOrEqual(cap);
  });
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

test.describe('measurement authority: legacy-guarded configs never re-produce the greedy 6/5/2 split', () => {
  test.describe.configure({ timeout: 180_000 });

  test('corporate 13 image items + legacy sectionSpacing now fit ONE measured page, never the greedy 6/5/2', async ({ page }) => {
    // sectionSpacing: 8 is ignored by corporate rendering but made the OLD dense
    // guard bail (custom-spacing) → greedy fallback → [6,5,2]. This test fails if
    // that fingerprint ever returns. With the theme dense CSS deps fixed, the
    // dense profile genuinely renders on the DOM, so 13 image rows + header +
    // totals now MEASURE one fitted A4 sheet — never an over-split, and the
    // download reports the SAME single physical page (preview/export parity).
    await seedConfig(page, { theme: 'corporate', sectionSpacing: 8 });
    await seedQuote(page, { images: true });
    await openPreview(page);
    await settlePages(page, 1);

    await expect(page.locator(`${PANEL}.corporate-theme-container`).first()).toBeVisible();
    const geo = await measurePages(page);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(13);
    expect(geo.rows).not.toEqual([6, 5, 2]);
    expect(geo.pages).toBe(1);
    for (const r of geo.rows) {
      expect(r).toBeGreaterThanOrEqual(1);
    }
    expect(geo.overflows).toEqual([]);
    geo.scrolls.forEach((scroll, i) => {
      const cap = A4_PX + (i < geo.pages - 1 ? TOLERANCE_PX : 0);
      expect(scroll).toBeLessThanOrEqual(cap);
    });

    expect(countPhysicalPages(await downloadPdf(page))).toBe(geo.pages);
  });

  test('corporate 13 long-description image items: measured split never equals [6,5,2] and never overflows', async ({ page }) => {
    test.setTimeout(300_000);
    await seedConfig(page, { theme: 'corporate', sectionSpacing: 8 });
    await seedQuote(page, { images: true, longDescs: true });
    await openPreview(page);

    await expect
      .poll(async () => page.locator(`${PANEL} .pdf-page`).count(), { timeout: 25000 })
      .toBeGreaterThanOrEqual(2);

    const geo = await measurePages(page);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(13);
    expect(geo.rows).not.toEqual([6, 5, 2]);
    for (const r of geo.rows) {
      expect(r).toBeGreaterThanOrEqual(1);
    }
    expect(geo.overflows).toEqual([]);
    assertSheetFit(geo, A4_PX, TOLERANCE_PX);
  });
});