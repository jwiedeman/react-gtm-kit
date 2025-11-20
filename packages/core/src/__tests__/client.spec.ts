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
      expect.arrayContaining([
        expect.objectContaining({ containerId: 'GTM-READY-CLIENT', status: 'loaded' })
      ])
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
});
