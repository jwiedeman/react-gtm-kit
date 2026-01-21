# GTM Kit Framework Comparison

This guide helps you understand the differences between GTM Kit adapters across frameworks.

## Quick Reference

| Feature          | React                | Vue                    | Solid                | Svelte            | Astro              | Next.js              | Nuxt                   | Remix                |
| ---------------- | -------------------- | ---------------------- | -------------------- | ----------------- | ------------------ | -------------------- | ---------------------- | -------------------- |
| Provider Pattern | `<GtmProvider>`      | `app.use(GtmPlugin)`   | `<GtmProvider>`      | `setGtmContext()` | Manual `initGtm()` | `<GtmProvider>`      | `app.use(GtmPlugin)`   | `<GtmProvider>`      |
| Auto-init        | Yes (default)        | Yes (default)          | Yes (default)        | Yes (default)     | No                 | Yes                  | Yes                    | Yes                  |
| Error Boundary   | `<GtmErrorBoundary>` | `useGtmErrorHandler()` | `<GtmErrorBoundary>` | -                 | -                  | `<GtmErrorBoundary>` | `useGtmErrorHandler()` | `<GtmErrorBoundary>` |
| Auto Cleanup     | Yes                  | Yes                    | Yes                  | Manual            | N/A                | Yes                  | Yes                    | Yes                  |
| SSR Support      | Yes                  | Yes                    | Yes                  | Yes               | Yes                | Yes                  | Yes                    | Yes                  |

## Hook/Composable Naming

All frameworks follow the `useGtm*` pattern except Svelte, which uses store pattern with `gtm*` prefix:

| Purpose            | React/Solid/Remix | Vue/Nuxt          | Svelte               |
| ------------------ | ----------------- | ----------------- | -------------------- |
| Get push function  | `useGtmPush()`    | `useGtmPush()`    | `gtmPush` (store)    |
| Get client         | `useGtmClient()`  | `useGtmClient()`  | `gtmClient` (store)  |
| Consent API        | `useGtmConsent()` | `useGtmConsent()` | `gtmConsent` (store) |
| Check ready (sync) | `useIsGtmReady()` | `useIsGtmReady()` | `gtmIsReady` (store) |
| Wait for ready     | `useGtmReady()`   | `useGtmReady()`   | `gtmReady` (store)   |

## Installation Patterns

### React / React-based (Next.js, Remix)

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

### Vue / Nuxt

```ts
import { createApp } from 'vue';
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';

createApp(App).use(GtmPlugin, { containers: 'GTM-XXXXXX' }).mount('#app');
```

### Solid

```tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-solid';

function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <YourApp />
    </GtmProvider>
  );
}
```

### Svelte

```svelte
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  import { onDestroy } from 'svelte';

  const store = createGtmStore({ containers: 'GTM-XXXXXX' });
  setGtmContext(store);

  // Important: Manual cleanup required
  onDestroy(() => store.destroy());
</script>
```

### Astro

```ts
// In a client-side script
import { initGtm } from '@jwiedeman/gtm-kit-astro';

initGtm({ containers: 'GTM-XXXXXX' });
```

Or use the component:

```astro
---
import { GtmHead } from '@jwiedeman/gtm-kit-astro/components';
---
<head>
  <GtmHead containers="GTM-XXXXXX" enablePageTracking />
</head>
```

## Pushing Events

### React / Solid / Remix

```tsx
import { useGtmPush } from '@jwiedeman/gtm-kit-react';

function MyComponent() {
  const push = useGtmPush();

  const handleClick = () => {
    push({ event: 'button_click', button_id: 'cta' });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Vue / Nuxt

```vue
<script setup>
import { useGtmPush } from '@jwiedeman/gtm-kit-vue';

const push = useGtmPush();

const handleClick = () => {
  push({ event: 'button_click', button_id: 'cta' });
};
</script>
```

### Svelte

```svelte
<script>
  import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';
  import { get } from 'svelte/store';

  const { gtmPush } = getGtmContext();

  const handleClick = () => {
    get(gtmPush)({ event: 'button_click', button_id: 'cta' });
  };
</script>
```

### Astro

```ts
import { push } from '@jwiedeman/gtm-kit-astro';

push({ event: 'button_click', button_id: 'cta' });
```

## Consent Management

### React / Solid / Remix

```tsx
import { useGtmConsent } from '@jwiedeman/gtm-kit-react';

function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  const handleAccept = () => {
    updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted'
    });
  };

  return <button onClick={handleAccept}>Accept Cookies</button>;
}
```

### Vue / Nuxt

```vue
<script setup>
import { useGtmConsent } from '@jwiedeman/gtm-kit-vue';

const { updateConsent } = useGtmConsent();

