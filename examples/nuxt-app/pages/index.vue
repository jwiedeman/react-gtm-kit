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

// Set page meta
useHead({
  title: 'Home - GTM Kit Nuxt Demo'
});
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>GTM Kit for Nuxt 3</h1>
      <p>Server-side rendering ready Google Tag Manager integration.</p>
      <button class="cta-button" @click="trackCTAClick">
        Get Started
      </button>
    </section>

    <section class="features">
      <h2>Why GTM Kit?</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>SSR Ready</h3>
          <p>Works seamlessly with Nuxt 3's server-side rendering.</p>
        </div>
        <div class="feature-card">
          <h3>Auto Page Tracking</h3>
          <p>Automatic page view tracking on route changes.</p>
        </div>
        <div class="feature-card">
          <h3>Consent Mode v2</h3>
          <p>Built-in GDPR compliance with consent presets.</p>
        </div>
        <div class="feature-card">
          <h3>TypeScript</h3>
          <p>Full TypeScript support with complete types.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding: 1rem 0;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #00dc82 0%, #36e4da 50%, #0047e1 100%);
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
  color: #00dc82;
  font-size: 1.125rem;
  padding: 0.75rem 2rem;
  font-weight: 600;
}

.features h2 {
  text-align: center;
  margin-bottom: 2rem;
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
