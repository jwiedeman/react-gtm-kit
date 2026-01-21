<script lang="ts">
  /**
   * GTM Kit Svelte Layout Pattern
   *
   * This layout demonstrates the recommended way to set up GTM in a SvelteKit app.
   *
   * Key patterns demonstrated:
   *
   * 1. **Browser Guard**: The `browser` check from SvelteKit's `$app/environment` is
   *    essential for SSR safety. GTM requires the DOM and window object, so we only
   *    initialize on the client side. Without this guard, SSR would fail.
   *
   * 2. **Context Setup**: `setGtmContext()` makes the GTM store available to all
   *    child components via Svelte's context API. Child components use `getGtmContext()`
   *    to access the stores.
   *
   * 3. **Consent Defaults**: The `onBeforeInit` callback sets consent defaults BEFORE
   *    the GTM script loads. This ensures Google's consent mode is properly configured
   *    from the first request. Always set consent defaults before initialization.
   *
   * 4. **Environment Variables**: Container ID and dataLayer name can be configured
   *    via environment variables for different deployments (dev/staging/prod).
   *
   * Note: Unlike React/Vue, Svelte requires manual cleanup in components that use
   * the GTM store. See individual page components for cleanup patterns.
   */
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  import { browser } from '$app/environment';

  const containerId = import.meta.env.VITE_GTM_CONTAINERS ?? 'GTM-SVELTE';
  const dataLayerName = import.meta.env.VITE_GTM_DATALAYER ?? 'svelteDataLayer';

  // Browser guard: GTM requires DOM/window, only available in browser context
  if (browser) {
    const gtm = createGtmStore({
      containers: containerId,
      dataLayerName,
      onBeforeInit: (client) => {
        // IMPORTANT: Set consent defaults BEFORE GTM script loads
        // This ensures proper consent mode behavior from the first request
        client.setConsentDefaults({
          analytics_storage: 'denied',
          ad_storage: 'denied'
        });
      }
    });
    // Make GTM available to all child components via Svelte context
    setGtmContext(gtm);
  }
</script>

<nav>
  <a href="/">Home</a>
  <a href="/products">Products</a>
  <a href="/about">About</a>
</nav>

<main>
  <slot />
</main>

<style>
  nav {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  nav a {
    color: #333;
    text-decoration: none;
  }

  nav a:hover {
    text-decoration: underline;
  }

  main {
    padding: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }
</style>
