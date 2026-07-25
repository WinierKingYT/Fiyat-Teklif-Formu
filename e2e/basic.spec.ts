import { test, expect } from '@playwright/test';

test('app loads and shows builder view', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
});

test('can navigate to history view', async ({ page }) => {
  await page.goto('/?view=history');
  await expect(page.locator('text=Tekliflerim')).toBeVisible();
});

test('can navigate to settings view', async ({ page }) => {
  await page.goto('/?view=settings');
  await expect(page.locator('text=Uygulama Ayarları')).toBeVisible();
});
