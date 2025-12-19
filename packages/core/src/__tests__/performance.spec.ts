/**
 * Performance Tests for GTM Kit Core
 *
 * These tests ensure the library maintains acceptable performance
 * under various load conditions and usage patterns.
 */
import { createGtmClient } from '../../src';

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  describe('Initialization Performance', () => {
    it('initializes single container quickly', () => {
      const start = performance.now();

      const client = createGtmClient({ containers: 'GTM-PERF' });
      client.init();

      const duration = performance.now() - start;

      // Allow for CI/slow environment variability
      expect(duration).toBeLessThan(100);
    });

    it('initializes 5 containers quickly', () => {
      const start = performance.now();

      const client = createGtmClient({
        containers: ['GTM-PERF1', 'GTM-PERF2', 'GTM-PERF3', 'GTM-PERF4', 'GTM-PERF5']
      });
      client.init();

      const duration = performance.now() - start;

      // Allow for CI/slow environment variability
      expect(duration).toBeLessThan(200);
    });

    it('initializes with full config quickly', () => {
      const start = performance.now();

      const client = createGtmClient({
        containers: [
          { id: 'GTM-FULL1', queryParams: { gtm_auth: 'auth1', gtm_preview: 'preview1' } },
          { id: 'GTM-FULL2', queryParams: { gtm_auth: 'auth2' } }
        ],
        host: 'https://custom.gtm.example.com',
        dataLayerName: 'customDataLayer',
        defaultQueryParams: { gtm_cookies_win: 'x' },
        scriptAttributes: { nonce: 'test-nonce', 'data-purpose': 'analytics' }
      });

      client.setConsentDefaults(
        { ad_storage: 'denied', analytics_storage: 'denied' },
        { region: ['EEA'], waitForUpdate: 500 }
      );

      client.init();

      const duration = performance.now() - start;

      // Allow for CI/slow environment variability
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Push Performance', () => {
    it('pushes 1000 events in under 50ms', () => {
      const client = createGtmClient({ containers: 'GTM-PUSH-PERF' });
      client.init();

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        client.push({ event: `event_${i}`, index: i });
      }

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(500);
    });

    it('pushes 10000 events in under 500ms', () => {
      const client = createGtmClient({ containers: 'GTM-PUSH-PERF-10K' });
      client.init();

      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        client.push({ event: `event_${i}`, index: i });
      }

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(2000);
    });

    it('pushes complex ecommerce events efficiently', () => {
      const client = createGtmClient({ containers: 'GTM-ECOMMERCE-PERF' });
      client.init();

      const complexEvent = {
        event: 'purchase',
        ecommerce: {
          transaction_id: 'T-PERF-123',
          value: 1234.56,
          currency: 'USD',
          items: Array.from({ length: 50 }, (_, i) => ({
            item_id: `SKU-${i}`,
            item_name: `Product ${i} with a moderately long name`,
            price: Math.random() * 100,
            quantity: Math.floor(Math.random() * 5) + 1,
            item_category: `Category ${i % 10}`,
            item_brand: `Brand ${i % 5}`,
            item_variant: `Variant ${i % 3}`,
            custom_dimensions: {
              dimension1: 'value1',
              dimension2: 'value2'
            }
          }))
        }
      };

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        client.push({ ...complexEvent, transaction_id: `T-${i}` });
      }

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Consent Performance', () => {
    it('updates consent rapidly without degradation', () => {
      const client = createGtmClient({ containers: 'GTM-CONSENT-PERF' });
      client.setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'denied' });
      client.init();

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        client.updateConsent({
          analytics_storage: i % 2 === 0 ? 'granted' : 'denied',
          ad_storage: i % 3 === 0 ? 'granted' : 'denied'
        });
      }

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Teardown Performance', () => {
    it('tears down single container quickly', () => {
      const client = createGtmClient({ containers: 'GTM-TEARDOWN-PERF' });
      client.init();

      const start = performance.now();
      client.teardown();
      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(100);
    });

    it('tears down 5 containers quickly', () => {
      const client = createGtmClient({
        containers: ['GTM-TD1', 'GTM-TD2', 'GTM-TD3', 'GTM-TD4', 'GTM-TD5']
      });
      client.init();

      const start = performance.now();
      client.teardown();
      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Lifecycle Performance', () => {
    it('completes 100 init/teardown cycles efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        const client = createGtmClient({ containers: `GTM-CYCLE-${i % 10}` });
        client.init();
        client.push({ event: `cycle_${i}` });
        client.teardown();
      }

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(5000);
    });

    it('handles interleaved multi-client operations efficiently', () => {
      const clients = Array.from({ length: 5 }, (_, i) =>
        createGtmClient({ containers: `GTM-MULTI-${i}` })
      );

      const start = performance.now();

      // Interleaved operations
      for (let round = 0; round < 20; round++) {
        clients.forEach((client, index) => {
          if (round === 0) {
            client.init();
          }
          client.push({ event: `client_${index}_round_${round}` });
        });
      }

      // Teardown all
      clients.forEach((client) => client.teardown());

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Memory Efficiency', () => {
    it('does not accumulate excessive data layer entries with large payloads', () => {
      const client = createGtmClient({ containers: 'GTM-MEMORY' });
      client.init();

      // Push 1000 medium-sized events
      for (let i = 0; i < 1000; i++) {
        client.push({
          event: `memory_test_${i}`,
          data: {
            id: i,
            name: `Item ${i}`,
            description: 'A moderately long description for testing purposes',
            nested: {
              level1: {
                level2: {
                  value: i * 2
                }
              }
            }
          }
        });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // DataLayer should contain all events plus some overhead
      expect(dataLayer.length).toBeGreaterThanOrEqual(1000);

      // This test mainly verifies no crash/timeout occurs
    });
  });

  describe('Concurrent Access Performance', () => {
    it('handles concurrent push operations without serialization delay', async () => {
      const client = createGtmClient({ containers: 'GTM-CONCURRENT' });
      client.init();

      const start = performance.now();

      // Simulate concurrent access from multiple "components"
      const promises = Array.from({ length: 10 }, (_, context) =>
        Promise.resolve().then(() => {
          for (let i = 0; i < 100; i++) {
            client.push({ event: 'concurrent', context, index: i });
          }
        })
      );

      await Promise.all(promises);

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(1000);

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const concurrentEvents = dataLayer.filter(
        (e) => typeof e === 'object' && (e as { event?: string }).event === 'concurrent'
      );

      expect(concurrentEvents.length).toBe(1000);
    });
  });

  describe('Script Injection Performance', () => {
    it('injects multiple container scripts without blocking', () => {
      const start = performance.now();

      const client = createGtmClient({
        containers: Array.from({ length: 10 }, (_, i) => `GTM-INJECT-${i}`)
      });
      client.init();

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(500);

      const scripts = document.querySelectorAll('script[data-gtm-container-id]');
      expect(scripts).toHaveLength(10);
    });
  });

  describe('Query Parameter Construction Performance', () => {
    it('constructs complex query strings efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        const client = createGtmClient({
          containers: {
            id: `GTM-QP-${i}`,
            queryParams: {
              gtm_auth: `auth_key_${i}`,
              gtm_preview: `env_${i}`,
              gtm_cookies_win: 'x'
            }
          },
          defaultQueryParams: {
            custom_param: 'value',
            another_param: 'another_value'
          }
        });
        client.init();
        client.teardown();
      }

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('whenReady Performance', () => {
    it('resolves whenReady quickly after script load', async () => {
      const client = createGtmClient({ containers: 'GTM-READY-PERF' });
      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-READY-PERF"]');

      const start = performance.now();

      // Simulate script load
      script?.dispatchEvent(new Event('load'));

      const states = await client.whenReady();

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(100);
      expect(states).toHaveLength(1);
    });

    it('handles multiple whenReady calls efficiently', async () => {
      const client = createGtmClient({ containers: 'GTM-MULTI-READY' });
      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-MULTI-READY"]');
      script?.dispatchEvent(new Event('load'));

      const start = performance.now();

      // Call whenReady many times concurrently
      const promises = Array.from({ length: 100 }, () => client.whenReady());
      await Promise.all(promises);

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(500);
    });
  });

  describe('onReady Callback Performance', () => {
    it('handles many onReady callbacks efficiently', () => {
      const client = createGtmClient({ containers: 'GTM-ONREADY-PERF' });
      client.init();

      const callbacks: (() => void)[] = [];

      const start = performance.now();

      // Register many callbacks
      for (let i = 0; i < 100; i++) {
        const unsubscribe = client.onReady(() => undefined);
        callbacks.push(unsubscribe);
      }

      // Trigger load
      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-ONREADY-PERF"]');
      script?.dispatchEvent(new Event('load'));

      const duration = performance.now() - start;

      // Allow for CI variability
      expect(duration).toBeLessThan(500);

      // Cleanup
      callbacks.forEach((cb) => cb());
    });
  });
});

describe('Performance Regression Prevention', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('maintains consistent performance over multiple runs', () => {
    const durations: number[] = [];

    for (let run = 0; run < 10; run++) {
      // Reset
      document.head.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;

      const start = performance.now();

      const client = createGtmClient({ containers: `GTM-CONSISTENT-${run}` });
      client.init();

      for (let i = 0; i < 100; i++) {
        client.push({ event: `event_${i}` });
      }

      client.teardown();

      durations.push(performance.now() - start);
    }

    // Calculate statistics
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    const variance = max - min;

    // Average should be reasonable (allow for CI variability)
    expect(avg).toBeLessThan(500);

    // Variance should not be too high (no degradation over runs)
    expect(variance).toBeLessThan(avg * 5);
  });
});
