import { expect, test } from '@playwright/test';

import { startSsrServer, type SsrServer } from '../apps/ssr-server/server';

test.describe('SSR CSP + noscript integration', () => {
  let server: SsrServer;

  test.beforeAll(async () => {
    server = await startSsrServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('injects container script with nonce and renders noscript fallback', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    const containerScripts = page.locator('script[data-gtm-container-id="GTM-TEST"]');
    await expect(containerScripts).toHaveCount(1);

    await expect(containerScripts).toHaveAttribute('nonce', 'test-nonce-123');
    await expect(containerScripts).toHaveAttribute(
      'src',
      /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-TEST&l=dataLayer/
    );

    const noscriptFrame = page.locator('noscript iframe');
    await expect(noscriptFrame).toHaveAttribute(
      'src',
      'https://www.googletagmanager.com/ns.html?id=GTM-TEST&l=dataLayer'
    );
  });
});
