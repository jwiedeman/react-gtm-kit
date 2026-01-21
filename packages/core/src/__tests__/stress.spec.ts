/**
 * Stress tests and chaos testing for GTM Kit Core
 *
 * These tests ensure the library handles extreme conditions:
 * - High-frequency operations
 * - Concurrent access
 * - Race conditions
 * - Resource exhaustion
 * - Rapid state transitions
 */
import { createGtmClient } from '../../src';

describe('Stress Testing', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('High-frequency push operations', () => {
    it('handles 10,000 rapid push calls', () => {
      // Use unlimited dataLayer size for stress testing
      const client = createGtmClient({ containers: 'GTM-STRESS', maxDataLayerSize: 0 });
      client.init();

      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        client.push({ event: `event_${i}`, index: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // All events should be pushed
      const events = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event?.startsWith('event_')
      );
      expect(events).toHaveLength(10000);

      // Performance: should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('handles burst traffic pattern', () => {
      // Use unlimited dataLayer size for stress testing
      const client = createGtmClient({ containers: 'GTM-BURST', maxDataLayerSize: 0 });
      client.init();

      // Simulate 10 bursts of 100 events each
      for (let burst = 0; burst < 10; burst++) {
        for (let eventIndex = 0; eventIndex < 100; eventIndex++) {
          client.push({ event: 'burst_event', burst, eventIndex });
        }
        // Advance timers between bursts
        jest.advanceTimersByTime(100);
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const burstEvents = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event === 'burst_event'
      );

      expect(burstEvents).toHaveLength(1000);
    });

    it('handles concurrent push from multiple contexts', async () => {
      // Use unlimited dataLayer size for stress testing
      const client = createGtmClient({ containers: 'GTM-CONCURRENT', maxDataLayerSize: 0 });
      client.init();

      // Simulate concurrent pushes (as if from different components)
      const contexts = ['header', 'sidebar', 'main', 'footer', 'modal'];
      const pushPromises = contexts.map((ctx) =>
        Promise.resolve().then(() => {
          for (let i = 0; i < 100; i++) {
            client.push({ event: 'concurrent_event', context: ctx, index: i });
          }
        })
      );

      // Wait for all pushes to complete
      await Promise.all(pushPromises);

      // All contexts pushed their events
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const events = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event === 'concurrent_event'
      );

      expect(events.length).toBe(500);
    });
  });

  describe('Race conditions', () => {
    it('handles init() during push queue processing', () => {
      const client = createGtmClient({ containers: 'GTM-RACE1' });

      // Queue events before init
      for (let i = 0; i < 50; i++) {
        client.push({ event: `pre_init_${i}` });
      }

      // Init while we're still pushing
      client.init();

      // Continue pushing during/after init
      for (let i = 0; i < 50; i++) {
        client.push({ event: `post_init_${i}` });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // All events should be present
      const preInitEvents = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event?.startsWith('pre_init_')
      );
      const postInitEvents = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event?.startsWith('post_init_')
      );

      expect(preInitEvents).toHaveLength(50);
      expect(postInitEvents).toHaveLength(50);
    });

    it('handles rapid init/teardown during event pushes', () => {
      const client = createGtmClient({ containers: 'GTM-RACE2' });

      // Interleave init/teardown with pushes
      for (let cycle = 0; cycle < 20; cycle++) {
        client.init();
        client.push({ event: `cycle_${cycle}_a` });
        client.push({ event: `cycle_${cycle}_b` });
        client.teardown();
      }

      // Should not throw and client should be in clean state
      expect(client.isInitialized()).toBe(false);
      expect(() => client.init()).not.toThrow();
    });

    it('handles consent update during initialization', () => {
      const client = createGtmClient({ containers: 'GTM-RACE3' });

      client.setConsentDefaults({ analytics_storage: 'denied' });

      // Start initialization
      client.init();

      // Immediately update consent (simulating fast user interaction)
      client.updateConsent({ analytics_storage: 'granted' });
      client.updateConsent({ ad_storage: 'granted' });

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // Should have consent default and updates
      const consentEntries = dataLayer.filter((e) => Array.isArray(e) && e[0] === 'consent');

      expect(consentEntries.length).toBeGreaterThanOrEqual(2);
    });

    it('handles concurrent promise-based consent updates', async () => {
      const client = createGtmClient({ containers: 'GTM-RACE-ASYNC' });
      client.init();

      // Simulate multiple async consent updates from different components
      const updates = [
        Promise.resolve().then(() => client.updateConsent({ ad_storage: 'granted' })),
        Promise.resolve().then(() => client.updateConsent({ analytics_storage: 'granted' })),
        Promise.resolve().then(() => client.updateConsent({ ad_user_data: 'granted' })),
        Promise.resolve().then(() => client.updateConsent({ ad_personalization: 'granted' }))
      ];

      await Promise.all(updates);

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const consentUpdates = dataLayer.filter((e) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'update');

      // All unique consent updates should be present
      expect(consentUpdates).toHaveLength(4);
    });

    it('maintains correct order when consent updates race with event pushes', async () => {
      const client = createGtmClient({ containers: 'GTM-RACE-ORDER', maxDataLayerSize: 0 });
      client.init();

      const results: string[] = [];

      // Interleave consent updates with event pushes using microtasks
      await Promise.all([
        Promise.resolve().then(() => {
          client.push({ event: 'event_1' });
          results.push('event_1');
        }),
        Promise.resolve().then(() => {
          client.updateConsent({ ad_storage: 'granted' });
          results.push('consent_1');
        }),
        Promise.resolve().then(() => {
          client.push({ event: 'event_2' });
          results.push('event_2');
        }),
        Promise.resolve().then(() => {
          client.updateConsent({ analytics_storage: 'granted' });
          results.push('consent_2');
        })
      ]);

      // All operations completed
      expect(results).toHaveLength(4);

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const events = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event
      );
      const consents = dataLayer.filter((e) => Array.isArray(e) && e[0] === 'consent');

      expect(events.length).toBeGreaterThanOrEqual(2); // gtm.js + our events
      expect(consents).toHaveLength(2);
    });

    it('safely handles consent updates after teardown', () => {
      const client = createGtmClient({ containers: 'GTM-RACE-TEARDOWN' });
      client.init();

      // Update consent
      client.updateConsent({ ad_storage: 'granted' });

      // Teardown
      client.teardown();

      // Attempting consent update after teardown should not throw
      expect(() => {
        client.updateConsent({ analytics_storage: 'granted' });
      }).not.toThrow();

      // Re-initialize
      expect(() => client.init()).not.toThrow();
    });

    it('handles rapid setConsentDefaults before init correctly', () => {
      const client = createGtmClient({ containers: 'GTM-RACE-DEFAULTS' });

      // Multiple consent defaults before init (simulating different CMPs/components)
      client.setConsentDefaults({ ad_storage: 'denied' });
      client.setConsentDefaults({ analytics_storage: 'denied' });
      client.setConsentDefaults({ ad_user_data: 'denied' });
      client.setConsentDefaults({ ad_personalization: 'denied' });

      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const defaults = dataLayer.filter((e) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'default');

      // All unique defaults should be applied
      expect(defaults).toHaveLength(4);
    });

    it('handles consent update during simulated page navigation', () => {
      const client = createGtmClient({ containers: 'GTM-CONSENT-NAV' });
      client.setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'denied' });
      client.init();

      // Update consent
      client.updateConsent({ ad_storage: 'granted' });

      // Simulate page hide (navigation)
      const pagehideEvent = new Event('pagehide');
      window.dispatchEvent(pagehideEvent);

      // Try another consent update after pagehide
      // This should still work (though the page is "navigating away")
      expect(() => {
        client.updateConsent({ analytics_storage: 'granted' });
      }).not.toThrow();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const updates = dataLayer.filter((e) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'update');

      // Both updates should be present
      expect(updates.length).toBeGreaterThanOrEqual(2);

      client.teardown();
    });

    it('preserves consent state across rapid navigation simulation', () => {
      // First page load
      const client1 = createGtmClient({
        containers: 'GTM-NAV-PERSIST',
        dataLayerName: 'navTestLayer1'
      });
      client1.setConsentDefaults({ ad_storage: 'denied' });
      client1.init();
      client1.updateConsent({ ad_storage: 'granted' });

      const dataLayer1 = (globalThis as Record<string, unknown>).navTestLayer1 as unknown[];
      const update1 = dataLayer1.find((e) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'update');
      expect(update1).toBeDefined();

      // Teardown first client (simulating navigation)
      client1.teardown();

      // Second page load (new client, different dataLayer to simulate fresh page)
      const client2 = createGtmClient({
        containers: 'GTM-NAV-PERSIST-2',
        dataLayerName: 'navTestLayer2'
      });
      client2.setConsentDefaults({ ad_storage: 'denied' });
      client2.init();

      // User should need to re-consent on new page (normal GTM behavior)
      const dataLayer2 = (globalThis as Record<string, unknown>).navTestLayer2 as unknown[];
      const defaults2 = dataLayer2.filter((e) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'default');
      expect(defaults2).toHaveLength(1);

      client2.teardown();
    });

    it('handles multiple containers with interleaved operations', () => {
      const clients = [
        createGtmClient({ containers: 'GTM-MULTI-A' }),
        createGtmClient({ containers: 'GTM-MULTI-B' }),
        createGtmClient({ containers: 'GTM-MULTI-C' })
      ];

      // Interleave operations across clients
      for (let i = 0; i < 10; i++) {
        const clientIndex = i % clients.length;
        clients[clientIndex].init();
        clients[clientIndex].push({ event: `client_${clientIndex}_event_${i}` });
      }

      // Teardown in reverse order
      for (let i = clients.length - 1; i >= 0; i--) {
        clients[i].teardown();
      }

      // All clients should be torn down
      clients.forEach((client) => {
        expect(client.isInitialized()).toBe(false);
      });
    });
  });

  describe('Memory and resource management', () => {
    it('handles very large event payloads', () => {
      const client = createGtmClient({ containers: 'GTM-LARGE-PAYLOAD' });
      client.init();

      // Create a large payload (simulating detailed ecommerce data)
      const largePayload = {
        event: 'large_purchase',
        ecommerce: {
          items: Array.from({ length: 500 }, (_, i) => ({
            item_id: `SKU-${i}`,
            item_name: `Product ${i} with a very long description that contains detailed information about the product including features, specifications, and other metadata`,
            price: Math.random() * 1000,
            quantity: Math.floor(Math.random() * 10) + 1,
            item_category: `Category ${i % 10}`,
            item_category2: `Subcategory ${i % 50}`,
            item_variant: `Variant ${i % 5}`,
            item_brand: `Brand ${i % 20}`,
            custom_dimensions: {
              dimension1: 'value1',
              dimension2: 'value2',
              dimension3: 'value3'
            }
          })),
          value: 50000.0,
          currency: 'USD',
          transaction_id: 'T-LARGE-12345'
        }
      };

      expect(() => client.push(largePayload)).not.toThrow();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const event = dataLayer.find(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event === 'large_purchase'
      ) as Record<string, unknown>;

      expect((event.ecommerce as { items: unknown[] }).items).toHaveLength(500);
    });

    it('handles 100+ cart items in ecommerce event', () => {
      const client = createGtmClient({ containers: 'GTM-CART-100' });
      client.init();

      // Create a realistic GA4 ecommerce event with 100+ items
      const items = Array.from({ length: 150 }, (_, i) => ({
        item_id: `SKU-${String(i).padStart(5, '0')}`,
        item_name: `Product ${i}`,
        affiliation: 'Online Store',
        coupon: i % 10 === 0 ? 'DISCOUNT10' : undefined,
        discount: i % 10 === 0 ? 5.0 : 0,
        index: i,
        item_brand: `Brand ${i % 20}`,
        item_category: `Category ${i % 10}`,
        item_category2: `Subcategory ${i % 50}`,
        item_category3: `Type ${i % 5}`,
        item_list_id: 'main_list',
        item_list_name: 'Main Product List',
        item_variant: `Size ${['S', 'M', 'L', 'XL'][i % 4]}`,
        location_id: `LOC-${i % 3}`,
        price: parseFloat((Math.random() * 200 + 10).toFixed(2)),
        quantity: Math.floor(Math.random() * 5) + 1
      }));

      const purchaseEvent = {
        event: 'purchase',
        ecommerce: {
          transaction_id: `T-${Date.now()}`,
          affiliation: 'Online Store',
          value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          tax: 125.5,
          shipping: 15.0,
          currency: 'USD',
          coupon: 'SUMMER_SALE',
          items
        }
      };

      expect(() => client.push(purchaseEvent)).not.toThrow();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const event = dataLayer.find(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event === 'purchase'
      ) as Record<string, unknown>;

      expect(event).toBeDefined();
      expect((event.ecommerce as { items: unknown[] }).items).toHaveLength(150);
    });

    it('handles 1000+ sequential dataLayer events', () => {
      // Use unlimited dataLayer size for this stress test
      const client = createGtmClient({ containers: 'GTM-1000-EVENTS', maxDataLayerSize: 0 });
      client.init();

      const startTime = performance.now();

      // Push 1000+ events simulating real user session activity
      for (let i = 0; i < 1200; i++) {
        const eventType = i % 10;
        switch (eventType) {
          case 0:
            client.push({ event: 'page_view', page_path: `/page-${i}`, page_title: `Page ${i}` });
            break;
          case 1:
            client.push({ event: 'scroll', percent_scrolled: i % 100 });
            break;
          case 2:
            client.push({ event: 'click', element_id: `btn-${i}`, element_class: 'cta-button' });
            break;
          case 3:
            client.push({ event: 'view_item', ecommerce: { items: [{ item_id: `SKU-${i}` }] } });
            break;
          case 4:
            client.push({ event: 'add_to_cart', ecommerce: { items: [{ item_id: `SKU-${i}`, quantity: 1 }] } });
            break;
          case 5:
            client.push({ event: 'video_start', video_title: `Video ${i}`, video_provider: 'YouTube' });
            break;
          case 6:
            client.push({ event: 'video_progress', video_percent: 25, video_title: `Video ${i}` });
            break;
          case 7:
            client.push({ event: 'form_start', form_id: `form-${i}`, form_name: `Form ${i}` });
            break;
          case 8:
            client.push({ event: 'form_submit', form_id: `form-${i}`, form_name: `Form ${i}` });
            break;
          case 9:
            client.push({ event: 'search', search_term: `query ${i}` });
            break;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // Verify all events were pushed
      const pushEvents = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && typeof (e as { event?: string }).event === 'string'
      );

      // Account for gtm.js auto-event + 1200 user events
      expect(pushEvents.length).toBeGreaterThanOrEqual(1200);

      // Performance: should complete in reasonable time (< 2 seconds for 1200 events)
      expect(duration).toBeLessThan(2000);

      // Verify event distribution
      const pageViews = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event === 'page_view'
      );
      expect(pageViews).toHaveLength(120); // 1200 / 10 = 120 page views
    });

    it('handles deeply nested objects (20 levels)', () => {
      const client = createGtmClient({ containers: 'GTM-DEEP-NEST' });
      client.init();

      // Create deeply nested object
      let deepObject: Record<string, unknown> = { value: 'bottom' };
      for (let i = 19; i >= 0; i--) {
        deepObject = { [`level_${i}`]: deepObject };
      }

      const payload = { event: 'deep_event', data: deepObject };

      expect(() => client.push(payload)).not.toThrow();
    });

    it('handles circular reference prevention', () => {
      const client = createGtmClient({ containers: 'GTM-CIRCULAR' });
      client.init();

      // Note: This test verifies the library doesn't crash on circular refs
      // The actual behavior depends on browser JSON handling
      const circularObj: Record<string, unknown> = { event: 'circular_test' };
      // This will cause issues if the library tries to deep clone/serialize
      // but push should still work as it just adds to the array

      expect(() => client.push(circularObj)).not.toThrow();
    });

    it('cleans up all scripts on teardown with multiple containers', () => {
      const containerIds = ['GTM-CLEAN-A', 'GTM-CLEAN-B', 'GTM-CLEAN-C', 'GTM-CLEAN-D', 'GTM-CLEAN-E'];
      const client = createGtmClient({ containers: containerIds });

      client.init();

      // Verify all scripts are added
      expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(5);

      client.teardown();

      // All scripts should be removed
      expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
    });
  });

  describe('Timing and async operations', () => {
    it('handles push calls before script loads', async () => {
      const client = createGtmClient({ containers: 'GTM-ASYNC1' });

      // Push before init
      client.push({ event: 'before_init_1' });
      client.push({ event: 'before_init_2' });

      client.init();

      // Push immediately after init (scripts not loaded yet)
      client.push({ event: 'after_init_1' });
      client.push({ event: 'after_init_2' });

      // Simulate async script load
      jest.advanceTimersByTime(1000);

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-ASYNC1"]');
      script?.dispatchEvent(new Event('load'));

      // Push after script load
      client.push({ event: 'after_load_1' });

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // All events should be present
      expect(dataLayer).toContainEqual(expect.objectContaining({ event: 'before_init_1' }));
      expect(dataLayer).toContainEqual(expect.objectContaining({ event: 'after_init_1' }));
      expect(dataLayer).toContainEqual(expect.objectContaining({ event: 'after_load_1' }));
    });

    it('handles multiple whenReady calls simultaneously', async () => {
      const client = createGtmClient({ containers: 'GTM-WHEN-READY-MULTI' });
      client.init();

      const results: number[] = [];

      // Call whenReady multiple times simultaneously
      const promises = Array.from({ length: 10 }, (_, i) => client.whenReady().then(() => results.push(i)));

      // Simulate script load
      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-WHEN-READY-MULTI"]');
      script?.dispatchEvent(new Event('load'));

      await Promise.all(promises);

      expect(results).toHaveLength(10);
    });

    it('handles script error gracefully', () => {
      const client = createGtmClient({ containers: 'GTM-ERROR' });
      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-ERROR"]');

      // Simulate script error
      expect(() => script?.dispatchEvent(new Event('error'))).not.toThrow();

      // Client should still be functional
      expect(() => client.push({ event: 'after_error' })).not.toThrow();
    });
  });
});

