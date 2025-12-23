# Vue 3 + GTM Kit Example

This example demonstrates how to integrate GTM Kit with a Vue 3 application using Vue Router.

## Quick Start

```bash
# From the monorepo root
pnpm install

# Start the development server
pnpm --filter @react-gtm-kit/example-vue-app dev
```

Open http://localhost:5173 to view the app.

## Features Demonstrated

- GTM script injection with custom data layer name
- Vue Router page view tracking
- Consent Mode v2 with GDPR defaults
- Cookie banner with consent management
- Event tracking from Vue components

## Project Structure

```
vue-app/
├── src/
│   ├── main.ts          # GTM Plugin setup
│   ├── App.vue          # Page view tracking
│   ├── components/
│   │   ├── CookieBanner.vue  # Consent management
│   │   └── Navigation.vue    # Navigation component
│   └── views/
│       ├── Home.vue
│       ├── Products.vue
│       └── About.vue
├── index.html
├── vite.config.ts
└── package.json
```

## Setup Walkthrough

### 1. Install Packages

```bash
npm install @react-gtm-kit/core @react-gtm-kit/vue
```

### 2. Configure GTM Plugin (src/main.ts)

```typescript
import { createApp } from 'vue';
import { GtmPlugin } from '@react-gtm-kit/vue';
import { consentPresets } from '@react-gtm-kit/core';
import App from './App.vue';

const app = createApp(App);

// Configure GTM with consent defaults
app.use(GtmPlugin, {
  containers: 'GTM-XXXXXX', // Replace with your GTM ID
  dataLayerName: 'vueAppDataLayer',
  onBeforeInit: (client) => {
    // Set GDPR-compliant consent defaults
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }
});

app.mount('#app');
```

### 3. Add Page View Tracking (App.vue)

```vue
<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useGtmPush } from '@react-gtm-kit/vue';

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
```

### 4. Track Events from Components

```vue
<script setup lang="ts">
import { useGtmPush } from '@react-gtm-kit/vue';

const push = useGtmPush();

const handleClick = () => {
  push({
    event: 'button_click',
    button_name: 'cta_hero'
  });
};
</script>

<template>
  <button @click="handleClick">Click Me</button>
</template>
```

### 5. Manage Consent (CookieBanner.vue)

```vue
<script setup lang="ts">
import { useGtmConsent } from '@react-gtm-kit/vue';

const { update } = useGtmConsent();

const acceptAll = () => {
  update({
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });
};

const rejectAll = () => {
  update({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
};
</script>
```

## Testing

```bash
# Build the app
pnpm --filter @react-gtm-kit/example-vue-app build

# Run E2E tests
pnpm e2e:test
```

## Debugging

1. Open Chrome DevTools
2. In the Console, type `vueAppDataLayer` to inspect events
3. Use GTM Preview mode for real-time debugging
4. Check Network tab for GTM script loading

## Common Issues

### GTM script not loading

- Verify your container ID is correct
- Check that `onBeforeInit` doesn't throw errors
- Ensure the Vue plugin is installed before mounting

### Page views not tracking

- Make sure `useRoute()` is called in a component inside `<router-view>`
- Check that the watcher is set up with `immediate: true`

### Consent not updating

- Verify the consent update is called after user interaction
- Check browser cookies for persisted consent state

## Learn More

- [GTM Kit Documentation](https://github.com/jwiedeman/GTM-Kit)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Google Tag Manager](https://tagmanager.google.com/)
