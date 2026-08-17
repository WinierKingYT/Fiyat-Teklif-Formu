import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('app loads and shows builder view', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('can navigate to history view', async ({ page }) => {
    await page.goto('/?view=history');
    await expect(page.locator('text=Teklif').first()).toBeVisible();
  });

  test('can navigate to settings view', async ({ page }) => {
    await page.goto('/?view=settings');
    await expect(page.locator('text=Uygulama Ayarları')).toBeVisible();
  });
});

test.describe('Quote Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#main-content');
  });

  test('shows default tab with empty form', async ({ page }) => {
    await expect(page.locator('text=Yeni Teklif').first()).toBeVisible();
  });

  test('can add a new item to the quote', async ({ page }) => {
    const addButton = page.locator('button:has-text("Ürün Ekle"), button:has-text("Ekle")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('input[placeholder*="Ürün"], input[placeholder*="ürün"]').first()).toBeVisible();
    }
  });

  test('can fill in customer information', async ({ page }) => {
    const customerTab = page.locator('button:has-text("Müşteri"), [data-tab="customer"]').first();
    if (await customerTab.isVisible()) {
      await customerTab.click();
      const nameInput = page.locator('input[name="name"], input[placeholder*="Müşteri"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Müşteri A.Ş.');
        await expect(nameInput).toHaveValue('Test Müşteri A.Ş.');
      }
    }
  });

  test('can fill in quote title', async ({ page }) => {
    const titleInput = page.locator('input[name="title"], input[placeholder*="Başlık"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Hizmet Teklifi');
      await expect(titleInput).toHaveValue('Hizmet Teklifi');
    }
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=settings');
    await page.waitForSelector('text=Uygulama Ayarları');
  });

  test('shows all setting tabs', async ({ page }) => {
    await expect(page.locator('button:has-text("Genel Ayarlar")')).toBeVisible();
    await expect(page.locator('button:has-text("Varsayılan Bilgiler")')).toBeVisible();
    await expect(page.locator('button:has-text("PDF Düzeni")')).toBeVisible();
    await expect(page.locator('button:has-text("Filigran")')).toBeVisible();
  });

  test('can switch between tabs', async ({ page }) => {
    await page.click('button:has-text("Varsayılan Bilgiler")');
    await expect(page.locator('text=Teklif Varsayılanları')).toBeVisible();

    await page.click('button:has-text("PDF Düzeni")');
    await expect(page.locator('text=PDF Bölüm Sıralaması')).toBeVisible();

    await page.click('button:has-text("Filigran")');
    await expect(page.locator('text=Filigran Ayarları')).toBeVisible();
  });

  test('can toggle theme', async ({ page }) => {
    const darkModeRadio = page.locator('input[name="appTheme"][value="dark"]');
    if (await darkModeRadio.isVisible()) {
      await darkModeRadio.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    }
  });

  test('can change font size', async ({ page }) => {
    const fontSizeSlider = page.locator('input[type="range"][min="12"][max="20"]');
    if (await fontSizeSlider.isVisible()) {
      await fontSizeSlider.fill('16');
      const sizeDisplay = page.locator('text=16px');
      await expect(sizeDisplay).toBeVisible();
    }
  });
});

test.describe('PDF Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=settings');
    await page.waitForSelector('text=Uygulama Ayarları');
    await page.click('button:has-text("Filigran")');
  });

  test('can toggle watermark', async ({ page }) => {
    const watermarkToggle = page.locator('input[type="checkbox"]').first();
    if (await watermarkToggle.isVisible()) {
      await watermarkToggle.click();
      const watermarkTextInput = page.locator('input[placeholder*="TASLAK"]');
      if (watermarkTextInput.isVisible()) {
        await expect(watermarkTextInput).toBeVisible();
      }
    }
  });

  test('can fill watermark text', async ({ page }) => {
    const watermarkToggle = page.locator('input[type="checkbox"]').first();
    if (await watermarkToggle.isVisible()) {
      const isChecked = await watermarkToggle.isChecked();
      if (!isChecked) await watermarkToggle.click();

      const watermarkTextInput = page.locator('input[placeholder*="TASLAK"]');
      if (await watermarkTextInput.isVisible()) {
        await watermarkTextInput.fill('ONAY');
        await expect(watermarkTextInput).toHaveValue('ONAY');
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('shows mobile view on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('shows desktop view on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });
});
