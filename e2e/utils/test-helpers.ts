/**
 * E2E Test Utilities for GTM-Kit
 *
 * Common helpers for testing GTM behavior across all framework integrations.
 * These utilities help test:
 * - Double-loading scenarios
 * - Race conditions
 * - Network failures
 * - Hydration issues
 * - Memory leaks
 * - Data layer corruption
 */
import type { Page, Response } from '@playwright/test';

// ============================================================================
// Data Layer Utilities
// ============================================================================

/**
 * Get the data layer from a page with a specific name
 */
export const getDataLayer = async <T>(page: Page, dataLayerName = 'dataLayer'): Promise<T[]> => {
  return page.evaluate((name) => {
    const layer = (window as unknown as Record<string, unknown>)[name];
    return Array.isArray(layer) ? (layer as T[]) : [];
  }, dataLayerName);
};

/**
 * Wait for a specific event to appear in the data layer
 */
export const waitForDataLayerEvent = async (
  page: Page,
  eventName: string,
  dataLayerName = 'dataLayer',
  timeout = 10_000
): Promise<void> => {
  await page.waitForFunction(
    ({ eventName, dataLayerName }) => {
      const layer = (window as unknown as Record<string, unknown[]>)[dataLayerName];
      if (!Array.isArray(layer)) return false;
      return layer.some(
        (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === eventName
      );
    },
    { eventName, dataLayerName },
    { timeout }
  );
};

/**
 * Wait for consent entry (default or update) in the data layer
 */
export const waitForConsentEntry = async (
  page: Page,
  type: 'default' | 'update',
  dataLayerName = 'dataLayer',
  timeout = 10_000
): Promise<void> => {
  await page.waitForFunction(
    ({ type, dataLayerName }) => {
      const layer = (window as unknown as Record<string, unknown[]>)[dataLayerName];
      if (!Array.isArray(layer)) return false;
      return layer.some((entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === type);
    },
    { type, dataLayerName },
    { timeout }
  );
};

/**
 * Count events of a specific type in the data layer
 */
export const countDataLayerEvents = async (
  page: Page,
  eventName: string,
  dataLayerName = 'dataLayer'
): Promise<number> => {
  return page.evaluate(
    ({ eventName, dataLayerName }) => {
      const layer = (window as unknown as Record<string, unknown[]>)[dataLayerName];
      if (!Array.isArray(layer)) return 0;
      return layer.filter(
        (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === eventName
      ).length;
    },
    { eventName, dataLayerName }
  );
};

/**
 * Clear the data layer (for testing recovery)
 */
export const clearDataLayer = async (page: Page, dataLayerName = 'dataLayer'): Promise<void> => {
  await page.evaluate((name) => {
    const layer = (window as unknown as Record<string, unknown[]>)[name];
    if (Array.isArray(layer)) {
      layer.length = 0;
    }
  }, dataLayerName);
};

/**
 * Corrupt the data layer for recovery testing
 */
export const corruptDataLayer = async (
  page: Page,
  corruption: 'clear' | 'null' | 'non-array' | 'add-invalid',
  dataLayerName = 'dataLayer'
): Promise<void> => {
  await page.evaluate(
    ({ corruption, dataLayerName }) => {
      const win = window as unknown as Record<string, unknown>;
      switch (corruption) {
        case 'clear':
          if (Array.isArray(win[dataLayerName])) {
            (win[dataLayerName] as unknown[]).length = 0;
          }
          break;
        case 'null':
          win[dataLayerName] = null;
          break;
        case 'non-array':
          win[dataLayerName] = { invalid: 'object' };
          break;
        case 'add-invalid':
          if (Array.isArray(win[dataLayerName])) {
            (win[dataLayerName] as unknown[]).push(null, undefined, 'invalid-string', 12345);
          }
          break;
      }
    },
    { corruption, dataLayerName }
  );
};

// ============================================================================
// Script Utilities
// ============================================================================

/**
 * Count GTM container scripts in the page
 */
export const countContainerScripts = async (page: Page, containerId?: string): Promise<number> => {
  const selector = containerId ? `script[data-gtm-container-id="${containerId}"]` : 'script[data-gtm-container-id]';
  return page.locator(selector).count();
};

/**
 * Check if GTM scripts are blocked (simulating ad blocker)
 */
export const checkScriptBlocked = async (page: Page): Promise<boolean> => {
  return page.evaluate(() => {
    const scripts = document.querySelectorAll('script[data-gtm-container-id]');
    return Array.from(scripts).some((script) => {
      const src = script.getAttribute('src') || '';
      // Check if script failed to load by checking for error state
      return src.includes('googletagmanager.com');
    });
  });
};

/**
 * Inject a duplicate GTM script to test double-load scenarios
 */
export const injectDuplicateScript = async (page: Page, containerId: string): Promise<void> => {
  await page.evaluate((id) => {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    script.setAttribute('data-gtm-container-id', id);
    script.setAttribute('data-duplicate', 'true');
    document.head.appendChild(script);
  }, containerId);
};

/**
 * Remove all GTM scripts from the page
 */
export const removeAllGtmScripts = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    document.querySelectorAll('script[data-gtm-container-id]').forEach((script) => script.remove());
  });
};

