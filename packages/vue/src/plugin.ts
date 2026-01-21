import { inject, ref, onErrorCaptured, type App, type InjectionKey, type Ref, type Component } from 'vue';
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
  /** Synchronously check if all GTM scripts have finished loading */
  isReady: () => boolean;
  /** Returns a promise that resolves when all GTM scripts are loaded */
  whenReady: () => Promise<ScriptLoadState[]>;
  /** Register a callback for when GTM scripts are ready */
  onReady: (callback: (state: ScriptLoadState[]) => void) => () => void;
  /** @internal Pre-computed consent API (memoized to avoid recreating on each useGtmConsent call) */
  _consentApi: GtmConsentApi;
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
// Track installed apps to prevent duplicate installations
const installedApps = new WeakSet<App>();

export const GtmPlugin = {
  install(app: App, options: GtmPluginOptions): void {
    // Guard against duplicate installation on the same app
    if (installedApps.has(app)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[gtm-kit/vue] GtmPlugin has already been installed on this Vue app. ' +
            'The duplicate installation will be ignored.'
        );
      }
      return;
    }
    installedApps.add(app);

    const { autoInit = true, onBeforeInit, ...clientOptions } = options;

    const client = createGtmClient(clientOptions);
    const hasOnBeforeInit = typeof onBeforeInit === 'function';

    // Pre-compute consent functions to avoid recreating closures on each call
    const setConsentDefaults = (state: ConsentState, regionOptions?: ConsentRegionOptions) => {
      // Warn if setConsentDefaults is called after init when onBeforeInit was also provided
      if (client.isInitialized() && hasOnBeforeInit && process.env.NODE_ENV !== 'production') {
        console.warn(
          '[gtm-kit/vue] setConsentDefaults() was called after initialization while onBeforeInit was also provided. ' +
            'When using onBeforeInit, set consent defaults there instead of calling setConsentDefaults() after init. ' +
            'Consent defaults should be set before GTM initialization to ensure proper tag behavior.'
        );
      }
      client.setConsentDefaults(state, regionOptions);
    };
    const updateConsent = (state: ConsentState, regionOptions?: ConsentRegionOptions) =>
      client.updateConsent(state, regionOptions);

    // Pre-compute the consent API object for memoization
    const consentApi: GtmConsentApi = { setConsentDefaults, updateConsent };

    const context: GtmContext = {
      client,
      push: (value: DataLayerValue) => client.push(value),
      setConsentDefaults,
      updateConsent,
      isReady: () => client.isReady(),
      whenReady: () => client.whenReady(),
      onReady: (callback: (state: ScriptLoadState[]) => void) => client.onReady(callback),
      _consentApi: consentApi
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

    // Register cleanup when the Vue app is unmounted
    // We wrap the app.unmount method to ensure proper teardown
    const originalUnmount = app.unmount.bind(app);
    app.unmount = () => {
      client.teardown();
      return originalUnmount();
    };
  }
};

/**
 * Internal helper to get the GTM context with proper error handling.
 */
const useGtmContext = (): GtmContext => {
  const context = inject(GTM_INJECTION_KEY);
  if (!context) {
    throw new Error(
      '[gtm-kit/vue] useGtm() was called outside of a Vue app with GtmPlugin installed. ' +
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
  // Return the pre-computed consent API object (memoized)
  return useGtmContext()._consentApi;
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

/**
 * Composable to check if GTM scripts have finished loading synchronously.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useIsGtmReady } from '@jwiedeman/gtm-kit-vue';
 *
 * const isReady = useIsGtmReady();
 *
 * // Check if GTM is ready
 * if (isReady()) {
 *   console.log('GTM is ready');
 * }
 * </script>
 * ```
 */
export const useIsGtmReady = (): (() => boolean) => {
  return useGtmContext().isReady;
};

/**
 * Options for useGtmErrorHandler composable.
 */
export interface GtmErrorHandlerOptions {
  /** Callback invoked when an error is caught */
  onError?: (error: Error, instance: Component | null, info: string) => void;
  /** Whether to log errors to console (default: true in development) */
  logErrors?: boolean;
}

/**
 * Return value from useGtmErrorHandler.
 */
export interface GtmErrorHandlerResult {
  /** Whether an error has been caught */
  hasError: Ref<boolean>;
  /** The caught error, if any */
  error: Ref<Error | null>;
  /** Reset the error state */
  reset: () => void;
}

/**
 * Composable to handle GTM-related errors in child components.
 * Use this in a parent component to catch and handle GTM errors gracefully.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGtmErrorHandler } from '@jwiedeman/gtm-kit-vue';
 *
 * const { hasError, error, reset } = useGtmErrorHandler({
 *   onError: (err) => console.error('GTM error:', err)
 * });
 * </script>
 *
 * <template>
 *   <div v-if="hasError">
 *     <p>GTM failed to load: {{ error?.message }}</p>
 *     <button @click="reset">Retry</button>
 *   </div>
 *   <div v-else>
 *     <GtmContent />
 *   </div>
 * </template>
 * ```
 */
/**
 * Checks if an error is GTM-related.
 *
 * Detection methods (in order of reliability):
 * 1. Check for `isGtmKitError` property (set by GTM Kit internal errors)
 * 2. Check if error name is 'GtmKitError'
 * 3. Check stack trace for installed gtm-kit package paths (node_modules)
 * 4. Fall back to message content (less reliable)
 */
const isGtmRelatedError = (err: Error): boolean => {
  // Method 1: Check for custom property (most reliable)
  if ('isGtmKitError' in err && err.isGtmKitError === true) {
    return true;
  }

  // Method 2: Check error name
  if (err.name === 'GtmKitError') {
    return true;
  }

  // Method 3: Check stack trace for INSTALLED gtm-kit packages
  // We specifically check for node_modules paths to avoid matching:
  // - Source files during development (packages/vue/src/...)
  // - Test files (packages/vue/src/__tests__/...)
  if (err.stack) {
    const stackLower = err.stack.toLowerCase();
    if (stackLower.includes('node_modules/@jwiedeman/gtm-kit') || stackLower.includes('node_modules/gtm-kit')) {
      return true;
    }
  }

  // Method 4: Check message for GTM Kit error format (falls back to string matching)
  // GTM Kit errors follow the format: [gtm-kit/package] message
  if (err.message.startsWith('[gtm-kit/')) {
    return true;
  }

  return false;
};

export const useGtmErrorHandler = (options: GtmErrorHandlerOptions = {}): GtmErrorHandlerResult => {
  const { onError, logErrors = process.env.NODE_ENV !== 'production' } = options;

  const hasError = ref(false);
  const error = ref<Error | null>(null);

  const reset = () => {
    hasError.value = false;
    error.value = null;
  };

  onErrorCaptured((err: Error, instance: Component | null, info: string) => {
    // Only handle GTM-related errors using robust detection
    if (isGtmRelatedError(err)) {
      hasError.value = true;
      error.value = err;

      if (logErrors) {
        console.error('[gtm-kit/vue] Error caught by useGtmErrorHandler:', err);
        console.error('[gtm-kit/vue] Component info:', info);
      }

      if (onError) {
        try {
          onError(err, instance, info);
        } catch {
          // Ignore callback errors
        }
      }

      // Return false to stop error propagation (equivalent to React error boundary behavior)
      return false;
    }

    // Let non-GTM errors propagate
    return true;
  });

  return { hasError, error, reset };
};

// Extend Vue's ComponentCustomProperties for Options API users
declare module 'vue' {
  interface ComponentCustomProperties {
    $gtm: GtmContext;
  }
}
