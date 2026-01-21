import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import {
  createGtmClient,
  type ConsentRegionOptions,
  type ConsentState,
  type CreateGtmClientOptions,
  type DataLayerValue,
  type GtmClient,
  type ScriptLoadState
} from '@jwiedeman/gtm-kit';

/**
 * Options for creating a GTM store.
 * Extends CreateGtmClientOptions with Svelte-specific options.
 */
export interface GtmStoreOptions extends CreateGtmClientOptions {
  /**
   * Whether to automatically initialize GTM when the store is created.
   * @default true
   */
  autoInit?: boolean;

  /**
   * Callback executed before GTM initialization.
   * Use this to set consent defaults.
   */
  onBeforeInit?: (client: GtmClient) => void;
}

/**
 * The GTM store value containing all GTM functionality.
 */
export interface GtmStoreValue {
  /** The underlying GTM client instance */
  client: GtmClient;
  /** Push a value to the data layer */
  push: (value: DataLayerValue) => void;
  /** Set consent defaults (must be called before init) */
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  /** Update consent state */
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
  /** Synchronously check if all GTM scripts have finished loading */
  isReady: () => boolean;
  /** Returns a promise that resolves when all GTM scripts are loaded */
  whenReady: () => Promise<ScriptLoadState[]>;
  /** Register a callback for when GTM scripts are ready */
  onReady: (callback: (state: ScriptLoadState[]) => void) => () => void;
  /** Whether GTM has been initialized */
  initialized: boolean;
}

/**
 * Consent-specific API subset.
 */
export interface GtmConsentApi {
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
}

/** Context key for GTM store */
const GTM_CONTEXT_KEY = Symbol('gtm-kit');

/**
 * Create a GTM store for Svelte.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
 *   import { onMount } from 'svelte';
 *
 *   const gtm = createGtmStore({ containers: 'GTM-XXXXXX' });
 *   setGtmContext(gtm);
 * </script>
 * ```
 */
export function createGtmStore(options: GtmStoreOptions): Writable<GtmStoreValue> {
  const { autoInit = true, onBeforeInit, ...clientOptions } = options;

  const client = createGtmClient(clientOptions);

  const initialValue: GtmStoreValue = {
    client,
    push: (value: DataLayerValue) => client.push(value),
    setConsentDefaults: (state: ConsentState, regionOptions?: ConsentRegionOptions) =>
      client.setConsentDefaults(state, regionOptions),
    updateConsent: (state: ConsentState, regionOptions?: ConsentRegionOptions) =>
      client.updateConsent(state, regionOptions),
    isReady: () => client.isReady(),
    whenReady: () => client.whenReady(),
    onReady: (callback: (state: ScriptLoadState[]) => void) => client.onReady(callback),
    initialized: false
  };

  const store = writable<GtmStoreValue>(initialValue);

  // Call onBeforeInit hook if provided (for consent defaults)
  if (onBeforeInit) {
    onBeforeInit(client);
  }

  // Auto-initialize if enabled
  if (autoInit) {
    client.init();
    store.update((s) => ({ ...s, initialized: true }));
  }

  return store;
}

/**
 * Get the GTM context from a parent component.
 * Must be called during component initialization.
 *
 * @example
 * ```svelte
 * <script>
 *   import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';
 *
 *   const gtm = getGtmContext();
 *   $: ({ push } = $gtm);
 * </script>
 * ```
 */
export function getGtmContext(): Writable<GtmStoreValue> {
  const context = getContext<Writable<GtmStoreValue>>(GTM_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      '[gtm-kit/svelte] getGtmContext() was called outside of a component tree with GTM context. ' +
        'Make sure to call setGtmContext() in a parent component.'
    );
  }
  return context;
}

/**
 * Set the GTM context for child components.
 * Call this in your root layout or App component.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
 *
 *   const gtm = createGtmStore({ containers: 'GTM-XXXXXX' });
 *   setGtmContext(gtm);
 * </script>
 *
 * <slot />
 * ```
 */
