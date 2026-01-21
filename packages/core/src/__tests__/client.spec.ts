import { createGtmClient } from '../../src';

describe('createGtmClient', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('initializes the data layer, injects scripts, and flushes queued events', () => {
    const client = createGtmClient({ containers: 'GTM-ABC123' });
    client.push({ event: 'pre-init-event' });

    expect((globalThis as Record<string, unknown>).dataLayer).toBeUndefined();

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer).toHaveLength(2);
    expect(dataLayer[0]).toMatchObject({ event: 'gtm.js' });
    expect(dataLayer[1]).toMatchObject({ event: 'pre-init-event' });

    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id="GTM-ABC123"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain('https://www.googletagmanager.com/gtm.js?id=GTM-ABC123');
  });

  it('avoids duplicating scripts when init is called multiple times', () => {
    const client = createGtmClient({ containers: 'GTM-ABC999' });
    client.init();
    client.init();

    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id="GTM-ABC999"]');
    expect(scripts).toHaveLength(1);
  });

  it('supports multiple containers with deterministic ordering', () => {
    const client = createGtmClient({
      containers: [{ id: 'GTM-FIRST' }, { id: 'GTM-SECOND', queryParams: { gtm_auth: 'auth', gtm_preview: 'env' } }]
    });

    client.init();

    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]'));
    expect(scripts).toHaveLength(2);
    expect(scripts[0].getAttribute('data-gtm-container-id')).toBe('GTM-FIRST');
    expect(scripts[1].getAttribute('data-gtm-container-id')).toBe('GTM-SECOND');
    expect(scripts[1].src).toContain('gtm_auth=auth');
    expect(scripts[1].src).toContain('gtm_preview=env');
  });

  it('uses a custom host and default query params when injecting scripts', () => {
    const client = createGtmClient({
      containers: { id: 'GTM-HOST', queryParams: { gtm_preview: 'preview' } },
      host: 'https://tag.example.com/',
      defaultQueryParams: { gtm_auth: 'auth-token' }
    });

    client.init();

    const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-HOST"]');
    expect(script).not.toBeNull();
    expect(script?.src.startsWith('https://tag.example.com/gtm.js')).toBe(true);

    const url = new URL(script?.src ?? '');
    expect(url.searchParams.get('id')).toBe('GTM-HOST');
    expect(url.searchParams.get('gtm_auth')).toBe('auth-token');
    expect(url.searchParams.get('gtm_preview')).toBe('preview');
  });

  it('exposes the resolved data layer name when a custom name is provided', () => {
    const client = createGtmClient({ containers: 'GTM-DATA-NAME', dataLayerName: 'customLayer' });

    expect(client.dataLayerName).toBe('customLayer');
  });

  it('exposes readiness promises and callbacks after scripts load', async () => {
    const client = createGtmClient({ containers: 'GTM-READY-CLIENT' });
    const callback = jest.fn();

    client.init();

    const readiness = client.whenReady();
    const unsubscribe = client.onReady(callback);
    const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-READY-CLIENT"]');

    expect(script).not.toBeNull();
    script?.dispatchEvent(new Event('load'));

    const states = await readiness;

    expect(states).toEqual(
      expect.arrayContaining([expect.objectContaining({ containerId: 'GTM-READY-CLIENT', status: 'loaded' })])
    );
    expect(callback).toHaveBeenCalledWith(states);

    unsubscribe();
  });

  it('applies custom script attributes including CSP nonce', () => {
    const client = createGtmClient({
      containers: 'GTM-NONCE',
      scriptAttributes: {
        async: false,
        nonce: 'nonce-123',
        'data-custom': 'custom-value'
      }
    });

    client.init();

    const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-NONCE"]');
    expect(script).not.toBeNull();
    expect(script?.async).toBe(false);
    expect(script?.getAttribute('nonce')).toBe('nonce-123');
    expect(script?.nonce).toBe('nonce-123');
    expect(script?.getAttribute('data-custom')).toBe('custom-value');
  });

  it('tears down scripts and restores the data layer', () => {
    (globalThis as Record<string, unknown>).dataLayer = [{ event: 'pre-existing' }];

    const client = createGtmClient({ containers: 'GTM-TEARDOWN' });
    client.push({ event: 'queued-before-init' });
    client.init();
    client.push({ event: 'after-init' });

    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(1);

    client.teardown();

    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
    expect((globalThis as Record<string, unknown>).dataLayer).toEqual([{ event: 'pre-existing' }]);
    expect(client.isInitialized()).toBe(false);

    client.init();
    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const startEvent = dataLayer.find((entry) => (entry as Record<string, unknown>).event === 'gtm.js');
    expect(startEvent).toBeDefined();
  });

  it('queues consent defaults before init and flushes on initialization', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT' });
    client.setConsentDefaults({ ad_storage: 'denied' }, { region: ['EEA'] });

    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
    expect((globalThis as Record<string, unknown>).dataLayer).toBeUndefined();

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(Array.isArray(dataLayer[1])).toBe(true);
    expect(dataLayer[1]).toEqual(['consent', 'default', { ad_storage: 'denied' }, { region: ['EEA'] }]);
  });

  it('delivers queued consent defaults before other pre-init events', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-ORDER' });

    client.push({ event: 'pre-init-event' });
    client.setConsentDefaults({ analytics_storage: 'denied' });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer[1]).toEqual(['consent', 'default', { analytics_storage: 'denied' }]);
    expect(dataLayer[2]).toMatchObject({ event: 'pre-init-event' });
  });

  it('preserves consent default ordering when queuing multiple defaults', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-ORDER-MULTI' });

    client.push({ event: 'pre-init-event' });
    client.setConsentDefaults({ ad_storage: 'denied' });
    client.setConsentDefaults({ analytics_storage: 'denied' });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer[1]).toEqual(['consent', 'default', { ad_storage: 'denied' }]);
    expect(dataLayer[2]).toEqual(['consent', 'default', { analytics_storage: 'denied' }]);
    expect(dataLayer[3]).toMatchObject({ event: 'pre-init-event' });
  });

  it('keeps CMP consent defaults and updates ahead of queued events', () => {
    const client = createGtmClient({ containers: 'GTM-CMP-ORDER' });

    client.push({ event: 'pre-init-event' });
    client.setConsentDefaults({ ad_storage: 'denied' }, { region: ['EEA'], waitForUpdate: 2000 });
    client.updateConsent({ ad_storage: 'granted', analytics_storage: 'granted' });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

    expect(dataLayer[1]).toEqual([
      'consent',
      'default',
      { ad_storage: 'denied' },
      { region: ['EEA'], wait_for_update: 2000 }
    ]);
    expect(dataLayer[2]).toEqual(['consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted' }]);
    expect(dataLayer[3]).toMatchObject({ event: 'pre-init-event' });
  });

  it('delivers duplicate queued events in order', () => {
    const client = createGtmClient({ containers: 'GTM-DUPLICATE-QUEUE' });

    client.push({ event: 'queued-event', value: 1 });
    client.push({ event: 'queued-event', value: 1 });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const queuedEvents = dataLayer.filter(
      (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === 'queued-event'
    );

    expect(queuedEvents).toHaveLength(2);
    expect(queuedEvents[0]).toMatchObject({ event: 'queued-event', value: 1 });
    expect(queuedEvents[1]).toMatchObject({ event: 'queued-event', value: 1 });
  });

  it('pushes consent updates immediately after init', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-UPDATE' });
    client.init();

    client.updateConsent({ ad_storage: 'granted', analytics_storage: 'granted' });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer[dataLayer.length - 1]).toEqual([
      'consent',
      'update',
      { ad_storage: 'granted', analytics_storage: 'granted' }
    ]);
  });

  it('throws for invalid consent state input', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-INVALID' });

    expect(() =>
      client.updateConsent({
        // @ts-expect-error runtime validation coverage
        ad_storage: 'invalid'
      })
    ).toThrow(/Invalid consent value/);
  });

  it('deduplicates snapshot values when hydrating an existing data layer', () => {
    const existingStart = { event: 'gtm.js', 'gtm.start': 123 }; // server timestamp placeholder
    const existingConsent: unknown[] = ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' }];

    (globalThis as Record<string, unknown>).dataLayer = [existingStart, existingConsent];

    const client = createGtmClient({ containers: 'GTM-HYDRATE' });
    client.setConsentDefaults({ analytics_storage: 'denied', ad_storage: 'denied' });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

    const startEvents = dataLayer.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        !Array.isArray(entry) &&
        (entry as { event?: string }).event === 'gtm.js'
    );
    expect(startEvents).toHaveLength(1);

    const consentCommands = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    );
    expect(consentCommands).toHaveLength(1);
  });

  it('deduplicates identical consent defaults queued before init', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-QUEUE-DEDUP' });

    client.setConsentDefaults({ ad_storage: 'denied' });
    client.setConsentDefaults({ ad_storage: 'denied' });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const defaults = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    );

    expect(defaults).toHaveLength(1);
  });

  it('deduplicates identical consent updates after init', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-UPDATE-DEDUP' });

    client.init();

    client.updateConsent({ ad_storage: 'granted' });
    client.updateConsent({ ad_storage: 'granted' });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const updates = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
    );

    expect(updates).toHaveLength(1);
  });

  it('allows repeated non-consent events after initialization', () => {
    const client = createGtmClient({ containers: 'GTM-DUPLICATE-RUNTIME' });

    client.init();

    client.push({ event: 'runtime-event', value: 2 });
    client.push({ event: 'runtime-event', value: 2 });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const runtimeEvents = dataLayer.filter(
      (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === 'runtime-event'
    );

    expect(runtimeEvents).toHaveLength(2);
  });

  it('deduplicates consent updates regardless of property order', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-ORDER' });

    client.init();

    // Same consent state with different property order
    client.updateConsent({ ad_storage: 'granted', analytics_storage: 'denied' });
    client.updateConsent({ analytics_storage: 'denied', ad_storage: 'granted' });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const updates = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
    );

    // Should deduplicate despite different property order (signature sorts keys)
    expect(updates).toHaveLength(1);
  });

  it('handles rapid consent updates correctly without data loss', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-RAPID' });

    client.init();

    // Simulate rapid toggling of consent UI
    const states = [
      { ad_storage: 'denied' as const, analytics_storage: 'denied' as const },
      { ad_storage: 'granted' as const, analytics_storage: 'denied' as const },
      { ad_storage: 'granted' as const, analytics_storage: 'granted' as const },
      { ad_storage: 'denied' as const, analytics_storage: 'granted' as const },
      { ad_storage: 'denied' as const, analytics_storage: 'denied' as const } // Back to initial
    ];

    for (const state of states) {
      client.updateConsent(state);
    }

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const updates = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
    );

    // First and last are identical, so should be deduplicated (4 unique states)
    expect(updates).toHaveLength(4);
  });

  it('does not deduplicate consent commands with different options', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-OPTIONS' });

    client.init();

    // Same consent state but different region options
    client.updateConsent({ ad_storage: 'granted' });
    client.updateConsent({ ad_storage: 'granted' }, { region: ['US'] });
    client.updateConsent({ ad_storage: 'granted' }, { region: ['EU'] });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const updates = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
    );

    // Different options mean different signatures, so all should be pushed
    expect(updates).toHaveLength(3);
  });

  describe('dataLayer size limit', () => {
    it('uses default max size of 500 when not specified', () => {
      const client = createGtmClient({ containers: 'GTM-DEFAULT-SIZE' });
      client.init();

      // Push 500 events (at limit, no trimming yet)
      for (let i = 0; i < 499; i++) {
        client.push({ event: 'event', index: i });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      // 1 gtm.js start + 499 events = 500
      expect(dataLayer.length).toBe(500);
    });

    it('trims oldest non-critical entries when size limit is reached', () => {
      const client = createGtmClient({ containers: 'GTM-SIZE-LIMIT', maxDataLayerSize: 10 });
      client.init();

      // gtm.js is entry 0, push 11 more events to trigger trimming
      for (let i = 0; i < 12; i++) {
        client.push({ event: 'event', index: i });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.length).toBeLessThanOrEqual(10);

      // gtm.js should still be present
      const startEvent = dataLayer.find(
        (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === 'gtm.js'
      );
      expect(startEvent).toBeDefined();
    });

    it('preserves gtm.js start event when trimming', () => {
      const client = createGtmClient({ containers: 'GTM-PRESERVE-START', maxDataLayerSize: 5 });
      client.init();

      // Push many events to trigger trimming
      for (let i = 0; i < 20; i++) {
        client.push({ event: 'event', index: i });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const startEvent = dataLayer.find(
        (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === 'gtm.js'
      );
      expect(startEvent).toBeDefined();
    });

    it('preserves consent commands when trimming', () => {
      const client = createGtmClient({ containers: 'GTM-PRESERVE-CONSENT', maxDataLayerSize: 5 });
      client.setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'denied' });
      client.init();

      // Push many events to trigger trimming
      for (let i = 0; i < 20; i++) {
        client.push({ event: 'event', index: i });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const consentCommand = dataLayer.find(
        (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
      );
      expect(consentCommand).toBeDefined();
    });

    it('calls onDataLayerTrim callback when trimming occurs', () => {
      const onDataLayerTrim = jest.fn();
      const client = createGtmClient({
        containers: 'GTM-TRIM-CALLBACK',
        maxDataLayerSize: 5,
        onDataLayerTrim
      });
      client.init();

      // Push events to trigger trimming
      for (let i = 0; i < 10; i++) {
        client.push({ event: 'event', index: i });
      }

      expect(onDataLayerTrim).toHaveBeenCalled();
      expect(onDataLayerTrim.mock.calls[0][0]).toBeGreaterThan(0); // trimmedCount
      expect(typeof onDataLayerTrim.mock.calls[0][1]).toBe('number'); // currentSize
    });

    it('does not trim when maxDataLayerSize is 0 (unlimited)', () => {
      const client = createGtmClient({ containers: 'GTM-UNLIMITED', maxDataLayerSize: 0 });
      client.init();

      // Push many events
      for (let i = 0; i < 600; i++) {
        client.push({ event: 'event', index: i });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      expect(dataLayer.length).toBe(601); // 1 gtm.js + 600 events
    });

    it('handles edge case where all entries are critical', () => {
      const client = createGtmClient({ containers: 'GTM-ALL-CRITICAL', maxDataLayerSize: 3 });
      client.setConsentDefaults({ ad_storage: 'denied' });
      client.updateConsent({ ad_storage: 'granted' });
      client.init();

      // Push one more event - should still work even if over limit due to critical entries
      client.push({ event: 'normal-event' });

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      // Should have gtm.js, consent default, consent update, and the normal event
      expect(dataLayer.length).toBeGreaterThanOrEqual(3);
    });

    it('keeps most recent events when trimming', () => {
      const client = createGtmClient({ containers: 'GTM-RECENT', maxDataLayerSize: 5 });
      client.init();

      for (let i = 0; i < 10; i++) {
        client.push({ event: 'event', index: i });
      }

      const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
      const events = dataLayer.filter(
        (entry) => typeof entry === 'object' && entry !== null && (entry as { event?: string }).event === 'event'
      ) as { event: string; index: number }[];

      // Most recent events should be preserved (higher indices)
      const indices = events.map((e) => e.index);
      const maxIndex = Math.max(...indices);
      expect(maxIndex).toBe(9); // The last pushed event should be there
    });
  });
});
