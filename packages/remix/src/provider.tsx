import React, { createContext, useContext, useEffect, useRef, useMemo, type ReactNode } from 'react';
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
 * Props for the GTM Provider component.
 */
export interface GtmProviderProps {
  /** GTM client configuration */
  config: CreateGtmClientOptions;

  /** Child components */
  children: ReactNode;

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
}

/**
 * Consent-specific API subset.
 */
export interface GtmConsentApi {
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
}

/**
 * The GTM context for Remix.
 */
export const GtmContext = createContext<GtmContextValue | null>(null);

/**
 * GTM Provider component for Remix.
 * Handles StrictMode correctly and provides GTM context to children.
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * import { GtmProvider } from '@jwiedeman/gtm-kit-remix';
 *
 * export default function App() {
 *   return (
 *     <html>
 *       <head />
 *       <body>
 *         <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
 *           <Outlet />
 *         </GtmProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function GtmProvider({ config, children, onBeforeInit, onAfterInit }: GtmProviderProps): React.ReactElement {
  // Create client once and store in ref to survive StrictMode remounts
  const clientRef = useRef<GtmClient | null>(null);
  const initializedRef = useRef(false);

  // Create client on first render only
  if (!clientRef.current) {
    clientRef.current = createGtmClient(config);
  }

  const client = clientRef.current;

  // Initialize GTM (handles StrictMode correctly)
  useEffect(() => {
    // Skip if already initialized (StrictMode protection)
    if (initializedRef.current) {
      return;
    }

    // Call onBeforeInit hook for consent defaults
    if (onBeforeInit) {
      onBeforeInit(client);
    }

    // Initialize GTM
    client.init();
    initializedRef.current = true;

    // Call onAfterInit hook
    if (onAfterInit) {
      onAfterInit(client);
    }

    // Cleanup on unmount
    return () => {
      // Don't teardown immediately in StrictMode
      // Only teardown if we're truly unmounting
      const timer = setTimeout(() => {
        if (!document.querySelector('[data-gtm-kit-provider]')) {
          client.teardown();
          clientRef.current = null;
          initializedRef.current = false;
        }
      }, 100);

      // Clear the timeout on cleanup
      clearTimeout(timer);
    };
  }, [client, onBeforeInit, onAfterInit]);

  // Memoize context value
  const contextValue = useMemo<GtmContextValue>(
    () => ({
      client,
      push: (value: DataLayerValue) => client.push(value),
      setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) =>
        client.setConsentDefaults(state, options),
      updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => client.updateConsent(state, options),
      whenReady: () => client.whenReady()
    }),
    [client]
  );

  return (
    <GtmContext.Provider value={contextValue}>
      <div data-gtm-kit-provider="" style={{ display: 'contents' }}>
        {children}
      </div>
    </GtmContext.Provider>
  );
}

/**
 * Internal helper to get the GTM context with proper error handling.
 */
const useGtmContext = (): GtmContextValue => {
  const context = useContext(GtmContext);
  if (!context) {
    throw new Error(
      '[gtm-kit] useGtm() was called outside of a GtmProvider. ' +
        'Make sure to wrap your app with <GtmProvider config={{ containers: "GTM-XXXXXX" }}>.'
    );
  }
  return context;
};

/**
 * Hook to access the full GTM context.
 *
 * @example
 * ```tsx
 * import { useGtm } from '@jwiedeman/gtm-kit-remix';
 *
 * function MyComponent() {
 *   const { push, client } = useGtm();
 *
 *   return (
 *     <button onClick={() => push({ event: 'click' })}>
 *       Track
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
 *
 * @example
 * ```tsx
 * import { useGtmPush } from '@jwiedeman/gtm-kit-remix';
 *
 * function BuyButton() {
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
 * import { useGtmConsent } from '@jwiedeman/gtm-kit-remix';
 *
 * function CookieBanner() {
 *   const { updateConsent } = useGtmConsent();
 *
 *   return (
 *     <button onClick={() => updateConsent({ analytics_storage: 'granted' })}>
 *       Accept
 *     </button>
 *   );
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
 * import { useGtmClient } from '@jwiedeman/gtm-kit-remix';
 *
 * function MyComponent() {
 *   const client = useGtmClient();
 *   return <div>{client.isInitialized() ? 'Ready' : 'Loading'}</div>;
 * }
 * ```
 */
export const useGtmClient = (): GtmClient => {
  return useGtmContext().client;
};

/**
 * Hook to get the whenReady function.
 *
 * @example
 * ```tsx
 * import { useGtmReady } from '@jwiedeman/gtm-kit-remix';
 * import { useEffect } from 'react';
 *
 * function MyComponent() {
 *   const whenReady = useGtmReady();
 *
 *   useEffect(() => {
 *     whenReady().then(() => console.log('GTM ready!'));
 *   }, [whenReady]);
 *
 *   return <div>Loading...</div>;
 * }
 * ```
 */
export const useGtmReady = (): (() => Promise<ScriptLoadState[]>) => {
  return useGtmContext().whenReady;
};
