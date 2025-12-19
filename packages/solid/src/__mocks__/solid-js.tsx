/**
 * Mock implementation of solid-js for testing
 */

import type { JSX } from 'solid-js';

// Context storage
const contextValues = new Map<unknown, unknown>();
let currentOwner: { cleanups: (() => void)[] } | null = null;

/**
 * Creates a context
 */
export function createContext<T>(): {
  Provider: (props: { value: T; children: JSX.Element }) => JSX.Element;
  id: symbol;
} {
  const id = Symbol('context');
  return {
    Provider: (props: { value: T; children: JSX.Element }) => {
      contextValues.set(id, props.value);
      return props.children;
    },
    id
  };
}

/**
 * Gets a context value
 */
export function useContext<T>(context: { id: symbol }): T | undefined {
  return contextValues.get(context.id) as T | undefined;
}

/**
 * Creates a reactive root
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const prevOwner = currentOwner;
  const owner = { cleanups: [] as (() => void)[] };
  currentOwner = owner;

  const dispose = () => {
    owner.cleanups.forEach((cleanup) => cleanup());
    owner.cleanups = [];
    contextValues.clear();
  };

  try {
    return fn(dispose);
  } finally {
    currentOwner = prevOwner;
  }
}

/**
 * Registers a cleanup function
 */
export function onCleanup(fn: () => void): void {
  if (currentOwner) {
    currentOwner.cleanups.push(fn);
  }
}

/**
 * Creates a signal (simplified for testing)
 */
export function createSignal<T>(value: T): [() => T, (v: T) => void] {
  let current = value;
  const read = () => current;
  const write = (v: T) => {
    current = v;
  };
  return [read, write];
}

/**
 * Creates an effect (simplified for testing)
 */
export function createEffect(fn: () => void): void {
  fn();
}

/**
 * Type export for JSX
 */
export type { JSX };
