import { expect, test } from '@playwright/test';

test.describe('Application smoke tests', () => {
  test('opens the quote builder', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByLabel('Teklif Numarası')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kalem Ekle', exact: true })).toBeVisible();
  });

  test('opens quote history from a direct link', async ({ page }) => {
    await page.goto('/?view=history');

    await expect(page.getByRole('heading', { name: 'Tekliflerim', exact: true })).toBeVisible();
    await expect(page.getByText('Henüz kayıtlı teklif yok')).toBeVisible();
  });

  test('opens settings and switches tabs', async ({ page }) => {
    await page.goto('/?view=settings');

    await expect(page.getByRole('heading', { name: 'Uygulama Ayarları' })).toBeVisible();
    await page.getByRole('button', { name: 'Varsayılan Bilgiler', exact: true }).click();
    await expect(page.getByText('Teklif Varsayılanları')).toBeVisible();

    await page.getByRole('button', { name: 'PDF Düzeni', exact: true }).click();
    await expect(page.getByText('PDF Bölüm Sıralaması')).toBeVisible();

    await page.getByRole('button', { name: 'Filigran', exact: true }).click();
    await expect(page.getByText('Filigran Ayarları')).toBeVisible();
  });

  test('renders the builder at mobile and desktop widths', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByLabel('Menüyü Aç/Kapat')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByLabel('Teklif Numarası')).toBeVisible();
  });

  test('renders item cards on mobile and the sortable table on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Kalem Ekle', exact: true }).click();
    await expect(page.locator('[data-row="0"][data-field="name"]')).toBeVisible();
    await expect(page.locator('tbody')).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('tbody')).toBeVisible();
  });

  test('supports sorting and bulk discount updates for selected items', async ({ page }) => {
    await page.goto('/');
    const addItem = page.getByRole('button', { name: 'Kalem Ekle', exact: true });
    await addItem.click();
    await addItem.click();

    await page.locator('[data-row="0"][data-field="name"]').fill('Ucuz Hizmet');
    await page.locator('[data-row="0"][data-field="price"]').fill('100');
    await page.locator('[data-row="1"][data-field="name"]').fill('Pahalı Hizmet');
    await page.locator('[data-row="1"][data-field="price"]').fill('500');

    await page.getByRole('button', { name: 'Tümünü seç', exact: true }).click();
    await expect(page.getByText('2 seçili', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '%10', exact: true }).first().click();
    await expect(page.locator('[data-field="discountRate"]').nth(0)).toHaveValue('10');
    await expect(page.locator('[data-field="discountRate"]').nth(1)).toHaveValue('10');

    await page.getByRole('button', { name: 'Araçlar', exact: true }).click();
    await page.getByRole('button', { name: 'Pahalıdan Ucuza', exact: true }).click();
    await expect(page.locator('[data-row="0"][data-field="name"]')).toHaveValue('Pahalı Hizmet');
  });
});
