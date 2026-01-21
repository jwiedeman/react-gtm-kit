<script setup lang="ts">
import { watch, onMounted, ref } from 'vue';

const route = useRoute();
const isClient = ref(false);

// Only import and use GTM composables on the client side
// The plugin is only installed client-side (.client.ts)
let push: ((data: Record<string, unknown>) => void) | null = null;

onMounted(async () => {
  isClient.value = true;
  // Dynamically import to avoid SSR issues
  const { useGtmPush } = await import('@jwiedeman/gtm-kit-vue');
  push = useGtmPush();

  // Track initial page view
  push({
    event: 'page_view',
    page_path: route.fullPath,
    page_title: document.title
  });
});

// Track page views on route changes (only on client)
watch(
  () => route.fullPath,
  (path) => {
    if (push && isClient.value) {
      push({
        event: 'page_view',
        page_path: path,
        page_title: document.title
      });
    }
  }
);
</script>

<template>
  <div class="layout">
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <NuxtLink to="/">GTM Kit Nuxt Demo</NuxtLink>
        </div>
        <ul class="nav-links">
          <li><NuxtLink to="/">Home</NuxtLink></li>
          <li><NuxtLink to="/products">Products</NuxtLink></li>
          <li><NuxtLink to="/about">About</NuxtLink></li>
        </ul>
      </nav>
    </header>

    <main class="content">
      <slot />
    </main>

    <footer class="footer">
      <p>GTM Kit Nuxt Example - Powered by <a href="https://github.com/jwiedeman/react-gtm-kit" target="_blank">GTM Kit</a></p>
    </footer>

    <CookieBanner />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #2c3e50;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand a {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: #ecf0f1;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #3498db;
}

.content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background: #34495e;
  color: #ecf0f1;
  text-align: center;
  padding: 1rem;
}

.footer a {
  color: #3498db;
}
</style>
