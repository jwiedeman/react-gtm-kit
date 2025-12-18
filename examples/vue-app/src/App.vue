<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useGtmPush } from '@react-gtm-kit/vue';
import Navigation from './components/Navigation.vue';
import CookieBanner from './components/CookieBanner.vue';

const route = useRoute();
const push = useGtmPush();

// Track page views on route changes
watch(
  () => route.fullPath,
  (path) => {
    push({
      event: 'page_view',
      page_path: path,
      page_title: document.title
    });
  },
  { immediate: true }
);
</script>

<template>
  <div class="app">
    <Navigation />
    <main class="content">
      <router-view />
    </main>
    <CookieBanner />
  </div>
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

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
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
</style>
