export type { NuxtGtmOptions, NuxtGtmContext } from './module';
export {
  createNuxtGtmPlugin,
  useNuxtGtm,
  useNuxtGtmPush,
  useNuxtGtmConsent,
  useNuxtGtmClient,
  useTrackPageViews
} from './module';

// Re-export Vue composables for convenience
export {
  useGtm,
  useGtmPush,
  useGtmConsent,
  useGtmClient,
  useGtmReady,
  GtmPlugin,
  GTM_INJECTION_KEY
} from '@react-gtm-kit/vue';

// Re-export core types for convenience
export type {
  CreateGtmClientOptions,
  GtmClient,
  ConsentState,
  ConsentRegionOptions,
  DataLayerValue,
  ScriptLoadState
} from '@react-gtm-kit/core';

export { consentPresets, pushEvent, pushEcommerce } from '@react-gtm-kit/core';
