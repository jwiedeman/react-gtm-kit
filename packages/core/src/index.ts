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
export { DEFAULT_DATA_LAYER_NAME, DEFAULT_GTM_HOST } from './constants';
export type { ConsentCommand, ConsentRegionOptions, ConsentState } from './consent';
export { buildConsentCommand, consent, createConsentDefaultsCommand, createConsentUpdateCommand } from './consent';
export { consentPresets, getConsentPreset, eeaDefault, allGranted, analyticsOnly } from './consent/presets';
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
export type { AutoQueueOptions, AutoQueueState } from './auto-queue';
export { installAutoQueue, createAutoQueueScript, attachToInlineBuffer } from './auto-queue';
export {
  isString,
  normalizeContainer,
  normalizeContainers,
  toRecord,
  normalizeHost,
  buildGtmScriptUrl,
  buildGtmNoscriptUrl,
  escapeAttributeValue
} from './url-utils';
