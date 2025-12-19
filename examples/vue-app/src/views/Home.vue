<script setup lang="ts">
import { useGtmPush } from '@jwiedeman/gtm-kit-vue';

const push = useGtmPush();

const trackCTAClick = () => {
  push({
    event: 'cta_click',
    cta_name: 'hero_get_started',
    cta_location: 'homepage_hero'
  });
};
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>Welcome to GTM Kit</h1>
      <p>The simplest way to add Google Tag Manager to your Vue app.</p>
      <button class="cta-button" @click="trackCTAClick">
        Get Started
      </button>
    </section>

    <section class="features">
      <h2>Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Zero Dependencies</h3>
          <p>Core package is only 3.7KB gzipped with no runtime dependencies.</p>
        </div>
        <div class="feature-card">
          <h3>Consent Mode v2</h3>
          <p>Built-in support for Google's Consent Mode with ready-to-use presets.</p>
        </div>
        <div class="feature-card">
          <h3>TypeScript First</h3>
          <p>Full TypeScript support with complete type definitions.</p>
        </div>
        <div class="feature-card">
          <h3>Vue 3 Ready</h3>
          <p>Native Vue 3 composables and plugin for seamless integration.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding: 2rem 0;
}

.hero {
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-button {
  background: white;
  color: #667eea;
  font-size: 1.125rem;
  padding: 0.75rem 2rem;
  font-weight: 600;
}

.features {
  padding: 2rem 0;
}

.features h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #6c757d;
}
</style>
