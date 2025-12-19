# GTM Kit

**The simplest way to add Google Tag Manager to any JavaScript app.**

Works with React, Vue, Next.js, Nuxt, Svelte, SolidJS, Remix, or vanilla JavaScript. Pick what you need, ignore the rest.

<!-- Badges: Build & Quality -->
[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![E2E](https://github.com/jwiedeman/GTM-Kit/actions/workflows/e2e.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/e2e.yml)
[![codecov](https://codecov.io/gh/jwiedeman/GTM-Kit/graph/badge.svg)](https://codecov.io/gh/jwiedeman/GTM-Kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<!-- Badges: Package Status -->
![core](https://img.shields.io/badge/core-3.7KB-brightgreen?logo=javascript&logoColor=white)
![react](https://img.shields.io/badge/react-6.9KB-61DAFB?logo=react&logoColor=white)
![vue](https://img.shields.io/badge/vue-4KB-4FC08D?logo=vuedotjs&logoColor=white)
![next](https://img.shields.io/badge/next-14.2KB-000000?logo=nextdotjs&logoColor=white)
![nuxt](https://img.shields.io/badge/nuxt-5KB-00DC82?logo=nuxtdotjs&logoColor=white)

<!-- Badges: More Frameworks -->
![svelte](https://img.shields.io/badge/svelte-4KB-FF3E00?logo=svelte&logoColor=white)
![solid](https://img.shields.io/badge/solid-5KB-2C4F7C?logo=solid&logoColor=white)
![remix](https://img.shields.io/badge/remix-8KB-000000?logo=remix&logoColor=white)

<!-- Badges: Meta -->
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

### The Lazy Way (Recommended)

Just run this command. It auto-detects your framework and sets everything up:

```bash
npx @react-gtm-kit/cli init
```

Done. Seriously, that's it.

---

### Manual Installation

If you prefer to install manually, copy-paste the command for your framework:

| Framework | Command |
|-----------|---------|
| **React** | `npm install @react-gtm-kit/core @react-gtm-kit/react-modern` |
| **Vue 3** | `npm install @react-gtm-kit/core @react-gtm-kit/vue` |
| **Next.js** | `npm install @react-gtm-kit/core @react-gtm-kit/next` |
| **Nuxt 3** | `npm install @react-gtm-kit/core @react-gtm-kit/nuxt` |
| **Svelte** | `npm install @react-gtm-kit/core @react-gtm-kit/svelte` |
| **SolidJS** | `npm install @react-gtm-kit/core @react-gtm-kit/solid` |
| **Remix** | `npm install @react-gtm-kit/core @react-gtm-kit/remix` |
| **Vanilla** | `npm install @react-gtm-kit/core` |
| **React (class)** | `npm install @react-gtm-kit/core @react-gtm-kit/react-legacy` |

<details>
<summary><strong>Using yarn, pnpm, or bun?</strong></summary>

```bash
# Yarn
yarn add @react-gtm-kit/core @react-gtm-kit/react-modern

# pnpm
pnpm add @react-gtm-kit/core @react-gtm-kit/react-modern

# Bun
bun add @react-gtm-kit/core @react-gtm-kit/react-modern
```

</details>

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
| `@react-gtm-kit/svelte`       | ~4 KB       | Svelte 4+              |
| `@react-gtm-kit/solid`        | ~5 KB       | SolidJS 1+             |
| `@react-gtm-kit/remix`        | ~8 KB       | Remix 2+               |

---

## Troubleshooting

### Quick Diagnostic

**Is GTM loading at all?** Open your browser console and type `dataLayer`. You should see an array.

- **Empty or undefined?** Check your container ID and ensure the provider is wrapping your app
- **Has events?** GTM is working! Check your container configuration in GTM

---

### Troubleshooting Decision Tree

```
Something's not working...
│
├─ "Module not found" error
│   └─ Run: rm -rf node_modules package-lock.json && npm install
│
├─ GTM fires twice (React)
│   └─ This is normal in StrictMode. GTM Kit handles it.
│      Still seeing issues? Ensure only ONE provider at the root.
│
├─ Events not showing in GTM debugger
│   ├─ 1. Type `dataLayer` in console - are events there?
│   │   ├─ Yes → Problem is in GTM, not the library
│   │   └─ No → Check container ID format (GTM-XXXXXX)
│   ├─ 2. Is your container published?
│   │   └─ Preview mode events won't show in analytics
│   └─ 3. Check for ad blockers
│
├─ Consent Mode not working
│   └─ Consent MUST be set BEFORE init:
│      onBeforeInit={(client) => client.setConsentDefaults(...)}
│
├─ TypeScript errors
│   └─ Run: npm i -D @types/react @types/react-dom
│
├─ SSR hydration mismatch
│   └─ Use the framework-specific adapter (Next, Nuxt, Remix)
│
└─ Still stuck?
    └─ Open an issue: github.com/jwiedeman/GTM-Kit/issues
```

---

### Common Issues & Fixes

<details>
<summary><strong>GTM fires twice</strong></summary>

This usually means StrictMode is enabled (React dev mode). **GTM Kit handles this automatically.** If you're still seeing issues:

```tsx
// Verify you're using the provider correctly
<GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
  {/* Your app - only ONE provider at the root */}
</GtmProvider>
```
</details>

<details>
<summary><strong>Events not showing in GTM debugger</strong></summary>

1. Check your container ID (GTM-XXXXXX format)
2. Open browser console, type `dataLayer` - you should see your events
3. Make sure GTM container is published (not just in preview)
4. Disable ad blockers (they often block GTM)
</details>

<details>
<summary><strong>Consent Mode isn't working</strong></summary>

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
</details>

<details>
<summary><strong>Type errors with TypeScript</strong></summary>

Make sure you have the correct types:

```bash
npm install --save-dev @types/react @types/react-dom
```
</details>

<details>
<summary><strong>Module not found</strong></summary>

```bash
# Clear your node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```
</details>

<details>
<summary><strong>SSR/Hydration issues</strong></summary>

Use the correct adapter for your framework:

- **Next.js**: Use `@react-gtm-kit/next` with `GtmHeadScript` and `GtmNoScript`
- **Nuxt**: Use `@react-gtm-kit/nuxt` with `.client.ts` plugin
- **Remix**: Use `@react-gtm-kit/remix` with `GtmScripts`
- **SvelteKit**: Wrap GTM in `browser` check

</details>

---

## Framework Support Matrix

| Framework     | Package                       | Status     | Min Version | Tests | Size |
| ------------- | ----------------------------- | ---------- | ----------- | ----- | ---- |
| Vanilla JS    | `@react-gtm-kit/core`         | ✅ Stable  | ES2018+     | ![155 tests](https://img.shields.io/badge/tests-155_passed-brightgreen) | ![3.7KB](https://img.shields.io/badge/gzip-3.7KB-blue) |
| React (hooks) | `@react-gtm-kit/react-modern` | ✅ Stable  | 16.8+       | ![9 tests](https://img.shields.io/badge/tests-9_passed-brightgreen) | ![6.9KB](https://img.shields.io/badge/gzip-6.9KB-blue) |
| React (class) | `@react-gtm-kit/react-legacy` | ✅ Stable  | 16.0+       | ![4 tests](https://img.shields.io/badge/tests-4_passed-brightgreen) | ![6.9KB](https://img.shields.io/badge/gzip-6.9KB-blue) |
| Next.js       | `@react-gtm-kit/next`         | ✅ Stable  | 13+         | ![14 tests](https://img.shields.io/badge/tests-14_passed-brightgreen) | ![14.2KB](https://img.shields.io/badge/gzip-14.2KB-blue) |
| Vue 3         | `@react-gtm-kit/vue`          | ✅ Stable  | 3.0+        | ![23 tests](https://img.shields.io/badge/tests-23_passed-brightgreen) | ![4KB](https://img.shields.io/badge/gzip-~4KB-blue) |
| Nuxt 3        | `@react-gtm-kit/nuxt`         | ✅ Stable  | 3.0+        | ![12 tests](https://img.shields.io/badge/tests-12_passed-brightgreen) | ![5KB](https://img.shields.io/badge/gzip-~5KB-blue) |
| Svelte        | `@react-gtm-kit/svelte`       | ✅ Stable  | 4.0+        | ![✓](https://img.shields.io/badge/tests-ready-brightgreen) | ![4KB](https://img.shields.io/badge/gzip-~4KB-blue) |
| SolidJS       | `@react-gtm-kit/solid`        | ✅ Stable  | 1.0+        | ![✓](https://img.shields.io/badge/tests-ready-brightgreen) | ![5KB](https://img.shields.io/badge/gzip-~5KB-blue) |
| Remix         | `@react-gtm-kit/remix`        | ✅ Stable  | 2.0+        | ![19 tests](https://img.shields.io/badge/tests-19_passed-brightgreen) | ![8KB](https://img.shields.io/badge/gzip-~8KB-blue) |
| CLI           | `@react-gtm-kit/cli`          | ✅ Stable  | Node 18+    | ![94 tests](https://img.shields.io/badge/tests-94_passed-brightgreen) | ![0KB](https://img.shields.io/badge/runtime-0KB-blue) |

---

## Examples

Working example apps for each framework:

```bash
git clone https://github.com/jwiedeman/GTM-Kit.git
cd GTM-Kit

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
