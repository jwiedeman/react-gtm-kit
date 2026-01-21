<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  onMount(() => {
    if (!browser) return;
    const layer = (window as unknown as { svelteDataLayer?: unknown[] }).svelteDataLayer;
    if (Array.isArray(layer)) {
      layer.push({
        event: 'page_view',
        page_title: 'About',
        page_path: '/about'
      });
    }
  });
</script>

<h1>About</h1>
<p>Learn more about GTM-Kit and Svelte integration.</p>
