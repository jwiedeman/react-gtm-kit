# @jwiedeman/gtm-kit-svelte

[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/GTM-Kit/graph/badge.svg?flag=svelte)](https://codecov.io/gh/jwiedeman/GTM-Kit)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-svelte.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-svelte)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jwiedeman/gtm-kit-svelte)](https://bundlephobia.com/package/@jwiedeman/gtm-kit-svelte)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte](https://img.shields.io/badge/Svelte-4.0+-FF3E00.svg?logo=svelte)](https://svelte.dev/)

**Svelte stores and context for Google Tag Manager. Reactive by design.**

The Svelte adapter for GTM Kit - provides stores and context for idiomatic Svelte integration.

---

## Installation

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-svelte
```

```bash
yarn add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-svelte
```

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-svelte
```

---

## Quick Start

### Step 1: Create Store in Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';

  const gtm = createGtmStore({ containers: 'GTM-XXXXXX' });
  setGtmContext(gtm);
</script>

<slot />
```

### Step 2: Push Events

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';

  const gtm = getGtmContext();

  function handleClick() {
    $gtm.push({ event: 'purchase', value: 49.99 });
  }
</script>

<button on:click={handleClick}>Buy Now</button>
```

**That's it!** GTM is now running.

---

## Features

| Feature             | Description                     |
| ------------------- | ------------------------------- |
| **Svelte Stores**   | Native Svelte store integration |
| **Context API**     | Uses Svelte context for DI      |
| **Reactive**        | Fully reactive with `$` syntax  |
| **TypeScript**      | Full type definitions included  |
| **Consent Mode v2** | Built-in GDPR compliance        |
| **SSR Compatible**  | Safe for SvelteKit SSR          |

---

## Available Functions

### `createGtmStore(options)`

Creates a new GTM store. Call this once in your root layout.

```svelte
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';

  const gtm = createGtmStore({
    containers: 'GTM-XXXXXX',
    autoInit: true, // default
    onBeforeInit: (client) => {
      // Set consent defaults here
    }
  });

  setGtmContext(gtm);
</script>
```

### `getGtmContext()`

Gets the GTM store from context. Use in child components.

```svelte
<script>
  import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';

  const gtm = getGtmContext();

  // Access store values reactively
  $: ({ push, client, updateConsent } = $gtm);
</script>
```

### `gtmPush()`

Get a derived store for just the push function.

```svelte
<script>
  import { gtmPush } from '@jwiedeman/gtm-kit-svelte';

  const push = gtmPush();

  function track() {
    $push({ event: 'button_click' });
  }
</script>
```

### `gtmConsent()`

Get a derived store for consent functions.

```svelte
<script>
  import { gtmConsent } from '@jwiedeman/gtm-kit-svelte';

  const consent = gtmConsent();

  function acceptAll() {
    $consent.updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted'
    });
  }
</script>
```

### `gtmClient()`

Get a derived store for the raw GTM client.

```svelte
<script>
  import { gtmClient } from '@jwiedeman/gtm-kit-svelte';

  const client = gtmClient();
</script>
```

### `gtmReady()`

Get a derived store for the whenReady function.

```svelte
<script>
  import { gtmReady } from '@jwiedeman/gtm-kit-svelte';
  import { onMount } from 'svelte';

  const whenReady = gtmReady();

  onMount(async () => {
    await $whenReady();
    console.log('GTM is ready!');
  });
</script>
```

---

## SvelteKit Integration

### Basic Setup

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  import { browser } from '$app/environment';

  // Only create store in browser
  if (browser) {
    const gtm = createGtmStore({ containers: 'GTM-XXXXXX' });
    setGtmContext(gtm);
  }
</script>

<slot />
```

### Page Tracking

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';

  let gtm;

  if (browser) {
    gtm = createGtmStore({ containers: 'GTM-XXXXXX' });
    setGtmContext(gtm);

    // Track page views
    $: if ($gtm && $page) {
      $gtm.push({
        event: 'page_view',
        page_path: $page.url.pathname
      });
    }
  }
</script>

<slot />
```

---

## Consent Mode v2 (GDPR)

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  import { consentPresets } from '@jwiedeman/gtm-kit';
  import { browser } from '$app/environment';

  if (browser) {
    const gtm = createGtmStore({
      containers: 'GTM-XXXXXX',
      onBeforeInit: (client) => {
        // Deny by default for EU users
        client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
      }
    });
    setGtmContext(gtm);
  }
</script>

<slot />
```

```svelte
<!-- src/lib/CookieBanner.svelte -->
<script>
  import { gtmConsent } from '@jwiedeman/gtm-kit-svelte';

  const consent = gtmConsent();

  function acceptAll() {
    $consent.updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }

  function rejectAll() {
    $consent.updateConsent({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
</script>

<div class="cookie-banner">
  <p>We use cookies to improve your experience.</p>
  <button on:click={acceptAll}>Accept All</button>
  <button on:click={rejectAll}>Reject All</button>
</div>
```

---

## Store Options

```typescript
interface GtmStoreOptions {
  // Required: GTM container ID(s)
  containers: string | ContainerConfig | (string | ContainerConfig)[];

  // Whether to auto-initialize GTM (default: true)
  autoInit?: boolean;

  // Custom dataLayer name (default: 'dataLayer')
  dataLayerName?: string;

  // Custom GTM host
  host?: string;

  // Script attributes (e.g., nonce for CSP)
  scriptAttributes?: Record<string, string>;

  // Called before GTM initializes
  onBeforeInit?: (client: GtmClient) => void;
}
```

---

## TypeScript

Full TypeScript support is included:

```svelte
<script lang="ts">
  import { getGtmContext, type GtmStoreValue } from '@jwiedeman/gtm-kit-svelte';
  import type { Writable } from 'svelte/store';

  const gtm: Writable<GtmStoreValue> = getGtmContext();
</script>
```

---

## Requirements

- Svelte 4.0+ or 5.0+
- `@jwiedeman/gtm-kit` (peer dependency)

---

## Related Packages

- **Core**: [@jwiedeman/gtm-kit](https://www.npmjs.com/package/@jwiedeman/gtm-kit) (required)

---

## Support

**Have a question, found a bug, or need help?**

[Open an issue on GitHub](https://github.com/jwiedeman/GTM-Kit/issues) — we're actively maintaining this project and respond quickly.

---

## License

MIT
