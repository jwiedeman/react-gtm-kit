/**
 * Mock implementation of solid-js/web for testing
 */

/**
 * Template function for JSX (minimal implementation)
 * Returns a function that creates clones of the template element
 */
export function template(str: string, _count?: number): () => HTMLElement {
  return () => {
    const container = document.createElement('div');
    container.innerHTML = str.trim();
    return (container.firstChild as HTMLElement) || container;
  };
}

/**
 * Insert function for JSX
 */
export function insert(
  parent: HTMLElement,
  accessor: (() => unknown) | unknown,
  _marker?: unknown,
  _initial?: unknown
): void {
  const value = typeof accessor === 'function' ? accessor() : accessor;
  if (value instanceof Node) {
    parent.appendChild(value);
  } else if (value !== null && value !== undefined) {
    parent.appendChild(document.createTextNode(String(value)));
  }
}

/**
 * Effect function for JSX
 */
export function effect(fn: () => void): void {
  fn();
}

/**
 * Memo function for JSX
 */
export function memo<T>(fn: () => T): () => T {
  return fn;
}

/**
 * createComponent for JSX (the key function for component rendering)
 */
export function createComponent<T>(Comp: (props: T) => unknown, props: T): unknown {
  return Comp(props);
}

/**
 * Spread function for JSX
 */
export function spread(_node: HTMLElement, _accessor: unknown): void {
  // No-op for testing
}

/**
 * Delegate events function
 */
export function delegateEvents(_events: string[]): void {
  // No-op for testing
}

/**
 * Render function (simplified)
 */
export function render(code: () => unknown, element: HTMLElement): () => void {
  const result = code();
  if (result instanceof Node) {
    element.appendChild(result);
  }
  return () => {
    element.innerHTML = '';
  };
}

/**
 * HydrationScript for SSR
 */
export function HydrationScript(): null {
  return null;
}

/**
 * NoHydration wrapper
 */
export function NoHydration(props: { children: unknown }): unknown {
  return props.children;
}

/**
 * Dynamic component helper
 */
export function Dynamic<T extends { component: unknown }>(props: T): unknown {
  const { component: Comp, ...rest } = props as { component: (p: unknown) => unknown };
  return Comp ? createComponent(Comp, rest) : null;
}

export default {
  template,
  insert,
  effect,
  memo,
  createComponent,
  spread,
  delegateEvents,
  render,
  HydrationScript,
  NoHydration,
  Dynamic
};
