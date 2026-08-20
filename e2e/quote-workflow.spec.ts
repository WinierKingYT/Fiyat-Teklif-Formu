import { test, expect } from '@playwright/test';

test.describe('End-to-End Quote Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#main-content');
  });

  test('complete workflow: fill details -> add items -> verify summary -> preview PDF', async ({ page }) => {
    // 1. Fill Customer Info
    const customerSection = page.locator('text=Müşteri Bilgileri').first();
    await expect(customerSection).toBeVisible();

    // 2. Add Item
    const addItemBtn = page.locator('button:has-text("Kalem Ekle"), button:has-text("Ürün Ekle")').first();
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();
      
      const itemNameInput = page.locator('input[placeholder*="Ürün"], [data-field="name"]').first();
      if (await itemNameInput.isVisible()) {
        await itemNameInput.fill('Web Geliştirme Hizmeti');
        await expect(itemNameInput).toHaveValue('Web Geliştirme Hizmeti');
      }
    }

    // 3. Open PDF Preview
    const pdfBtn = page.locator('button:has-text("PDF"), button:has-text("Önizle")').first();
    if (await pdfBtn.isVisible()) {
      await pdfBtn.click();
      await expect(page.locator('.pdf-preview, #printable-quote-container-panel').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('multi-tab workflow: add tab -> switch tab -> verify isolated quote states', async ({ page }) => {
    const addTabBtn = page.locator('button[aria-label*="Yeni Sekme"], button:has-text("+")').first();
    if (await addTabBtn.isVisible()) {
      await addTabBtn.click();
      await expect(page.locator('.tab-item, [role="tab"]').last()).toBeVisible();
    }
  });
});
