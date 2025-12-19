import { useEffect, useRef } from 'react';
import { useLocation } from '@remix-run/react';
import { useGtmPush } from './provider';

/**
 * Options for the useTrackPageViews hook.
 */
export interface UseTrackPageViewsOptions {
  /**
   * The event name to use for page view events.
   * @default 'page_view'
   */
  eventName?: string;

  /**
   * Whether to track the initial page load.
   * @default true
   */
  trackInitialPageView?: boolean;

  /**
   * Custom data to include with each page view event.
   */
  customData?: Record<string, unknown>;

  /**
   * Callback to transform the page view event data before pushing.
   * Use this to add custom properties or modify the event.
   */
  transformEvent?: (data: PageViewData) => Record<string, unknown>;
}

/**
 * Data included with each page view event.
 */
export interface PageViewData {
  event: string;
  page_path: string;
  page_search: string;
  page_hash: string;
  page_url: string;
  [key: string]: unknown;
}

/**
 * Hook to automatically track page views on route changes.
 * Uses Remix's useLocation to detect navigation.
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * import { GtmProvider, useTrackPageViews } from '@react-gtm-kit/remix';
 *
 * function PageViewTracker() {
 *   useTrackPageViews();
 *   return null;
 * }
 *
 * export default function App() {
 *   return (
 *     <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
 *       <PageViewTracker />
 *       <Outlet />
 *     </GtmProvider>
 *   );
 * }
 * ```
 *
 * @example With custom options
 * ```tsx
 * useTrackPageViews({
 *   eventName: 'virtual_page_view',
 *   customData: { app_version: '1.0.0' },
 *   transformEvent: (data) => ({
 *     ...data,
 *     user_id: getCurrentUserId()
 *   })
 * });
 * ```
 */
export function useTrackPageViews(options: UseTrackPageViewsOptions = {}): void {
  const {
    eventName = 'page_view',
    trackInitialPageView = true,
    customData = {},
    transformEvent
  } = options;

  const location = useLocation();
  const push = useGtmPush();
  const lastPathRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;

    // Skip if this is the same path (prevents double-firing)
    if (currentPath === lastPathRef.current) {
      return;
    }

    // Skip initial page view if configured
    if (isFirstRenderRef.current && !trackInitialPageView) {
      isFirstRenderRef.current = false;
      lastPathRef.current = currentPath;
      return;
    }

    isFirstRenderRef.current = false;
    lastPathRef.current = currentPath;

    // Build page view data
    const pageViewData: PageViewData = {
      event: eventName,
      page_path: location.pathname,
      page_search: location.search,
      page_hash: location.hash,
      page_url: typeof window !== 'undefined' ? window.location.href : currentPath,
      ...customData
    };

    // Apply transform if provided
    const eventData = transformEvent ? transformEvent(pageViewData) : pageViewData;

    // Push to GTM
    push(eventData);
  }, [location, push, eventName, trackInitialPageView, customData, transformEvent]);
}
