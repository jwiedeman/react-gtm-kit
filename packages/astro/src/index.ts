// Client-side GTM management
export {
  initGtm,
  getGtmClient,
  requireGtmClient,
  push,
  setConsentDefaults,
  updateConsent,
  whenReady,
  teardown
} from './client';

// Page tracking
export { trackPageView, setupViewTransitions, setupPageTracking } from './page-tracking';
export type { PageViewData, TrackPageViewOptions } from './page-tracking';

// Re-export core types for convenience
export type {
  ConsentState,
  ConsentRegionOptions,
  CreateGtmClientOptions,
  DataLayerValue,
  GtmClient,
  ScriptLoadState,
  ContainerConfigInput,
  ContainerDescriptor,
  ScriptAttributes
} from '@jwiedeman/gtm-kit';

// Re-export consent helpers
export { consentPresets, getConsentPreset, eeaDefault, allGranted, analyticsOnly } from '@jwiedeman/gtm-kit';
