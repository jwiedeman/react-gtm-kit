/**
 * Mock implementation of solid-js for testing
 */

import type { JSX } from 'solid-js';

// Context storage - use a stack to handle nested contexts
const contextStack = new Map<symbol, unknown[]>();
let currentOwner: { cleanups: (() => void)[] } | null = null;

/**
 * Creates a context
 */
export function createContext<T>(defaultValue?: T): {
  Provider: (props: { value: T; children: JSX.Element }) => JSX.Element;
  id: symbol;
} {
  const id = Symbol('context');
  contextStack.set(id, defaultValue !== undefined ? [defaultValue] : []);

  return {
    Provider: (props: { value: T; children: JSX.Element }) => {
      // Push context value onto the stack BEFORE evaluating children
      const stack = contextStack.get(id) || [];
      stack.push(props.value);
      contextStack.set(id, stack);

      // Now evaluate children - they will see the context
      const children = typeof props.children === 'function' ? (props.children as () => JSX.Element)() : props.children;

      // Pop context value after children are evaluated (for cleanup)
      // Note: we don't actually pop in tests to keep the context available
      return children;
    },
    id
  };
}

/**
 * Gets a context value
 */
export function useContext<T>(context: { id: symbol }): T | undefined {
  const stack = contextStack.get(context.id);
  if (!stack || stack.length === 0) return undefined;
  return stack[stack.length - 1] as T;
}

/**
 * Clears all context stacks (for test isolation)
 */
export function clearContexts(): void {
  contextStack.clear();
}

/**
 * Creates a reactive root
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  // Clear all context stacks at the start of each root for test isolation
  contextStack.clear();

  const prevOwner = currentOwner;
  const owner = { cleanups: [] as (() => void)[] };
  currentOwner = owner;

  const dispose = () => {
    owner.cleanups.forEach((cleanup) => cleanup());
    owner.cleanups = [];
    // Clear all context stacks
    contextStack.clear();
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
