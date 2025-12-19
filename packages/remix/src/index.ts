export type { GtmProviderProps, GtmContextValue, GtmConsentApi } from './provider';
export {
  GtmProvider,
  GtmContext,
  useGtm,
  useGtmPush,
  useGtmConsent,
  useGtmClient,
  useGtmReady
} from './provider';

export { useTrackPageViews } from './route-tracker';
export type { UseTrackPageViewsOptions } from './route-tracker';

export { GtmScripts } from './scripts';
export type { GtmScriptsProps } from './scripts';
