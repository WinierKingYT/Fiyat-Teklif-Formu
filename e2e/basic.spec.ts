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
});
