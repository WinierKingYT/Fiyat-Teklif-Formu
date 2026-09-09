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

// Realistic persisted snapshot from an existing user browser: full settings,
// legacy itemsPerPage, and — crucially — NO paginationMode key.
const legacySnapshot = {
  showLogo: true, showBankInfo: true, showSignatures: true, showCustomerSignature: false,
  showTerms: true, showNotes: true, showSummary: true,
  title: 'FİYAT TEKLİFİ', fontFamily: 'Inter', fontSize: 12,
  tableHeaderFontSize: 14, tableRowHeight: 35, borderRadius: 6,
  tableHeaderBg: '#f1f5f9', margins: 'normal', pageOrientation: 'portrait',
  showTableImages: true, showTableUnit: true, showTableTax: true,
  showWatermark: false, watermarkText: 'TASLAK', watermarkOpacity: 0.1,
  watermarkColor: '#000000', watermarkFontSize: 120, watermarkRotation: -45,
  customFooter: '', logoPosition: 'left', logoStyle: 'square', logoMaxHeight: 50,
  showPageNumbers: true, pageBgPattern: 'none', theme: 'modern', color: '#1b3a5c',
  globalFontFamily: 'Inter', titleFontFamily: '', labelFontFamily: '', bodyFontFamily: '',
  itemsPerPage: 6,
  tableDensity: 'comfortable',
  pageBackgroundColor: '#ffffff',
};

async function seedStoredConfig(page: Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript(({ snapshot }) => {
    localStorage.setItem('pdfConfig', JSON.stringify(snapshot));
  }, { snapshot: { ...legacySnapshot, ...extra } });
}

async function seedRealisticQuote(page: Page, n: number, opts: { images?: boolean } = {}) {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await page.getByLabel('Teklif Numarası').fill('E2E-LEGACY-001');

  // Company block (Firma tab) incl. collapsed detail fields.
  await page.getByRole('button', { name: 'Firma', exact: true }).click();
  await page.locator('#companyName').fill('E2E Tedarik Ltd. Şti.');
  const showAll = page.getByRole('button', { name: 'Tüm Alanları Göster', exact: true });
  if (await showAll.isVisible()) {
    await showAll.click();
  }
  await page.locator('#companyAddress').fill('Atatürk Mah. Sanayi Cad. No: 28 Kadıköy / İstanbul');
  await page.locator('#companyPhone').fill('+90 (212) 555 01 23');
  await page.locator('#companyEmail').fill('info@e2e-tedarik.com');

  // Customer block incl. collapsed extra fields.
  await page.locator('#customerName').fill('Mehmet Özdemir');
  await page.locator('#customerCompany').fill('Mega Lojistik ve Ticaret Ltd. Şti.');
  const extraInfo = page.getByRole('button', { name: '+ Ek Bilgiler', exact: true });
  if (await extraInfo.isVisible()) {
    await extraInfo.click();
  }
  await page.locator('#customerPhone').fill('+90 (532) 555 98 76');
  await page.locator('#customerEmail').fill('mehmet@megolojistik.com');
  await page.locator('#customerAddress').fill('Atatürk Mah. Sanayi Cad. No: 28 Kadıköy / İstanbul');

  // Bank block (Banka tab) so the full bottom section renders.
  await page.getByRole('button', { name: 'Banka', exact: true }).click();
  await page.locator('#bankName').fill('E2E Bank');
  await page.locator('#iban').fill('TR120006200000012345678901');

  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
    await page.locator(`[data-row="${i}"][data-field="name"]`).fill(`E2E Ürün ${i + 1}`);
    await page.locator(`[data-row="${i}"][data-field="price"]`).fill('250');
  }

  if (opts.images) {
    const inputs = page.locator('tbody input[type="file"][accept="image/*"]');
    await expect(inputs).toHaveCount(n);
    for (let i = 0; i < n; i++) {
      await inputs.nth(i).setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: PNG_1X1 });
    }
    await expect(page.locator('tbody td img').first()).toBeVisible();
  }
}

async function openPreview(page: Page) {
  await page.getByRole('button', { name: 'PDF Önizle & İndir', exact: true }).click();
  await expect(page.locator(`${PANEL} .pdf-page`).first()).toBeVisible({ timeout: 15000 });
}

async function settlePages(page: Page, expected: number) {
  await expect
    .poll(async () => page.locator(`${PANEL} .pdf-page`).count(), { timeout: 20000 })
    .toBe(expected);
}

async function measurePages(page: Page) {
  return page.evaluate(
    ({ panel, tol }) => {
      const pages = Array.from(document.querySelectorAll(`${panel} .pdf-page`)) as HTMLElement[];
      return {
        pages: pages.length,
        heights: pages.map((p) => p.offsetHeight),
        overflows: pages
          .map((p, i) => (p.scrollHeight > p.clientHeight + tol ? i + 1 : -1))
          .filter((i) => i > 0),
        rows: pages.map((p) => p.querySelectorAll('tbody tr').length),
      };
    },
    { panel: PANEL, tol: TOLERANCE_PX }
  );
}

function countPhysicalPages(pdf: Buffer): number {
  // Page tree nodes stay uncompressed in jsPDF output; content streams are
  // FlateDecode-compressed, so a literal scan counts real pages only.
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

test.describe('Legacy persisted pagination (§7/§9/§10)', () => {
  test('LEGACY-6 → 14 plain products: 1 React page, 1 physical PDF page', async ({ page }) => {
    test.setTimeout(180_000);
    await seedStoredConfig(page);
    await seedRealisticQuote(page, 14);
    await openPreview(page);
    await settlePages(page, 1);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(1);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }

    const pdf = await downloadPdf(page);
    expect(countPhysicalPages(pdf)).toBe(1);
  });

  test('LEGACY-6 → 14 image products: 1 React page, 1 physical PDF page', async ({ page }) => {
    test.setTimeout(180_000);
    await seedStoredConfig(page);
    await seedRealisticQuote(page, 14, { images: true });
    await openPreview(page);
    await settlePages(page, 1);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(1);
    expect(geo.rows.reduce((a, b) => a + b, 0)).toBe(14);
    expect(geo.overflows).toEqual([]);
    for (const h of geo.heights) {
      expect(h).toBeLessThanOrEqual(A4_PX + TOLERANCE_PX);
    }

    const pdf = await downloadPdf(page);
    expect(countPhysicalPages(pdf)).toBe(1);
  });

  test('MANUAL-6 → 14 products: 6/6/2 pages and 3 physical PDF pages', async ({ page }) => {
    test.setTimeout(180_000);
    await seedStoredConfig(page, { paginationMode: 'manual', itemsPerPage: 6 });
    await seedRealisticQuote(page, 14);
    await openPreview(page);
    await settlePages(page, 3);

    const geo = await measurePages(page);
    expect(geo.pages).toBe(3);
    expect(geo.rows).toEqual([6, 6, 2]);

    const pdf = await downloadPdf(page);
    expect(countPhysicalPages(pdf)).toBe(3);
  });
});
