/**
 * Auto-queue: Automatic dataLayer buffering for race condition elimination.
 *
 * This module provides automatic buffering of dataLayer pushes that occur before
 * GTM.js loads. Events are captured, stored in order, and replayed once GTM is ready.
 *
 * @example
 * ```ts
 * // Call as early as possible (ideally inline in <head>)
 * import { installAutoQueue } from '@jwiedeman/gtm-kit';
 *
 * installAutoQueue(); // Start buffering immediately
 *
 * // Later, events pushed before GTM loads are automatically queued
 * window.dataLayer.push({ event: 'early_event' }); // Buffered!
 *
 * // When GTM loads, all buffered events replay in order
 * ```
 *
 * @example
 * ```html
 * <!-- Inline script for earliest possible buffering -->
 * <script>
 *   // Minimal inline version for <head>
 *   (function(w,d,n){
 *     w[n]=w[n]||[];var q=[],o=w[n].push.bind(w[n]);
 *     w[n].push=function(){q.push(arguments);return o.apply(this,arguments)};
 *     w.__gtmkit_buffer=q;
 *   })(window,document,'dataLayer');
 * </script>
 * ```
 */

import { DEFAULT_DATA_LAYER_NAME } from './constants';
import type { DataLayerValue } from './types';

/**
 * Escape a string for safe use in JavaScript string literals.
 * Prevents XSS when interpolating values into inline scripts.
 */
const escapeJsString = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/**
 * Checks if a dataLayer value is the GTM.js load event.
 * Used to detect when GTM has finished loading.
 */
const isGtmLoadEvent = (value: DataLayerValue): boolean =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (value as Record<string, unknown>).event === 'gtm.js';

/**
 * Cleans up the inline buffer global reference.
 * Call this in error handlers to prevent memory leaks if the full
 * GTM Kit fails to initialize after the inline script ran.
 *
 * @example
 * ```ts
 * try {
 *   // Initialize GTM Kit
 *   const client = createGtmClient({ containers: 'GTM-XXXXX' });
 *   client.init();
 * } catch (error) {
 *   // Clean up inline buffer on error
 *   cleanupInlineBuffer();
 *   console.error('GTM initialization failed:', error);
 * }
 * ```
 */
export function cleanupInlineBuffer(): void {
  if (typeof globalThis === 'undefined') {
    return;
  }

  const globalScope = globalThis as Record<string, unknown>;
  if (globalScope.__gtmkit_buffer !== undefined) {
    delete globalScope.__gtmkit_buffer;
  }
}

/** Options for configuring the auto-queue behavior */
export interface AutoQueueOptions {
  /**
   * Name of the dataLayer array. Defaults to 'dataLayer'.
   */
  dataLayerName?: string;

  /**
   * Interval in milliseconds to check if GTM has loaded.
   * Lower values = faster detection, higher CPU usage.
   * @default 50
   */
  pollInterval?: number;

  /**
   * Maximum time in milliseconds to wait for GTM before giving up.
   * Set to 0 for unlimited waiting.
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of events to buffer.
   * Prevents memory issues if GTM never loads.
   * @default 1000
   */
  maxBufferSize?: number;

  /**
   * Callback fired when the buffer is replayed.
   */
  onReplay?: (bufferedCount: number) => void;

  /**
   * Callback fired if timeout is reached before GTM loads.
   */
  onTimeout?: (bufferedCount: number) => void;
}

/** State of the auto-queue system */
export interface AutoQueueState {
  /** Whether the auto-queue is currently active */
  active: boolean;
  /** Number of events currently buffered */
  bufferedCount: number;
  /** Whether GTM has been detected as ready */
  gtmReady: boolean;
  /** Manually trigger replay (useful for testing) */
  replay: () => void;
  /** Uninstall the auto-queue and restore original push */
  uninstall: () => void;
}

interface BufferedEntry {
  value: DataLayerValue;
  timestamp: number;
}

