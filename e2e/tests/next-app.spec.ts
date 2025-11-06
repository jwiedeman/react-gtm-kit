import { expect, test, type Page } from '@playwright/test';

import { startNextAppServer, type NextAppServer } from '../apps/next-app/server';

const getDataLayer = async <T>(page: Page): Promise<T[]> => {
  return page.evaluate(() => {
    const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
    if (Array.isArray(layer)) {
      return layer as T[];
    }

    return [] as T[];
  });
};

test.describe('Next.js App Router example', () => {
  let server: NextAppServer;

  test.beforeAll(async () => {
    server = await startNextAppServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('renders GTM assets and tracks navigations with consent updates', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    const scriptLocator = page.locator('head script[data-gtm-container-id="GTM-NEXTAPP"]');
    await expect(scriptLocator).toHaveCount(1);
    await expect(scriptLocator).toHaveAttribute('nonce', /.+/);

    const noscriptFrame = page.locator('body > noscript iframe');
    await expect(noscriptFrame).toHaveAttribute(
      'src',
      'https://www.googletagmanager.com/ns.html?id=GTM-NEXTAPP&l=nextAppDataLayer'
    );

    await page.waitForFunction(() => {
      const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
      return Array.isArray(layer)
        ? layer.some((entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default')
        : false;
    });

    const initialCookies = await page.context().cookies();
    const consentCookie = initialCookies.find((cookie) => cookie.name === 'next-app-consent');
    expect(consentCookie).toBeDefined();
    expect(consentCookie?.value).toContain('"analytics_storage":"denied"');

    await page.waitForFunction(() => {
      const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
      return Array.isArray(layer)
        ? layer.some(
            (entry) =>
              typeof entry === 'object' &&
              entry !== null &&
              'event' in entry &&
              (entry as { event?: string; page_path?: string }).event === 'page_view' &&
              (entry as { event?: string; page_path?: string }).page_path === '/'
          )
        : false;
    });

    const pageViewEvents = await getDataLayer<{ event?: string; page_path?: string }>(page);
    expect(pageViewEvents.some((entry) => entry.event === 'page_view' && entry.page_path === '/')).toBe(true);

    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/pricing$/);

    await page.waitForFunction(() => {
      const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
      return Array.isArray(layer)
        ? layer.some(
            (entry) =>
              typeof entry === 'object' &&
              entry !== null &&
              (entry as { event?: string }).event === 'page_view' &&
              (entry as { page_path?: string }).page_path?.includes('/pricing')
          )
        : false;
    });

    const pricingEvents = await getDataLayer<{ event?: string; page_path?: string }>(page);
    expect(pricingEvents.some((entry) => entry.event === 'page_view' && entry.page_path?.includes('/pricing'))).toBe(
      true
    );

    await page.getByRole('link', { name: 'Analytics Suite' }).click();
    await expect(page).toHaveURL(/\/products\/analytics-suite$/);

    await page.waitForFunction(() => {
      const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
      return Array.isArray(layer)
        ? layer.some(
            (entry) =>
              typeof entry === 'object' &&
              entry !== null &&
              (entry as { event?: string }).event === 'page_view' &&
              (entry as { page_path?: string }).page_path?.includes('/products/analytics-suite')
          )
        : false;
    });

    const productEvents = await getDataLayer<{ event?: string; page_path?: string }>(page);
    expect(
      productEvents.some(
        (entry) => entry.event === 'page_view' && entry.page_path?.includes('/products/analytics-suite')
      )
    ).toBe(true);

    const banner = page.getByRole('dialog', { name: 'Consent preferences' });
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: 'Accept analytics' }).click();

    await page.waitForFunction(() => {
      const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
      if (!Array.isArray(layer)) {
        return false;
      }

      return layer.some(
        (entry) =>
          Array.isArray(entry) &&
          entry[0] === 'consent' &&
          entry[1] === 'update' &&
          (entry[2] as Record<string, string>).analytics_storage === 'granted'
      );
    });

    const grantedCookies = await page.context().cookies();
    const grantedConsent = grantedCookies.find((cookie) => cookie.name === 'next-app-consent');
    expect(grantedConsent?.value).toContain('"analytics_storage":"granted"');

    await page.getByRole('button', { name: 'Manage consent' }).click();
    await page.getByRole('button', { name: 'Keep essential only' }).click();

    await page.waitForFunction(() => {
      const layer = (window as unknown as { nextAppDataLayer?: unknown[] }).nextAppDataLayer;
      if (!Array.isArray(layer)) {
        return false;
      }

      return layer.filter(Array.isArray).some((entry) => {
        if (!Array.isArray(entry) || entry[1] !== 'update') {
          return false;
        }

        const state = entry[2] as Record<string, string>;
        return state.analytics_storage === 'denied' && state.ad_storage === 'denied';
      });
    });

    const resetCookies = await page.context().cookies();
    const resetConsent = resetCookies.find((cookie) => cookie.name === 'next-app-consent');
    expect(resetConsent?.value).toContain('"analytics_storage":"denied"');
  });
});
