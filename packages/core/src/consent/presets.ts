import type { ConsentState } from '../consent';

export const consentPresets = {
  /**
   * Baseline preset recommended by Google for users in regions that require explicit opt-in
   * before enabling advertising or analytics tags.
   */
  eeaDefault: Object.freeze({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  } satisfies ConsentState),
  /**
   * Convenience preset granting all consent categories.
   */
  allGranted: Object.freeze({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  } satisfies ConsentState),
  /**
   * Preset to allow analytics measurement while preventing ad personalisation and storage.
   */
  analyticsOnly: Object.freeze({
    ad_storage: 'denied',
    analytics_storage: 'granted',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  } satisfies ConsentState)
} as const;

export type ConsentPresetName = keyof typeof consentPresets;

export const getConsentPreset = (name: ConsentPresetName): ConsentState => ({
  ...consentPresets[name]
});
