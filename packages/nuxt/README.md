# @jwiedeman/gtm-kit-nuxt

[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/GTM-Kit/graph/badge.svg?flag=nuxt)](https://codecov.io/gh/jwiedeman/GTM-Kit)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-nuxt.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-nuxt)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jwiedeman/gtm-kit-nuxt)](https://bundlephobia.com/package/@jwiedeman/gtm-kit-nuxt)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.0+-00DC82.svg?logo=nuxt.js)](https://nuxt.com/)

**Nuxt 3 module for Google Tag Manager. Auto page tracking. Zero config.**

The Nuxt adapter for GTM Kit - native module with automatic page tracking and SSR support.

---

## Installation

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-nuxt
```

```bash
yarn add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-nuxt
```

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-nuxt
```

---

## Quick Start

### Step 1: Create Plugin

```ts
// plugins/gtm.client.ts
import { GtmPlugin } from '@jwiedeman/gtm-kit-nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, { containers: 'GTM-XXXXXX' });
});
```

### Step 2: Push Events

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';

const { push } = useGtm();

push({ event: 'page_view' });
</script>
```

**That's it!** GTM is running with automatic page tracking.

---

## Features

| Feature                | Description                         |
| ---------------------- | ----------------------------------- |
| **Native Nuxt Module** | Built specifically for Nuxt 3       |
| **Auto Page Tracking** | Tracks route changes automatically  |
| **SSR Support**        | Server-side rendering compatible    |
| **Composables**        | Uses Vue composables under the hood |
| **TypeScript**         | Full type definitions included      |
| **Consent Mode v2**    | Built-in GDPR compliance            |

---

## Plugin Configuration

```ts
// plugins/gtm.client.ts
import { GtmPlugin } from '@jwiedeman/gtm-kit-nuxt';
import { consentPresets } from '@jwiedeman/gtm-kit';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, {
    containers: 'GTM-XXXXXX',
    dataLayerName: 'dataLayer',
    onBeforeInit: (client) => {
      // Set consent defaults for EU
      client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
    }
  });
});
```

---

## Available Composables

All composables from `@jwiedeman/gtm-kit-vue` are available:

### `useGtm()`

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';

const { push, updateConsent } = useGtm();
</script>
```

### `useGtmPush()`

```vue
<script setup>
import { useGtmPush } from '@jwiedeman/gtm-kit-vue';

const push = useGtmPush();

push({ event: 'purchase', value: 99.99 });
</script>
```

### `useGtmConsent()`

```vue
<script setup>
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';

const { updateConsent } = useGtmConsent();
</script>
```

---

## Automatic Page Tracking

The Nuxt module automatically tracks page views on route changes. No additional setup required.

If you need custom page tracking:

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';
import { useRoute } from 'vue-router';
import { watch } from 'vue';

const route = useRoute();
const { push } = useGtm();

// Custom page tracking with additional data
watch(
  () => route.fullPath,
  (path) => {
    push({
      event: 'page_view',
      page_path: path,
      page_title: document.title,
      user_type: 'logged_in' // custom data
    });
  }
);
</script>
```

---

## Consent Mode v2 (GDPR)

```ts
// plugins/gtm.client.ts
import { GtmPlugin } from '@jwiedeman/gtm-kit-nuxt';
import { consentPresets } from '@jwiedeman/gtm-kit';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, {
    containers: 'GTM-XXXXXX',
    onBeforeInit: (client) => {
      // Deny all by default for EU users
      client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
    }
  });
});
```

```vue
<!-- components/CookieBanner.vue -->
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

// Partial update - only change specific categories
const customChoice = () =>
  updateConsent({
    analytics_storage: 'granted',
    ad_storage: 'denied'
  });
</script>

<template>
  <div class="cookie-banner">
    <button @click="acceptAll">Accept All</button>
    <button @click="rejectAll">Reject All</button>
    <button @click="analyticsOnly">Analytics Only</button>
  </div>
</template>
```

**Granular Updates** - Update individual categories without affecting others:

```vue
<script setup>
const { updateConsent } = useGtmConsent();

// User later opts into ads from settings page
const enableAds = () =>
  updateConsent({
    ad_storage: 'granted',
    ad_user_data: 'granted'
  });
// analytics_storage and ad_personalization remain unchanged
</script>
```

---

## SSR Considerations

The plugin file is named `gtm.client.ts` (note the `.client` suffix) to ensure it only runs on the client side. GTM requires a browser environment.

For noscript fallback (SEO), you can add this to your `app.vue`:

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- GTM noscript fallback -->
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
</template>
```

---

## Multiple Containers

```ts
// plugins/gtm.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, {
    containers: [{ id: 'GTM-MAIN' }, { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }]
  });
});
```

---

## Runtime Config

You can use Nuxt runtime config for the GTM ID:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      gtmId: process.env.GTM_ID || 'GTM-XXXXXX'
    }
  }
});
```

```ts
// plugins/gtm.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  nuxtApp.vueApp.use(GtmPlugin, {
    containers: config.public.gtmId
  });
});
```

---

## Requirements

- Nuxt 3.0+
- Vue 3.3+
- `@jwiedeman/gtm-kit` (peer dependency)

---

## License

MIT
