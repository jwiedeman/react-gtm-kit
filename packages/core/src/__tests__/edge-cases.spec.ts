/**
 * Edge case and error handling tests for GTM Kit Core
 *
 * These tests ensure the library handles unexpected inputs gracefully
 * and provides helpful error messages to developers.
 */
import { createGtmClient } from '../../src';

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
    // Reset any custom data layers
    for (const key of Object.keys(globalThis)) {
      if (key.includes('Layer') && key !== 'dataLayer') {
        delete (globalThis as Record<string, unknown>)[key];
      }
    }
  });

  describe('Container validation', () => {
    it('throws when no containers provided', () => {
      expect(() => createGtmClient({ containers: [] })).toThrow(/At least one GTM container ID/);
    });

    it('throws for empty containers array', () => {
      expect(() => createGtmClient({ containers: [] })).toThrow();
    });

    it('handles empty string container ID gracefully', () => {
      // Empty string should not cause a crash - client handles it gracefully
      const client = createGtmClient({ containers: '' as unknown as string });
      // Should not throw during init
      expect(() => client.init()).not.toThrow();
      // Client initializes but no valid scripts are injected for empty ID
      expect(client.isInitialized()).toBe(true);
    });

    it('handles whitespace container ID', () => {
      const client = createGtmClient({ containers: '   GTM-TEST123   ' });
      client.init();
      // Should handle whitespace in URL
      const script = document.querySelector('script');
      expect(script?.src).toContain('GTM-TEST123');
    });

    it('handles special characters in query params', () => {
      const client = createGtmClient({
        containers: {
          id: 'GTM-SPECIAL',
          queryParams: {
            gtm_auth: 'test&value=1',
            gtm_preview: 'env=test'
          }
        }
      });
      client.init();
      const script = document.querySelector('script');
      // URL should be properly encoded
      expect(script?.src).toContain('gtm_auth=');
    });
  });

  describe('Push edge cases', () => {
    it('ignores null push values', () => {
      const client = createGtmClient({ containers: 'GTM-NULL' });
      client.init();

      const lengthBefore = ((globalThis as Record<string, unknown>).dataLayer as unknown[]).length;
      client.push(null as unknown as Record<string, unknown>);
      const lengthAfter = ((globalThis as Record<string, unknown>).dataLayer as unknown[]).length;

      expect(lengthAfter).toBe(lengthBefore);
    });

    it('ignores undefined push values', () => {
      const client = createGtmClient({ containers: 'GTM-UNDEFINED' });
      client.init();

      const lengthBefore = ((globalThis as Record<string, unknown>).dataLayer as unknown[]).length;
      client.push(undefined as unknown as Record<string, unknown>);
      const lengthAfter = ((globalThis as Record<string, unknown>).dataLayer as unknown[]).length;

      expect(lengthAfter).toBe(lengthBefore);
    });

    it('handles deeply nested objects', () => {
      const client = createGtmClient({ containers: 'GTM-NESTED' });
      client.init();

      const deepObject = {
        event: 'deep_event',
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deeply nested'
              }
            }
          }
        }
      };

      client.push(deepObject);

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const pushed = dataLayer.find(
        (e) => typeof e === 'object' && e !== null && (e as { event?: string }).event === 'deep_event'
      );
      expect(pushed).toMatchObject(deepObject);
    });

    it('handles arrays in event data', () => {
      const client = createGtmClient({ containers: 'GTM-ARRAY' });
      client.init();

      client.push({
        event: 'purchase',
        items: [
          { id: '1', name: 'Product 1' },
          { id: '2', name: 'Product 2' }
        ]
      });

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const pushed = dataLayer.find(
        (e) => typeof e === 'object' && e !== null && (e as { event?: string }).event === 'purchase'
      ) as Record<string, unknown>;

      expect(pushed.items).toHaveLength(2);
    });

    it('handles very large objects', () => {
      const client = createGtmClient({ containers: 'GTM-LARGE' });
      client.init();

      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random()
      }));

      expect(() => client.push({ event: 'large_event', items: largeArray })).not.toThrow();
    });

    it('handles symbols in event data', () => {
      const client = createGtmClient({ containers: 'GTM-SYMBOL' });
      client.init();

      const symbolKey = Symbol('test');
      const obj = {
        event: 'symbol_event',
        [symbolKey]: 'symbol value'
      };

      // Should not throw
      expect(() => client.push(obj)).not.toThrow();
    });

    it('handles functions in event data', () => {
      const client = createGtmClient({ containers: 'GTM-FUNC' });
      client.init();

      expect(() =>
        client.push({
          event: 'func_event',
          callback: () => undefined
        })
      ).not.toThrow();
    });
  });

  describe('Custom data layer name edge cases', () => {
    it('handles unusual but valid data layer names', () => {
      const client = createGtmClient({
        containers: 'GTM-CUSTOM-DL',
        dataLayerName: '_myCustomLayer123'
      });
      client.init();

      expect((globalThis as Record<string, unknown>)._myCustomLayer123).toBeDefined();
      expect(client.dataLayerName).toBe('_myCustomLayer123');
    });

    it('handles dollar sign prefixed data layer names', () => {
      const client = createGtmClient({
        containers: 'GTM-DOLLAR-DL',
        dataLayerName: '$dataLayer'
      });
      client.init();

      expect((globalThis as Record<string, unknown>).$dataLayer).toBeDefined();
    });

    it('preserves existing custom data layer on init', () => {
      (globalThis as Record<string, unknown>).myLayer = [{ existing: 'data' }];

      const client = createGtmClient({
        containers: 'GTM-PRESERVE-DL',
        dataLayerName: 'myLayer'
      });
      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).myLayer as unknown[];
      expect(dataLayer.find((e) => (e as { existing?: string }).existing === 'data')).toBeDefined();
    });
  });

  describe('Script injection edge cases', () => {
    it('handles missing document head gracefully', () => {
      // This test verifies the script manager handles edge cases
      const client = createGtmClient({ containers: 'GTM-NO-HEAD' });

      // Should not throw
      expect(() => client.init()).not.toThrow();

      // Cleanup - script should be in body or head
      expect(document.querySelector('script[data-gtm-container-id="GTM-NO-HEAD"]')).not.toBeNull();
    });

    it('injects script even with custom host', () => {
      const client = createGtmClient({
        containers: 'GTM-CUSTOM-HOST-TEST',
        host: 'https://custom.gtm.example.com/'
      });

      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-CUSTOM-HOST-TEST"]');
      expect(script).not.toBeNull();
      expect(script?.src).toContain('custom.gtm.example.com');
    });

    it('handles CSP nonce properly', () => {
      const client = createGtmClient({
        containers: 'GTM-CSP',
        scriptAttributes: { nonce: 'abc123xyz' }
      });

      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-CSP"]');
      expect(script?.getAttribute('nonce')).toBe('abc123xyz');
      expect(script?.nonce).toBe('abc123xyz');
    });

    it('handles all custom script attributes', () => {
      const client = createGtmClient({
        containers: 'GTM-ATTRS',
        scriptAttributes: {
          async: false,
          defer: true,
          'data-custom': 'value',
          'data-another': 'test',
          id: 'my-gtm-script'
        }
      });

      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-ATTRS"]');
      expect(script?.async).toBe(false);
      expect(script?.defer).toBe(true);
      expect(script?.getAttribute('data-custom')).toBe('value');
      expect(script?.getAttribute('data-another')).toBe('test');
      expect(script?.id).toBe('my-gtm-script');
    });
  });

  describe('Consent edge cases', () => {
    it('handles all supported consent signal types', () => {
      const client = createGtmClient({ containers: 'GTM-ALL-CONSENT' });

      client.setConsentDefaults({
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });

      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const consent = dataLayer.find((e) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'default') as unknown[];

      expect(consent[2]).toMatchObject({
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    });

    it('handles consent with multiple regions', () => {
      const client = createGtmClient({ containers: 'GTM-MULTI-REGION' });

      client.setConsentDefaults({ ad_storage: 'denied' }, { region: ['DE', 'FR', 'IT', 'ES'] });

      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const consent = dataLayer.find((e) => Array.isArray(e) && e[0] === 'consent') as unknown[];

      expect(consent[3]).toMatchObject({ region: ['DE', 'FR', 'IT', 'ES'] });
    });

    it('handles wait_for_update option', () => {
      const client = createGtmClient({ containers: 'GTM-WAIT' });

      client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: 500 });

      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const consent = dataLayer.find((e) => Array.isArray(e) && e[0] === 'consent') as unknown[];

      expect(consent[3]).toMatchObject({ wait_for_update: 500 });
    });

    it('rejects invalid consent values', () => {
      const client = createGtmClient({ containers: 'GTM-INVALID-CONSENT' });
      client.init();

      expect(() => {
        client.updateConsent({
          // @ts-expect-error Testing runtime validation
          ad_storage: 'maybe'
        });
      }).toThrow(/Invalid consent value/);
    });
  });

  describe('Multiple containers edge cases', () => {
    it('handles 5+ containers', () => {
      const containers = ['GTM-A', 'GTM-B', 'GTM-C', 'GTM-D', 'GTM-E', 'GTM-F'];
      const client = createGtmClient({ containers });

      client.init();

      const scripts = document.querySelectorAll('script[data-gtm-container-id]');
      expect(scripts).toHaveLength(6);

      containers.forEach((id, index) => {
        expect(scripts[index].getAttribute('data-gtm-container-id')).toBe(id);
      });
    });

    it('handles containers with different configurations', () => {
      const client = createGtmClient({
        containers: [
          { id: 'GTM-PRIMARY' },
          { id: 'GTM-STAGING', queryParams: { gtm_preview: 'env-1' } },
          { id: 'GTM-SECONDARY', queryParams: { gtm_auth: 'auth-key', gtm_preview: 'env-2' } }
        ]
      });

      client.init();

      const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]');

      expect(scripts[0].src).not.toContain('gtm_auth');
      expect(scripts[1].src).toContain('gtm_preview=env-1');
      expect(scripts[2].src).toContain('gtm_auth=auth-key');
      expect(scripts[2].src).toContain('gtm_preview=env-2');
    });
  });

  describe('Initialization state edge cases', () => {
    it('isInitialized returns correct state', () => {
      const client = createGtmClient({ containers: 'GTM-INIT-STATE' });

      expect(client.isInitialized()).toBe(false);

      client.init();
      expect(client.isInitialized()).toBe(true);

      client.teardown();
      expect(client.isInitialized()).toBe(false);

      client.init();
      expect(client.isInitialized()).toBe(true);
    });

    it('handles rapid init/teardown cycles', () => {
      const client = createGtmClient({ containers: 'GTM-RAPID' });

      for (let i = 0; i < 10; i++) {
        client.init();
        client.push({ event: `event_${i}` });
        client.teardown();
      }

      // Final state should be clean
      expect(client.isInitialized()).toBe(false);
      expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
    });

    it('queues events during rapid initialization', () => {
      const client = createGtmClient({ containers: 'GTM-QUEUE-RAPID' });

      // Queue events before init
      client.push({ event: 'event_1' });
      client.push({ event: 'event_2' });
      client.push({ event: 'event_3' });

      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const events = dataLayer.filter((e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event?.startsWith('event_'));

      expect(events).toHaveLength(3);
    });
  });

  describe('Host configuration edge cases', () => {
    it('handles host without trailing slash', () => {
      const client = createGtmClient({
        containers: 'GTM-HOST-NO-SLASH',
        host: 'https://custom.gtm.com'
      });

      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-HOST-NO-SLASH"]');
      expect(script?.src).toMatch(/^https:\/\/custom\.gtm\.com/);
    });

    it('handles host with trailing slash', () => {
      const client = createGtmClient({
        containers: 'GTM-HOST-SLASH',
        host: 'https://custom.gtm.com/'
      });

      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-HOST-SLASH"]');
      expect(script?.src).toMatch(/^https:\/\/custom\.gtm\.com\//);
    });

    it('handles host with path', () => {
      const client = createGtmClient({
        containers: 'GTM-HOST-PATH',
        host: 'https://custom.gtm.com/gtm/'
      });

      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-HOST-PATH"]');
      expect(script?.src).toContain('custom.gtm.com/gtm/');
    });
  });

  describe('Memory and cleanup', () => {
    it('properly cleans up all resources on teardown', () => {
      const client = createGtmClient({ containers: 'GTM-CLEANUP' });

      client.init();
      client.push({ event: 'test_event' });

      // Verify setup
      expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(1);

      client.teardown();

      // Verify cleanup
      expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
    });

    it('clears internal queue on teardown', () => {
      const client = createGtmClient({ containers: 'GTM-QUEUE-CLEAR' });

      client.push({ event: 'queued_1' });
      client.push({ event: 'queued_2' });

      // Teardown before init
      client.teardown();

      // Init should have empty queue
      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const queuedEvents = dataLayer.filter((e) => typeof e === 'object' && (e as { event?: string }).event?.startsWith('queued_'));

      expect(queuedEvents).toHaveLength(0);
    });
  });

  describe('Ready callbacks', () => {
    it('returns unsubscribe function from onReady', () => {
      const client = createGtmClient({ containers: 'GTM-UNSUB-FN' });
      const callback = jest.fn();

      client.init();
      const unsubscribe = client.onReady(callback);

      // Unsubscribe should be a function
      expect(typeof unsubscribe).toBe('function');

      // Should not throw when called
      expect(() => unsubscribe()).not.toThrow();
    });

    it('whenReady returns a promise', () => {
      const client = createGtmClient({ containers: 'GTM-PROMISE' });
      client.init();

      const promise = client.whenReady();
      expect(promise).toBeInstanceOf(Promise);
    });

    it('resolves whenReady on script load', async () => {
      const client = createGtmClient({ containers: 'GTM-READY-RESOLVE' });
      client.init();

      const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-READY-RESOLVE"]');

      // Simulate load
      script?.dispatchEvent(new Event('load'));

      const states = await client.whenReady();
      expect(states).toBeDefined();
      expect(Array.isArray(states)).toBe(true);
    });
  });
});
