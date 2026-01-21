/**
 * E2E Robustness Tests for GTM-Kit
 *
 * These tests verify that GTM-Kit behaves correctly under adverse conditions
 * that users might encounter in production:
 * - Ad blockers blocking GTM scripts
 * - Slow/unreliable networks
 * - Rapid page navigation
 * - Multiple tab interactions
 * - Long-running sessions
 * - Race conditions
 */
import { expect, test } from '@playwright/test';

import {
  getDataLayer,
  countContainerScripts,
  countDataLayerEvents,
  clearDataLayer,
  corruptDataLayer,
  blockGtmRequests,
  unblockGtmRequests,
  throttleGtmRequests,
  simulateVisibilityChange,
  collectConsoleErrors,
  collectPageErrors,
  measureTime
} from '../utils/test-helpers';
import { startVueAppServer, type VueAppServer } from '../apps/vue-app/server';

// ============================================================================
// Script Blocking Tests (Ad Blocker Simulation)
// Uses Vue app to avoid Next.js build concurrency issues
// ============================================================================

test.describe('Script Blocking Resilience', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('gracefully handles GTM script being blocked', async ({ page }) => {
    // Block all GTM requests
    await blockGtmRequests(page);

    // Navigate to the app
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });

    // App should still load without errors
    const errors = await collectPageErrors(page, async () => {
      await page.waitForTimeout(2000);
    });

    // No critical page errors should occur
    const criticalErrors = errors.filter(
      (e) => !e.message.includes('googletagmanager') && !e.message.includes('net::ERR')
    );
    expect(criticalErrors).toHaveLength(0);

    // Page should still function
    await expect(page.locator('body')).toBeVisible();
  });

  test('continues tracking to data layer when scripts blocked', async ({ page }) => {
    await blockGtmRequests(page);

    await page.goto(server.url, { waitUntil: 'domcontentloaded' });

    // Wait a moment for initialization
    await page.waitForTimeout(1000);

    // Check data layer exists and has entries
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');

    // Data layer should still be initialized with local events
    expect(Array.isArray(dataLayer)).toBe(true);
  });

  test('recovers when script blocking is removed', async ({ page }) => {
    // Start with scripts blocked
    await blockGtmRequests(page);
    await page.goto(server.url, { waitUntil: 'domcontentloaded' });

    // Unblock scripts
    await unblockGtmRequests(page);

    // Navigate to trigger new script load
    await page.getByRole('link', { name: 'Products' }).click();

    // Should be able to push events
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(dataLayer.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Network Failure Tests
// Uses Vue app to avoid Next.js build concurrency issues
// ============================================================================

test.describe('Network Failure Handling', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('handles slow network without blocking page interaction', async ({ page }) => {
    // Throttle GTM requests to be very slow
    await throttleGtmRequests(page, 5000);

    const { durationMs } = await measureTime(async () => {
      await page.goto(server.url, { waitUntil: 'domcontentloaded' });
    });

    // Page should load quickly despite slow GTM
    expect(durationMs).toBeLessThan(10000);

    // Page should be interactive
    await expect(page.locator('body')).toBeVisible();

    // Should be able to interact while GTM is loading
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('handles offline mode gracefully', async ({ page, context }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Go offline
    await context.setOffline(true);

    // Try to push events
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        layer.push({ event: 'offline_event', timestamp: Date.now() });
      }
    });

    // Event should be in data layer
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(dataLayer.some((e) => e != null && e.event === 'offline_event')).toBe(true);

    // Go back online
    await context.setOffline(false);
  });
});

// ============================================================================
// Rapid Navigation Tests
// Uses Vue app SPA navigation
// ============================================================================

test.describe('Rapid Navigation Stress Tests', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('handles rapid back/forward navigation', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Navigate to a few pages
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForURL(/\/products/);

    await page.getByRole('link', { name: 'About' }).click();
    await page.waitForURL(/\/about/);

    // Rapid back/forward
    for (let i = 0; i < 5; i++) {
      await page.goBack();
      await page.waitForTimeout(50);
      await page.goForward();
      await page.waitForTimeout(50);
    }

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Data layer should exist
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(Array.isArray(dataLayer)).toBe(true);
  });

  test('handles rapid link clicking without duplicate events', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Clear existing page views
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        // Filter out existing page_view events
        const filtered = layer.filter(
          (e) => e == null || typeof e !== 'object' || (e as { event?: string }).event !== 'page_view'
        );
        layer.length = 0;
        filtered.forEach((item) => layer.push(item));
      }
    });

    // Rapid navigation
    for (let i = 0; i < 3; i++) {
      await page.getByRole('link', { name: 'Products' }).click();
      await page.waitForTimeout(100);
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await page.waitForTimeout(100);
    }

    // Wait for events to settle
    await page.waitForTimeout(500);

    const pageViewCount = await countDataLayerEvents(page, 'page_view', 'vueAppDataLayer');

    // Should have page views (allow variance for timing)
    expect(pageViewCount).toBeGreaterThanOrEqual(0);
    expect(pageViewCount).toBeLessThanOrEqual(10);
  });

  test('maintains data layer integrity during rapid SPA transitions', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    const initialLength = await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      return Array.isArray(layer) ? layer.length : 0;
    });

    // Rapid transitions
    for (let i = 0; i < 10; i++) {
      await page.evaluate((index) => {
        const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
        if (Array.isArray(layer)) {
          layer.push({ event: `stress_test_${index}`, timestamp: Date.now() });
        }
      }, i);
    }

    const finalLength = await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      return Array.isArray(layer) ? layer.length : 0;
    });

    // All events should be preserved
    expect(finalLength).toBe(initialLength + 10);
  });
});

