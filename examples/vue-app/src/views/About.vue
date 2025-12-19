<script setup lang="ts">
import { useGtm } from '@jwiedeman/gtm-kit-vue';

const { push, whenReady } = useGtm();

// Example of using whenReady
whenReady().then((states) => {
  console.log('GTM scripts loaded:', states);
});

const trackFormSubmit = () => {
  push({
    event: 'form_submit',
    form_name: 'contact_form',
    form_destination: 'support@example.com'
  });
  alert('Form submitted! Event tracked.');
};

const showDataLayer = () => {
  // Access the dataLayer directly
  const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer;
  console.log('Current dataLayer:', dataLayer);
  alert('Check the browser console to see the dataLayer contents.');
};
</script>

<template>
  <div class="about-page">
    <h1>About GTM Kit</h1>

    <section class="about-section">
      <h2>What is GTM Kit?</h2>
      <p>
        GTM Kit is a lightweight, production-ready Google Tag Manager integration
        that works with any JavaScript framework. It provides a simple, consistent
        API across React, Vue, Next.js, Nuxt, and vanilla JavaScript.
      </p>
    </section>

    <section class="about-section">
      <h2>Key Features</h2>
      <ul>
        <li><strong>Zero Dependencies</strong> - Core is 3.7KB gzipped</li>
        <li><strong>Consent Mode v2</strong> - Built-in GDPR compliance</li>
        <li><strong>Multi-container</strong> - Support for multiple GTM containers</li>
        <li><strong>SSR-safe</strong> - Works with server-side rendering</li>
        <li><strong>TypeScript</strong> - Full type coverage</li>
        <li><strong>StrictMode-safe</strong> - No double-firing in React</li>
      </ul>
    </section>

    <section class="about-section">
      <h2>Try It Out</h2>
      <p>Click the buttons below to test GTM tracking:</p>
      <div class="button-group">
        <button @click="trackFormSubmit">Track Form Submit</button>
        <button @click="showDataLayer">Show dataLayer</button>
      </div>
    </section>

    <section class="about-section">
      <h2>Documentation</h2>
      <p>
        For more information, check out the
        <a href="https://github.com/jwiedeman/react-gtm-kit" target="_blank">
          GitHub repository
        </a>.
      </p>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 800px;
  margin: 0 auto;
}

.about-page h1 {
  margin-bottom: 2rem;
}

.about-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.about-section h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.about-section p {
  color: #495057;
  margin-bottom: 1rem;
}

.about-section ul {
  margin-left: 1.5rem;
}

.about-section li {
  margin-bottom: 0.5rem;
  color: #495057;
}

.about-section a {
  color: #3498db;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.button-group button {
  background: #3498db;
  color: white;
}
</style>
