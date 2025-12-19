/**
 * Mock implementation of svelte/store for testing
 */

export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;
export type Updater<T> = (value: T) => T;

export interface Readable<T> {
  subscribe(run: Subscriber<T>): Unsubscriber;
}

export interface Writable<T> extends Readable<T> {
  set(value: T): void;
  update(updater: Updater<T>): void;
}

/**
 * Creates a writable store
 */
export function writable<T>(value: T): Writable<T> {
  let currentValue = value;
  const subscribers = new Set<Subscriber<T>>();

  function set(newValue: T): void {
    currentValue = newValue;
    subscribers.forEach((s) => s(currentValue));
  }

  function update(updater: Updater<T>): void {
    set(updater(currentValue));
  }

  function subscribe(run: Subscriber<T>): Unsubscriber {
    subscribers.add(run);
    run(currentValue);
    return () => {
      subscribers.delete(run);
    };
  }

  return { subscribe, set, update };
}

/**
 * Creates a derived store
 */
export function derived<T, U>(
  store: Readable<T>,
  fn: (value: T) => U
): Readable<U> {
  return {
    subscribe(run: Subscriber<U>): Unsubscriber {
      return store.subscribe((value) => {
        run(fn(value));
      });
    }
  };
}

/**
 * Gets the current value from a store
 */
export function get<T>(store: Readable<T>): T {
  let value!: T;
  store.subscribe((v) => (value = v))();
  return value;
}
