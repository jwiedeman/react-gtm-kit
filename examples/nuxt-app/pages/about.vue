<script setup lang="ts">
import { useGtm } from '@react-gtm-kit/vue';

const { push } = useGtm();

const trackFormSubmit = () => {
  push({
    event: 'form_submit',
    form_name: 'contact_form'
  });
  alert('Form event tracked!');
};

useHead({
  title: 'About - GTM Kit Nuxt Demo'
});
</script>

<template>
  <div class="about">
    <h1>About GTM Kit</h1>

    <section class="section">
      <h2>Nuxt 3 Integration</h2>
      <p>
        GTM Kit provides first-class support for Nuxt 3 with automatic page view
        tracking, SSR compatibility, and a simple plugin-based setup.
      </p>
    </section>

    <section class="section">
      <h2>Setup Instructions</h2>
      <ol>
        <li>Install the packages:
          <code>npm install @react-gtm-kit/core @react-gtm-kit/vue @react-gtm-kit/nuxt</code>
        </li>
        <li>Create a client plugin at <code>plugins/gtm.client.ts</code></li>
        <li>Use the composables in your components</li>
      </ol>
    </section>

    <section class="section">
      <h2>Test Tracking</h2>
      <button @click="trackFormSubmit">Track Form Submit</button>
    </section>
  </div>
</template>

<style scoped>
.about h1 {
  margin-bottom: 2rem;
}

.section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.section h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.section p {
  color: #495057;
}

.section ol {
  margin-left: 1.5rem;
}

.section li {
  margin-bottom: 0.75rem;
  color: #495057;
}

.section code {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.section button {
  background: #00dc82;
  color: white;
}
</style>
