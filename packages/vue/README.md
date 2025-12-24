# @jwiedeman/gtm-kit-vue

[![CI](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/react-gtm-kit/graph/badge.svg?flag=vue)](https://codecov.io/gh/jwiedeman/react-gtm-kit)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-vue.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-vue)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jwiedeman/gtm-kit-vue)](https://bundlephobia.com/package/@jwiedeman/gtm-kit-vue)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.3+-4FC08D.svg?logo=vue.js)](https://vuejs.org/)

**Vue 3 plugin and composables for Google Tag Manager. Composition API ready.**

The Vue adapter for GTM Kit - provides a plugin and composables for clean Vue integration.

---

## Installation

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-vue
```

```bash
yarn add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-vue
```

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-vue
```

---

## Quick Start

### Step 1: Add Plugin

```ts
// main.ts
import { createApp } from 'vue';
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';
import App from './App.vue';

createApp(App).use(GtmPlugin, { containers: 'GTM-XXXXXX' }).mount('#app');
```

### Step 2: Push Events

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';

const { push } = useGtm();

function handleClick() {
  push({ event: 'purchase', value: 49.99 });
}
</script>

<template>
  <button @click="handleClick">Buy Now</button>
</template>
```

**That's it!** GTM is now running.

---

## Features

| Feature             | Description                    |
| ------------------- | ------------------------------ |
| **Vue 3 Native**    | Built for Composition API      |
| **Composables**     | Clean, reactive Vue patterns   |
| **TypeScript**      | Full type definitions included |
| **Consent Mode v2** | Built-in GDPR compliance       |
| **SSR Compatible**  | Safe for Nuxt and Vite SSR     |
| **Lightweight**     | ~4KB gzipped                   |

---

## Available Composables

### `useGtm()`

Get the full GTM API.

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';

const { client, push, updateConsent, setConsentDefaults } = useGtm();

push({ event: 'page_view', page_path: '/' });
</script>
```

### `useGtmPush()`

Get just the push function.

```vue
<script setup>
import { useGtmPush } from '@jwiedeman/gtm-kit-vue';

const push = useGtmPush();

push({ event: 'button_click', button_id: 'cta-main' });
</script>
```

### `useGtmConsent()`

Manage consent state.

```vue
<script setup>
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';

const { updateConsent } = useGtmConsent();

function acceptAll() {
  updateConsent({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });
}
</script>
```

### `useGtmClient()`

Get the raw GTM client instance.

```vue
<script setup>
import { useGtmClient } from '@jwiedeman/gtm-kit-vue';

const client = useGtmClient();

onMounted(async () => {
  await client.whenReady();
  console.log('GTM is ready!');
});
</script>
```

### `useGtmReady()`

Get a function that resolves when GTM is loaded.

```vue
<script setup>
import { useGtmReady } from '@jwiedeman/gtm-kit-vue';

const whenReady = useGtmReady();

onMounted(async () => {
  await whenReady();
  console.log('GTM scripts loaded!');
});
</script>
```

---

## Plugin Options

```ts
app.use(GtmPlugin, {
  containers: 'GTM-XXXXXX', // Required
  dataLayerName: 'dataLayer', // Optional
  host: 'https://custom.host.com', // Optional
  scriptAttributes: { nonce: '...' }, // Optional: CSP
  onBeforeInit: (client) => {
    // Called before GTM initializes
    // Perfect for consent defaults
  },
  onAfterInit: (client) => {
    // Called after GTM initializes
  }
});
```

---

## Vue Router Integration

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';
import { watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { push } = useGtm();

watch(
  () => route.fullPath,
  (path) => {
    push({ event: 'page_view', page_path: path });
  }
);
</script>
```

Or create a reusable composable:

```ts
// composables/usePageTracking.ts
import { useGtm } from '@jwiedeman/gtm-kit-vue';
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export function usePageTracking() {
  const route = useRoute();
  const { push } = useGtm();

  onMounted(() => {
    // Track initial page
    push({ event: 'page_view', page_path: route.fullPath });
  });

  watch(
    () => route.fullPath,
    (path, oldPath) => {
      if (path !== oldPath) {
        push({ event: 'page_view', page_path: path });
      }
    }
  );
}
```

---

## Consent Mode v2 (GDPR)

```ts
// main.ts
import { createApp } from 'vue';
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';
import { consentPresets } from '@jwiedeman/gtm-kit';
import App from './App.vue';

createApp(App)
  .use(GtmPlugin, {
    containers: 'GTM-XXXXXX',
    onBeforeInit: (client) => {
      // Deny by default for EU users
      client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
    }
  })
  .mount('#app');
```

```vue
<!-- CookieBanner.vue -->
<script setup>
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';
import { consentPresets } from '@jwiedeman/gtm-kit';

const { updateConsent } = useGtmConsent();

// Accept all tracking
const acceptAll = () => updateConsent(consentPresets.allGranted);

// Reject all tracking
const rejectAll = () => updateConsent(consentPresets.eeaDefault);

// Analytics only (mixed consent)
const analyticsOnly = () => updateConsent(consentPresets.analyticsOnly);

// Granular: custom selection
const customChoice = () =>
  updateConsent({
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
</script>

<template>
  <div class="cookie-banner">
    <p>We use cookies to improve your experience.</p>
    <button @click="acceptAll">Accept All</button>
    <button @click="rejectAll">Reject All</button>
    <button @click="analyticsOnly">Analytics Only</button>
  </div>
</template>
```

**Partial Updates** - Only update changed categories:

```vue
<script setup>
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';

const { updateConsent } = useGtmConsent();

// User later opts into ads from preference center
const enableAds = () =>
  updateConsent({
    ad_storage: 'granted',
    ad_user_data: 'granted'
  });
// Other categories (analytics_storage, ad_personalization) remain unchanged
</script>
```

---

## Nuxt 3

For Nuxt 3 projects, use [`@jwiedeman/gtm-kit-nuxt`](https://www.npmjs.com/package/@jwiedeman/gtm-kit-nuxt) which provides:

- Native Nuxt module integration
- Auto-import of composables
- Automatic page tracking
- SSR support out of the box

---

## Requirements

- Vue 3.3+
- `@jwiedeman/gtm-kit` (peer dependency)

---

## License

MIT
