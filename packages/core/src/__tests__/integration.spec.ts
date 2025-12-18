/**
 * Integration tests for complex GTM Kit scenarios
 *
 * These tests verify that multiple features work together correctly,
 * including multi-container setups, CSP compliance, and advanced consent flows.
 */
import { createGtmClient, consentPresets, createNoscriptMarkup } from '../../src';

describe('Multi-Container Integration', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles primary and secondary containers with different configs', () => {
    const client = createGtmClient({
      containers: [
        { id: 'GTM-PRIMARY' },
        { id: 'GTM-STAGING', queryParams: { gtm_preview: 'env-123', gtm_auth: 'staging-auth' } },
        { id: 'GTM-ANALYTICS', queryParams: { gtm_cookies_win: 'x' } }
      ]
    });

    client.init();

    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]');
    expect(scripts).toHaveLength(3);

    // Verify each container has correct configuration
    const primaryScript = document.querySelector('script[data-gtm-container-id="GTM-PRIMARY"]');
    const stagingScript = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-STAGING"]');
    const analyticsScript = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-ANALYTICS"]');

    expect(primaryScript).not.toBeNull();
    expect(stagingScript?.src).toContain('gtm_preview=env-123');
    expect(stagingScript?.src).toContain('gtm_auth=staging-auth');
    expect(analyticsScript?.src).toContain('gtm_cookies_win=x');
  });

  it('applies default query params to all containers', () => {
    const client = createGtmClient({
      containers: ['GTM-ONE', 'GTM-TWO', 'GTM-THREE'],
      defaultQueryParams: { gtm_auth: 'global-auth', gtm_preview: 'global-env' }
    });

    client.init();

    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]');

    scripts.forEach((script) => {
      expect(script.src).toContain('gtm_auth=global-auth');
      expect(script.src).toContain('gtm_preview=global-env');
    });
  });

  it('allows container-specific params to override defaults', () => {
    const client = createGtmClient({
      containers: [
        { id: 'GTM-DEFAULT' },
        { id: 'GTM-CUSTOM', queryParams: { gtm_preview: 'custom-env' } }
      ],
      defaultQueryParams: { gtm_preview: 'default-env' }
    });

    client.init();

    const defaultScript = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-DEFAULT"]');
    const customScript = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-CUSTOM"]');

    expect(defaultScript?.src).toContain('gtm_preview=default-env');
    expect(customScript?.src).toContain('gtm_preview=custom-env');
  });

  it('shares single data layer across all containers', () => {
    const client = createGtmClient({
      containers: ['GTM-A', 'GTM-B', 'GTM-C']
    });

    client.init();
    client.push({ event: 'shared_event', value: 'test' });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

    // All containers are injected
    const scripts = document.querySelectorAll('script[data-gtm-container-id]');
    expect(scripts).toHaveLength(3);

    // Event is in the shared data layer
    expect(dataLayer).toContainEqual(
      expect.objectContaining({ event: 'shared_event', value: 'test' })
    );
  });
});

describe('CSP (Content Security Policy) Integration', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('applies nonce to all injected scripts', () => {
    const client = createGtmClient({
      containers: ['GTM-CSP1', 'GTM-CSP2'],
      scriptAttributes: { nonce: 'random-nonce-value' }
    });

    client.init();

    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-gtm-container-id]');

    scripts.forEach((script) => {
      expect(script.getAttribute('nonce')).toBe('random-nonce-value');
      expect(script.nonce).toBe('random-nonce-value');
    });
  });

  it('supports custom host with nonce', () => {
    const client = createGtmClient({
      containers: 'GTM-CUSTOM-HOST',
      host: 'https://custom-gtm-server.example.com/',
      scriptAttributes: { nonce: 'csp-nonce-123' }
    });

    client.init();

    const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-CUSTOM-HOST"]');

    expect(script?.src).toContain('custom-gtm-server.example.com');
    expect(script?.nonce).toBe('csp-nonce-123');
  });

  it('generates noscript tag with correct attributes for CSP', () => {
    const html = createNoscriptMarkup('GTM-NOSCRIPT-CSP', {
      host: 'https://custom.gtm.com/'
    });

    expect(html).toContain('custom.gtm.com/ns.html');
    expect(html).toContain('id=GTM-NOSCRIPT-CSP');
    expect(html).toContain('display:none');
    expect(html).toContain('visibility:hidden');
  });

  it('combines custom host, data layer name, and query params', () => {
    const client = createGtmClient({
      containers: {
        id: 'GTM-FULL-CUSTOM',
        queryParams: { gtm_preview: 'env-5' }
      },
      host: 'https://gtm.mycompany.com',
      dataLayerName: 'myCustomDataLayer',
      defaultQueryParams: { gtm_auth: 'company-auth' },
      scriptAttributes: {
        nonce: 'company-nonce',
        'data-category': 'analytics'
      }
    });

    client.init();

    const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-FULL-CUSTOM"]');

    // Verify all customizations applied
    expect(script?.src).toContain('gtm.mycompany.com');
    expect(script?.src).toContain('l=myCustomDataLayer');
    expect(script?.src).toContain('gtm_auth=company-auth');
    expect(script?.src).toContain('gtm_preview=env-5');
    expect(script?.nonce).toBe('company-nonce');
    expect(script?.getAttribute('data-category')).toBe('analytics');

    // Verify custom data layer is used
    expect((globalThis as Record<string, unknown>).myCustomDataLayer).toBeDefined();
  });
});