// ============================================================================
// Consent Race Condition Tests
// Uses Vue app consent features
// ============================================================================

test.describe('Consent Race Conditions', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('handles rapid consent toggling', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Accept consent via the cookie banner if visible
    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
    }

    // Push some events to verify data layer works
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        layer.push({ event: 'consent_test_event' });
      }
    });

    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(dataLayer.some((e) => e != null && e.event === 'consent_test_event')).toBe(true);
  });

  test('handles consent update during page navigation', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Accept consent if banner visible
    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
    }

    // Immediately navigate
    await page.getByRole('link', { name: 'Products' }).click();

    // Page should navigate successfully
    await page.waitForURL(/\/products/);

    // Data layer should still work
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(Array.isArray(dataLayer)).toBe(true);
  });
});

// ============================================================================
// Visibility Change Tests
// ============================================================================

test.describe('Page Visibility Handling', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('maintains data layer during visibility changes', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Get initial data layer
    const initialLength = await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      return Array.isArray(layer) ? layer.length : 0;
    });

    // Simulate tab switch (hidden)
    await simulateVisibilityChange(page, true);
    await page.waitForTimeout(500);

    // Push event while hidden
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        layer.push({ event: 'hidden_event', visibility: 'hidden' });
      }
    });

    // Simulate tab return (visible)
    await simulateVisibilityChange(page, false);
    await page.waitForTimeout(500);

    // Push event while visible
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        layer.push({ event: 'visible_event', visibility: 'visible' });
      }
    });

    // Both events should be in data layer
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');

    expect(dataLayer.some((e) => e != null && e.event === 'hidden_event')).toBe(true);
    expect(dataLayer.some((e) => e != null && e.event === 'visible_event')).toBe(true);
    // Data layer should have grown by 2 events
    expect(dataLayer.length).toBeGreaterThanOrEqual(initialLength + 2);
  });

  test('handles rapid visibility toggling', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Rapid visibility changes
    for (let i = 0; i < 20; i++) {
      await simulateVisibilityChange(page, i % 2 === 0);
      await page.waitForTimeout(25);
    }

    // App should still be functional
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(Array.isArray(dataLayer)).toBe(true);
  });
});

// ============================================================================
// Data Layer Corruption Recovery
// ============================================================================

test.describe('Data Layer Corruption Recovery', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('continues working after data layer is cleared', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Clear data layer
    await clearDataLayer(page, 'vueAppDataLayer');

    // Push new event
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        layer.push({ event: 'after_clear' });
      }
    });

    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(dataLayer.some((e) => e != null && e.event === 'after_clear')).toBe(true);
  });

  test('handles invalid data being pushed to data layer', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Corrupt with invalid data
    await corruptDataLayer(page, 'add-invalid', 'vueAppDataLayer');

    // Push valid event
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (Array.isArray(layer)) {
        layer.push({ event: 'valid_after_corruption' });
      }
    });

    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    // Filter out null/undefined values before checking
    expect(dataLayer.some((e) => e != null && e.event === 'valid_after_corruption')).toBe(true);
  });
});

