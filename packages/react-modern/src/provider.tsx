import { createContext, useContext, useEffect, useMemo, useRef, type PropsWithChildren, type JSX } from 'react';
import {
  createGtmClient,
  type ConsentRegionOptions,
  type ConsentState,
  type CreateGtmClientOptions,
  type DataLayerValue,
  type GtmClient,
  type ScriptLoadState
} from '@jwiedeman/gtm-kit';

export interface GtmProviderProps extends PropsWithChildren {
  config: CreateGtmClientOptions;
}

export interface GtmContextValue {
  client: GtmClient;
  push: (value: DataLayerValue) => void;
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
  whenReady: () => Promise<ScriptLoadState[]>;
  onReady: (callback: (state: ScriptLoadState[]) => void) => () => void;
}

export interface GtmConsentApi {
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
}

const GtmContext = createContext<GtmContextValue | null>(null);

const warnOnConfigChange = (initialConfig: CreateGtmClientOptions, nextConfig: CreateGtmClientOptions): void => {
  if (process.env.NODE_ENV !== 'production' && initialConfig !== nextConfig) {
    console.warn(
      '[react-gtm-kit] GtmProvider received new configuration; reconfiguration after mount is not supported. ' +
        'The initial configuration will continue to be used.'
    );
  }
};

const useStableClient = (config: CreateGtmClientOptions): GtmClient => {
  const clientRef = useRef<GtmClient>();
  const configRef = useRef<CreateGtmClientOptions>();

  if (!clientRef.current) {
    clientRef.current = createGtmClient(config);
    configRef.current = config;
  } else if (configRef.current) {
    warnOnConfigChange(configRef.current, config);
  }

  return clientRef.current!;
};

export const GtmProvider = ({ config, children }: GtmProviderProps): JSX.Element => {
  const client = useStableClient(config);

  useEffect(() => {
    client.init();
    return () => {
      client.teardown();
    };
  }, [client]);

  const value = useMemo<GtmContextValue>(
    () => ({
      client,
      push: (value) => client.push(value),
      setConsentDefaults: (state, options) => client.setConsentDefaults(state, options),
      updateConsent: (state, options) => client.updateConsent(state, options),
      whenReady: () => client.whenReady(),
      onReady: (callback) => client.onReady(callback)
    }),
    [client]
  );

  return <GtmContext.Provider value={value}>{children}</GtmContext.Provider>;
};

const useGtmContext = (): GtmContextValue => {
  const context = useContext(GtmContext);
  if (!context) {
    throw new Error('useGtm hook must be used within a GtmProvider instance.');
  }
  return context;
};

export const useGtm = useGtmContext;

export const useGtmClient = (): GtmClient => {
  return useGtmContext().client;
};

export const useGtmPush = (): ((value: DataLayerValue) => void) => {
  return useGtmContext().push;
};

export const useGtmConsent = (): GtmConsentApi => {
  const { setConsentDefaults, updateConsent } = useGtmContext();
  return useMemo(() => ({ setConsentDefaults, updateConsent }), [setConsentDefaults, updateConsent]);
};

export const useGtmReady = (): (() => Promise<ScriptLoadState[]>) => {
  const { whenReady } = useGtmContext();
  return whenReady;
};
