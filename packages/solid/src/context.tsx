import { createContext, useContext, onCleanup, type JSX } from 'solid-js';
import { createStore } from 'solid-js/store';
import {
  createGtmClient,
  type ConsentRegionOptions,
  type ConsentState,
  type CreateGtmClientOptions,
  type DataLayerValue,
  type GtmClient,
  type ScriptLoadState
} from '@react-gtm-kit/core';

/**
 * Props for the GTM Provider component.
 */
export interface GtmProviderProps extends CreateGtmClientOptions {
  /** Child components */
  children: JSX.Element;

  /**
   * Whether to automatically initialize GTM when the provider mounts.
   * @default true
   */
  autoInit?: boolean;

  /**
   * Callback executed before GTM initialization.
   * Use this to set consent defaults.
   */
  onBeforeInit?: (client: GtmClient) => void;

  /**
   * Callback executed after GTM initialization.
   */
  onAfterInit?: (client: GtmClient) => void;
}

/**
 * The GTM context value containing all GTM functionality.
 */
export interface GtmContextValue {
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

/**
 * The GTM context for SolidJS.
 */
export const GtmContext = createContext<GtmContextValue>();

/**
 * GTM Provider component for SolidJS.
 *
 * @example
 * ```tsx
 * import { GtmProvider } from '@react-gtm-kit/solid';
 *
 * function App() {
 *   return (
 *     <GtmProvider containers="GTM-XXXXXX">
 *       <MyApp />
 *     </GtmProvider>
 *   );
 * }
 * ```
 */
export function GtmProvider(props: GtmProviderProps): JSX.Element {
  // Note: Don't destructure children - in Solid.js, children is a getter that
  // should only be accessed inside the returned JSX to maintain proper reactivity
  const autoInit = props.autoInit ?? true;
  const onBeforeInit = props.onBeforeInit;
  const onAfterInit = props.onAfterInit;

  // Extract client options (everything except children and lifecycle hooks)
  const clientOptions: CreateGtmClientOptions = {
    containers: props.containers,
    ...(props.dataLayerName && { dataLayerName: props.dataLayerName }),
    ...(props.host && { host: props.host }),
    ...(props.scriptAttributes && { scriptAttributes: props.scriptAttributes })
  };

  const client = createGtmClient(clientOptions);

  const [state, setState] = createStore<{ initialized: boolean }>({
    initialized: false
  });

  const contextValue: GtmContextValue = {
    client,
    push: (value: DataLayerValue) => client.push(value),
    setConsentDefaults: (consentState: ConsentState, regionOptions?: ConsentRegionOptions) =>
      client.setConsentDefaults(consentState, regionOptions),
    updateConsent: (consentState: ConsentState, regionOptions?: ConsentRegionOptions) =>
      client.updateConsent(consentState, regionOptions),
    whenReady: () => client.whenReady(),
    onReady: (callback: (loadState: ScriptLoadState[]) => void) => client.onReady(callback),
    get initialized() {
      return state.initialized;
    }
  };

  // Call onBeforeInit hook if provided (for consent defaults)
  if (onBeforeInit) {
    onBeforeInit(client);
  }

  // Auto-initialize if enabled
  if (autoInit) {
    client.init();
    setState('initialized', true);

    // Call onAfterInit hook if provided
    if (onAfterInit) {
      onAfterInit(client);
    }
  }

  // Cleanup on unmount
  onCleanup(() => {
    client.teardown();
  });

  return <GtmContext.Provider value={contextValue}>{props.children}</GtmContext.Provider>;
}

/**
 * Internal helper to get the GTM context with proper error handling.
 */
const useGtmContext = (): GtmContextValue => {
  const context = useContext(GtmContext);
  if (!context) {
    throw new Error(
      '[gtm-kit] useGtm() was called outside of a GtmProvider. ' +
        'Make sure to wrap your app with <GtmProvider containers="GTM-XXXXXX">.'
    );
  }
  return context;
};

/**
 * Hook to access the full GTM context.
 *
 * @example
 * ```tsx
 * import { useGtm } from '@react-gtm-kit/solid';
 *
 * function MyComponent() {
 *   const { push, client } = useGtm();
 *
 *   return (
 *     <button onClick={() => push({ event: 'click' })}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export const useGtm = (): GtmContextValue => {
  return useGtmContext();
};

/**
 * Hook to get just the push function.
 * Use this when you only need to push events.
 *
 * @example
 * ```tsx
 * import { useGtmPush } from '@react-gtm-kit/solid';
 *
 * function MyComponent() {
 *   const push = useGtmPush();
 *
 *   return (
 *     <button onClick={() => push({ event: 'purchase', value: 99 })}>
 *       Buy
 *     </button>
 *   );
 * }
 * ```
 */
export const useGtmPush = (): ((value: DataLayerValue) => void) => {
  return useGtmContext().push;
};

/**
 * Hook to access consent management functions.
 *
 * @example
 * ```tsx
 * import { useGtmConsent } from '@react-gtm-kit/solid';
 *
 * function CookieBanner() {
 *   const { updateConsent } = useGtmConsent();
 *
 *   const acceptAll = () => {
 *     updateConsent({
 *       ad_storage: 'granted',
 *       analytics_storage: 'granted'
 *     });
 *   };
 *
 *   return <button onClick={acceptAll}>Accept All</button>;
 * }
 * ```
 */
export const useGtmConsent = (): GtmConsentApi => {
  const { setConsentDefaults, updateConsent } = useGtmContext();
  return { setConsentDefaults, updateConsent };
};

/**
 * Hook to get the raw GTM client instance.
 *
 * @example
 * ```tsx
 * import { useGtmClient } from '@react-gtm-kit/solid';
 *
 * function MyComponent() {
 *   const client = useGtmClient();
 *
 *   return <div>Initialized: {client.isInitialized() ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export const useGtmClient = (): GtmClient => {
  return useGtmContext().client;
};

/**
 * Hook to get the whenReady function.
 * Use this to wait for GTM scripts to load.
 *
 * @example
 * ```tsx
 * import { useGtmReady } from '@react-gtm-kit/solid';
 * import { onMount } from 'solid-js';
 *
 * function MyComponent() {
 *   const whenReady = useGtmReady();
 *
 *   onMount(async () => {
 *     const states = await whenReady();
 *     console.log('GTM loaded:', states);
 *   });
 *
 *   return <div>Loading...</div>;
 * }
 * ```
 */
export const useGtmReady = (): (() => Promise<ScriptLoadState[]>) => {
  return useGtmContext().whenReady;
};