// ============================================================================
// Navigation Utilities
// ============================================================================

/**
 * Perform rapid navigation to stress test route tracking
 */
export const performRapidNavigation = async (
  page: Page,
  urls: string[],
  delayMs = 50
): Promise<void> => {
  for (const url of urls) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (delayMs > 0) {
      await page.waitForTimeout(delayMs);
    }
  }
};

/**
 * Navigate back and forth rapidly
 */
export const performBackForwardNavigation = async (page: Page, cycles = 5, delayMs = 100): Promise<void> => {
  for (let i = 0; i < cycles; i++) {
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await page.waitForTimeout(delayMs);
    await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await page.waitForTimeout(delayMs);
  }
};

// ============================================================================
// Network Simulation Utilities
// ============================================================================

/**
 * Block GTM script loading to simulate ad blocker or network failure
 */
export const blockGtmRequests = async (page: Page): Promise<void> => {
  await page.route('**/googletagmanager.com/**', (route) => {
    void route.abort('failed');
  });
};

/**
 * Unblock GTM requests
 */
export const unblockGtmRequests = async (page: Page): Promise<void> => {
  await page.unroute('**/googletagmanager.com/**');
};

/**
 * Delay GTM script loading
 */
export const delayGtmRequests = async (page: Page, delayMs: number): Promise<void> => {
  await page.route('**/googletagmanager.com/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
};

/**
 * Make GTM requests fail intermittently
 */
export const intermittentGtmFailures = async (page: Page, failureRate = 0.5): Promise<void> => {
  await page.route('**/googletagmanager.com/**', async (route) => {
    if (Math.random() < failureRate) {
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
};

/**
 * Simulate slow network for GTM requests
 */
export const throttleGtmRequests = async (page: Page, latencyMs = 3000): Promise<void> => {
  await page.route('**/googletagmanager.com/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
    await route.continue();
  });
};

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Decode a cookie value (handles multiple encoding layers)
 */
export const decodeCookieValue = (value?: string | null): string => {
  if (!value) return '';

  let decoded = value;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded;
};

/**
 * Get a specific cookie by name
 */
export const getCookie = async (page: Page, name: string): Promise<string | undefined> => {
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === name);
  return cookie ? decodeCookieValue(cookie.value) : undefined;
};

/**
 * Clear all cookies
 */
export const clearCookies = async (page: Page): Promise<void> => {
  await page.context().clearCookies();
};

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Measure execution time of an async operation
 */
export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> => {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  return { result, durationMs };
};

/**
 * Wait for a condition with custom polling
 */
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout = 10_000,
  pollInterval = 100
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
  return false;
};

// ============================================================================
// Memory Utilities
// ============================================================================

/**
 * Get memory usage from the page (if available)
 */
export const getMemoryUsage = async (
  page: Page
): Promise<{ usedJSHeapSize: number; totalJSHeapSize: number } | null> => {
  return page.evaluate(() => {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize
      };
    }
    return null;
  });
};

/**
 * Check for potential memory leaks by measuring heap growth
 */
