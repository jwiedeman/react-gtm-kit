import type { ConsentState } from '../consent';

/**
 * Pre-configured consent state presets for common scenarios.
 *
 * These presets cover the most common consent patterns:
 * - `eeaDefault`: All denied (GDPR compliant default)
 * - `allGranted`: All granted (user accepts everything)
 * - `analyticsOnly`: Mixed state (analytics only, no ads)
 *
 * For custom combinations, pass a partial `ConsentState` object to `updateConsent()`.
 * You only need to specify the categories you want to update.
 *
 * @example
 * ```ts
 * // Use a preset
 * client.updateConsent(consentPresets.allGranted);
 *
 * // Or create a custom state
 * client.updateConsent({
 *   analytics_storage: 'granted',
 *   ad_storage: 'denied'
 * });
 *
 * // Partial updates (only update specific categories)
 * client.updateConsent({ analytics_storage: 'granted' });
 * ```
 */
export const consentPresets = {
  /**
   * All categories denied - GDPR/EEA compliant default.
   *
   * Use as the initial state for regions requiring explicit opt-in consent.
   * Tags will be blocked until the user grants specific permissions.
   *
   * | Category | State |
   * |----------|-------|
   * | ad_storage | denied |
   * | analytics_storage | denied |
   * | ad_user_data | denied |
   * | ad_personalization | denied |
   */
  eeaDefault: Object.freeze({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  } satisfies ConsentState),

  /**
   * All categories granted - user accepts all tracking.
   *
   * Use when the user clicks "Accept All" or in regions where consent is implied.
   *
   * | Category | State |
   * |----------|-------|
   * | ad_storage | granted |
   * | analytics_storage | granted |
   * | ad_user_data | granted |
   * | ad_personalization | granted |
   */
  allGranted: Object.freeze({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  } satisfies ConsentState),

  /**
   * Analytics allowed, advertising denied - mixed consent state.
   *
   * Use when the user accepts analytics/statistics but rejects advertising cookies.
   * This is a common "essential + analytics" consent pattern.
   *
   * | Category | State |
   * |----------|-------|
   * | ad_storage | denied |
   * | analytics_storage | granted |
   * | ad_user_data | denied |
   * | ad_personalization | denied |
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