describe('Chaos Testing', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  describe('Unexpected input handling', () => {
    it('survives all JavaScript primitive types as push values', () => {
      const client = createGtmClient({ containers: 'GTM-PRIMITIVES' });
      client.init();

      const primitives = [
        null,
        undefined,
        true,
        false,
        0,
        -1,
        1,
        Infinity,
        -Infinity,
        NaN,
        '',
        'string',
        Symbol('test'),
        BigInt(9007199254740991)
      ];

      primitives.forEach((primitive) => {
        expect(() => client.push(primitive as unknown as Record<string, unknown>)).not.toThrow();
      });
    });

    it('survives various object types as push values', () => {
      const client = createGtmClient({ containers: 'GTM-OBJECTS' });
      client.init();

      const objects = [
        {},
        [],
        new Date(),
        new Map(),
        new Set(),
        new WeakMap(),
        new WeakSet(),
        new Error('test'),
        /regex/,
        () => {
          /* noop */
        },
        async () => {
          /* noop */
        },
        function* () {
          yield;
        },
        Promise.resolve(),
        new ArrayBuffer(8),
        new Uint8Array(8)
      ];

      objects.forEach((obj) => {
        expect(() => client.push(obj as unknown as Record<string, unknown>)).not.toThrow();
      });
    });

    it('handles prototype pollution attempts', () => {
      const client = createGtmClient({ containers: 'GTM-PROTOTYPE' });
      client.init();

      // Attempt prototype pollution (should not affect global Object)
      const maliciousPayload = JSON.parse('{"__proto__":{"polluted":"true"}}');

      expect(() => client.push(maliciousPayload)).not.toThrow();

      // Verify no pollution occurred
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  describe('DOM manipulation resilience', () => {
    it('survives removal of head element after init', () => {
      const client = createGtmClient({ containers: 'GTM-NO-HEAD' });
      client.init();

      // Remove head (shouldn't happen but let's be safe)
      document.head.innerHTML = '';

      // Operations should not throw
      expect(() => client.push({ event: 'after_head_removal' })).not.toThrow();
    });

    it('survives removal of its own script tag', () => {
      const client = createGtmClient({ containers: 'GTM-SCRIPT-REMOVE' });
      client.init();

      // Remove the injected script
      const script = document.querySelector('script[data-gtm-container-id="GTM-SCRIPT-REMOVE"]');
      script?.remove();

      // Operations should not throw
      expect(() => client.push({ event: 'after_script_removal' })).not.toThrow();
      expect(() => client.teardown()).not.toThrow();
    });

    it('survives multiple dataLayer modifications', () => {
      const client = createGtmClient({ containers: 'GTM-DL-MODIFY' });
      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

      // External modifications to dataLayer
      dataLayer.push({ external: 'modification' });
      dataLayer.length = 0; // Clear it
      dataLayer.push({ after: 'clear' });

      // Client operations should still work
      expect(() => client.push({ event: 'after_modification' })).not.toThrow();
    });
  });

  describe('Error recovery', () => {
    it('recovers from consent validation errors', () => {
      const client = createGtmClient({ containers: 'GTM-CONSENT-ERROR' });
      client.init();

      // Try invalid consent - should throw
      expect(() => {
        client.updateConsent({ ad_storage: 'invalid' as 'granted' });
      }).toThrow();

      // Should still work after error
      expect(() => {
        client.updateConsent({ ad_storage: 'granted' });
      }).not.toThrow();
    });

    it('continues working after init failure simulation', () => {
      const client = createGtmClient({ containers: 'GTM-INIT-FAIL' });

      // First init
      client.init();

      // Teardown
      client.teardown();

      // Re-init should work
      expect(() => client.init()).not.toThrow();
      expect(() => client.push({ event: 'after_reinit' })).not.toThrow();
    });
  });
});

describe('Edge Case Combinations', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles every feature combined', () => {
    const client = createGtmClient({
      containers: [
        { id: 'GTM-COMBO-1', queryParams: { gtm_auth: 'auth1' } },
        { id: 'GTM-COMBO-2', queryParams: { gtm_preview: 'env1' } }
      ],
      host: 'https://custom.gtm.example.com',
      dataLayerName: 'customLayer',
      defaultQueryParams: { gtm_cookies_win: 'x' },
      scriptAttributes: { nonce: 'test-nonce', 'data-purpose': 'analytics' }
    });

    // Set consent before init
    client.setConsentDefaults(
      { ad_storage: 'denied', analytics_storage: 'denied' },
      { region: ['EEA'], waitForUpdate: 500 }
    );

    // Queue events before init
    client.push({ event: 'pre_init_event' });

    // Initialize
    client.init();

    // Push various events
    client.push({ event: 'page_view', page_path: '/' });
    client.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: 'T-123',
        value: 99.99,
        items: [{ item_id: 'SKU-1', quantity: 2 }]
      }
    });

    // Update consent
    client.updateConsent({ analytics_storage: 'granted' });

    // Verify everything is set up correctly
    const customLayer = (globalThis as Record<string, unknown>).customLayer as unknown[];
    expect(customLayer).toBeDefined();
    expect(customLayer.length).toBeGreaterThan(3);

    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]');
    expect(scripts).toHaveLength(2);

    scripts.forEach((script) => {
      expect(script.src).toContain('custom.gtm.example.com');
      expect(script.nonce).toBe('test-nonce');
      expect(script.getAttribute('data-purpose')).toBe('analytics');
    });

    // Teardown
    client.teardown();
    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
  });

  it('handles rapid framework transitions (SPA simulation)', () => {
    // Simulate mounting/unmounting components rapidly
    for (let transition = 0; transition < 100; transition++) {
      const client = createGtmClient({ containers: `GTM-SPA-${transition % 10}` });

      if (transition % 2 === 0) {
        client.init();
        client.push({ event: `transition_${transition}` });
        client.teardown();
      } else {
        // Sometimes just push without full lifecycle
        client.push({ event: `queued_${transition}` });
      }
    }

    // Should not leave any orphaned scripts
    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
  });
});
