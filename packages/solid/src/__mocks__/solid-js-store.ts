/**
 * Mock implementation of solid-js/store for testing
 */

export type Store<T> = T;
export interface SetStoreFunction<T> {
  <K extends keyof T>(key: K, value: T[K]): void;
  (value: Partial<T>): void;
}

/**
 * Creates a store
 */
export function createStore<T extends object>(value: T): [Store<T>, SetStoreFunction<T>] {
  const store = { ...value } as T;

  const setStore = ((keyOrValue: keyof T | Partial<T>, newValue?: unknown) => {
    if (typeof keyOrValue === 'string' || typeof keyOrValue === 'symbol') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as any)[keyOrValue] = newValue;
    } else {
      Object.assign(store, keyOrValue);
    }
  }) as SetStoreFunction<T>;

  return [store as Store<T>, setStore];
}

/**
 * Produces a new value
 */
export function produce<T>(fn: (state: T) => void): (state: T) => T {
  return (state: T) => {
    const draft = { ...state };
    fn(draft);
    return draft;
  };
}

/**
 * Reconcile store values
 */
export function reconcile<T>(value: T): T {
  return value;
}
