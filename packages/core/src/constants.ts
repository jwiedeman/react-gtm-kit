export const DEFAULT_GTM_HOST = 'https://www.googletagmanager.com';
export const DEFAULT_DATA_LAYER_NAME = 'dataLayer';
export const DEFAULT_MAX_DATA_LAYER_SIZE = 500;

/**
 * Maximum reasonable wait time for consent waitForUpdate (30 minutes).
 * Values exceeding this will trigger a warning.
 */
export const MAX_CONSENT_WAIT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Default timeout for script loading (30 seconds).
 */
export const DEFAULT_SCRIPT_TIMEOUT_MS = 30000;

/**
 * Default timeout for GTM initialization check (5 seconds).
 */
export const DEFAULT_INIT_TIMEOUT_MS = 5000;

/**
 * Default delay between retry attempts (1 second).
 */
export const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Maximum delay between retry attempts (30 seconds).
 */
export const MAX_RETRY_DELAY_MS = 30000;