/**
 * Installs automatic dataLayer buffering that captures events before GTM loads.
 *
 * Call this as early as possible in your application lifecycle, ideally before
 * any other scripts that might push to the dataLayer.
 *
 * The auto-queue:
 * 1. Creates the dataLayer if it doesn't exist
 * 2. Intercepts all pushes to capture them in a buffer
 * 3. Detects when GTM.js loads by watching for the 'gtm.js' event
 * 4. Replays all buffered events in order once GTM is ready
 * 5. Removes itself, allowing normal dataLayer operation
 *
 * @param options - Configuration options
 * @returns State object with control methods
 *
 * @example
 * ```ts
 * const queue = installAutoQueue({
 *   onReplay: (count) => console.log(`Replayed ${count} buffered events`),
 *   onTimeout: (count) => console.warn(`GTM didn't load, ${count} events buffered`)
 * });
 *
 * // Check state
 * console.log(queue.bufferedCount); // Number of events waiting
 *
 * // Manual control (usually not needed)
 * queue.replay();    // Force replay now
 * queue.uninstall(); // Remove the interceptor
 * ```
 */
export function installAutoQueue(options: AutoQueueOptions = {}): AutoQueueState {
  const {
    dataLayerName = DEFAULT_DATA_LAYER_NAME,
    pollInterval = 50,
    timeout = 30000,
    maxBufferSize = 1000,
    onReplay,
    onTimeout
  } = options;

  // Skip in non-browser environments
  if (typeof globalThis === 'undefined' || typeof globalThis.document === 'undefined') {
    return createNoopState();
  }

  const globalScope = globalThis as Record<string, unknown>;

  // Create dataLayer if it doesn't exist
  if (!Array.isArray(globalScope[dataLayerName])) {
    globalScope[dataLayerName] = [];
  }

  const dataLayer = globalScope[dataLayerName] as DataLayerValue[];
  const buffer: BufferedEntry[] = [];
  const originalPush = dataLayer.push.bind(dataLayer);

  let active = true;
  let gtmReady = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let replayTimer: ReturnType<typeof setTimeout> | null = null;

  // Check if GTM.js event is present (indicating GTM has loaded)
  const isGtmLoaded = (): boolean => dataLayer.some(isGtmLoadEvent);

  // Replay all buffered events to the dataLayer
  const replay = (): void => {
    if (!active) return;

    active = false;
    gtmReady = true;

    // Clear all timers
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    if (replayTimer) {
      clearTimeout(replayTimer);
      replayTimer = null;
    }

    // Restore original push
    dataLayer.push = originalPush;

    // Replay buffered events in order
    const count = buffer.length;
    for (const entry of buffer) {
      originalPush(entry.value);
    }
    buffer.length = 0;

    onReplay?.(count);
  };

  // Uninstall without replaying
  const uninstall = (): void => {
    if (!active) return;

    active = false;

    // Clear all timers
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    if (replayTimer) {
      clearTimeout(replayTimer);
      replayTimer = null;
    }

    dataLayer.push = originalPush;
    buffer.length = 0;

    // Clean up any lingering global buffer reference
    cleanupInlineBuffer();
  };

  // Create intercepted push function
  const interceptedPush = function (this: DataLayerValue[], ...args: DataLayerValue[]): number {
    for (const value of args) {
      // Always push to actual dataLayer (GTM may already be listening)
      originalPush(value);

      // Buffer the value for potential replay
      if (active && buffer.length < maxBufferSize) {
        buffer.push({
          value,
          timestamp: Date.now()
        });
      }

      // Check if this push indicates GTM is ready
      if (active && !replayTimer && isGtmLoadEvent(value)) {
        // GTM just loaded! Trigger replay on next tick to ensure
        // this event is fully processed first
        replayTimer = setTimeout(replay, 0);
      }
    }

    return dataLayer.length;
  };

  // Install the interceptor
  dataLayer.push = interceptedPush;

  // Check if GTM was already loaded before we installed
  if (isGtmLoaded()) {
    // GTM already present, replay immediately
    replayTimer = setTimeout(replay, 0);
  } else {
    // Poll for GTM readiness as backup detection
    pollTimer = setInterval(() => {
      if (isGtmLoaded()) {
        replay();
      }
    }, pollInterval);

    // Set timeout if configured
    if (timeout > 0) {
      timeoutTimer = setTimeout(() => {
        if (active) {
          onTimeout?.(buffer.length);
          // Don't uninstall on timeout - keep buffering in case GTM loads late
        }
      }, timeout);
    }
  }

  // Return state object
  return {
    get active() {
      return active;
    },
    get bufferedCount() {
      return buffer.length;
    },
    get gtmReady() {
      return gtmReady;
    },
    replay,
    uninstall
  };
}

