import {
  createGtmClient,
  type ConsentRegionOptions,
  type ConsentState,
  type CreateGtmClientOptions,
  type DataLayerValue,
  type GtmClient,
  type ScriptLoadState
} from '@jwiedeman/gtm-kit';

let clientInstance: GtmClient | null = null;
let clientConfig: CreateGtmClientOptions | null = null;

/**
 * Initialize the GTM client for use in Astro.
 * Should be called once when the page loads.
 *
 * @example
 * ```ts
 * // In a client-side script
 * import { initGtm } from '@jwiedeman/gtm-kit-astro';
 *
 * initGtm({ containers: 'GTM-XXXXXX' });
 * ```
 */
export const initGtm = (options: CreateGtmClientOptions): GtmClient => {
  if (clientInstance && clientConfig) {
    // If already initialized with same config, return existing instance
    if (JSON.stringify(clientConfig) === JSON.stringify(options)) {
      return clientInstance;
    }
    // Teardown existing client if config changed
    clientInstance.teardown();
  }

  clientInstance = createGtmClient(options);
  clientConfig = options;
  clientInstance.init();

  return clientInstance;
};

/**
 * Get the current GTM client instance.
 * Returns null if not initialized.
 *
 * @example
 * ```ts
 * import { getGtmClient } from '@jwiedeman/gtm-kit-astro';
 *
 * const client = getGtmClient();
 * if (client) {
 *   client.push({ event: 'page_view' });
 * }
 * ```
 */
export const getGtmClient = (): GtmClient | null => clientInstance;

/**
 * Get the GTM client or throw if not initialized.
 * Use this when you expect the client to be available.
 *
 * @throws Error if GTM client is not initialized
 */
export const requireGtmClient = (): GtmClient => {
  if (!clientInstance) {
    throw new Error(
      '[gtm-kit/astro] GTM client not initialized. Call initGtm() first or ensure the GTM script has loaded.'
    );
  }
  return clientInstance;
};

/**
 * Push a value to the GTM dataLayer.
 * This is a convenience function that handles the case where GTM isn't initialized.
 *
 * @example
 * ```ts
 * import { push } from '@jwiedeman/gtm-kit-astro';
 *
 * push({ event: 'button_click', button_name: 'hero_cta' });
 * ```
 */
export const push = (value: DataLayerValue): void => {
  const client = getGtmClient();
  if (client) {
    client.push(value);
  } else if (typeof window !== 'undefined') {
    // Fallback: push directly to dataLayer if it exists
    const dataLayerName = clientConfig?.dataLayerName ?? 'dataLayer';
    const win = window as unknown as Record<string, unknown>;
    const dataLayer = win[dataLayerName] as DataLayerValue[] | undefined;
    if (Array.isArray(dataLayer)) {
      dataLayer.push(value);
    } else {
      console.warn('[gtm-kit/astro] GTM not initialized and dataLayer not found.');
    }
  }
};

/**
 * Set consent defaults (must be called before GTM loads).
 *
 * @example
 * ```ts
 * import { setConsentDefaults } from '@jwiedeman/gtm-kit-astro';
 *
 * setConsentDefaults({
 *   ad_storage: 'denied',
 *   analytics_storage: 'denied'
 * });
 * ```
 */
export const setConsentDefaults = (state: ConsentState, options?: ConsentRegionOptions): void => {
  const client = getGtmClient();
  if (client) {
    client.setConsentDefaults(state, options);
  } else {
    console.warn('[gtm-kit/astro] GTM not initialized. Consent defaults should be set before init.');
  }
};

/**
 * Update consent state after user interaction.
 *
 * @example
 * ```ts
 * import { updateConsent } from '@jwiedeman/gtm-kit-astro';
 *
 * // When user accepts cookies
 * updateConsent({
 *   ad_storage: 'granted',
 *   analytics_storage: 'granted',
 *   ad_user_data: 'granted',
 *   ad_personalization: 'granted'
 * });
 * ```
 */
export const updateConsent = (state: ConsentState, options?: ConsentRegionOptions): void => {
  const client = getGtmClient();
  if (client) {
    client.updateConsent(state, options);
  } else {
    console.warn('[gtm-kit/astro] GTM not initialized. Cannot update consent.');
  }
};

/**
 * Wait for GTM scripts to be ready.
 *
 * @example
 * ```ts
 * import { whenReady } from '@jwiedeman/gtm-kit-astro';
 *
 * whenReady().then((states) => {
 *   console.log('GTM loaded:', states);
 * });
 * ```
 */
export const whenReady = (): Promise<ScriptLoadState[]> => {
  const client = getGtmClient();
  if (client) {
    return client.whenReady();
  }
  return Promise.reject(new Error('[gtm-kit/astro] GTM not initialized.'));
};

/**
 * Clean up the GTM client.
 * Call this when navigating away or cleaning up.
 */
export const teardown = (): void => {
  if (clientInstance) {
    clientInstance.teardown();
    clientInstance = null;
    clientConfig = null;
  }
};