describe('Consent Mode v2 Integration', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('applies EEA default consent preset correctly', () => {
    const client = createGtmClient({ containers: 'GTM-EEA-CONSENT' });

    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const consentDefault = dataLayer.find(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    ) as unknown[];

    expect(consentDefault).toBeDefined();
    expect(consentDefault[2]).toMatchObject({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    expect(consentDefault[3]).toMatchObject({ region: ['EEA'] });
  });

  it('applies all-granted preset correctly', () => {
    const client = createGtmClient({ containers: 'GTM-ALL-GRANTED' });

    client.setConsentDefaults(consentPresets.allGranted);
    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const consentDefault = dataLayer.find(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    ) as unknown[];

    expect(consentDefault[2]).toMatchObject({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  });

  it('applies analytics-only preset correctly', () => {
    const client = createGtmClient({ containers: 'GTM-ANALYTICS-ONLY' });

    client.setConsentDefaults(consentPresets.analyticsOnly);
    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const consentDefault = dataLayer.find(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    ) as unknown[];

    expect(consentDefault[2]).toMatchObject({
      ad_storage: 'denied',
      analytics_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  });

  it('handles multiple region-specific consent configurations', () => {
    const client = createGtmClient({ containers: 'GTM-MULTI-REGION' });

    // Global default - most permissive
    client.setConsentDefaults(consentPresets.allGranted);

    // EU restriction
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });

    // US - analytics only
    client.setConsentDefaults(consentPresets.analyticsOnly, { region: ['US-CA'] });

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const consentDefaults = dataLayer.filter(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    );

    // Should have 3 consent defaults (one for each region config)
    expect(consentDefaults.length).toBe(3);
  });

  it('processes consent update after user interaction', () => {
    const client = createGtmClient({ containers: 'GTM-CONSENT-FLOW' });

    // Set restricted defaults
    client.setConsentDefaults({
      ad_storage: 'denied',
      analytics_storage: 'denied'
    });

    client.init();

    // Simulate user accepting cookies
    client.updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const consentUpdate = dataLayer.find(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
    ) as unknown[];

    expect(consentUpdate).toBeDefined();
    expect(consentUpdate[2]).toMatchObject({
      ad_storage: 'granted',
      analytics_storage: 'granted'
    });
  });

  it('respects wait_for_update option', () => {
    const client = createGtmClient({ containers: 'GTM-WAIT-UPDATE' });

    client.setConsentDefaults(
      { ad_storage: 'denied', analytics_storage: 'denied' },
      { region: ['EEA'], waitForUpdate: 2000 }
    );

    client.init();

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const consentDefault = dataLayer.find(
      (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
    ) as unknown[];

    expect(consentDefault[3]).toMatchObject({
      region: ['EEA'],
      wait_for_update: 2000
    });
  });
});

describe('E-commerce Event Integration', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles GA4 view_item event', () => {
    const client = createGtmClient({ containers: 'GTM-ECOMMERCE' });
    client.init();

    client.push({
      event: 'view_item',
      ecommerce: {
        currency: 'USD',
        value: 29.99,
        items: [
          {
            item_id: 'SKU-123',
            item_name: 'Test Product',
            price: 29.99,
            quantity: 1
          }
        ]
      }
    });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const viewItem = dataLayer.find(
      (e) => typeof e === 'object' && (e as { event?: string }).event === 'view_item'
    ) as Record<string, unknown>;

    expect(viewItem).toBeDefined();
    expect(viewItem.ecommerce).toMatchObject({
      currency: 'USD',
      value: 29.99
    });
  });

  it('handles GA4 add_to_cart event', () => {
    const client = createGtmClient({ containers: 'GTM-ECOMMERCE' });
    client.init();

    client.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'USD',
        value: 59.98,
        items: [
          { item_id: 'SKU-123', item_name: 'Product A', price: 29.99, quantity: 2 }
        ]
      }
    });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'add_to_cart',
        ecommerce: expect.objectContaining({ value: 59.98 })
      })
    );
  });

  it('handles GA4 purchase event with complete data', () => {
    const client = createGtmClient({ containers: 'GTM-ECOMMERCE' });
    client.init();

    const purchaseEvent = {
      event: 'purchase',
      ecommerce: {
        transaction_id: 'T-12345',
        value: 109.97,
        tax: 10.00,
        shipping: 5.00,
        currency: 'USD',
        coupon: 'SAVE10',
        items: [
          {
            item_id: 'SKU-001',
            item_name: 'Product One',
            price: 49.99,
            quantity: 1,
            item_category: 'Category A'
          },
          {
            item_id: 'SKU-002',
            item_name: 'Product Two',
            price: 59.98,
            quantity: 2,
            item_category: 'Category B'
          }
        ]
      }
    };

    client.push(purchaseEvent);

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    const purchase = dataLayer.find(
      (e) => typeof e === 'object' && (e as { event?: string }).event === 'purchase'
    );

    expect(purchase).toMatchObject(purchaseEvent);
  });

  it('clears previous ecommerce data before new event', () => {
    const client = createGtmClient({ containers: 'GTM-ECOMMERCE-CLEAR' });
    client.init();

    // Send ecommerce clear before new event (GTM best practice)
    client.push({ ecommerce: null });
    client.push({
      event: 'view_item_list',
      ecommerce: {
        item_list_id: 'search_results',
        items: [{ item_id: 'SKU-1' }]
      }
    });

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];

    // Should have both the clear and the new event
    expect(dataLayer).toContainEqual({ ecommerce: null });
    expect(dataLayer).toContainEqual(
      expect.objectContaining({ event: 'view_item_list' })
    );
  });
});

