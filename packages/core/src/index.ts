export type {
  ContainerConfigInput,
  ContainerDescriptor,
  CreateGtmClientOptions,
  DataLayerValue,
  GtmClient,
  ScriptAttributes,
  ScriptLoadState,
  ScriptLoadStatus
} from './types';
export type { ConsentCommand, ConsentRegionOptions, ConsentState } from './consent';
export {
  buildConsentCommand,
  consent,
  createConsentDefaultsCommand,
  createConsentUpdateCommand
} from './consent';
export { consentPresets, getConsentPreset } from './consent/presets';
export { createGtmClient } from './client';
export { pushEvent, pushEcommerce } from './events';
export { createNoscriptMarkup, DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES } from './noscript';
export type { NoscriptOptions } from './noscript';
export type {
  AdsConversionEvent,
  AdsConversionPayload,
  CustomEvent,
  EcommerceEvent,
  EcommerceEventName,
  EcommerceItem,
  EcommercePayload,
  EventForName,
  EventName,
  EventPayload,
  GtmEvent,
  PageViewEvent,
  PageViewPayload,
  PushEcommerceOptions
} from './events';
