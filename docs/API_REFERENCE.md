# GTM-Kit API Reference

Complete API documentation for all GTM-Kit packages and adapters.

---

## Table of Contents

- [Core Package](#core-package)
- [React Adapter](#react-adapter)
- [Vue Adapter](#vue-adapter)
- [SolidJS Adapter](#solidjs-adapter)
- [Svelte Adapter](#svelte-adapter)
- [Remix Adapter](#remix-adapter)
- [Next.js Adapter](#nextjs-adapter)
- [Nuxt Adapter](#nuxt-adapter)
- [Astro Adapter](#astro-adapter)

---

## Core Package

`@jwiedeman/gtm-kit`

The core package provides the foundational GTM client and utilities used by all framework adapters.

### createGtmClient(options)

Creates a new GTM client instance.

```typescript
import { createGtmClient } from '@jwiedeman/gtm-kit';

const client = createGtmClient({
  containers: 'GTM-XXXXXX'
  // ... options
});
```

#### Options

| Option             | Type                               | Default                              | Description                               |
| ------------------ | ---------------------------------- | ------------------------------------ | ----------------------------------------- |
| `containers`       | `string \| ContainerConfigInput[]` | _required_                           | GTM container ID(s)                       |
| `dataLayerName`    | `string`                           | `'dataLayer'`                        | Custom dataLayer variable name            |
| `host`             | `string`                           | `'https://www.googletagmanager.com'` | Custom GTM host URL                       |
| `debug`            | `boolean`                          | `false`                              | Enable verbose debug logging              |
| `logger`           | `Logger`                           | Console                              | Custom logger instance                    |
| `maxDataLayerSize` | `number`                           | `500`                                | Maximum dataLayer entries before trimming |
| `scriptTimeout`    | `number`                           | `30000`                              | Script load timeout (ms)                  |
| `retry`            | `ScriptRetryOptions`               | `undefined`                          | Retry configuration for failed loads      |

#### ScriptRetryOptions

```typescript
interface ScriptRetryOptions {
  attempts?: number; // Number of retry attempts (default: 0)
  delay?: number; // Initial delay between retries in ms (default: 1000)
  maxDelay?: number; // Maximum delay between retries in ms (default: 30000)
}
```

#### ContainerConfigInput

```typescript
type ContainerConfigInput =
  | string // Simple container ID: "GTM-XXXXXX"
  | { id: string; queryParams?: Record<string, string> }; // With query params
```

### GtmClient Methods

#### client.init()

Initializes the GTM client and loads container scripts.

```typescript
await client.init();
```

Returns: `Promise<void>`

#### client.push(value)

Pushes a value to the dataLayer.

```typescript
client.push({ event: 'page_view', page_path: '/home' });
```

| Parameter | Type             | Description                 |
| --------- | ---------------- | --------------------------- |
| `value`   | `DataLayerValue` | Object to push to dataLayer |

Returns: `boolean` - Whether the push was successful

#### client.setConsentDefaults(state, options?)

Sets initial consent state. **Must be called before `init()`**.

```typescript
client.setConsentDefaults(
  {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  },
  {
    waitForUpdate: 500,
    region: ['US-CA', 'EEA']
  }
);
```

| Parameter               | Type           | Description                                  |
| ----------------------- | -------------- | -------------------------------------------- |
| `state`                 | `ConsentState` | Consent key/value pairs                      |
| `options.waitForUpdate` | `number`       | Milliseconds to wait for consent update      |
| `options.region`        | `string[]`     | ISO 3166-2 region codes for regional consent |

#### client.updateConsent(state, options?)

Updates consent state after user interaction.

```typescript
client.updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted'
});
```

#### client.whenReady()

Returns a promise that resolves when all GTM scripts are loaded.

```typescript
const scriptStates = await client.whenReady();
```

Returns: `Promise<ScriptLoadState[]>`

#### client.isReady()

Synchronously checks if GTM is ready.

```typescript
if (client.isReady()) {
  // GTM is loaded
}
```

Returns: `boolean`

#### client.getDiagnostics()

Returns diagnostic information about the client state.

```typescript
const diagnostics = client.getDiagnostics();
console.log(diagnostics);
// {
//   initialized: true,
//   ready: true,
//   dataLayerSize: 15,
//   queueSize: 0,
//   containers: ['GTM-XXXXXX'],
//   scriptStates: [...],
//   uptimeMs: 5000,
//   debugMode: false
// }
```

Returns: `GtmDiagnostics`

#### client.teardown()

Cleans up the client and removes event listeners.

```typescript
client.teardown();
```

### Event Functions

#### pushEvent(client, eventName, payload?)

Pushes a custom event to the dataLayer.

```typescript
import { pushEvent } from '@jwiedeman/gtm-kit';

pushEvent(client, 'button_click', {
  button_name: 'signup',
  button_location: 'header'
});
```

#### pushEcommerce(client, eventName, ecommerce, options?)

Pushes an e-commerce event with proper GA4 formatting.

```typescript
import { pushEcommerce } from '@jwiedeman/gtm-kit';

pushEcommerce(client, 'purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  items: [{ item_id: 'SKU-001', item_name: 'Product', price: 99.99, quantity: 1 }]
});
```

### Consent Presets

```typescript
import { getConsentPreset, consentPresets } from '@jwiedeman/gtm-kit';

// Use a preset
const eeaDefaults = getConsentPreset('eeaDefault');

// Available presets
consentPresets.eeaDefault; // All denied (GDPR-compliant)
consentPresets.allGranted; // All granted
consentPresets.analyticsOnly; // Only analytics granted
```

### Types

```typescript
// Consent state keys
type ConsentKey = 'ad_storage' | 'analytics_storage' | 'ad_user_data' | 'ad_personalization';

// Consent values
type ConsentValue = 'granted' | 'denied';

// Consent state object
type ConsentState = Partial<Record<ConsentKey, ConsentValue>>;

// Script load status
type ScriptLoadStatus = 'pending' | 'loading' | 'loaded' | 'failed' | 'partial' | 'skipped';

// Script load state
interface ScriptLoadState {
  containerId: string;
  status: ScriptLoadStatus;
  error?: Error;
  loadTimeMs?: number;
}
```

---

## React Adapter

`@jwiedeman/gtm-kit-react`

### GtmProvider

Context provider component that initializes GTM for your React app.

```tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-react';

function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <YourApp />
    </GtmProvider>
  );
}
```

#### Props

| Prop       | Type                     | Description              |
| ---------- | ------------------------ | ------------------------ |
| `config`   | `CreateGtmClientOptions` | GTM client configuration |
| `children` | `ReactNode`              | Child components         |

### Hooks

#### useGtm()

Returns the full GTM context with all functions.

```tsx
const { client, push, setConsentDefaults, updateConsent, whenReady, isReady } = useGtm();
```

Returns: `GtmContextValue`

#### useGtmClient()

Returns the raw GTM client instance.

```tsx
const client = useGtmClient();
```

#### useGtmPush()

Returns the push function for sending events.

```tsx
const push = useGtmPush();
push({ event: 'page_view' });
```

#### useGtmConsent()

Returns consent management functions.

```tsx
const { setConsentDefaults, updateConsent } = useGtmConsent();
```

#### useGtmReady()

Returns the `whenReady` promise function.

```tsx
const whenReady = useGtmReady();
await whenReady();
```

#### useIsGtmReady()

Returns the synchronous `isReady` check function.

```tsx
const isReady = useIsGtmReady();
if (isReady()) {
  // GTM loaded
}
```

#### useGtmInitialized()

Returns a reactive boolean that updates when GTM initializes.

```tsx
const initialized = useGtmInitialized();
// Re-renders when GTM initializes
```

#### useGtmError()

Returns error state for GTM script loading.

```tsx
const { hasError, failedScripts, errorMessage } = useGtmError();

if (hasError) {
  console.error('GTM failed:', errorMessage);
}
```

#### useIsGtmProviderPresent()

Safely checks if GtmProvider exists without throwing.

```tsx
const hasProvider = useIsGtmProviderPresent();

if (!hasProvider) {
  return <FallbackComponent />;
}
```

### GtmErrorBoundary

Error boundary component for catching GTM-related errors.

```tsx
import { GtmErrorBoundary } from '@jwiedeman/gtm-kit-react';

<GtmErrorBoundary fallback={<div>GTM failed to load</div>} onError={(error, errorInfo) => console.error(error)}>
  <YourComponent />
</GtmErrorBoundary>;
```

#### Props

| Prop        | Type                                           | Description                           |
| ----------- | ---------------------------------------------- | ------------------------------------- |
| `children`  | `ReactNode`                                    | Child components                      |
| `fallback`  | `ReactNode`                                    | Fallback UI on error                  |
| `onError`   | `(error: Error, errorInfo: ErrorInfo) => void` | Error callback                        |
| `logErrors` | `boolean`                                      | Log errors to console (default: true) |

### Utilities

#### isSsr()

Checks if running in server-side rendering environment.

```tsx
import { isSsr } from '@jwiedeman/gtm-kit-react';

if (!isSsr()) {
  // Client-side only code
}
```

#### useHydrated()

Returns false during SSR/hydration, true after hydration completes.

```tsx
import { useHydrated } from '@jwiedeman/gtm-kit-react';

const hydrated = useHydrated();
if (hydrated) {
  // Safe to access browser APIs
}
```

---

## Vue Adapter

`@jwiedeman/gtm-kit-vue`

### GtmPlugin

Vue 3 plugin for GTM integration.

```typescript
import { createApp } from 'vue';
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';

const app = createApp(App);
app.use(GtmPlugin, {
  containers: 'GTM-XXXXXX',
  autoInit: true,
  onBeforeInit: (client) => {
    client.setConsentDefaults({ analytics_storage: 'denied' });
  }
});
```

#### Options

| Option                       | Type                               | Default     | Description                       |
| ---------------------------- | ---------------------------------- | ----------- | --------------------------------- |
| `containers`                 | `string \| ContainerConfigInput[]` | _required_  | GTM container ID(s)               |
| `autoInit`                   | `boolean`                          | `true`      | Auto-initialize on plugin install |
| `onBeforeInit`               | `(client: GtmClient) => void`      | `undefined` | Callback before initialization    |
| All `CreateGtmClientOptions` |                                    |             | Passed to client                  |

### Composables

#### useGtm()

Returns the full GTM context.

```vue
<script setup>
import { useGtm } from '@jwiedeman/gtm-kit-vue';

const { client, push, setConsentDefaults, updateConsent, whenReady, isReady } = useGtm();
</script>
```

#### useGtmClient()

Returns the GTM client instance.

```vue
<script setup>
import { useGtmClient } from '@jwiedeman/gtm-kit-vue';

const client = useGtmClient();
</script>
```

#### useGtmPush()

Returns the push function.

```vue
<script setup>
import { useGtmPush } from '@jwiedeman/gtm-kit-vue';

const push = useGtmPush();
push({ event: 'page_view' });
</script>
```

#### useGtmConsent()

Returns consent management API.

```vue
<script setup>
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';

const { setConsentDefaults, updateConsent } = useGtmConsent();
</script>
```

#### useGtmReady()

Returns the whenReady promise function.

```vue
<script setup>
import { useGtmReady } from '@jwiedeman/gtm-kit-vue';

const whenReady = useGtmReady();
</script>
```

#### useIsGtmReady()

Returns the synchronous isReady function.

```vue
<script setup>
import { useIsGtmReady } from '@jwiedeman/gtm-kit-vue';

const isReady = useIsGtmReady();
</script>
```

#### useGtmErrorHandler(options?)

Reactive error handler for GTM errors.

```vue
<script setup>
import { useGtmErrorHandler } from '@jwiedeman/gtm-kit-vue';

const { hasError, error, reset } = useGtmErrorHandler({
  onError: (err) => console.error('GTM error:', err),
  logErrors: true
});
</script>

<template>
  <div v-if="hasError">
    Error: {{ error?.message }}
    <button @click="reset">Retry</button>
  </div>
</template>
```

### Options API

The GTM client is available via `this.$gtm` in Options API components:

```vue
<script>
export default {
  mounted() {
    this.$gtm.push({ event: 'page_view' });
  }
};
</script>
```

---

## SolidJS Adapter

`@jwiedeman/gtm-kit-solid`

### GtmProvider

Context provider component for SolidJS.

```tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-solid';

function App() {
  return (
    <GtmProvider
      containers="GTM-XXXXXX"
      autoInit={true}
      onBeforeInit={(client) => {
        client.setConsentDefaults({ analytics_storage: 'denied' });
      }}
    >
      <YourApp />
    </GtmProvider>
  );
}
```

#### Props

| Prop           | Type                               | Default     | Description              |
| -------------- | ---------------------------------- | ----------- | ------------------------ |
| `containers`   | `string \| ContainerConfigInput[]` | _required_  | GTM container ID(s)      |
| `autoInit`     | `boolean`                          | `true`      | Auto-initialize on mount |
| `onBeforeInit` | `(client: GtmClient) => void`      | `undefined` | Callback before init     |
| `onAfterInit`  | `() => void`                       | `undefined` | Callback after init      |

### Hooks

#### useGtm()

Returns the full GTM context with a reactive `initialized` signal.

```tsx
import { useGtm } from '@jwiedeman/gtm-kit-solid';

const { client, push, consent, whenReady, isReady, initialized } = useGtm();
```

#### useGtmClient()

Returns the GTM client instance.

```tsx
import { useGtmClient } from '@jwiedeman/gtm-kit-solid';

const client = useGtmClient();
```

#### useGtmPush()

Returns the push function.

```tsx
import { useGtmPush } from '@jwiedeman/gtm-kit-solid';

const push = useGtmPush();
```

#### useGtmConsent()

Returns consent management API.

```tsx
import { useGtmConsent } from '@jwiedeman/gtm-kit-solid';

const { setConsentDefaults, updateConsent } = useGtmConsent();
```

### GtmErrorBoundary

Error boundary for GTM errors.

```tsx
import { GtmErrorBoundary } from '@jwiedeman/gtm-kit-solid';

<GtmErrorBoundary
  fallback={(error, reset) => (
    <div>
      Error: {error.message}
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <YourComponent />
</GtmErrorBoundary>;
```

---

## Svelte Adapter

`@jwiedeman/gtm-kit-svelte`

### Store Functions

#### createGtmStore(options)

Creates a writable Svelte store for GTM.

```svelte
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';

  const gtmStore = createGtmStore({
    containers: 'GTM-XXXXXX',
    autoInit: true,
    onBeforeInit: (client) => {
      client.setConsentDefaults({ analytics_storage: 'denied' });
    }
  });

  setGtmContext(gtmStore);
</script>
```

#### destroyGtmStore(store)

Cleans up the GTM store and client.

```svelte
<script>
  import { onDestroy } from 'svelte';
  import { destroyGtmStore } from '@jwiedeman/gtm-kit-svelte';

  onDestroy(() => {
    destroyGtmStore(gtmStore);
  });
</script>
```

### Context Functions

#### setGtmContext(store)

Sets the GTM context for child components.

```svelte
<script>
  import { setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  setGtmContext(gtmStore);
</script>
```

#### getGtmContext()

Gets the GTM context from a parent component.

```svelte
<script>
  import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';
  const gtmStore = getGtmContext();
</script>
```

### Derived Stores

#### gtmPush()

Returns a readable store with the push function.

```svelte
<script>
  import { gtmPush } from '@jwiedeman/gtm-kit-svelte';
  const push = gtmPush();
  $push({ event: 'page_view' });
</script>
```

#### gtmConsent()

Returns a readable store with consent API.

```svelte
<script>
  import { gtmConsent } from '@jwiedeman/gtm-kit-svelte';
  const consent = gtmConsent();
  $consent.updateConsent({ analytics_storage: 'granted' });
</script>
```

#### gtmClient()

Returns a readable store with the client instance.

```svelte
<script>
  import { gtmClient } from '@jwiedeman/gtm-kit-svelte';
  const client = gtmClient();
</script>
```

#### gtmReady()

Returns a readable store with the whenReady function.

```svelte
<script>
  import { gtmReady } from '@jwiedeman/gtm-kit-svelte';
  const whenReady = gtmReady();
</script>
```

#### gtmIsReady()

Returns a readable store with the isReady function.

```svelte
<script>
  import { gtmIsReady } from '@jwiedeman/gtm-kit-svelte';
  const isReady = gtmIsReady();
</script>
```

---

## Remix Adapter

`@jwiedeman/gtm-kit-remix`

### GtmProvider

Context provider for Remix applications.

```tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-remix';

export default function App() {
  return (
    <GtmProvider
      config={{ containers: 'GTM-XXXXXX' }}
      onBeforeInit={(client) => {
        client.setConsentDefaults({ analytics_storage: 'denied' });
      }}
    >
      <Outlet />
    </GtmProvider>
  );
}
```

### Hooks

All hooks from React adapter are available:

- `useGtm()`
- `useGtmClient()`
- `useGtmPush()`
- `useGtmConsent()`
- `useGtmReady()`
- `useIsGtmReady()`

#### useTrackPageViews(options?)

Automatically tracks page views on route changes.

```tsx
import { useTrackPageViews } from '@jwiedeman/gtm-kit-remix';

function App() {
  useTrackPageViews({
    eventName: 'page_view',
    trackInitialPageView: true,
    customData: { app_version: '1.0' },
    transformEvent: (event) => ({
      ...event,
      timestamp: Date.now()
    })
  });

  return <Outlet />;
}
```

#### Options

| Option                 | Type               | Default       | Description                        |
| ---------------------- | ------------------ | ------------- | ---------------------------------- |
| `eventName`            | `string`           | `'page_view'` | Event name for page views          |
| `trackInitialPageView` | `boolean`          | `true`        | Track initial page load            |
| `customData`           | `object`           | `undefined`   | Additional data for all page views |
| `transformEvent`       | `(event) => event` | `undefined`   | Transform page view events         |

### Server Components

#### GtmScripts

Renders GTM script tags for server-side rendering.

```tsx
import { GtmScripts } from '@jwiedeman/gtm-kit-remix';

export default function Document() {
  return (
    <html>
      <head>
        <GtmScripts
          containers="GTM-XXXXXX"
          host="https://www.googletagmanager.com"
          dataLayerName="dataLayer"
          scriptAttributes={{ nonce: 'abc123' }}
        />
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

### GtmErrorBoundary

Error boundary component (same as React adapter).

---

## Next.js Adapter

`@jwiedeman/gtm-kit-next`

### Server Components

#### GtmHeadScript

Renders GTM script tag for the document head.

```tsx
import { GtmHeadScript } from '@jwiedeman/gtm-kit-next';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GtmHeadScript
          containers="GTM-XXXXXX"
          host="https://www.googletagmanager.com"
          dataLayerName="dataLayer"
          scriptAttributes={{ nonce: 'abc123' }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### GtmNoScript

Renders GTM noscript iframe fallback.

```tsx
import { GtmNoScript } from '@jwiedeman/gtm-kit-next';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>...</head>
      <body>
        <GtmNoScript containers="GTM-XXXXXX" />
        {children}
      </body>
    </html>
  );
}
```

### Client Hooks

#### useTrackPageViews(options)

Tracks page views with Next.js App Router.

```tsx
'use client';

import { useTrackPageViews } from '@jwiedeman/gtm-kit-next';
import { createGtmClient } from '@jwiedeman/gtm-kit';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });

function PageTracker() {
  useTrackPageViews({
    client,
    eventName: 'page_view',
    includeSearchParams: true,
    trackHash: false,
    trackOnMount: true,
    skipSamePath: true
  });

  return null;
}
```

#### Options

| Option                | Type                   | Default       | Description            |
| --------------------- | ---------------------- | ------------- | ---------------------- |
| `client`              | `GtmClient`            | _required_    | GTM client instance    |
| `eventName`           | `string`               | `'page_view'` | Event name             |
| `buildPayload`        | `(location) => object` | `undefined`   | Custom payload builder |
| `includeSearchParams` | `boolean`              | `true`        | Include query params   |
| `trackHash`           | `boolean`              | `false`       | Track hash changes     |
| `trackOnMount`        | `boolean`              | `true`        | Track initial mount    |
| `skipSamePath`        | `boolean`              | `true`        | Skip if path unchanged |
| `waitForReady`        | `boolean`              | `true`        | Wait for GTM ready     |

---

## Nuxt Adapter

`@jwiedeman/gtm-kit-nuxt`

### Module Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@jwiedeman/gtm-kit-nuxt'],
  gtm: {
    containers: 'GTM-XXXXXX',
    autoInit: true
  }
});
```

### Plugin Creation

For manual setup without the module:

```typescript
// plugins/gtm.client.ts
import { createNuxtGtmPlugin } from '@jwiedeman/gtm-kit-nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  createNuxtGtmPlugin(nuxtApp, {
    containers: 'GTM-XXXXXX',
    autoInit: true
  });
});
```

### Composables

#### useNuxtGtm()

Returns the full GTM context.

```vue
<script setup>
const { client, push, setConsentDefaults, updateConsent, whenReady, isReady } = useNuxtGtm();
</script>
```

#### useNuxtGtmClient()

Returns the GTM client instance.

```vue
<script setup>
const client = useNuxtGtmClient();
</script>
```

#### useNuxtGtmPush()

Returns the push function.

```vue
<script setup>
const push = useNuxtGtmPush();
</script>
```

#### useNuxtGtmConsent()

Returns consent management API.

```vue
<script setup>
const { setConsentDefaults, updateConsent } = useNuxtGtmConsent();
</script>
```

#### useTrackPageViews(options)

Automatically tracks page views on route changes.

```vue
<script setup>
import { useTrackPageViews } from '@jwiedeman/gtm-kit-nuxt';

const route = useRoute();

useTrackPageViews({
  route,
  eventName: 'page_view',
  includeQueryParams: true,
  trackInitialPageView: true,
  additionalData: { app_version: '1.0' }
});
</script>
```

---

## Astro Adapter

`@jwiedeman/gtm-kit-astro`

### Client-Side Functions

Use these in `<script>` tags or client-side JavaScript:

#### initGtm(options)

Initializes the GTM client.

```astro
<script>
  import { initGtm } from '@jwiedeman/gtm-kit-astro/client';

  const client = initGtm({
    containers: 'GTM-XXXXXX'
  });
</script>
```

#### getGtmClient()

Gets the current client instance (or null).

```javascript
import { getGtmClient } from '@jwiedeman/gtm-kit-astro/client';

const client = getGtmClient();
```

#### requireGtmClient()

Gets the client or throws if not initialized.

```javascript
import { requireGtmClient } from '@jwiedeman/gtm-kit-astro/client';

const client = requireGtmClient(); // Throws if not initialized
```

#### push(value)

Pushes to dataLayer (works even before initialization).

```javascript
import { push } from '@jwiedeman/gtm-kit-astro/client';

push({ event: 'page_view', page_path: '/home' });
```

#### setConsentDefaults(state, options?)

Sets consent defaults.

```javascript
import { setConsentDefaults } from '@jwiedeman/gtm-kit-astro/client';

setConsentDefaults({
  ad_storage: 'denied',
  analytics_storage: 'denied'
});
```

#### updateConsent(state, options?)

Updates consent state.

```javascript
import { updateConsent } from '@jwiedeman/gtm-kit-astro/client';

updateConsent({
  analytics_storage: 'granted'
});
```

#### whenReady()

Waits for GTM scripts to load.

```javascript
import { whenReady } from '@jwiedeman/gtm-kit-astro/client';

await whenReady();
```

#### teardown()

Cleans up the client.

```javascript
import { teardown } from '@jwiedeman/gtm-kit-astro/client';

teardown();
```

### Page Tracking

#### trackPageView(options?)

Manually tracks a page view.

```javascript
import { trackPageView } from '@jwiedeman/gtm-kit-astro/client';

trackPageView({
  eventName: 'page_view',
  includeQueryParams: true,
  additionalData: { section: 'blog' }
});
```

#### setupViewTransitions(options?)

Auto-tracks with Astro View Transitions.

```javascript
import { setupViewTransitions } from '@jwiedeman/gtm-kit-astro/client';

const cleanup = setupViewTransitions({
  eventName: 'page_view'
});

// Later, to cleanup:
cleanup();
```

#### setupPageTracking(options?)

Auto-tracks with standard navigation.

```javascript
import { setupPageTracking } from '@jwiedeman/gtm-kit-astro/client';

const cleanup = setupPageTracking();
```

### Astro Components

#### GtmHead

Convenience component for head that sets up everything.

```astro
---
import { GtmHead } from '@jwiedeman/gtm-kit-astro';
---

<html>
  <head>
    <GtmHead
      containers="GTM-XXXXXX"
      enablePageTracking={true}
      defaultConsent={{
        ad_storage: 'denied',
        analytics_storage: 'denied'
      }}
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

#### Props

| Prop                 | Type              | Default       | Description           |
| -------------------- | ----------------- | ------------- | --------------------- |
| `containers`         | `string \| array` | _required_    | GTM container ID(s)   |
| `host`               | `string`          | GTM default   | Custom GTM host       |
| `dataLayerName`      | `string`          | `'dataLayer'` | Custom dataLayer name |
| `defaultConsent`     | `ConsentState`    | `undefined`   | Initial consent state |
| `enablePageTracking` | `boolean`         | `false`       | Auto-track page views |
| `pageViewEventName`  | `string`          | `'page_view'` | Page view event name  |
| `scriptAttributes`   | `object`          | `undefined`   | Script tag attributes |

---

## Common Patterns

### Setting Consent Before Initialization

All adapters support setting consent defaults before GTM initializes:

```typescript
// React
<GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
  <ConsentBanner onAccept={() => updateConsent({ analytics_storage: 'granted' })} />
</GtmProvider>

// Vue (in onBeforeInit)
app.use(GtmPlugin, {
  containers: 'GTM-XXXXXX',
  onBeforeInit: (client) => {
    client.setConsentDefaults({ analytics_storage: 'denied' });
  }
});

// Svelte (in store creation)
const gtmStore = createGtmStore({
  containers: 'GTM-XXXXXX',
  onBeforeInit: (client) => {
    client.setConsentDefaults({ analytics_storage: 'denied' });
  }
});
```

### E-Commerce Event Tracking

```typescript
import { pushEcommerce } from '@jwiedeman/gtm-kit';

// View product list
pushEcommerce(client, 'view_item_list', {
  item_list_id: 'search_results',
  item_list_name: 'Search Results',
  items: products.map((p, i) => ({
    item_id: p.id,
    item_name: p.name,
    price: p.price,
    index: i
  }))
});

// Add to cart
pushEcommerce(client, 'add_to_cart', {
  currency: 'USD',
  value: product.price,
  items: [
    {
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: 1
    }
  ]
});

// Purchase
pushEcommerce(client, 'purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  tax: 8.99,
  shipping: 5.99,
  items: cartItems
});
```

---

## Version Compatibility

| Package | Min Node | Min TypeScript | Framework Version        |
| ------- | -------- | -------------- | ------------------------ |
| Core    | 18.0     | 5.0            | -                        |
| React   | 18.0     | 5.0            | React 18+                |
| Vue     | 18.0     | 5.0            | Vue 3.3+                 |
| SolidJS | 18.0     | 5.0            | Solid 1.7+               |
| Svelte  | 18.0     | 5.0            | Svelte 4+                |
| Remix   | 18.0     | 5.0            | Remix 2.0+               |
| Next.js | 18.0     | 5.0            | Next.js 13+ (App Router) |
| Nuxt    | 18.0     | 5.0            | Nuxt 3.0+                |
| Astro   | 18.0     | 5.0            | Astro 3.0+               |

---

_Generated for GTM-Kit v1.1.6_