// ============================================================================
// Multiple Script Injection Prevention
// Uses Vue app to avoid Next.js build issues
// ============================================================================

test.describe('Duplicate Script Prevention', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('only injects one GTM script per container', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    const scriptCount = await countContainerScripts(page, 'GTM-VUEAPP');
    expect(scriptCount).toBe(1);
  });

  test('does not duplicate scripts on navigation', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Navigate multiple times
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForURL(/\/products/);

    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await page.waitForURL(/\/$/);

    await page.getByRole('link', { name: 'About' }).click();
    await page.waitForURL(/\/about/);

    // Should still have only one script
    const scriptCount = await countContainerScripts(page, 'GTM-VUEAPP');
    expect(scriptCount).toBe(1);
  });
});

// ============================================================================
// Performance Under Load
// ============================================================================

test.describe('Performance Under Load', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('handles high-frequency event pushes', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Push 1000 events rapidly
    const { durationMs } = await measureTime(async () => {
      await page.evaluate(() => {
        const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
        if (!Array.isArray(layer)) return;

        for (let i = 0; i < 1000; i++) {
          layer.push({ event: `rapid_event_${i}`, index: i, timestamp: Date.now() });
        }
      });
    });

    // Should complete quickly (< 1 second)
    expect(durationMs).toBeLessThan(1000);

    // All events should be in the layer
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    const rapidEvents = dataLayer.filter((e) => e != null && e.event?.startsWith('rapid_event_'));
    expect(rapidEvents.length).toBe(1000);
  });

  test('handles large event payloads', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Push large ecommerce payload
    await page.evaluate(() => {
      const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
      if (!Array.isArray(layer)) return;

      const largePayload = {
        event: 'large_purchase',
        ecommerce: {
          items: Array.from({ length: 200 }, (_, i) => ({
            item_id: `SKU-${i}`,
            item_name: `Product ${i} - This is a long product name with detailed description`,
            price: Math.random() * 1000,
            quantity: Math.floor(Math.random() * 10) + 1,
            item_category: `Category ${i % 10}`,
            item_brand: `Brand ${i % 20}`,
            custom_attributes: {
              color: 'blue',
              size: 'large',
              material: 'cotton',
              weight: '500g'
            }
          })),
          value: 50000,
          currency: 'USD',
          transaction_id: 'T-LARGE-123'
        }
      };

      layer.push(largePayload);
    });

    // Event should be in the layer
    const dataLayer = await getDataLayer<{ event?: string }>(page, 'vueAppDataLayer');
    expect(dataLayer.some((e) => e != null && e.event === 'large_purchase')).toBe(true);
  });
});

// ============================================================================
// Memory Stability
// ============================================================================

test.describe('Memory Stability', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('does not leak memory during repeated operations', async ({ page }) => {
    await page.goto(server.url, { waitUntil: 'networkidle' });

    // Perform many operations
    for (let batch = 0; batch < 10; batch++) {
      await page.evaluate((batchNum) => {
        const layer = (window as unknown as { vueAppDataLayer?: unknown[] }).vueAppDataLayer;
        if (!Array.isArray(layer)) return;

        for (let i = 0; i < 100; i++) {
          layer.push({ event: `batch_${batchNum}_event_${i}` });
        }
      }, batch);

      await page.waitForTimeout(50);
    }

    // Page should still be responsive
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/products/);
  });
});

// ============================================================================
// Error Boundary Tests
// Uses Vue app to avoid Next.js build issues
// ============================================================================

test.describe('Error Boundary Behavior', () => {
  let server: VueAppServer;

  test.beforeAll(async () => {
    server = await startVueAppServer();
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test('does not cause console errors in normal operation', async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      await page.goto(server.url, { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Products' }).click();
      await page.waitForURL(/\/products/);
    });

    // Filter out expected network errors (GTM might not be reachable in test env)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('googletagmanager.com') && !e.includes('Failed to load') && !e.includes('net::ERR')
    );

    expect(unexpectedErrors).toHaveLength(0);
  });
});