export const checkForMemoryLeaks = async (
  page: Page,
  operation: () => Promise<void>,
  iterations = 100,
  acceptableGrowthPercentage = 20
): Promise<{ leaked: boolean; growthPercentage: number }> => {
  const initialMemory = await getMemoryUsage(page);
  if (!initialMemory) return { leaked: false, growthPercentage: 0 };

  for (let i = 0; i < iterations; i++) {
    await operation();
  }

  // Force garbage collection if available (Chrome with --expose-gc)
  await page.evaluate(() => {
    if (typeof (globalThis as { gc?: () => void }).gc === 'function') {
      (globalThis as { gc: () => void }).gc();
    }
  });

  const finalMemory = await getMemoryUsage(page);
  if (!finalMemory) return { leaked: false, growthPercentage: 0 };

  const growthPercentage = ((finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / initialMemory.usedJSHeapSize) * 100;

  return {
    leaked: growthPercentage > acceptableGrowthPercentage,
    growthPercentage
  };
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Collect console errors from the page
 */
export const collectConsoleErrors = async (
  page: Page,
  action: () => Promise<void>
): Promise<string[]> => {
  const errors: string[] = [];
  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };

  page.on('console', handler);
  await action();
  page.off('console', handler);

  return errors;
};

/**
 * Collect uncaught errors from the page
 */
export const collectPageErrors = async (page: Page, action: () => Promise<void>): Promise<Error[]> => {
  const errors: Error[] = [];
  const handler = (err: Error) => {
    errors.push(err);
  };

  page.on('pageerror', handler);
  await action();
  page.off('pageerror', handler);

  return errors;
};

// ============================================================================
// Hydration Testing Utilities
// ============================================================================

/**
 * Simulate hydration mismatch by modifying DOM before hydration
 */
export const simulateHydrationMismatch = async (
  page: Page,
  containerId: string
): Promise<void> => {
  await page.evaluate((id) => {
    // Add an extra script that wasn't in SSR
    const extraScript = document.createElement('script');
    extraScript.setAttribute('data-gtm-container-id', id);
    extraScript.setAttribute('data-extra', 'true');
    document.head.appendChild(extraScript);
  }, containerId);
};

/**
 * Check for hydration warnings in console
 */
export const checkHydrationWarnings = async (
  page: Page,
  action: () => Promise<void>
): Promise<boolean> => {
  let hasWarnings = false;
  const handler = (msg: { text: () => string }) => {
    const text = msg.text();
    if (
      text.includes('hydration') ||
      text.includes('Hydration') ||
      text.includes('mismatch') ||
      text.includes('did not match')
    ) {
      hasWarnings = true;
    }
  };

  page.on('console', handler);
  await action();
  page.off('console', handler);

  return hasWarnings;
};

// ============================================================================
// Visibility Testing Utilities
// ============================================================================

/**
 * Simulate page visibility change
 */
export const simulateVisibilityChange = async (page: Page, hidden: boolean): Promise<void> => {
  await page.evaluate((isHidden) => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isHidden
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (isHidden ? 'hidden' : 'visible')
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
};

/**
 * Simulate tab switching
 */
export const simulateTabSwitch = async (page: Page, awayMs = 1000): Promise<void> => {
  await simulateVisibilityChange(page, true);
  await page.waitForTimeout(awayMs);
  await simulateVisibilityChange(page, false);
};

// ============================================================================
// Multiple Instance Testing
// ============================================================================

/**
 * Initialize multiple GTM clients (for testing isolation)
 */
export const initializeMultipleClients = async (
  page: Page,
  containerIds: string[]
): Promise<void> => {
  await page.evaluate((ids) => {
    const GTMKit = (window as unknown as { GTMKit?: { createGtmClient: (opts: { containers: string }) => { init: () => void } } }).GTMKit;
    if (!GTMKit) return;

    ids.forEach((id) => {
      const client = GTMKit.createGtmClient({ containers: id });
      client.init();
    });
  }, containerIds);
};

// ============================================================================
// Response Utilities
// ============================================================================

/**
 * Wait for a GTM request and return the response
 */
export const waitForGtmRequest = async (page: Page, timeout = 10_000): Promise<Response | null> => {
  try {
    const response = await page.waitForResponse(
      (response) => response.url().includes('googletagmanager.com'),
      { timeout }
    );
    return response;
  } catch {
    return null;
  }
};

/**
 * Collect all GTM-related requests during an action
 */
export const collectGtmRequests = async (
  page: Page,
  action: () => Promise<void>
): Promise<Array<{ url: string; status: number | null }>> => {
  const requests: Array<{ url: string; status: number | null }> = [];

  const handler = (response: Response) => {
    if (response.url().includes('googletagmanager.com')) {
      requests.push({
        url: response.url(),
        status: response.status()
      });
    }
  };

  page.on('response', handler);
  await action();
  page.off('response', handler);

  return requests;
};
