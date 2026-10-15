const { test, expect, chromium, devices } = require('@playwright/test');

test.describe('PWA basics', () => {
  test('has manifest link and maskable icons', async ({ page }) => {
    await page.goto('/');
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.json/);

    const manifest = await page.evaluate(async () => {
      const res = await fetch('/manifest.json');
      return res.json();
    });
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    const maskable = manifest.icons.filter(i => i.purpose === 'maskable');
    expect(maskable.length).toBeGreaterThanOrEqual(1);
  });

  test('service worker script available and SW supported', async ({ page }) => {
    await page.goto('/');
    const supported = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(supported).toBe(true);
    const swOk = await page.evaluate(async () => {
      try { const res = await fetch('/sw.js', { cache: 'no-store' }); return res.ok; } catch { return false; }
    });
    expect(swOk).toBe(true);
  });

  test('splash visible ~5s with progress bar', async ({ page }) => {
    await page.goto('/');
    const splash = page.locator('#splash');
    await expect(splash).toBeVisible();
    await page.waitForTimeout(4000);
    await expect(splash).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(splash).toBeHidden({ timeout: 5000 });
  });
});

test.describe('Install prompt UX', () => {
  test('Install App button in menu and fallback prompt shown', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.locator('.mobile-menu-btn');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }
    await expect(page.getByRole('button', { name: /Install App/i })).toBeVisible();
    await page.getByRole('button', { name: /Install App/i }).click();
    await expect(page.getByText('Install Journal AI')).toBeVisible();
  });

  test('no prompt when already installed (simulated)', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    // Simulate installed via matchMedia('(display-mode: standalone)')
    await context.addInitScript(() => {
      const original = window.matchMedia;
      window.matchMedia = (q) => {
        if (q === '(display-mode: standalone)') {
          return { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } };
        }
        return original ? original(q) : { matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } };
      };
    });
    const page = await context.newPage();
    await page.goto('https://localhost');
    const menuBtn = page.locator('.mobile-menu-btn');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }
    await page.getByRole('button', { name: /Install App/i }).click();
    // Prompt should not appear
    await expect(page.getByText('Install Journal AI')).toHaveCount(0);
    await context.close();
  });
});
