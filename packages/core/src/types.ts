/**
 * Branded type for GTM Container IDs.
 * Prevents accidental mix-ups with other string types.
 *
 * @example
 * ```ts
 * const containerId = 'GTM-XXXXXX' as ContainerId;
 * ```
 */
export type ContainerId = string & { readonly __brand: 'ContainerId' };

/**
 * Type guard to check if a string is a valid GTM container ID format.
 * Valid formats: GTM-XXXXXX (6+ alphanumeric characters)
 */
export const isValidContainerId = (value: string): value is ContainerId => {
  return /^GTM-[A-Z0-9]{6,}$/i.test(value);
};

/**
 * Safely cast a string to ContainerId after validation.
 * Throws if the format is invalid.
 */
export const toContainerId = (value: string): ContainerId => {
  if (!isValidContainerId(value)) {
    throw new Error(
      `Invalid GTM container ID format: "${value}". ` +
        'Container IDs must start with "GTM-" followed by 6 or more alphanumeric characters. ' +
        'Example: "GTM-ABC123" or "GTM-WXYZ7890"'
    );
  }
  return value;
};

/**
 * Branded type for DataLayer names.
 * Prevents accidental use of invalid JavaScript identifiers.
 */
export type DataLayerName = string & { readonly __brand: 'DataLayerName' };

/**
 * JavaScript reserved words that cannot be used as variable names.
 */
const JS_RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'await',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'arguments',
  'eval'
]);

/**
 * Type guard to check if a string is a valid dataLayer name.
 * Valid names must be valid JavaScript identifiers and not reserved words.
 *
 * Security: Prevents injection attacks via malicious dataLayer names like:
 * - "dataLayer'];alert('XSS');//"
 * - "dataLayer<script>"
 *
 * @example
 * ```ts
 * isValidDataLayerName('dataLayer'); // true
 * isValidDataLayerName('myCustomLayer'); // true
 * isValidDataLayerName('data_layer_1'); // true
 * isValidDataLayerName("dataLayer'];alert('XSS')"); // false
 * isValidDataLayerName('class'); // false (reserved word)
 * ```
 */
export const isValidDataLayerName = (value: string): value is DataLayerName => {
  // Must be a non-empty string
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  // Must be a valid JavaScript identifier
  // Starts with letter, underscore, or dollar sign
  // Contains only letters, numbers, underscores, or dollar signs
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
    return false;
  }

  // Must not be a reserved word
  if (JS_RESERVED_WORDS.has(value)) {
    return false;
  }

  return true;
};

/**
 * Safely cast a string to DataLayerName after validation.
 * Throws if the name is not a valid JavaScript identifier.
 *
 * @example
 * ```ts
 * const name = toDataLayerName('dataLayer'); // OK
 * const custom = toDataLayerName('myCustomLayer'); // OK
 * toDataLayerName("dataLayer'];alert('XSS')"); // throws Error
 * ```
 */
export const toDataLayerName = (value: string): DataLayerName => {
  if (!isValidDataLayerName(value)) {
    throw new Error(
      `Invalid dataLayer name: "${value}". ` +
        'DataLayer names must be valid JavaScript identifiers (letters, numbers, underscores, dollar signs) ' +
        'and cannot be reserved words. Example: "dataLayer", "myCustomLayer", "gtm_data"'
    );
  }
  return value;
};

/**
 * Values that can be pushed to the GTM dataLayer.
 *
 * The dataLayer accepts three types of values:
 *
 * ## 1. Objects (most common)
 * Plain objects containing event data and variables. Property values can be:
 * - **Primitives**: `string`, `number`, `boolean`, `null`, `undefined`
 * - **Arrays**: For ecommerce items, user lists, etc.
 * - **Nested objects**: For complex structured data
 *
 * ```ts
 * // Event with properties
 * push({ event: 'page_view', page_title: 'Home' });
 *
 * // Setting variables
 * push({ user_id: '12345', user_type: 'premium' });
 *
 * // Ecommerce data
 * push({
 *   event: 'purchase',
 *   ecommerce: {
 *     transaction_id: 'T-123',
 *     value: 99.99,
 *     items: [{ item_id: 'SKU-1', price: 99.99 }]
 *   }
 * });
 * ```
 *
 * ## 2. Functions (GTM callbacks)
 * Functions pushed to dataLayer are executed by GTM with a callback parameter.
 * Useful for reading GTM state or triggering container-specific behavior.
 *
 * ```ts
 * // Read container ID
 * push(function(this: { id: string }) {
 *   console.log('Container:', this.id);
 * });
 *
 * // Async operation with GTM
 * push(function() {
 *   return new Promise(resolve => {
 *     setTimeout(() => resolve(), 1000);
 *   });
 * });
 * ```
 *
 * ## 3. Arrays (consent commands, legacy format)
 * Array format primarily used for Google Consent Mode commands.
 * The first element is the command, followed by parameters.
 *
 * ```ts
 * // Consent default command
 * push(['consent', 'default', { analytics_storage: 'denied' }]);
 *
 * // Consent update command
 * push(['consent', 'update', { analytics_storage: 'granted' }]);
 * ```
 *
 * @see https://developers.google.com/tag-manager/devguide#datalayer
 * @see https://developers.google.com/tag-platform/gtagjs/reference#consent
 */
