import type { DataLayerValue } from './types';

const CONSENT_COMMAND = 'consent' as const;
const CONSENT_DEFAULT = 'default' as const;
const CONSENT_UPDATE = 'update' as const;

/**
 * The four consent categories tracked by Google Consent Mode v2.
 */
const CONSENT_KEYS = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'] as const;

/**
 * A consent category key: 'ad_storage' | 'analytics_storage' | 'ad_user_data' | 'ad_personalization'
 */
export type ConsentKey = (typeof CONSENT_KEYS)[number];

/**
 * A consent decision: 'granted' or 'denied'
 */
export type ConsentDecision = 'granted' | 'denied';

/**
 * Consent state object for one or more categories.
 *
 * This is a **partial** record - you only need to specify the categories you want to set.
 * Unspecified categories retain their previous state when using `updateConsent()`.
 *
 * @example
 * ```ts
 * // All four categories
 * const fullState: ConsentState = {
 *   ad_storage: 'granted',
 *   analytics_storage: 'granted',
 *   ad_user_data: 'granted',
 *   ad_personalization: 'granted'
 * };
 *
 * // Single category (partial update)
 * const partialState: ConsentState = {
 *   analytics_storage: 'granted'
 * };
 *
 * // Multiple specific categories
 * const mixedState: ConsentState = {
 *   analytics_storage: 'granted',
 *   ad_storage: 'denied'
 * };
 * ```
 */
export type ConsentState = Partial<Record<ConsentKey, ConsentDecision>>;

export interface ConsentRegionOptions {
  /**
   * ISO 3166-2 region codes (e.g., `US-CA`, `EEA`) that the consent command applies to.
   */
  region?: readonly string[];
  /**
   * Milliseconds to wait for an explicit update before firing tags when using the default command.
   */
  waitForUpdate?: number;
}

export type ConsentCommand = typeof CONSENT_DEFAULT | typeof CONSENT_UPDATE;

export interface ConsentCommandInput {
  command: ConsentCommand;
  state: ConsentState;
  options?: ConsentRegionOptions;
}

export type ConsentCommandValue =
  | [typeof CONSENT_COMMAND, ConsentCommand, ConsentState]
  | [typeof CONSENT_COMMAND, ConsentCommand, ConsentState, Record<string, unknown>];

const isConsentKey = (value: string): value is ConsentKey => (CONSENT_KEYS as readonly string[]).includes(value);

const isConsentDecision = (value: unknown): value is ConsentDecision => value === 'granted' || value === 'denied';

const assertValidRegions = (regions: readonly string[]) => {
  if (!Array.isArray(regions)) {
    throw new Error('Consent region list must be an array of ISO region codes.');
  }

  for (const region of regions) {
    if (typeof region !== 'string' || region.trim().length === 0) {
      throw new Error('Consent region codes must be non-empty strings.');
    }
  }
};

const assertValidWaitForUpdate = (waitForUpdate: number) => {
  if (!Number.isFinite(waitForUpdate) || waitForUpdate < 0) {
    throw new Error('waitForUpdate must be a non-negative finite number.');
  }
};

export const normalizeConsentState = (state: ConsentState): ConsentState => {
  const normalizedEntries = Object.entries(state ?? {}).map(([key, value]) => {
    if (!isConsentKey(key)) {
      throw new Error(`Invalid consent key: ${key}`);
    }

    if (!isConsentDecision(value)) {
      throw new Error(`Invalid consent value for key "${key}". Expected "granted" or "denied".`);
    }

    return [key, value] as const;
  });

  if (!normalizedEntries.length) {
    throw new Error('At least one consent key/value pair is required.');
  }

  const normalizedState = {} as ConsentState;
  for (const [key, value] of normalizedEntries) {
    normalizedState[key as ConsentKey] = value;
  }

  return Object.freeze(normalizedState);
};

const normalizeOptions = (options?: ConsentRegionOptions): Record<string, unknown> | undefined => {
  if (!options) {
    return undefined;
  }

  const payload: Record<string, unknown> = {};

  if (options.region) {
    assertValidRegions(options.region);
    if (options.region.length) {
      payload.region = [...options.region];
    }
  }

  if (typeof options.waitForUpdate === 'number') {
    assertValidWaitForUpdate(options.waitForUpdate);
    payload.wait_for_update = options.waitForUpdate;
  }

  return Object.keys(payload).length ? payload : undefined;
};

export const buildConsentCommand = ({ command, state, options }: ConsentCommandInput): ConsentCommandValue => {
  if (command !== CONSENT_DEFAULT && command !== CONSENT_UPDATE) {
    throw new Error(`Unsupported consent command: ${command}`);
  }

  const normalizedState = normalizeConsentState(state);
  const normalizedOptions = normalizeOptions(options);

  if (normalizedOptions) {
    return [CONSENT_COMMAND, command, normalizedState, normalizedOptions];
  }

  return [CONSENT_COMMAND, command, normalizedState];
};

export const createConsentCommandValue = (input: ConsentCommandInput): DataLayerValue => {
  // Spread the tuple to convert it to a plain array for DataLayerValue compatibility
  return [...buildConsentCommand(input)];
};

export const createConsentDefaultsCommand = (state: ConsentState, options?: ConsentRegionOptions): DataLayerValue =>
  createConsentCommandValue({ command: CONSENT_DEFAULT, state, options });

export const createConsentUpdateCommand = (state: ConsentState, options?: ConsentRegionOptions): DataLayerValue =>
  createConsentCommandValue({ command: CONSENT_UPDATE, state, options });

export const consent = {
  buildConsentCommand,
  createConsentDefaultsCommand,
  createConsentUpdateCommand,
  normalizeConsentState
};
