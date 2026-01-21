<script setup lang="ts">
import { onMounted } from 'vue';

// Enable automatic page view tracking (client-side only)
const route = useRoute();

// Only use GTM composables on the client side
// The GTM plugin is only installed client-side (.client.ts)
onMounted(async () => {
  const { useTrackPageViews } = await import('@jwiedeman/gtm-kit-nuxt');

  useTrackPageViews({
    route,
    eventName: 'page_view',
    includeQueryParams: true,
    trackInitialPageView: true
  });
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: #333;
}

button {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover {
  opacity: 0.9;
}

a {
  color: #3498db;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
