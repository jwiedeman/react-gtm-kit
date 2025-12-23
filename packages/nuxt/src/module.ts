import { ref, watch, onMounted, type App } from 'vue';
import { type GtmClient } from '@jwiedeman/gtm-kit';
import {
  GtmPlugin,
  useGtm,
  useGtmPush,
  useGtmConsent,
  useGtmClient,
  type GtmPluginOptions,
  type GtmContext
} from '@jwiedeman/gtm-kit-vue';

/**
 * Options for the Nuxt GTM module.
 * Extends the Vue plugin options.
 *
 * For automatic page tracking, use the `useTrackPageViews` composable
 * in your app.vue or layout component.
 */
export type NuxtGtmOptions = GtmPluginOptions;

/**
 * Extended context for Nuxt with additional helpers.
 */
export interface NuxtGtmContext extends GtmContext {
  /** Track a page view manually */
  trackPageView: (path?: string, additionalData?: Record<string, unknown>) => void;
}

/**
 * Creates a Nuxt plugin for GTM Kit.
 * Use this in your Nuxt plugins directory.
 *
 * @example
 * ```ts
 * // plugins/gtm.client.ts
 * import { createNuxtGtmPlugin } from '@jwiedeman/gtm-kit-nuxt';
 *
 * export default defineNuxtPlugin((nuxtApp) => {
 *   createNuxtGtmPlugin(nuxtApp.vueApp, {
 *     containers: 'GTM-XXXXXX'
 *   });
 * });
 * ```
 */
export const createNuxtGtmPlugin = (app: App, options: NuxtGtmOptions): GtmClient => {
  // Install the Vue plugin
  app.use(GtmPlugin, options);

  // Get the client from the Vue plugin
  const client = (app.config.globalProperties as { $gtm?: GtmContext }).$gtm?.client;

  if (!client) {
    throw new Error('[gtm-kit/nuxt] Failed to initialize GTM client');
  }

  return client;
};

/**
 * Composable for accessing the full GTM context in Nuxt.
 * This is an alias for useGtm() from @jwiedeman/gtm-kit-vue.
 *
 * @example
 * ```vue
 * <script setup>
 * const { push, client } = useNuxtGtm();
 *
 * push({ event: 'custom_event' });
 * </script>
 * ```
 */
export const useNuxtGtm = useGtm;

/**
 * Composable for pushing events in Nuxt.
 * This is an alias for useGtmPush() from @jwiedeman/gtm-kit-vue.
 */
export const useNuxtGtmPush = useGtmPush;

/**
 * Composable for consent management in Nuxt.
 * This is an alias for useGtmConsent() from @jwiedeman/gtm-kit-vue.
 */
export const useNuxtGtmConsent = useGtmConsent;

/**
 * Composable for accessing the raw GTM client in Nuxt.
 * This is an alias for useGtmClient() from @jwiedeman/gtm-kit-vue.
 */
export const useNuxtGtmClient = useGtmClient;

/**
 * Options for the useTrackPageViews composable.
 */
export interface TrackPageViewsOptions {
  /**
   * The GTM client instance to use.
   * If not provided, will use the client from the Vue plugin context.
   */
  client?: GtmClient;

  /**
   * Reactive route object to watch for changes.
   * Use useRoute() from Nuxt.
   */
  route: {
    fullPath: string;
    path: string;
    query?: Record<string, unknown>;
  };

  /**
   * Custom page view event name.
   * @default 'page_view'
   */
  eventName?: string;

  /**
   * Whether to include query parameters in page path.
   * @default true
   */
  includeQueryParams?: boolean;

  /**
   * Additional data to include with each page view event.
   */
  additionalData?: Record<string, unknown> | (() => Record<string, unknown>);

  /**
   * Whether to track the initial page view on mount.
   * @default true
   */
  trackInitialPageView?: boolean;
}

/**
 * Composable for automatic page view tracking with Nuxt Router.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTrackPageViews } from '@jwiedeman/gtm-kit-nuxt';
 *
 * const route = useRoute();
 *
 * useTrackPageViews({
 *   route,
 *   eventName: 'page_view',
 *   additionalData: { site_section: 'main' }
 * });
 * </script>
 * ```
 */
export const useTrackPageViews = (options: TrackPageViewsOptions): void => {
  const {
    route,
    eventName = 'page_view',
    includeQueryParams = true,
    additionalData,
    trackInitialPageView = true
  } = options;

  // Try to get client from options or from context
  let client: GtmClient | undefined = options.client;

  if (!client) {
    try {
      client = useGtmClient();
    } catch {
      // Client not available from context, will throw later if needed
    }
  }

  if (!client) {
    console.warn(
      '[gtm-kit/nuxt] useTrackPageViews: No GTM client available. ' +
        'Make sure GtmPlugin is installed or pass a client option.'
    );
    return;
  }

  const lastTrackedPath = ref<string>('');

  const getPagePath = (): string => {
    if (includeQueryParams) {
      return route.fullPath;
    }
    return route.path;
  };

  const getAdditionalData = (): Record<string, unknown> => {
    if (typeof additionalData === 'function') {
      return additionalData();
    }
    return additionalData ?? {};
  };

  const trackPageView = (): void => {
    const pagePath = getPagePath();

    // Skip if this path was already tracked
    if (pagePath === lastTrackedPath.value) {
      return;
    }

    lastTrackedPath.value = pagePath;

    client!.push({
      event: eventName,
      page_path: pagePath,
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
      ...getAdditionalData()
    });
  };

  // Track initial page view on mount if enabled
  onMounted(() => {
    if (trackInitialPageView) {
      trackPageView();
    }
  });

  // Watch for route changes
  watch(
    () => route.fullPath,
    () => {
      trackPageView();
    }
  );
};

// Note: Type augmentation for NuxtApp.$gtm should be done in the user's project
// by adding a type declaration file with:
//
// declare module '#app' {
//   interface NuxtApp {
//     $gtm: import('@jwiedeman/gtm-kit-vue').GtmContext;
//   }
// }
