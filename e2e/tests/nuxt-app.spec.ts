import { expect, test, type Page } from '@playwright/test';

import { startNuxtAppServer, type NuxtAppServer } from '../apps/nuxt-app/server';

const getDataLayer = async <T>(page: Page): Promise<T[]> => {
  return page.evaluate(() => {
    const layer = (window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer;
    if (Array.isArray(layer)) {
      return layer as T[];
    }

    return [] as T[];
  });
};

test.describe('Nuxt 3 App example', () => {
  let server: NuxtAppServer;

  test.beforeAll(async () => {
    server = await startNuxtAppServer();
  }, 120000); // Extended timeout for Nuxt build

  test.afterAll(async () => {
    await server.close();
  });

  test('renders GTM script and initializes data layer', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Check GTM script is injected
    const scriptLocator = page.locator('head script[data-gtm-container-id="GTM-NUXTAPP"]');
    await expect(scriptLocator).toHaveCount(1);
    await expect(scriptLocator).toHaveAttribute('src', /l=nuxtAppDataLayer/);

    // Check data layer is initialized
    await page.waitForFunction(() => {
      const layer = (window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer;
      return Array.isArray(layer) && layer.length > 0;
    });

    const dataLayer = await getDataLayer<{ event?: string }>(page);
    expect(dataLayer.length).toBeGreaterThan(0);

    // Should have gtm.js start event
    const startEvent = dataLayer.find((e) => e.event === 'gtm.js');
    expect(startEvent).toBeDefined();
  });

  test('applies consent defaults for GDPR compliance', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Wait for consent to be set
    await page.waitForFunction(() => {
      const layer = (window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer;
      return Array.isArray(layer)
        ? layer.some((entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default')
        : false;
    });

    const dataLayer = await getDataLayer<unknown>(page);
    const consentDefault = dataLayer.find(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    ) as unknown[];

    expect(consentDefault).toBeDefined();
    // Should have EEA default preset with denied storage
    expect(consentDefault[2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied'
    });
  });

  test('navigates between pages with Nuxt Router', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Verify home page
    await expect(page.locator('h1, h2, main')).toBeVisible();

    // Navigate to Products (if link exists)
    const productsLink = page.locator('a[href="/products"]').or(page.locator('text=Products'));
    if ((await productsLink.count()) > 0) {
      await productsLink.first().click();
      await expect(page).toHaveURL(/\/products/);
    }

    // Navigate to About (if link exists)
    const aboutLink = page.locator('a[href="/about"]').or(page.locator('text=About'));
    if ((await aboutLink.count()) > 0) {
      await aboutLink.first().click();
      await expect(page).toHaveURL(/\/about/);
    }
  });

  test('handles SSR hydration correctly', async ({ page }) => {
    // Navigate to page and check GTM initializes after hydration
    const response = await page.goto(server.url, { waitUntil: 'domcontentloaded' });

    // Check SSR response
    expect(response?.status()).toBe(200);

    // Wait for client-side hydration
    await page.waitForFunction(() => {
      return document.body.classList.contains('nuxt-loaded') ||
             (window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer !== undefined;
    }, { timeout: 10000 });

    // After hydration, GTM should be initialized
    const hasGtm = await page.evaluate(() => {
      return Array.isArray((window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer);
    });

    expect(hasGtm).toBe(true);
  });

  test('maintains data layer through client-side navigation', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Wait for data layer initialization
    await page.waitForFunction(() => {
      const layer = (window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer;
      return Array.isArray(layer) && layer.length > 0;
    });

    const initialData = await getDataLayer<unknown>(page);
    const initialStartEvent = initialData.find(
      (e) => typeof e === 'object' && e !== null && (e as { event?: string }).event === 'gtm.js'
    );

    // Navigate to another page
    const anyLink = page.locator('a[href^="/"]').first();
    if ((await anyLink.count()) > 0) {
      await anyLink.click();
      await page.waitForLoadState('networkidle');

      // Data layer should still contain the original start event
      const finalData = await getDataLayer<unknown>(page);
      const finalStartEvent = finalData.find(
        (e) => typeof e === 'object' && e !== null && (e as { event?: string }).event === 'gtm.js'
      );

      expect(finalStartEvent).toEqual(initialStartEvent);
    }
  });

  test('handles consent banner interaction', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Look for consent banner
    const banner = page.locator('[data-testid="cookie-banner"], .cookie-banner, [role="dialog"]:has-text("cookie")');

    if ((await banner.count()) > 0) {
      await expect(banner).toBeVisible();

      // Try to find and click accept button
      const acceptButton = banner.locator('button:has-text("Accept"), button:has-text("Allow"), button:has-text("OK")');

      if ((await acceptButton.count()) > 0) {
        await acceptButton.click();

        // Wait for consent update
        await page.waitForFunction(
          () => {
            const layer = (window as unknown as { nuxtAppDataLayer?: unknown[] }).nuxtAppDataLayer;
            return Array.isArray(layer)
              ? layer.some((entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update')
              : false;
          },
          { timeout: 5000 }
        );

        const dataLayer = await getDataLayer<unknown>(page);
        const consentUpdate = dataLayer.find(
          (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
        );

        expect(consentUpdate).toBeDefined();
      }
    }
  });

  test('GTM script has correct attributes', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    const script = page.locator('script[data-gtm-container-id="GTM-NUXTAPP"]');
    await expect(script).toHaveCount(1);

    // Check script attributes
    const src = await script.getAttribute('src');
    expect(src).toContain('googletagmanager.com/gtm.js');
    expect(src).toContain('id=GTM-NUXTAPP');
    expect(src).toContain('l=nuxtAppDataLayer');

    // Script should be async by default
    const isAsync = await script.evaluate((el) => (el as HTMLScriptElement).async);
    expect(isAsync).toBe(true);
  });
});
