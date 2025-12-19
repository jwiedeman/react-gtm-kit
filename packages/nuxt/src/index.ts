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
} from '@jwiedeman/gtm-kit-vue';

// Re-export core types for convenience
export type {
  CreateGtmClientOptions,
  GtmClient,
  ConsentState,
  ConsentRegionOptions,
  DataLayerValue,
  ScriptLoadState
} from '@jwiedeman/gtm-kit';

export { consentPresets, pushEvent, pushEcommerce } from '@jwiedeman/gtm-kit';
