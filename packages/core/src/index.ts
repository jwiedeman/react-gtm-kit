export type {
  ContainerConfigInput,
  ContainerDescriptor,
  CreateGtmClientOptions,
  DataLayerValue,
  GtmClient,
  ScriptAttributes
} from './types';
export type {
  ConsentCommand,
  ConsentRegionOptions,
  ConsentState
} from './consent';
export { buildConsentCommand, consent } from './consent';
export { consentPresets, getConsentPreset } from './consent/presets';
export { createGtmClient } from './client';
export {
  createNoscriptMarkup,
  DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES
} from './noscript';
export type { NoscriptOptions } from './noscript';
