import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { expect, test, type Download, type Page } from '@playwright/test';

const DB_NAME = 'TeklifMasterDB';

type BackupPayload = {
  schemaVersion: number;
  createdAt: string;
  stores: Record<string, Array<Record<string, unknown>>>;
};

const makeBackup = (stores: Partial<BackupPayload['stores']>): BackupPayload => ({
  schemaVersion: 3,
  createdAt: new Date().toISOString(),
  stores: {
    customers: [],
    products: [],
    quotes: [],
    templates: [],
    bankInfo: [],
    settings: [],
    recycle_bin: [],
    drafts: [],
    quoteVersions: [],
    ...stores,
  },
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

const seedRecycleBin = async (page: Page, items: Array<Record<string, unknown>>) => {
  await page.evaluate(async ({ dbName, items: recycleItems }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['customers', 'products', 'bankInfo', 'recycle_bin'], 'readwrite');
      transaction.objectStore('customers').clear();
      transaction.objectStore('products').clear();
      transaction.objectStore('bankInfo').clear();
      transaction.objectStore('recycle_bin').clear();
      recycleItems.forEach(item => transaction.objectStore('recycle_bin').put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  }, { dbName: DB_NAME, items });
};

const seedQuoteForDeletion = async (page: Page) => {
  await page.evaluate(async ({ dbName }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['quotes', 'recycle_bin'], 'readwrite');
      transaction.objectStore('quotes').clear();
      transaction.objectStore('recycle_bin').clear();
      transaction.objectStore('quotes').put({
        id: 950,
        quoteData: { number: 'E2E-SIL-001', currency: 'TRY' },
        customerData: { name: 'Silinecek E2E Müşteri', company: 'E2E Silme Testi A.Ş.' },
        items: [],
        discount: { type: 'percentage', value: 0 },
        createdAt: new Date().toISOString(),
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  }, { dbName: DB_NAME });
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

  test('persists accurate non-zero financial minor units to IndexedDB on autosave after edit', async ({ page }) => {
    await openBuilder(page);
    await fillRequiredQuote(page);

    // Initial manual save to establish a savedQuoteId on active tab
    await page.getByRole('button', { name: 'Teklifi Kaydet', exact: true }).click();
    await expect(page.getByText('Teklif kaydedildi', { exact: true })).toBeVisible();

    // Edit item price (1250 -> 2000 => 2 * 2000 = 4000 TRY, 20% VAT = 800 TRY, Grand Total = 4800 TRY)
    const priceInput = page.locator('[data-row="0"][data-field="price"]');
    await priceInput.fill('2000');
    await priceInput.blur();
    await expect(priceInput).toHaveValue('2000');

    // Wait for debounce and poll IndexedDB quotes store directly
    await expect.poll(async () => {
      return await page.evaluate(async ({ dbName }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const allQuotes = await new Promise<Array<{ subtotalMinor?: number; taxTotalMinor?: number; grandTotalMinor?: number }>>((resolve, reject) => {
          const tx = db.transaction('quotes', 'readonly');
          const request = tx.objectStore('quotes').getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        db.close();
        const latest = allQuotes[allQuotes.length - 1];
        return latest ? {
          subtotalMinor: latest.subtotalMinor,
          taxTotalMinor: latest.taxTotalMinor,
          grandTotalMinor: latest.grandTotalMinor,
        } : null;
      }, { dbName: DB_NAME });
    }, { timeout: 15_000, intervals: [1000, 2000] }).toEqual({
      subtotalMinor: 400000,
      taxTotalMinor: 80000,
      grandTotalMinor: 480000,
    });
  });
});

test.describe('Delete workflows', () => {
  test('moves a deleted quote to the recycle bin atomically', async ({ page }) => {
    await page.goto('/');
    await seedQuoteForDeletion(page);
    await page.goto('/?view=history');

    await expect(page.getByText('E2E-SIL-001', { exact: true })).toBeVisible();
    await page.locator('button[title="Sil"]').click();
    await expect(page.getByRole('heading', { name: 'Sil', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Onayla', exact: true }).last().click();

    await expect(page.getByText('1 teklif geri dönüşüm kutusuna taşındı', { exact: true })).toBeVisible();
    await expect(page.getByText('Henüz kayıtlı teklif yok', { exact: true })).toBeVisible();

    const persisted = await page.evaluate(async ({ dbName }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const [quotes, recycleBin] = await Promise.all([
        new Promise<unknown[]>((resolve, reject) => {
          const request = db.transaction('quotes', 'readonly').objectStore('quotes').getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }),
        new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
          const request = db.transaction('recycle_bin', 'readonly').objectStore('recycle_bin').getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }),
      ]);
      db.close();
      return { quotesCount: quotes.length, recycleBinItem: recycleBin.find(item => item.originalId === 950) };
    }, { dbName: DB_NAME });

    expect(persisted.quotesCount).toBe(0);
    expect(persisted.recycleBinItem).toEqual(expect.objectContaining({ originalStore: 'quotes', originalId: 950 }));
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

  test('replaces pre-existing data atomically across multiple stores so database strictly matches backup snapshot', async ({ page }) => {
    const staleCustomer = { id: 902, name: 'Eski Müşteri Silinecek', company: 'Eski Ltd.' };
    const staleProduct = { id: 801, name: 'Eski Ürün Silinecek', price: 500 };
    const staleQuote = { id: 701, quoteNumber: 'TK-ESKI-01', customerName: 'Eski Müşteri Silinecek' };

    const newSnapshotCustomer = { id: 903, name: 'Yeni Snapshot Müşteri', company: 'Yeni A.Ş.' };
    const newSnapshotProduct = { id: 802, name: 'Yeni Snapshot Ürün', price: 1500 };

    await openBackupSettings(page);
    // Seed initial stale data across multiple stores
    await importBackup(page, 'seed-stale.json', makeBackup({
      customers: [staleCustomer],
      products: [staleProduct],
      quotes: [staleQuote],
    }));
    await expect(page.getByText(/Yedekleme geri yüklendi.*3 kayıt/).first()).toBeVisible();

    // Import new snapshot containing only newCustomer and newProduct (quotes empty)
    await importBackup(page, 'new-snapshot.json', makeBackup({
      customers: [newSnapshotCustomer],
      products: [newSnapshotProduct],
      quotes: [],
    }));
    await expect(page.getByText(/Yedekleme geri yüklendi.*2 kayıt/).last()).toBeVisible();

    // Export and verify stale records are wiped across all stores and only snapshot records exist
    const { payload } = await exportBackup(page);
    expect(payload.stores.customers).toEqual([expect.objectContaining(newSnapshotCustomer)]);
    expect(payload.stores.customers).not.toContainEqual(expect.objectContaining(staleCustomer));

    expect(payload.stores.products).toEqual([expect.objectContaining(newSnapshotProduct)]);
    expect(payload.stores.products).not.toContainEqual(expect.objectContaining(staleProduct));

    expect(payload.stores.quotes).toEqual([]);
  });

  test('rejects a schema v3 backup with missing canonical stores without changing existing data', async ({ page }) => {
    await openBackupSettings(page);
    await importBackup(page, 'seed-backup.json', makeBackup({ customers: [originalCustomer] }));
    await expect(page.getByText(/Yedekleme geri yüklendi.*1 kayıt/).first()).toBeVisible();

    // Incomplete v3 backup (missing quotes, products, etc.)
    const incompleteV3Payload = {
      schemaVersion: 3,
      createdAt: new Date().toISOString(),
      stores: {
        customers: [{ id: 999, name: 'Geçersiz Eksik Snapshot' }],
      },
    };

    await importBackup(page, 'incomplete-v3.json', incompleteV3Payload);
    await expect(page.getByText(/eksik veri alanları var/i)).toBeVisible();

    // Verify pre-existing customer remains unchanged
    const { payload } = await exportBackup(page);
    expect(payload.stores.customers).toContainEqual(expect.objectContaining(originalCustomer));
    expect(payload.stores.customers).not.toContainEqual(expect.objectContaining({ name: 'Geçersiz Eksik Snapshot' }));
  });
});

test.describe('Recycle bin workflows', () => {
  test('restores a deleted item and removes it from the recycle bin', async ({ page }) => {
    await page.goto('/');
    await seedRecycleBin(page, [{
      id: 9401,
      originalStore: 'customers',
      originalId: 940,
      deletedAt: new Date().toISOString(),
      deletedBy: 'e2e',
      name: 'Geri Yüklenecek Müşteri',
      company: 'E2E Geri Dönüş A.Ş.',
      data: { id: 940, name: 'Geri Yüklenecek Müşteri', company: 'E2E Geri Dönüş A.Ş.' },
    }]);

    await page.getByRole('button', { name: 'Geri Dönüşüm', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Geri Dönüşüm Kutusu', exact: true })).toBeVisible();
    await expect(page.getByText('Geri Yüklenecek Müşteri', { exact: true })).toBeVisible();

    await page.locator('button[title="Geri Yükle"]').click();
    await expect(page.getByText('Öğe geri yüklendi', { exact: true })).toBeVisible();
    await expect(page.getByText('Geri dönüşüm kutusu boş', { exact: true })).toBeVisible();

    const restored = await page.evaluate(async ({ dbName }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const customer = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
        const request = db.transaction('customers', 'readonly').objectStore('customers').get(940);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const recycleBin = await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction('recycle_bin', 'readonly').objectStore('recycle_bin').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return { customer, recycleBinCount: recycleBin.length };
    }, { dbName: DB_NAME });

    expect(restored.customer).toEqual(expect.objectContaining({ id: 940, name: 'Geri Yüklenecek Müşteri' }));
    expect(restored.recycleBinCount).toBe(0);
  });

  test('keeps an item when its original store is invalid', async ({ page }) => {
    await page.goto('/');
    await seedRecycleBin(page, [{
      id: 9402,
      originalStore: 'missing_store',
      originalId: 941,
      deletedAt: new Date().toISOString(),
      deletedBy: 'e2e',
      name: 'Hatalı Geri Yükleme',
      data: { id: 941, name: 'Hatalı Geri Yükleme' },
    }]);

    await page.getByRole('button', { name: 'Geri Dönüşüm', exact: true }).click();
    await expect(page.getByText('Hatalı Geri Yükleme', { exact: true })).toBeVisible();
    await page.locator('button[title="Geri Yükle"]').click();

    await expect(page.getByText('Geri yükleme başarısız', { exact: true })).toBeVisible();
    await expect(page.getByText('Hatalı Geri Yükleme', { exact: true })).toBeVisible();
  });

  test('permanently deletes a recycle-bin item after confirmation', async ({ page }) => {
    await page.goto('/');
    await seedRecycleBin(page, [{
      id: 9403,
      originalStore: 'products',
      originalId: 942,
      deletedAt: new Date().toISOString(),
      deletedBy: 'e2e',
      name: 'Kalıcı Silinecek Ürün',
      data: { id: 942, name: 'Kalıcı Silinecek Ürün' },
    }]);

    await page.getByRole('button', { name: 'Geri Dönüşüm', exact: true }).click();
    await expect(page.getByText('Kalıcı Silinecek Ürün', { exact: true })).toBeVisible();
    await page.locator('button[title="Kalıcı Olarak Sil"]').click();
    await expect(page.getByRole('heading', { name: 'Kalıcı Sil', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Onayla', exact: true }).last().click();

    await expect(page.getByText('Öğe kalıcı olarak silindi', { exact: true })).toBeVisible();
    await expect(page.getByText('Geri dönüşüm kutusu boş', { exact: true })).toBeVisible();
  });
});
