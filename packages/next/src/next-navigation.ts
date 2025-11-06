export {};

declare module 'next/navigation' {
  export type ReadonlyURLSearchParams = URLSearchParams;
  export function usePathname(): string | null;
  export function useSearchParams(): ReadonlyURLSearchParams | null;
}
