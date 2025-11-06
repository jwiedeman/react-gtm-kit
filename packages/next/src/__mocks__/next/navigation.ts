let currentPathname: string | null = '/';
let currentSearchParams: URLSearchParams | null = null;

export const __setMockPathname = (value: string | null): void => {
  currentPathname = value;
};

export const __setMockSearchParams = (value: URLSearchParams | null): void => {
  currentSearchParams = value;
};

export const __resetMockNavigation = (): void => {
  currentPathname = '/';
  currentSearchParams = null;
};

export const usePathname = (): string | null => currentPathname;

export type ReadonlyURLSearchParams = URLSearchParams;

export const useSearchParams = (): ReadonlyURLSearchParams | null => currentSearchParams;
