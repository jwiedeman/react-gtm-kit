import { buildConsentCommand, consent, consentPresets, getConsentPreset } from '../../src';

describe('consent helpers', () => {
  it('normalizes and freezes consent state', () => {
    const state = consent.normalizeConsentState({
      ad_storage: 'granted',
      analytics_storage: 'denied'
    });

    expect(state).toEqual({
      ad_storage: 'granted',
      analytics_storage: 'denied'
    });
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('throws on invalid consent keys', () => {
    expect(() =>
      consent.normalizeConsentState({
        // @ts-expect-error intentional invalid key for runtime validation test
        invalid_key: 'granted'
      })
    ).toThrow(/Invalid consent key/);
  });

  it('throws on invalid consent values', () => {
    expect(() =>
      consent.normalizeConsentState({
        // @ts-expect-error intentional invalid value for runtime validation test
        ad_storage: 'maybe'
      })
    ).toThrow(/Invalid consent value/);
  });

  it('throws when state is empty', () => {
    expect(() => consent.normalizeConsentState({})).toThrow(/At least one consent key/);
  });

  it('builds consent commands with optional metadata', () => {
    expect(
      buildConsentCommand({
        command: 'update',
        state: { ad_storage: 'granted' }
      })
    ).toEqual(['consent', 'update', { ad_storage: 'granted' }]);

    expect(
      buildConsentCommand({
        command: 'default',
        state: { ad_storage: 'denied', analytics_storage: 'denied' },
        options: { region: ['US-CA', 'EEA'], waitForUpdate: 5000 }
      })
    ).toEqual([
      'consent',
      'default',
      { ad_storage: 'denied', analytics_storage: 'denied' },
      { region: ['US-CA', 'EEA'], wait_for_update: 5000 }
    ]);
  });

  it('throws when consent metadata is invalid', () => {
    expect(() =>
      buildConsentCommand({
        command: 'default',
        state: { ad_storage: 'granted' },
        options: { region: [''] }
      })
    ).toThrow(/Consent region codes must be non-empty strings/);

    expect(() =>
      buildConsentCommand({
        command: 'default',
        state: { ad_storage: 'granted' },
        options: { waitForUpdate: -10 }
      })
    ).toThrow(/waitForUpdate must be a non-negative/);
  });

  it('exposes immutable presets and clone helper', () => {
    expect(consentPresets.eeaDefault.ad_storage).toBe('denied');
    expect(Object.isFrozen(consentPresets.analyticsOnly)).toBe(true);

    const clone = getConsentPreset('allGranted');
    expect(clone).toEqual(consentPresets.allGranted);
    expect(Object.isFrozen(clone)).toBe(false);
    clone.ad_storage = 'denied';
    expect(consentPresets.allGranted.ad_storage).toBe('granted');
  });
});
