import { inject, type App, type InjectionKey } from 'vue';
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
 * Options for the GTM Vue plugin.
 * Extends CreateGtmClientOptions with Vue-specific options.
 */
export interface GtmPluginOptions extends CreateGtmClientOptions {
  /**
   * Whether to automatically initialize GTM when the plugin is installed.
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
 * The GTM context value provided to components via inject().
 */
export interface GtmContext {
  /** The underlying GTM client instance */
  client: GtmClient;
  /** Push a value to the data layer */
  push: (value: DataLayerValue) => void;
  /** Set consent defaults (must be called before init) */
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  /** Update consent state */
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
  /** Returns a promise that resolves when all GTM scripts are loaded */
  whenReady: () => Promise<ScriptLoadState[]>;
  /** Register a callback for when GTM scripts are ready */
  onReady: (callback: (state: ScriptLoadState[]) => void) => () => void;
}

/**
 * Consent-specific API subset.
 */
export interface GtmConsentApi {
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
}

/**
 * Injection key for the GTM context.
 * Use this with inject() to access the GTM context directly.
 */
export const GTM_INJECTION_KEY: InjectionKey<GtmContext> = Symbol('gtm-kit');

/**
 * Vue 3 plugin for GTM Kit.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';
 *
 * createApp(App)
 *   .use(GtmPlugin, { containers: 'GTM-XXXXXX' })
 *   .mount('#app');
 * ```
 */
export const GtmPlugin = {
  install(app: App, options: GtmPluginOptions): void {
    const { autoInit = true, onBeforeInit, ...clientOptions } = options;

    const client = createGtmClient(clientOptions);

    const context: GtmContext = {
      client,
      push: (value: DataLayerValue) => client.push(value),
      setConsentDefaults: (state: ConsentState, regionOptions?: ConsentRegionOptions) =>
        client.setConsentDefaults(state, regionOptions),
      updateConsent: (state: ConsentState, regionOptions?: ConsentRegionOptions) =>
        client.updateConsent(state, regionOptions),
      whenReady: () => client.whenReady(),
      onReady: (callback: (state: ScriptLoadState[]) => void) => client.onReady(callback)
    };

    // Provide the context to all components
    app.provide(GTM_INJECTION_KEY, context);

    // Also make it available as a global property for Options API users
    app.config.globalProperties.$gtm = context;

    // Call onBeforeInit hook if provided (for consent defaults)
    if (onBeforeInit) {
      onBeforeInit(client);
    }

    // Auto-initialize if enabled
    if (autoInit) {
      client.init();
    }

    // Register cleanup on app unmount
    app.mixin({
      unmounted() {
        // Note: This runs for each component, but teardown is idempotent
        // The actual teardown should only happen when the app is fully unmounted
      }
    });
  }
};

/**
 * Internal helper to get the GTM context with proper error handling.
 */
const useGtmContext = (): GtmContext => {
  const context = inject(GTM_INJECTION_KEY);
  if (!context) {
    throw new Error(
      '[gtm-kit] useGtm() was called outside of a Vue app with GtmPlugin installed. ' +
        'Make sure to call app.use(GtmPlugin, { containers: "GTM-XXXXXX" }) before using GTM composables.'
    );
  }
  return context;
};

/**
 * Composable to access the full GTM context.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGtm } from '@jwiedeman/gtm-kit-vue';
 *
 * const { push, client, whenReady } = useGtm();
 *
 * function trackClick() {
 *   push({ event: 'button_click', button_name: 'hero_cta' });
 * }
 * </script>
 * ```
 */
export const useGtm = (): GtmContext => {
  return useGtmContext();
};

/**
 * Composable to get just the push function.
 * Use this when you only need to push events.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGtmPush } from '@jwiedeman/gtm-kit-vue';
 *
 * const push = useGtmPush();
 *
 * function handlePurchase() {
 *   push({ event: 'purchase', value: 99.99 });
 * }
 * </script>
 * ```
 */
export const useGtmPush = (): ((value: DataLayerValue) => void) => {
  return useGtmContext().push;
};

/**
 * Composable to access consent management functions.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';
 *
 * const { updateConsent } = useGtmConsent();
 *
 * function acceptAll() {
 *   updateConsent({
 *     ad_storage: 'granted',
 *     analytics_storage: 'granted',
 *     ad_user_data: 'granted',
 *     ad_personalization: 'granted'
 *   });
 * }
 * </script>
 * ```
 */
export const useGtmConsent = (): GtmConsentApi => {
  const { setConsentDefaults, updateConsent } = useGtmContext();
  return { setConsentDefaults, updateConsent };
};

/**
 * Composable to get the raw GTM client instance.
 * Use this when you need direct access to the client.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGtmClient } from '@jwiedeman/gtm-kit-vue';
 *
 * const client = useGtmClient();
 *
 * // Check if client is initialized
 * if (client.isInitialized()) {
 *   console.log('GTM is ready');
 * }
 * </script>
 * ```
 */
export const useGtmClient = (): GtmClient => {
  return useGtmContext().client;
};

/**
 * Composable to get the whenReady function.
 * Use this to wait for GTM scripts to load.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGtmReady } from '@jwiedeman/gtm-kit-vue';
 * import { onMounted } from 'vue';
 *
 * const whenReady = useGtmReady();
 *
 * onMounted(async () => {
 *   const states = await whenReady();
 *   console.log('GTM scripts loaded:', states);
 * });
 * </script>
 * ```
 */
export const useGtmReady = (): (() => Promise<ScriptLoadState[]>) => {
  return useGtmContext().whenReady;
};

// Extend Vue's ComponentCustomProperties for Options API users
declare module 'vue' {
  interface ComponentCustomProperties {
    $gtm: GtmContext;
  }
}
