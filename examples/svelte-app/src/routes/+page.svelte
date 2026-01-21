<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { pushEvent } from '@jwiedeman/gtm-kit';

  let dataLayerSnapshot: string = '[]';

  function getDataLayer(): unknown[] {
    if (!browser) return [];
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    return Array.isArray(layer) ? layer : [];
  }

  function updateSnapshot() {
    dataLayerSnapshot = JSON.stringify(getDataLayer(), null, 2);
  }

  function handlePageView() {
    if (!browser) return;
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    if (Array.isArray(layer)) {
      layer.push({
        event: 'page_view',
        page_title: 'Manual Page View',
        page_path: `/demo/${Date.now()}`
      });
      updateSnapshot();
    }
  }

  function handleCtaClick() {
    if (!browser) return;
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    if (Array.isArray(layer)) {
      layer.push({
        event: 'cta_click',
        cta_label: 'Get Started',
        timestamp: new Date().toISOString()
      });
      updateSnapshot();
    }
  }

  function handleGrantAnalytics() {
    if (!browser) return;
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    if (Array.isArray(layer)) {
      layer.push(['consent', 'update', { analytics_storage: 'granted' }]);
      updateSnapshot();
    }
  }

  onMount(() => {
    // Initial page view
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    if (Array.isArray(layer)) {
      layer.push({
        event: 'page_view',
        page_title: 'Home',
        page_path: '/'
      });
    }

    // Update snapshot periodically
    updateSnapshot();
    const interval = setInterval(updateSnapshot, 1000);
    return () => clearInterval(interval);
  });
</script>

<h1>GTM-Kit Svelte Example</h1>

<section>
  <h2>Send Events</h2>
  <button on:click={handlePageView}>Push Page View</button>
  <button on:click={handleCtaClick}>Push CTA Click</button>
</section>

<section>
  <h2>Consent</h2>
  <button on:click={handleGrantAnalytics}>Grant Analytics</button>
</section>

<section>
  <h2>Data Layer Snapshot</h2>
  <pre>{dataLayerSnapshot}</pre>
</section>

<style>
  section {
    margin: 2rem 0;
  }

  button {
    padding: 0.5rem 1rem;
    margin-right: 0.5rem;
    cursor: pointer;
  }

  pre {
    background: #f5f5f5;
    padding: 1rem;
    overflow: auto;
    max-height: 300px;
    font-size: 0.85rem;
  }
</style>
