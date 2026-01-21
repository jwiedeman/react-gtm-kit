export type { GtmProviderProps, GtmContextValue, GtmConsentApi, GtmErrorBoundaryProps } from './provider';
export {
  GtmProvider,
  GtmErrorBoundary,
  GtmContext,
  useGtm,
  useGtmPush,
  useGtmConsent,
  useGtmClient,
  useGtmReady,
  useIsGtmReady
} from './provider';

export { useTrackPageViews } from './route-tracker';
export type { UseTrackPageViewsOptions } from './route-tracker';

export { GtmScripts } from './scripts';
export type { GtmScriptsProps } from './scripts';