export type DataLayerValue = Record<string, unknown> | ((...args: unknown[]) => unknown) | unknown[];

/**
 * Type-safe globalThis extension for accessing dataLayer.
 * Use this interface to extend globalThis in your application.
 *
 * @example
 * ```ts
 * declare global {
 *   interface Window extends GtmGlobalExtension {}
 * }
 *
 * // Then access safely
 * const dataLayer = window.dataLayer;
 * ```
 */
export interface GtmGlobalExtension {
  dataLayer?: DataLayerValue[];
  google_tag_manager?: Record<string, unknown>;
}

/**
 * Type-safe access to the dataLayer from globalThis/window.
 * Returns undefined if running in a non-browser environment or if dataLayer doesn't exist.
 */
export const getGlobalDataLayer = (name = 'dataLayer'): DataLayerValue[] | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  const global = globalThis as typeof globalThis & Record<string, unknown>;
  const layer = global[name];
  return Array.isArray(layer) ? (layer as DataLayerValue[]) : undefined;
};

/**
 * Type-safe access to google_tag_manager from globalThis/window.
 * Returns undefined if running in a non-browser environment or if GTM isn't loaded.
 */
export const getGoogleTagManager = (): Record<string, unknown> | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  const global = globalThis as typeof globalThis & GtmGlobalExtension;
  return global.google_tag_manager;
};

export interface DataLayerState {
  name: string;
  dataLayer: DataLayerValue[];
  created: boolean;
  restore(): void;
}

export interface Logger {
  debug(message: string, details?: Record<string, unknown>): void;
  info(message: string, details?: Record<string, unknown>): void;
  warn(message: string, details?: Record<string, unknown>): void;
  error(message: string, details?: Record<string, unknown>): void;
}

export type PartialLogger = Partial<Logger>;

export type ScriptAttributeValue = string | boolean | null | undefined;

export interface ScriptAttributes {
  async?: boolean;
  defer?: boolean;
  nonce?: string;
  [attribute: string]: ScriptAttributeValue;
}

/**
 * Script load status:
 * - 'loaded': Script loaded and GTM initialized successfully
 * - 'failed': Script failed to load (network error, blocked, etc.)
 * - 'skipped': Script was skipped (already present, or no document available)
 * - 'partial': Script loaded but GTM failed to initialize (malformed container, etc.)
 */
export type ScriptLoadStatus = 'loaded' | 'failed' | 'skipped' | 'partial';

export interface ScriptLoadState {
  containerId: string;
  src?: string;
  status: ScriptLoadStatus;
  fromCache?: boolean;
  error?: string;
  /**
   * Time taken to load the script in milliseconds.
   * Only present for scripts that were actually loaded (not cached/skipped).
   */
  loadTimeMs?: number;
}

export interface ContainerDescriptor {
  id: string;
  queryParams?: Record<string, string | number | boolean>;
}

export type ContainerConfigInput = string | ContainerDescriptor;

/**
 * Options for script retry behavior on load failures.
 */
export interface ScriptRetryOptions {
  /**
   * Number of retry attempts after initial failure.
   * Set to 0 to disable retries (default behavior).
   * @default 0
   */
  attempts?: number;

  /**
   * Initial delay in milliseconds before first retry.
   * Subsequent retries use exponential backoff (delay * 2^attempt).
   * @default 1000
   */
  delay?: number;