export function setGtmContext(store: Writable<GtmStoreValue>): void {
  // Check if a context already exists (nested context)
  try {
    const existing = getContext<Writable<GtmStoreValue>>(GTM_CONTEXT_KEY);
    if (existing) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[gtm-kit/svelte] setGtmContext() was called when a GTM context already exists. ' +
            'You should only have one GTM context at the root of your app. ' +
            'The duplicate context will be ignored.'
        );
      }
      return;
    }
  } catch {
    // getContext throws when called outside component initialization, which is fine
  }
  setContext(GTM_CONTEXT_KEY, store);
}

/**
 * Alias for getGtmContext() - get the full GTM store.
 */
export const gtmContext = getGtmContext;

/**
 * Get a derived store that provides just the push function.
 * Use this when you only need to push events.
 *
 * @example
 * ```svelte
 * <script>
 *   import { gtmPush } from '@jwiedeman/gtm-kit-svelte';
 *
 *   const push = gtmPush();
 *
 *   function handleClick() {
 *     $push({ event: 'button_click' });
 *   }
 * </script>
 * ```
 */
export function gtmPush(): Readable<(value: DataLayerValue) => void> {
  const store = getGtmContext();
  return derived(store, ($store) => $store.push);
}

/**
 * Get a derived store that provides consent functions.
 *
 * @example
 * ```svelte
 * <script>
 *   import { gtmConsent } from '@jwiedeman/gtm-kit-svelte';
 *
 *   const consent = gtmConsent();
 *
 *   function acceptAll() {
 *     $consent.updateConsent({ analytics_storage: 'granted' });
 *   }
 * </script>
 * ```
 */
export function gtmConsent(): Readable<GtmConsentApi> {
  const store = getGtmContext();
  return derived(store, ($store) => ({
    setConsentDefaults: $store.setConsentDefaults,
    updateConsent: $store.updateConsent
  }));
}

/**
 * Get a derived store that provides the raw GTM client.
 *
 * @example
 * ```svelte
 * <script>
 *   import { gtmClient } from '@jwiedeman/gtm-kit-svelte';
 *
 *   const client = gtmClient();
 * </script>
 * ```
 */
export function gtmClient(): Readable<GtmClient> {
  const store = getGtmContext();
  return derived(store, ($store) => $store.client);
}

/**
 * Get a derived store that provides the whenReady function.
 *
 * @example
 * ```svelte
 * <script>
 *   import { gtmReady } from '@jwiedeman/gtm-kit-svelte';
 *   import { onMount } from 'svelte';
 *
 *   const whenReady = gtmReady();
 *
 *   onMount(async () => {
 *     const states = await $whenReady();
 *     console.log('GTM loaded:', states);
 *   });
 * </script>
 * ```
 */
export function gtmReady(): Readable<() => Promise<ScriptLoadState[]>> {
  const store = getGtmContext();
  return derived(store, ($store) => $store.whenReady);
}

/**
 * Get a derived store that provides the isReady function.
 * Use this to check synchronously if GTM scripts have finished loading.
 *
 * @example
 * ```svelte
 * <script>
 *   import { gtmIsReady } from '@jwiedeman/gtm-kit-svelte';
 *
 *   const isReady = gtmIsReady();
 *
 *   // Check if GTM is ready
 *   if ($isReady()) {
 *     console.log('GTM is ready');
 *   }
 * </script>
 * ```
 */
export function gtmIsReady(): Readable<() => boolean> {
  const store = getGtmContext();
  return derived(store, ($store) => $store.isReady);
}

/**
 * Teardown the GTM client and clean up resources.
 * Call this in your component's onDestroy lifecycle hook.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createGtmStore, setGtmContext, destroyGtmStore } from '@jwiedeman/gtm-kit-svelte';
 *   import { onDestroy } from 'svelte';
 *
 *   const gtm = createGtmStore({ containers: 'GTM-XXXXXX' });
 *   setGtmContext(gtm);
 *
 *   onDestroy(() => {
 *     destroyGtmStore(gtm);
 *   });
 * </script>
 * ```
 */
export function destroyGtmStore(store: Writable<GtmStoreValue>): void {
  let storeValue: GtmStoreValue | null = null;

  // Get the store value synchronously
  const unsubscribe = store.subscribe((value) => {
    storeValue = value;
  });
  unsubscribe();

  // Teardown the client
  if (storeValue !== null) {
    (storeValue as GtmStoreValue).client.teardown();
    store.update((s) => ({ ...s, initialized: false }));
  }
}
