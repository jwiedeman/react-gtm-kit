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
  const store = { ...value };

  const setStore: SetStoreFunction<T> = (keyOrValue: keyof T | Partial<T>, value?: T[keyof T]) => {
    if (typeof keyOrValue === 'string' || typeof keyOrValue === 'symbol') {
      (store as T)[keyOrValue] = value as T[keyof T];
    } else {
      Object.assign(store, keyOrValue);
    }
  };

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