const handleAccept = () => {
  updateConsent({
    ad_storage: 'granted',
    analytics_storage: 'granted'
  });
};
</script>
```

### Astro

```ts
import { updateConsent } from '@jwiedeman/gtm-kit-astro';

updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted'
});
```

## Error Handling

### React / Solid / Remix

```tsx
import { GtmErrorBoundary, useGtmError } from '@jwiedeman/gtm-kit-react';

// Option 1: Error Boundary
function App() {
  return (
    <GtmErrorBoundary fallback={<p>GTM failed to load</p>}>
      <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
        <YourApp />
      </GtmProvider>
    </GtmErrorBoundary>
  );
}

// Option 2: Error Hook
function Analytics() {
  const { hasError, errorMessage } = useGtmError();

  if (hasError) {
    console.error('GTM Error:', errorMessage);
  }

  return null;
}
```

### Vue / Nuxt

```vue
<script setup>
import { useGtmErrorHandler } from '@jwiedeman/gtm-kit-vue';

useGtmErrorHandler({
  onError: (err) => {
    console.error('GTM Error:', err);
  }
});
</script>
```

## Cleanup / Teardown

### React / Solid / Remix / Vue / Nuxt

Cleanup is automatic when the provider/plugin unmounts.

### Svelte (Manual Required)

```svelte
<script>
  import { createGtmStore, setGtmContext, destroyGtmStore } from '@jwiedeman/gtm-kit-svelte';
  import { onDestroy } from 'svelte';

  const store = createGtmStore({ containers: 'GTM-XXXXXX' });
  setGtmContext(store);

  onDestroy(() => {
    destroyGtmStore(); // Required!
  });
</script>
```

### Astro

```ts
import { teardown } from '@jwiedeman/gtm-kit-astro';

// Call when needed (e.g., view transitions)
teardown();
```

## SSR Considerations

### React / Next.js / Remix

Use the `isSsr()` helper to prevent SSR-only code:

```tsx
import { isSsr, useHydrated } from '@jwiedeman/gtm-kit-react';

function MyComponent() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <Skeleton />;
  }

  // Safe to access browser APIs
  return <Analytics />;
}
```

### Vue / Nuxt

```ts
// In Nuxt, use onMounted for client-side code
onMounted(() => {
  const push = useGtmPush();
  push({ event: 'page_view' });
});
```

### Astro

```astro
---
// Server-side code here
---
<script>
  // Client-side code
  import { initGtm } from '@jwiedeman/gtm-kit-astro';
  initGtm({ containers: 'GTM-XXXXXX' });
</script>
```

## Common Pitfalls

### 1. Forgetting to wrap with Provider (React/Solid/Remix)

```tsx
// BAD - will throw error
function App() {
  const push = useGtmPush(); // Error: outside provider
}

// GOOD
function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <MyComponent />
    </GtmProvider>
  );
}

function MyComponent() {
  const push = useGtmPush(); // Works!
}
```

### 2. Forgetting cleanup in Svelte

```svelte
<!-- BAD - memory leak -->
<script>
  const store = createGtmStore({ containers: 'GTM-XXXXXX' });
  setGtmContext(store);
</script>

<!-- GOOD -->
<script>
  import { onDestroy } from 'svelte';
  const store = createGtmStore({ containers: 'GTM-XXXXXX' });
  setGtmContext(store);
  onDestroy(() => destroyGtmStore());
</script>
```

### 3. Calling consent defaults after init

```tsx
// BAD - consent defaults should be set BEFORE init
client.init();
client.setConsentDefaults({ analytics_storage: 'denied' }); // Too late!

// GOOD
client.setConsentDefaults({ analytics_storage: 'denied' });
client.init(); // Now consent is properly configured
```

### 4. Not handling script load failures

```tsx
// BAD - assuming GTM always loads
const push = useGtmPush();
push({ event: 'page_view' }); // May silently fail if GTM blocked

// GOOD - check for errors
const { hasError } = useGtmError();
if (!hasError) {
  push({ event: 'page_view' });
}
```

## Framework-Specific Features

### React

- `useIsGtmProviderPresent()` - Check if provider exists without throwing
- `useHydrated()` - Safe hydration detection
- `<GtmErrorBoundary>` - Class-based error boundary

### Vue

- `useGtmErrorHandler()` - Composable error handler with `onErrorCaptured`
- Plugin-based installation

### Svelte

- Store-based reactivity
- Manual cleanup required

### Astro

- Component-based (`<GtmHead>`) and imperative (`initGtm`) APIs
- View Transitions support via `setupViewTransitions()`

### Next.js

- App Router and Pages Router support
- Server Component compatible (scripts in `<head>`)

### Nuxt

- Both `useGtm*` and `useNuxtGtm*` aliases
- Module auto-registration
