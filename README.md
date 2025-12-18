# GTM Kit

**The simplest way to add Google Tag Manager to any JavaScript app.**

Works with React, Vue, Next.js, Nuxt, or vanilla JavaScript. Pick what you need, ignore the rest.

[![CI](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/react-gtm-kit/graph/badge.svg)](https://codecov.io/gh/jwiedeman/react-gtm-kit)

---

## Why GTM Kit?

| Problem                               | GTM Kit Solution                  |
| ------------------------------------- | --------------------------------- |
| "GTM fires twice in React StrictMode" | We handle it. Zero double-fires.  |
| "How do I do Consent Mode v2?"        | One-liner with built-in presets.  |
| "I need multiple GTM containers"      | Pass an array. Done.              |
| "It breaks SSR"                       | Nope. SSR-safe by default.        |
| "The bundle is huge"                  | Core is 3.7KB gzipped. Zero deps. |

---

## Installation

Copy-paste the command for your framework:

### React (hooks)

```bash
npm install @react-gtm-kit/core @react-gtm-kit/react-modern
```

### Vue 3

```bash
npm install @react-gtm-kit/core @react-gtm-kit/vue
```

### Next.js (App Router)

```bash
npm install @react-gtm-kit/core @react-gtm-kit/next
```

### Nuxt 3

```bash
npm install @react-gtm-kit/core @react-gtm-kit/nuxt
```

### Vanilla JavaScript / Any Framework

```bash
npm install @react-gtm-kit/core
```

### React (class components / pre-hooks)

```bash
npm install @react-gtm-kit/core @react-gtm-kit/react-legacy
```

---

## Quick Start (5 minutes)

### React

```tsx
// Step 1: Wrap your app (usually in index.tsx or App.tsx)
import { GtmProvider } from '@react-gtm-kit/react-modern';

function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <YourApp />
    </GtmProvider>
  );
}
```

```tsx
// Step 2: Push events from any component
import { useGtmPush } from '@react-gtm-kit/react-modern';

function BuyButton() {
  const push = useGtmPush();

  const handleClick = () => {
    push({ event: 'purchase', value: 49.99 });
  };

  return <button onClick={handleClick}>Buy Now</button>;
}
```

**That's it.** GTM is now running.

---

### Vue 3

```ts
// Step 1: Add plugin (main.ts)
import { createApp } from 'vue';
import { GtmPlugin } from '@react-gtm-kit/vue';
import App from './App.vue';

createApp(App).use(GtmPlugin, { containers: 'GTM-XXXXXX' }).mount('#app');
```

```vue
<!-- Step 2: Push events from any component -->
<script setup>
import { useGtm } from '@react-gtm-kit/vue';

const { push } = useGtm();

function handleClick() {
  push({ event: 'purchase', value: 49.99 });
}
</script>

<template>
  <button @click="handleClick">Buy Now</button>
</template>
```

---

### Next.js (App Router)

```tsx
// Step 1: Add to layout (app/layout.tsx)
import { GtmHeadScript, GtmNoScript } from '@react-gtm-kit/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GtmHeadScript containers="GTM-XXXXXX" />
      </head>
      <body>
        <GtmNoScript containers="GTM-XXXXXX" />
        {children}
      </body>
    </html>
  );
}
```

```tsx
// Step 2: Create a client provider (app/providers/gtm.tsx)
'use client';
import { createGtmClient } from '@react-gtm-kit/core';
import { useTrackPageViews } from '@react-gtm-kit/next';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init();

export function GtmProvider({ children }) {
  useTrackPageViews({ client }); // Auto-tracks route changes
  return children;
}
```

```tsx
// Step 3: Push events
import { pushEvent } from '@react-gtm-kit/core';

// Use the same client instance
pushEvent(client, 'purchase', { value: 49.99 });
```

---

### Nuxt 3

```ts
// Step 1: Create plugin (plugins/gtm.client.ts)
import { GtmPlugin } from '@react-gtm-kit/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, { containers: 'GTM-XXXXXX' });
});
```

```vue
<!-- Step 2: Push events from any component -->
<script setup>
import { useGtm } from '@react-gtm-kit/vue';

const { push } = useGtm();
push({ event: 'page_view' });
</script>
```

---

### Vanilla JavaScript

```ts
import { createGtmClient, pushEvent } from '@react-gtm-kit/core';

// Step 1: Create and initialize
const gtm = createGtmClient({ containers: 'GTM-XXXXXX' });
gtm.init();

// Step 2: Push events
pushEvent(gtm, 'page_view', { page_path: '/' });
pushEvent(gtm, 'purchase', { value: 49.99, currency: 'USD' });
```

Works with Vite, Webpack, esbuild, plain `<script>` tags—anything.

---

## Consent Mode v2 (GDPR)

Required for EU compliance. GTM Kit makes it easy:

```tsx
// React example
import { GtmProvider, useGtmConsent } from '@react-gtm-kit/react-modern';
import { consentPresets } from '@react-gtm-kit/core';

// Set defaults BEFORE GTM loads (required by Google)
<GtmProvider
  config={{ containers: 'GTM-XXXXXX' }}
  onBeforeInit={(client) => {
    // Deny everything by default for EU users
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }}
>
  <App />
</GtmProvider>;

// In your cookie banner
function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  const acceptAll = () => {
    updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  };

  const rejectAll = () => {
    updateConsent({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  };

  return (
    <div>
      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject All</button>
    </div>
  );
}
```

**Built-in presets:**

- `consentPresets.eeaDefault` — All denied (GDPR default)
- `consentPresets.allGranted` — All granted
- `consentPresets.analyticsOnly` — Analytics only, no ads

---

## Ecommerce Events (GA4)

```ts
import { pushEcommerce } from '@react-gtm-kit/core';

// Purchase
pushEcommerce(client, 'purchase', {
  transaction_id: 'T-12345',
  value: 120.0,
  currency: 'USD',
  items: [{ item_id: 'SKU-001', item_name: 'Blue T-Shirt', price: 40, quantity: 3 }]
});

// Add to cart
pushEcommerce(client, 'add_to_cart', {
  value: 40.0,
  currency: 'USD',
  items: [{ item_id: 'SKU-001', item_name: 'Blue T-Shirt', price: 40, quantity: 1 }]
});
```

---

## Common Use Cases

### Multiple GTM Containers

```ts
const client = createGtmClient({
  containers: [{ id: 'GTM-MAIN' }, { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }]
});
```

### Custom Data Layer Name

```ts
const client = createGtmClient({
  containers: 'GTM-XXXXXX',
  dataLayerName: 'myDataLayer' // Instead of default 'dataLayer'
});
```

### CSP (Content Security Policy) Nonce

```tsx
// Next.js
<GtmHeadScript containers="GTM-XXXXXX" scriptAttributes={{ nonce: serverNonce }} />
```

### Track Page Views (React Router)

```tsx
import { useLocation } from 'react-router-dom';
import { useGtmPush } from '@react-gtm-kit/react-modern';
import { useEffect, useRef } from 'react';

function PageTracker() {
  const location = useLocation();
  const push = useGtmPush();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path !== lastPath.current) {
      lastPath.current = path;
      push({ event: 'page_view', page_path: path });
    }
  }, [location, push]);

  return null;
}
```

### Track Page Views (Vue Router)

```ts
import { useGtm } from '@react-gtm-kit/vue';
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
```

---

## API Reference

### Core Client

```ts
import { createGtmClient, pushEvent, pushEcommerce } from '@react-gtm-kit/core';

const client = createGtmClient({
  containers: 'GTM-XXXXXX', // Required: ID or array of IDs
  dataLayerName: 'dataLayer', // Optional: custom name
  host: 'https://www.googletagmanager.com', // Optional: custom host
  scriptAttributes: { nonce: '...' } // Optional: for CSP
});

client.init(); // Start GTM
client.push({ event: 'custom' }); // Push to dataLayer
client.setConsentDefaults(state); // Set consent (before init)
client.updateConsent(state); // Update consent (after user action)
client.teardown(); // Cleanup (for tests)
await client.whenReady(); // Wait for scripts to load
```

### React Hooks

```ts
import {
  useGtm, // Full context { client, push, ... }
  useGtmPush, // Just the push() function
  useGtmConsent, // { setConsentDefaults, updateConsent }
  useGtmClient, // Raw client instance
  useGtmReady // whenReady() function
} from '@react-gtm-kit/react-modern';
```

### Vue Composables

```ts
import {
  useGtm, // Full API { client, push, updateConsent, ... }
  useGtmPush, // Just push()
  useGtmConsent // Consent methods
} from '@react-gtm-kit/vue';
```

### Next.js Helpers

```ts
import {
  GtmHeadScript, // Server component for <head>
  GtmNoScript, // Server component for noscript fallback
  useTrackPageViews // Auto page tracking hook
} from '@react-gtm-kit/next';
```

---

## Package Sizes

| Package                       | Size (gzip) | Use Case               |
| ----------------------------- | ----------- | ---------------------- |
| `@react-gtm-kit/core`         | 3.7 KB      | Required for all       |
| `@react-gtm-kit/react-modern` | 6.9 KB      | React 16.8+            |
| `@react-gtm-kit/react-legacy` | 6.9 KB      | React class components |
| `@react-gtm-kit/vue`          | ~4 KB       | Vue 3                  |
| `@react-gtm-kit/next`         | 14.2 KB     | Next.js 13+            |
| `@react-gtm-kit/nuxt`         | ~5 KB       | Nuxt 3                 |

---

## Troubleshooting

### "GTM fires twice"

This usually means StrictMode is enabled (React dev mode). **GTM Kit handles this automatically.** If you're still seeing issues:

```tsx
// Verify you're using the provider correctly
<GtmProvider config={{ containers: 'GTM-XXXXXX' }}>{/* Your app - only ONE provider at the root */}</GtmProvider>
```

### "Events not showing in GTM debugger"

1. Check your container ID (GTM-XXXXXX format)
2. Open browser console, type `dataLayer` - you should see your events
3. Make sure GTM container is published (not just in preview)

### "Consent Mode isn't working"

Consent defaults **MUST** be set before `init()`:

```tsx
// ✅ Correct - use onBeforeInit
<GtmProvider
  config={{ containers: 'GTM-XXXXXX' }}
  onBeforeInit={(client) => {
    client.setConsentDefaults(consentPresets.eeaDefault);
  }}
>

// ❌ Wrong - too late, GTM already initialized
useEffect(() => {
  client.setConsentDefaults(...); // This won't work
}, []);
```

### "Type errors with TypeScript"

Make sure you have the correct types:

```bash
npm install --save-dev @types/react @types/react-dom
```

### "Module not found"

```bash
# Clear your node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Framework Support Matrix

| Framework     | Package                       | Status    | Min Version |
| ------------- | ----------------------------- | --------- | ----------- |
| Vanilla JS    | `@react-gtm-kit/core`         | ✅ Stable | ES2018+     |
| React (hooks) | `@react-gtm-kit/react-modern` | ✅ Stable | 16.8+       |
| React (class) | `@react-gtm-kit/react-legacy` | ✅ Stable | 16.0+       |
| Next.js       | `@react-gtm-kit/next`         | ✅ Stable | 13+         |
| Vue 3         | `@react-gtm-kit/vue`          | ✅ Stable | 3.0+        |
| Nuxt 3        | `@react-gtm-kit/nuxt`         | ✅ Stable | 3.0+        |

---

## Examples

Working example apps for each framework:

```bash
git clone https://github.com/jwiedeman/react-gtm-kit.git
cd react-gtm-kit

# Install dependencies
pnpm install

# Run any example
pnpm --filter vanilla-csr dev
pnpm --filter react-strict-mode dev
pnpm --filter vue-app dev
pnpm --filter next-app dev
pnpm --filter nuxt-app dev
```

---

## Contributing

```bash
# Setup
pnpm install

# Run all tests
pnpm test

# Run E2E tests
pnpm e2e:test

# Build all packages
pnpm build

# Lint
pnpm lint
```

See [CONTRIBUTING.md](./docs/governance/contributing.md) for more details.

---

## License

MIT — use it however you want.