  /**
   * Maximum delay between retries in milliseconds.
   * Prevents exponential backoff from growing too large.
   * @default 30000
   */
  maxDelay?: number;
}

export interface CreateGtmClientOptions {
  containers: ContainerConfigInput[] | ContainerConfigInput;
  dataLayerName?: string;
  host?: string;
  defaultQueryParams?: Record<string, string | number | boolean>;
  scriptAttributes?: ScriptAttributes;
  logger?: PartialLogger;

  /**
   * Enable debug mode with verbose console logging.
   * When true, all GTM operations are logged to the console with timestamps
   * and colored prefixes for easy debugging.
   *
   * Note: This overrides any custom logger if set to true.
   * For production, either set to false or use a custom logger.
   * @default false
   */
  debug?: boolean;

  /**
   * Script retry configuration for failed loads.
   * Enables automatic retry with exponential backoff.
   */
  retry?: ScriptRetryOptions;

  /**
   * Timeout in milliseconds for script load.
   * If a script doesn't load within this time, it's considered failed.
   * Set to 0 to disable timeout (not recommended).
   * @default 30000
   */
  scriptTimeout?: number;

  /**
   * Callback invoked when a script fails to load (after all retries exhausted).
   * Use this to handle errors gracefully in your application.
   */
  onScriptError?: (state: ScriptLoadState) => void;

  /**
   * Callback invoked when a script load times out.
   * Called before retry attempts if retries are configured.
   */
  onScriptTimeout?: (containerId: string) => void;

  /**
   * Maximum number of entries allowed in the dataLayer array.
   * When the limit is reached, oldest non-critical entries are removed to make room.
   * Critical entries (gtm.js start event, consent commands) are preserved.
   * Set to 0 to disable the limit (not recommended for long-running SPAs).
   * @default 500
   */
  maxDataLayerSize?: number;

  /**
   * Callback invoked when dataLayer entries are trimmed due to size limit.
   * Use this to monitor memory management or log analytics.
   */
  onDataLayerTrim?: (trimmedCount: number, currentSize: number) => void;

  /**
   * Whether to verify GTM initialization after script loads.
   * When enabled, checks for the gtm.js event in the dataLayer after script load.
   * If verification fails, the script status is set to 'partial'.
   * @default false
   */
  verifyInitialization?: boolean;

  /**
   * Timeout in milliseconds to wait for GTM initialization verification.
   * Only used when verifyInitialization is true.
   * @default 5000
   */
  initializationTimeout?: number;

  /**
   * Callback invoked when a script loads but GTM fails to initialize.
   * This indicates a partial load failure (script loaded but GTM didn't work).
   */
  onPartialLoad?: (state: ScriptLoadState) => void;
}

/**
 * Diagnostic information about the GTM client state.
 * Useful for debugging integration issues.
 */
export interface GtmDiagnostics {
  /** Whether the client has been initialized */
  initialized: boolean;
  /** Whether all scripts have finished loading */
  ready: boolean;
  /** Name of the dataLayer being used */
  dataLayerName: string;
  /** Current size of the dataLayer array */
  dataLayerSize: number;
  /** Number of items in the pre-init queue */
  queueSize: number;
  /** Number of consent commands delivered */
  consentCommandsDelivered: number;
  /** Container IDs configured */
  containers: string[];
  /** Script load states for each container */
  scriptStates: ScriptLoadState[];
  /** Time since client was created (ms) */
  uptimeMs: number;
  /** Whether debug mode is enabled */
  debugMode: boolean;
}

export interface GtmClient {
  readonly dataLayerName: string;
  init(): void;
  push(value: DataLayerValue): void;
  setConsentDefaults(state: import('./consent').ConsentState, options?: import('./consent').ConsentRegionOptions): void;
  updateConsent(state: import('./consent').ConsentState, options?: import('./consent').ConsentRegionOptions): void;
  teardown(): void;
  isInitialized(): boolean;
  /**
   * Synchronously check if all GTM scripts have finished loading.
   * Returns true if all scripts have loaded (successfully or failed), false if still loading.
   */
  isReady(): boolean;
  whenReady(): Promise<ScriptLoadState[]>;
  onReady(callback: (state: ScriptLoadState[]) => void): () => void;
  /**
   * Get diagnostic information about the GTM client state.
   * Useful for debugging integration issues.
   */
  getDiagnostics(): GtmDiagnostics;
}
