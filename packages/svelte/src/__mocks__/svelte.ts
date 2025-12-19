/**
 * Mock implementation of svelte for testing
 */

const contextMap = new Map<unknown, unknown>();

/**
 * Gets context value by key
 */
export function getContext<T>(key: unknown): T | undefined {
  return contextMap.get(key) as T | undefined;
}

/**
 * Sets context value by key
 */
export function setContext<T>(key: unknown, value: T): T {
  contextMap.set(key, value);
  return value;
}

/**
 * Clears all context (for testing)
 */
export function clearContext(): void {
  contextMap.clear();
}

/**
 * Called when component is mounted
 */
export function onMount(fn: () => void | (() => void)): void {
  // In tests, just call immediately
  fn();
}

/**
 * Called when component is destroyed
 */
export function onDestroy(fn: () => void): void {
  // In tests, this is a no-op
  void fn;
}
