import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { expect, test, type Download, type Page } from '@playwright/test';

const DB_NAME = 'TeklifMasterDB';

type BackupPayload = {
  schemaVersion: number;
  createdAt: string;
  stores: Record<string, Array<Record<string, unknown>>>;
};

const makeBackup = (stores: BackupPayload['stores']): BackupPayload => ({
  schemaVersion: 3,
  createdAt: new Date().toISOString(),
  stores,
});

const openBuilder = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.getByLabel('Teklif Numarası')).toBeVisible();
};

const fillRequiredQuote = async (page: Page) => {
  await page.getByLabel('Teklif Numarası').fill('E2E-2026-001');
  await page.locator('#customerName').fill('E2E Müşteri');
  await page.locator('#customerCompany').fill('E2E Müşteri A.Ş.');

  await page.getByRole('button', { name: 'Firma', exact: true }).click();
  await page.locator('#companyName').fill('E2E Teklif Ltd.');

  await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
  await page.locator('[data-row="0"][data-field="name"]').fill('Bakım Hizmeti');
  await page.locator('[data-row="0"][data-field="quantity"]').fill('2');
  await page.locator('[data-row="0"][data-field="price"]').fill('1250');
};

const openBackupSettings = async (page: Page) => {
  await page.goto('/?view=settings&tab=backup');
  await expect(page.getByRole('heading', { name: 'Uygulama Ayarları' })).toBeVisible();
  await expect(page.locator('#backup-file-input')).toBeAttached();
};

const importBackup = async (page: Page, name: string, payload: unknown) => {
  await page.locator('#backup-file-input').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  });
};

const exportBackup = async (page: Page): Promise<{ download: Download; payload: BackupPayload }> => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Yedek Dosyasını İndir/ }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const payload = JSON.parse(await readFile(path!, 'utf8')) as BackupPayload;
  return { download, payload };
};

test.describe('Critical quote workflows', () => {
  test('saves the active quote and restores it after a reload', async ({ page }) => {
    await openBuilder(page);
    await fillRequiredQuote(page);

    await page.getByRole('button', { name: 'Teklifi Kaydet', exact: true }).click();
    await expect(page.getByText('Teklif kaydedildi', { exact: true })).toBeVisible();

    await expect.poll(() => page.evaluate(async ({ dbName }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const record = await new Promise<{ value?: Array<{ data?: { quoteData?: { number?: string } } }> } | undefined>((resolve, reject) => {
        const request = db.transaction('settings', 'readonly').objectStore('settings').get('active_quote_session');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return record?.value?.[0]?.data?.quoteData?.number;
    }, { dbName: DB_NAME })).toBe('E2E-2026-001');

    await page.reload();
    await expect(page.getByLabel('Teklif Numarası')).toHaveValue('E2E-2026-001');
    await expect(page.locator('#customerName')).toHaveValue('E2E Müşteri');
    await expect(page.locator('[data-row="0"][data-field="name"]')).toHaveValue('Bakım Hizmeti');
    await expect(page.locator('[data-row="0"][data-field="quantity"]')).toHaveValue('2');
    await expect(page.locator('[data-row="0"][data-field="price"]')).toHaveValue('1250');
  });

  test('previews and downloads a PDF without QR artifacts', async ({ page }) => {
    test.setTimeout(60_000);
    await openBuilder(page);
    await fillRequiredQuote(page);

    await page.getByRole('button', { name: 'PDF Önizle & İndir', exact: true }).click();
    const printableQuote = page.locator('#printable-quote-container-panel');
    await expect(printableQuote).toBeVisible();
    await expect(printableQuote.getByText(/QR\s*(Kod|Code)/i)).toHaveCount(0);
    await expect(printableQuote.locator('[id*="qrcode" i], [class*="qrcode" i], [data-testid*="qrcode" i], [aria-label*="QR" i]')).toHaveCount(0);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF İNDİR', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const path = await download.path();
    expect(path).not.toBeNull();
    const pdf = await readFile(path!);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});

test.describe('Backup and restore workflows', () => {
  const originalCustomer = { id: 901, name: 'Korunacak Müşteri', company: 'Sağlam Veri A.Ş.' };

  test('imports a valid backup and exports the restored data', async ({ page }) => {
    await openBackupSettings(page);
    await importBackup(page, 'valid-backup.json', makeBackup({ customers: [originalCustomer] }));

    await expect(page.getByText(/Yedekleme geri yüklendi.*1 kayıt/)).toBeVisible();
    const { download, payload } = await exportBackup(page);

    expect(download.suggestedFilename()).toMatch(/^teklif_master_yedek_\d{8}\.json$/);
    expect(payload.schemaVersion).toBe(3);
    expect(payload.stores.customers).toContainEqual(expect.objectContaining(originalCustomer));
  });

  test('rejects an unsupported backup without changing existing data', async ({ page }) => {
    await openBackupSettings(page);
    await importBackup(page, 'seed-backup.json', makeBackup({ customers: [originalCustomer] }));
    await expect(page.getByText(/Yedekleme geri yüklendi.*1 kayıt/)).toBeVisible();

    await importBackup(page, 'unsupported-backup.json', makeBackup({ unknownStore: [{ id: 1 }] }));
    await expect(page.getByText(/desteklenmeyen veri alanı var: unknownStore/)).toBeVisible();

    const { payload } = await exportBackup(page);
    expect(payload.stores.customers).toContainEqual(expect.objectContaining(originalCustomer));
  });

  test('rolls back every store when one restored record cannot be written', async ({ page }) => {
    await openBackupSettings(page);
    await importBackup(page, 'seed-backup.json', makeBackup({ customers: [originalCustomer] }));
    await expect(page.getByText(/Yedekleme geri yüklendi.*1 kayıt/)).toBeVisible();

    await importBackup(page, 'atomic-failure.json', makeBackup({
      customers: [{ ...originalCustomer, name: 'Yarım Kalmış Değişiklik' }],
      quoteVersions: [{ id: 'missing-required-version-id' }],
    }));
    await expect(page.getByText(/Yedekleme geri yükleme hatası/)).toBeVisible();

    const { payload } = await exportBackup(page);
    expect(payload.stores.customers).toContainEqual(expect.objectContaining(originalCustomer));
    expect(payload.stores.customers).not.toContainEqual(expect.objectContaining({ name: 'Yarım Kalmış Değişiklik' }));
    expect(payload.stores.quoteVersions).toEqual([]);
  });
});