/**
 * Creates a minimal inline script for earliest possible buffering.
 *
 * This returns a script that can be embedded directly in the HTML `<head>`
 * before any other scripts. It's a minimal version of installAutoQueue()
 * that captures events until the full GTM Kit is loaded.
 *
 * @param dataLayerName - Name of the dataLayer array
 * @returns Inline script string to embed in HTML
 *
 * @example
 * ```ts
 * // In your SSR template
 * const inlineScript = createAutoQueueScript();
 * // Output: <script>{inlineScript}</script> in <head>
 * ```
 */
export function createAutoQueueScript(dataLayerName: string = DEFAULT_DATA_LAYER_NAME): string {
  // Minified inline script that:
  // 1. Creates dataLayer if missing
  // 2. Overrides push to capture events
  // 3. Stores buffer in __gtmkit_buffer for later retrieval
  // SECURITY: Escape the dataLayerName to prevent XSS via malicious input
  const safeName = escapeJsString(dataLayerName);
  return `(function(w,n){w[n]=w[n]||[];var q=[],o=w[n].push.bind(w[n]);w[n].push=function(){for(var i=0;i<arguments.length;i++){q.push({v:arguments[i],t:Date.now()});o(arguments[i])}return w[n].length};w.__gtmkit_buffer={q:q,o:o,n:n}})(window,'${safeName}');`;
}

/**
 * Attaches to an existing inline buffer created by createAutoQueueScript().
 *
 * If you used the inline script in your HTML head, call this when the full
 * GTM Kit loads to take over buffer management and enable replay.
 *
 * @param options - Configuration options
 * @returns State object, or null if no inline buffer exists
 *
 * @example
 * ```ts
 * // After GTM Kit bundle loads
 * const queue = attachToInlineBuffer({
 *   onReplay: (count) => console.log(`Replayed ${count} events`)
 * });
 *
 * if (queue) {
 *   console.log(`Taking over ${queue.bufferedCount} buffered events`);
 * }
 * ```
 */
export function attachToInlineBuffer(options: Omit<AutoQueueOptions, 'dataLayerName'> = {}): AutoQueueState | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const globalScope = globalThis as Record<string, unknown>;
  const inlineBuffer = globalScope.__gtmkit_buffer as
    | {
        q: { v: DataLayerValue; t: number }[];
        o: (...args: DataLayerValue[]) => number;
        n: string;
      }
    | undefined;

  if (!inlineBuffer) {
    return null;
  }

  const { n: dataLayerName } = inlineBuffer;

  // Clean up the global reference
  delete globalScope.__gtmkit_buffer;

  // Install full auto-queue with the same dataLayer name
  // The buffer from the inline script is already in the dataLayer,
  // so we just need to continue monitoring from here
  return installAutoQueue({
    ...options,
    dataLayerName
  });
}

/** Creates a no-op state for SSR environments */
function createNoopState(): AutoQueueState {
  // No-op functions for SSR - these do nothing intentionally
  const noop = (): void => {
    /* no-op for SSR */
  };
  return {
    active: false,
    bufferedCount: 0,
    gtmReady: false,
    replay: noop,
    uninstall: noop
  };
}
