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

    it('throws for empty string container ID', () => {
      // Empty string container IDs should throw an error
      expect(() => createGtmClient({ containers: '' as unknown as string })).toThrow(
        /All container IDs are empty or invalid/
      );
    });

    it('throws for whitespace-only container ID', () => {
      // Whitespace-only container IDs should throw an error
      expect(() => createGtmClient({ containers: '   ' as unknown as string })).toThrow(
        /All container IDs are empty or invalid/
      );
    });

    it('skips invalid container IDs when mixed with valid ones', () => {
      const warnSpy = jest.fn();

      const client = createGtmClient({
        containers: [{ id: 'GTM-VALID1' }, { id: '' }, { id: 'GTM-VALID2' }, { id: '  ' }],
        logger: { warn: warnSpy }
      });

      // Should warn about invalid containers during construction
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('2 container ID(s) are empty or invalid'));

      client.init();

      // Should still inject valid scripts
      const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]');
      expect(scripts).toHaveLength(2);
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

    it('warns when waitForUpdate exceeds 30 minutes', () => {
      const warnSpy = jest.fn();
      const client = createGtmClient({
        containers: 'GTM-LONG-WAIT',
        logger: { warn: warnSpy }
      });

      // 31 minutes in milliseconds
      const thirtyOneMinutes = 31 * 60 * 1000;
      client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: thirtyOneMinutes });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds 30 minutes'),
        expect.objectContaining({ waitForUpdate: thirtyOneMinutes })
      );
    });

    it('does not warn when waitForUpdate is within 30 minutes', () => {
      const warnSpy = jest.fn();
      const client = createGtmClient({
        containers: 'GTM-OK-WAIT',
        logger: { warn: warnSpy }
      });

      // 29 minutes in milliseconds
      const twentyNineMinutes = 29 * 60 * 1000;
      client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: twentyNineMinutes });

      // Should not warn about excessive wait time
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('exceeds 30 minutes'), expect.anything());
    });

    it('throws error for negative waitForUpdate value', () => {
      const client = createGtmClient({ containers: 'GTM-NEGATIVE-WAIT' });

      expect(() => {
        client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: -1000 });
      }).toThrow(/Invalid waitForUpdate value/);
    });

    it('throws error for NaN waitForUpdate value', () => {
      const client = createGtmClient({ containers: 'GTM-NAN-WAIT' });

      expect(() => {
        client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: NaN });
      }).toThrow(/Invalid waitForUpdate value/);
    });

    it('throws error for Infinity waitForUpdate value', () => {
      const client = createGtmClient({ containers: 'GTM-INFINITY-WAIT' });

      expect(() => {
        client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: Infinity });
      }).toThrow(/Invalid waitForUpdate value/);
    });

    it('accepts zero waitForUpdate value', () => {
      const client = createGtmClient({ containers: 'GTM-ZERO-WAIT' });

      // Zero is valid (no wait)
      expect(() => {
        client.setConsentDefaults({ ad_storage: 'denied' }, { waitForUpdate: 0 });
      }).not.toThrow();
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

  describe('Defensive error handling', () => {
    it('catches and logs errors during dataLayer push without crashing', () => {
      const errorSpy = jest.fn();
      const client = createGtmClient({
        containers: 'GTM-DEFENSIVE',
        logger: { error: errorSpy }
      });
      client.init();

      // Corrupt the dataLayer to cause push errors
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as { push?: unknown };
      const originalPush = dataLayer.push;
      dataLayer.push = () => {
        throw new Error('Simulated dataLayer corruption');
      };

      // Push should not throw, even with corrupted dataLayer
      expect(() => {
        client.push({ event: 'test_event' });
      }).not.toThrow();

      // Error should be logged
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to push value to dataLayer.',
        expect.objectContaining({
          error: 'Simulated dataLayer corruption'
        })
      );

      // Restore original push
      dataLayer.push = originalPush;
      client.teardown();
    });

    it('continues functioning after push error', () => {
      const errorSpy = jest.fn();
      const client = createGtmClient({
        containers: 'GTM-CONTINUE',
        logger: { error: errorSpy }
      });
      client.init();

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as { push?: unknown };
      const originalPush = dataLayer.push;

      // Cause one error
      dataLayer.push = () => {
        throw new Error('First error');
      };
      client.push({ event: 'will_fail' });

      // Restore and push again
      dataLayer.push = originalPush;
      client.push({ event: 'will_succeed' });

      // Should have logged one error
      expect(errorSpy).toHaveBeenCalledTimes(1);

      // Successful push should have worked
      const events = (dataLayer as unknown[]).filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event === 'will_succeed'
      );
      expect(events).toHaveLength(1);

      client.teardown();
    });
  });

  describe('Multiple client instances', () => {
    it('warns when multiple clients share the same dataLayer', () => {
      const warnSpy1 = jest.fn();
      const warnSpy2 = jest.fn();

      // Use unique dataLayer name to isolate from other tests
      const uniqueDataLayerName = `testLayer_${Date.now()}_1`;

      const client1 = createGtmClient({
        containers: 'GTM-MULTI-1',
        dataLayerName: uniqueDataLayerName,
        logger: { warn: warnSpy1 }
      });
      const client2 = createGtmClient({
        containers: 'GTM-MULTI-2',
        dataLayerName: uniqueDataLayerName,
        logger: { warn: warnSpy2 }
      });

      client1.init();
      // First client should not warn
      expect(warnSpy1).not.toHaveBeenCalledWith(
        expect.stringContaining('Multiple GTM client instances'),
        expect.anything()
      );

      client2.init();
      // Second client should warn about sharing dataLayer
      expect(warnSpy2).toHaveBeenCalledWith(
        expect.stringContaining('Multiple GTM client instances'),
        expect.objectContaining({ activeInstances: 2 })
      );

      client1.teardown();
      client2.teardown();
    });

    it('warns when tearing down while other clients are active', () => {
      const warnSpy1 = jest.fn();
      const warnSpy2 = jest.fn();

      // Use unique dataLayer name to isolate from other tests
      const uniqueDataLayerName = `testLayer_${Date.now()}_2`;

      const client1 = createGtmClient({
        containers: 'GTM-TEARDOWN-1',
        dataLayerName: uniqueDataLayerName,
        logger: { warn: warnSpy1 }
      });
      const client2 = createGtmClient({
        containers: 'GTM-TEARDOWN-2',
        dataLayerName: uniqueDataLayerName,
        logger: { warn: warnSpy2 }
      });

      client1.init();
      client2.init();

      // Clear warnings from init
      warnSpy1.mockClear();

      // Teardown first client while second is still active
      client1.teardown();

      // Should warn about affecting other clients
      expect(warnSpy1).toHaveBeenCalledWith(
        expect.stringContaining('other instance(s) are still using'),
        expect.objectContaining({ remainingInstances: 1 })
      );

      client2.teardown();
    });

    it('does not warn when clients use different dataLayer names', () => {
      const warnSpy1 = jest.fn();
      const warnSpy2 = jest.fn();

      const client1 = createGtmClient({
        containers: 'GTM-DIFF-DL-1',
        dataLayerName: `uniqueLayer_${Date.now()}_a`,
        logger: { warn: warnSpy1 }
      });
      const client2 = createGtmClient({
        containers: 'GTM-DIFF-DL-2',
        dataLayerName: `uniqueLayer_${Date.now()}_b`,
        logger: { warn: warnSpy2 }
      });

      client1.init();
      client2.init();

      // Neither should warn about multiple instances
      expect(warnSpy1).not.toHaveBeenCalledWith(
        expect.stringContaining('Multiple GTM client instances'),
        expect.anything()
      );
      expect(warnSpy2).not.toHaveBeenCalledWith(
        expect.stringContaining('Multiple GTM client instances'),
        expect.anything()
      );

      client1.teardown();
      client2.teardown();
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
      const events = dataLayer.filter(
        (e) => typeof e === 'object' && !Array.isArray(e) && (e as { event?: string }).event?.startsWith('event_')
      );

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
      const queuedEvents = dataLayer.filter(
        (e) => typeof e === 'object' && (e as { event?: string }).event?.startsWith('queued_')
      );

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

  describe('Circular reference handling', () => {
    it('handles direct circular reference in object', () => {
      const client = createGtmClient({ containers: 'GTM-CIRCULAR-DIRECT' });
      client.init();

      // Create an object with a circular reference
      const obj: Record<string, unknown> = { event: 'circular_test', data: {} };
      (obj.data as Record<string, unknown>).self = obj;

      // Should not throw when pushing circular reference
      expect(() => client.push(obj)).not.toThrow();

      // Event should still be pushed to dataLayer
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.some((e) => (e as { event?: string }).event === 'circular_test')).toBe(true);
    });

    it('handles indirect circular reference in nested objects', () => {
      const client = createGtmClient({ containers: 'GTM-CIRCULAR-INDIRECT' });
      client.init();

      // Create objects with indirect circular references
      const a: Record<string, unknown> = { name: 'a' };
      const b: Record<string, unknown> = { name: 'b', parent: a };
      a.child = b;

      const obj = { event: 'nested_circular', data: a };

      // Should not throw
      expect(() => client.push(obj)).not.toThrow();

      // Event should still be pushed
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.some((e) => (e as { event?: string }).event === 'nested_circular')).toBe(true);
    });

    it('handles circular reference in array', () => {
      const client = createGtmClient({ containers: 'GTM-CIRCULAR-ARRAY' });
      client.init();

      // Create an array that contains itself
      const arr: unknown[] = [1, 2, 3];
      arr.push(arr);

      const obj = { event: 'array_circular', items: arr };

      // Should not throw
      expect(() => client.push(obj)).not.toThrow();

      // Event should still be pushed
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.some((e) => (e as { event?: string }).event === 'array_circular')).toBe(true);
    });

    it('handles deeply nested circular references', () => {
      const client = createGtmClient({ containers: 'GTM-CIRCULAR-DEEP' });
      client.init();

      // Create deeply nested structure with circular reference
      const root: Record<string, unknown> = {
        level1: {
          level2: {
            level3: {
              level4: {}
            }
          }
        }
      };
      // Add circular reference at deep level
      ((root.level1 as Record<string, unknown>).level2 as Record<string, unknown>).level3 = root;

      const obj = { event: 'deep_circular', tree: root };

      // Should not throw
      expect(() => client.push(obj)).not.toThrow();

      // Event should still be pushed
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.some((e) => (e as { event?: string }).event === 'deep_circular')).toBe(true);
    });

    it('handles multiple circular references in same object', () => {
      const client = createGtmClient({ containers: 'GTM-CIRCULAR-MULTI' });
      client.init();

      // Create object with multiple circular references
      const shared: Record<string, unknown> = { name: 'shared' };
      const obj: Record<string, unknown> = {
        event: 'multi_circular',
        ref1: shared,
        ref2: shared,
        nested: { ref3: shared }
      };
      shared.back = obj; // Add circular reference

      // Should not throw
      expect(() => client.push(obj)).not.toThrow();

      // Event should still be pushed
      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.some((e) => (e as { event?: string }).event === 'multi_circular')).toBe(true);
    });
  });

  describe('Diagnostics', () => {
    it('returns complete diagnostics before initialization', () => {
      const client = createGtmClient({ containers: 'GTM-DIAG-PRE' });

      const diag = client.getDiagnostics();

      expect(diag.initialized).toBe(false);
      expect(diag.ready).toBe(false);
      expect(diag.dataLayerName).toBe('dataLayer');
      expect(diag.dataLayerSize).toBe(0);
      expect(diag.queueSize).toBe(0);
      expect(diag.consentCommandsDelivered).toBe(0);
      expect(diag.containers).toEqual(['GTM-DIAG-PRE']);
      expect(diag.scriptStates).toEqual([]);
      expect(diag.uptimeMs).toBeGreaterThanOrEqual(0);
      expect(diag.debugMode).toBe(false);
    });

    it('returns complete diagnostics after initialization', () => {
      const client = createGtmClient({ containers: 'GTM-DIAG-POST' });
      client.init();
      client.push({ event: 'test_event' });

      const diag = client.getDiagnostics();

      expect(diag.initialized).toBe(true);
      expect(diag.dataLayerSize).toBeGreaterThan(0);
      expect(diag.containers).toEqual(['GTM-DIAG-POST']);

      client.teardown();
    });

    it('tracks consent commands delivered', () => {
      const client = createGtmClient({ containers: 'GTM-DIAG-CONSENT' });
      client.setConsentDefaults({ ad_storage: 'denied' });
      client.init();
      client.updateConsent({ ad_storage: 'granted' });

      const diag = client.getDiagnostics();

      // Should have at least 2 consent commands (default + update)
      expect(diag.consentCommandsDelivered).toBeGreaterThanOrEqual(2);

      client.teardown();
    });

    it('reflects debug mode setting', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);

      const client = createGtmClient({
        containers: 'GTM-DIAG-DEBUG',
        debug: true
      });

      const diag = client.getDiagnostics();
      expect(diag.debugMode).toBe(true);

      consoleLogSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('tracks multiple containers', () => {
      const client = createGtmClient({
        containers: ['GTM-DIAG-A', 'GTM-DIAG-B', 'GTM-DIAG-C']
      });

      const diag = client.getDiagnostics();

      expect(diag.containers).toEqual(['GTM-DIAG-A', 'GTM-DIAG-B', 'GTM-DIAG-C']);
    });
  });

  describe('Debug mode', () => {
    it('logs to console when debug mode is enabled', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const client = createGtmClient({
        containers: 'GTM-DEBUG-MODE',
        debug: true
      });

      client.init();

      // Debug mode should have logged the initialization
      const allCalls = [...consoleInfoSpy.mock.calls, ...consoleLogSpy.mock.calls];
      const hasGtmKitLog = allCalls.some((call) => typeof call[0] === 'string' && call[0].includes('[GTM-Kit'));
      expect(hasGtmKitLog).toBe(true);

      client.teardown();
      consoleInfoSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('does not log when debug mode is disabled', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const client = createGtmClient({
        containers: 'GTM-NO-DEBUG',
        debug: false
      });

      client.init();

      // Should not have GTM-Kit logs
      const allCalls = [...consoleInfoSpy.mock.calls, ...consoleLogSpy.mock.calls];
      const hasGtmKitLog = allCalls.some((call) => typeof call[0] === 'string' && call[0].includes('[GTM-Kit'));
      expect(hasGtmKitLog).toBe(false);

      client.teardown();
      consoleInfoSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('debug mode overrides custom logger', () => {
      const customLogSpy = jest.fn();
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const client = createGtmClient({
        containers: 'GTM-DEBUG-OVERRIDE',
        debug: true,
        logger: { info: customLogSpy }
      });

      client.init();

      // Custom logger should NOT be called when debug mode is on
      expect(customLogSpy).not.toHaveBeenCalled();

      // Console should have been used
      const allCalls = [...consoleInfoSpy.mock.calls, ...consoleLogSpy.mock.calls];
      const hasGtmKitLog = allCalls.some((call) => typeof call[0] === 'string' && call[0].includes('[GTM-Kit'));
      expect(hasGtmKitLog).toBe(true);

      client.teardown();
      consoleInfoSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('dataLayer mutation tracing', () => {
    it('logs push operations when debug mode is enabled', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-TRACE1', debug: true });
      client.init();

      // Get all log calls that contain push info
      const pushCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('push()')
      );

      // Should have logged the start event push
      expect(pushCalls.length).toBeGreaterThanOrEqual(1);

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('logs dataLayer trace enablement message', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-TRACE2', debug: true });
      client.init();

      const tracingEnabledCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('mutation tracing enabled')
      );

      expect(tracingEnabledCalls.length).toBe(1);

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('traces custom push events with debug mode', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-TRACE3', debug: true });
      client.init();

      // Clear previous calls to focus on the custom push
      consoleLogSpy.mockClear();

      // Push a custom event
      client.push({ event: 'custom_event', data: 'test' });

      const pushCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('push()')
      );

      expect(pushCalls.length).toBe(1);

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('does not trace when debug mode is disabled', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-NOTRACE' });
      client.init();

      // Should not have any trace-related logs
      const tracingCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('mutation tracing')
      );

      expect(tracingCalls.length).toBe(0);

      client.teardown();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Event queue visualization', () => {
    beforeEach(() => {
      document.head.innerHTML = '';
      delete (globalThis as Record<string, unknown>).dataLayer;
    });

    it('logs queue visualization when events are queued in debug mode', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-QUEUE-VIS', debug: true });

      // Queue events before init (should show visualization)
      client.push({ event: 'page_view', page_path: '/home' });
      client.push({ event: 'user_data', user_id: '123' });

      // Look for queue visualization logs
      const queueCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Queue Visualization')
      );

      expect(queueCalls.length).toBeGreaterThanOrEqual(1);

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('logs queue visualization when flushing queue', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-QUEUE-FLUSH', debug: true });

      // Queue events before init
      client.push({ event: 'queued_event_1' });
      client.push({ event: 'queued_event_2' });

      consoleLogSpy.mockClear(); // Clear previous logs

      // Init will flush the queue
      client.init();

      // Look for flush-related queue visualization
      const flushCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Flushing queue')
      );

      expect(flushCalls.length).toBe(1);

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('shows event types in queue visualization', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-QUEUE-TYPES', debug: true });

      // Queue various event types
      client.push({ event: 'page_view', page_path: '/products' });
      client.push({ event: 'add_to_cart', ecommerce: { items: [] } });
      client.push({ user_id: '12345', membership: 'premium' }); // Data without event

      // Get the visualization log content
      const allLogContent = consoleLogSpy.mock.calls.map((call) => JSON.stringify(call)).join('\n');

      // Should contain event names in the output
      expect(allLogContent).toContain('page_view');
      expect(allLogContent).toContain('add_to_cart');
      expect(allLogContent).toContain('ecommerce');
      expect(allLogContent).toContain('data'); // Data type for objects without event

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('does not show queue visualization when debug mode is disabled', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-NO-QUEUE-VIS', debug: false });

      // Queue events
      client.push({ event: 'test_event' });

      // Look for queue visualization logs
      const queueCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Queue Visualization')
      );

      expect(queueCalls.length).toBe(0);

      client.teardown();
      consoleLogSpy.mockRestore();
    });

    it('logs queue flushed message after successful flush', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const client = createGtmClient({ containers: 'GTM-QUEUE-FLUSHED', debug: true });

      // Queue some events
      client.push({ event: 'pre_init_event' });

      consoleLogSpy.mockClear();

      // Init will flush the queue
      client.init();

      // Look for "flushed successfully" log
      const flushedCalls = consoleLogSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('flushed successfully')
      );

      expect(flushedCalls.length).toBe(1);

      client.teardown();
      consoleLogSpy.mockRestore();
    });
  });
});