describe('Lifecycle Integration', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (globalThis as Record<string, unknown>).dataLayer;
  });

  it('handles complete setup -> use -> teardown cycle', () => {
    // Setup
    const client = createGtmClient({ containers: 'GTM-LIFECYCLE' });

    client.setConsentDefaults({ analytics_storage: 'denied' });
    client.push({ event: 'pre_init_event' });

    client.init();

    // Use
    expect(client.isInitialized()).toBe(true);

    client.push({ event: 'post_init_event' });
    client.updateConsent({ analytics_storage: 'granted' });

    // Verify state
    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer.length).toBeGreaterThan(3);
    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(1);

    // Teardown
    client.teardown();

    expect(client.isInitialized()).toBe(false);
    expect(document.querySelectorAll('script[data-gtm-container-id]')).toHaveLength(0);
  });

  it('handles re-initialization after teardown', () => {
    const client = createGtmClient({ containers: 'GTM-REINIT' });

    // First lifecycle
    client.init();
    client.push({ event: 'first_session_event' });
    client.teardown();

    // Second lifecycle
    client.init();
    client.push({ event: 'second_session_event' });

    expect(client.isInitialized()).toBe(true);

    const dataLayer = (globalThis as Record<string, unknown>).dataLayer as unknown[];
    expect(dataLayer).toContainEqual(
      expect.objectContaining({ event: 'second_session_event' })
    );
  });

  it('tracks multiple whenReady callbacks', async () => {
    const client = createGtmClient({ containers: 'GTM-READY-MULTI' });
    const callbacks: string[] = [];

    client.init();

    const promise1 = client.whenReady().then(() => callbacks.push('promise1'));
    const promise2 = client.whenReady().then(() => callbacks.push('promise2'));

    client.onReady(() => callbacks.push('callback1'));
    client.onReady(() => callbacks.push('callback2'));

    // Simulate script load
    const script = document.querySelector<HTMLScriptElement>('script[data-gtm-container-id="GTM-READY-MULTI"]');
    script?.dispatchEvent(new Event('load'));

    await Promise.all([promise1, promise2]);

    expect(callbacks).toContain('promise1');
    expect(callbacks).toContain('promise2');
    expect(callbacks).toContain('callback1');
    expect(callbacks).toContain('callback2');
  });
});
