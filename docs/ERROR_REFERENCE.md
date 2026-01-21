# GTM-Kit Error Message Reference

Complete reference of all error messages, warnings, and validation errors in GTM-Kit with explanations and solutions.

---

## Table of Contents

- [Core Package Errors](#core-package-errors)
- [Framework Adapter Errors](#framework-adapter-errors)
- [Validation Errors](#validation-errors)
- [Warning Messages](#warning-messages)

---

## Core Package Errors

### Event Push Errors

#### "An event name is required when pushing to the dataLayer"

**Full Message:**

```
An event name is required when pushing to the dataLayer.
Example: pushEvent(client, "page_view", { page_path: "/home" })
```

**Trigger:** Calling `pushEvent()` without an event name parameter.

**Solution:**

```typescript
// ❌ Wrong
pushEvent(client, '', { data: 'value' });
pushEvent(client, undefined, { data: 'value' });

// ✅ Correct
pushEvent(client, 'page_view', { page_path: '/home' });
pushEvent(client, 'button_click', { button_name: 'cta' });
```

---

#### "Event payloads must be plain objects"

**Full Message:**

```
Event payloads must be plain objects when pushing to the dataLayer.
Received: [type].
Example: pushEvent(client, "click", { button_name: "cta" })
```

**Trigger:** Passing a non-object payload (array, string, number, etc.) to `pushEvent()`.

**Solution:**

```typescript
// ❌ Wrong
pushEvent(client, 'page_view', 'home');
pushEvent(client, 'page_view', ['home', 'about']);
pushEvent(client, 'page_view', null);

// ✅ Correct
pushEvent(client, 'page_view', { page_path: '/home' });
pushEvent(client, 'page_view', undefined); // Payload is optional
```

---

#### "Ecommerce payload must be an object"

**Full Message:**

```
Ecommerce payload must be an object. Received: [type].
Example: pushEcommerce(client, "purchase", { transaction_id: "T123", value: 99.99, items: [...] })
```

**Trigger:** Calling `pushEcommerce()` with a non-object ecommerce parameter.

**Solution:**

```typescript
// ❌ Wrong
pushEcommerce(client, 'purchase', null);
pushEcommerce(client, 'add_to_cart', [item1, item2]);

// ✅ Correct
pushEcommerce(client, 'purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  items: [{ item_id: 'SKU-001', item_name: 'Product', price: 99.99 }]
});
```

---

#### "Ecommerce extras must be an object when provided"

**Full Message:**

```
Ecommerce extras must be an object when provided. Received: [type].
Example: pushEcommerce(client, "purchase", ecommerce, { extras: { user_id: "123" } })
```

**Trigger:** Providing a non-object `extras` value in the options parameter.

**Solution:**

```typescript
// ❌ Wrong
pushEcommerce(client, 'purchase', ecommerce, { extras: 'user123' });

// ✅ Correct
pushEcommerce(client, 'purchase', ecommerce, {
  extras: { user_id: '123', campaign: 'summer_sale' }
});
```

---

### Client Initialization Errors

#### "At least one GTM container ID is required"

**Full Message:**

```
At least one GTM container ID is required to initialize the client.
Example: createGtmClient({ containers: "GTM-XXXXXX" })
```

**Trigger:** Creating a client without providing any containers.

**Solution:**

```typescript
// ❌ Wrong
createGtmClient({});
createGtmClient({ containers: [] });
createGtmClient({ containers: undefined });

// ✅ Correct
createGtmClient({ containers: 'GTM-ABC123' });
createGtmClient({ containers: ['GTM-ABC123', 'GTM-XYZ789'] });
```

---

#### "All container IDs are empty or invalid"

**Full Message:**

```
All container IDs are empty or invalid. At least one valid GTM container ID is required.
Container IDs should be in the format "GTM-XXXXXX".
Example: createGtmClient({ containers: "GTM-ABC123" })
```

**Trigger:** All provided container IDs are empty strings or whitespace.

**Solution:**

```typescript
// ❌ Wrong
createGtmClient({ containers: '' });
createGtmClient({ containers: '   ' });
createGtmClient({ containers: ['', '  '] });

// ✅ Correct
createGtmClient({ containers: 'GTM-ABC123' });
```

---

#### "Invalid dataLayer name"

**Full Message:**

```
Invalid dataLayer name: "[name]". DataLayer names must be valid JavaScript identifiers
(letters, numbers, underscores, dollar signs) and cannot be reserved words.
Example: "dataLayer", "myCustomLayer", "gtm_data"
```

**Trigger:** Using an invalid JavaScript identifier or reserved keyword as `dataLayerName`.

**Solution:**

```typescript
// ❌ Wrong
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: 'class' }); // Reserved word
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: '123layer' }); // Starts with number
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: 'my-layer' }); // Contains hyphen
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: 'my layer' }); // Contains space

// ✅ Correct
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: 'dataLayer' });
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: 'myCustomLayer' });
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: 'gtm_data' });
createGtmClient({ containers: 'GTM-ABC123', dataLayerName: '$layer' });
```

**Reserved Words That Cannot Be Used:**
`break`, `case`, `catch`, `class`, `const`, `continue`, `debugger`, `default`, `delete`, `do`, `else`, `enum`, `export`, `extends`, `false`, `finally`, `for`, `function`, `if`, `import`, `in`, `instanceof`, `let`, `new`, `null`, `return`, `static`, `super`, `switch`, `this`, `throw`, `true`, `try`, `typeof`, `var`, `void`, `while`, `with`, `yield`

---

### Consent Errors

#### "Consent region list must be an array"

**Full Message:**

```
Consent region list must be an array of ISO 3166-2 region codes.
Received: [type].
Example: { region: ["US-CA", "EEA"] }
```

**Trigger:** Providing a non-array value for the `region` option.

**Solution:**

```typescript
// ❌ Wrong
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: 'US-CA' });
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: { code: 'US-CA' } });

// ✅ Correct
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: ['US-CA'] });
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: ['US-CA', 'EEA', 'GB'] });
```

---

#### "Consent region codes must be non-empty ISO 3166-2 strings"

**Full Message:**

```
Consent region codes must be non-empty ISO 3166-2 strings.
Received: [type].
Example: "US-CA", "EEA", "US"
```

**Trigger:** Including invalid values in the region array.

**Solution:**

```typescript
// ❌ Wrong
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: ['US-CA', null] });
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: ['US-CA', 123] });
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: [''] });

// ✅ Correct
client.setConsentDefaults({ analytics_storage: 'denied' }, { region: ['US-CA', 'EEA'] });
```

**Valid Region Code Examples:**

- Country codes: `US`, `CA`, `GB`, `DE`, `FR`
- Subdivision codes: `US-CA`, `US-NY`, `CA-ON`
- Regional groupings: `EEA` (European Economic Area)

---

#### "Invalid waitForUpdate value"

**Full Message:**

```
Invalid waitForUpdate value: [value]. waitForUpdate must be a non-negative finite number
representing milliseconds to wait for consent update.
Example: { waitForUpdate: 500 }
```

**Trigger:** Providing negative, NaN, or Infinity for `waitForUpdate`.

**Solution:**

```typescript
// ❌ Wrong
client.setConsentDefaults({ analytics_storage: 'denied' }, { waitForUpdate: -1 });
client.setConsentDefaults({ analytics_storage: 'denied' }, { waitForUpdate: NaN });
client.setConsentDefaults({ analytics_storage: 'denied' }, { waitForUpdate: Infinity });

// ✅ Correct
client.setConsentDefaults({ analytics_storage: 'denied' }, { waitForUpdate: 500 });
client.setConsentDefaults({ analytics_storage: 'denied' }, { waitForUpdate: 0 });
```

---

#### "Invalid consent key"

**Full Message:**

```
Invalid consent key: "[key]". Valid keys are: ad_storage, analytics_storage, ad_user_data, ad_personalization.
Example: { ad_storage: "granted", analytics_storage: "denied" }
```

**Trigger:** Using an unrecognized consent key.

**Solution:**

```typescript
// ❌ Wrong
client.setConsentDefaults({ tracking: 'denied' });
client.setConsentDefaults({ advertising_storage: 'denied' }); // Wrong key name

// ✅ Correct
client.setConsentDefaults({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
```

---

#### "Invalid consent value"

**Full Message:**

```
Invalid consent value for key "[key]": [value]. Consent values must be "granted" or "denied".
Example: { ad_storage: "granted" }
```

**Trigger:** Using a value other than `'granted'` or `'denied'`.

**Solution:**

```typescript
// ❌ Wrong
client.setConsentDefaults({ analytics_storage: true });
client.setConsentDefaults({ analytics_storage: 'yes' });
client.setConsentDefaults({ analytics_storage: 1 });

// ✅ Correct
client.setConsentDefaults({ analytics_storage: 'granted' });
client.setConsentDefaults({ analytics_storage: 'denied' });
```

---

#### "At least one consent key/value pair is required"

**Full Message:**

```
At least one consent key/value pair is required.
Example: { ad_storage: "granted", analytics_storage: "granted" }
```

**Trigger:** Providing an empty consent state object.

**Solution:**

```typescript
// ❌ Wrong
client.setConsentDefaults({});

// ✅ Correct
client.setConsentDefaults({ analytics_storage: 'denied' });
```

---

#### "Unsupported consent command"

**Full Message:**

```
Unsupported consent command: "[command]". Valid commands are "default" (for initial consent state)
or "update" (for user consent changes).
Example: buildConsentCommand({ command: "default", state: { analytics_storage: "denied" } })
```

**Trigger:** Using an invalid consent command type.

**Solution:**

```typescript
// ❌ Wrong
buildConsentCommand({ command: 'set', state: { analytics_storage: 'denied' } });

// ✅ Correct
buildConsentCommand({ command: 'default', state: { analytics_storage: 'denied' } });
buildConsentCommand({ command: 'update', state: { analytics_storage: 'granted' } });
```

---

### Container ID Validation Errors

#### "Invalid GTM container ID format"

**Full Message:**

```
Invalid GTM container ID format: "[value]". Container IDs must start with "GTM-" followed by
6 or more alphanumeric characters.
Example: "GTM-ABC123" or "GTM-WXYZ7890"
```

**Trigger:** Container ID doesn't match the required format.

**Solution:**

```typescript
// ❌ Wrong - Common mistakes
createGtmClient({ containers: 'GTM-ABC' }); // Too short (less than 6 chars)
createGtmClient({ containers: 'gtm-ABC123' }); // Lowercase prefix
createGtmClient({ containers: 'G-ABC123' }); // GA4 Measurement ID, not GTM
createGtmClient({ containers: 'UA-12345-1' }); // Universal Analytics ID, not GTM
createGtmClient({ containers: 'AW-123456789' }); // Google Ads ID, not GTM
createGtmClient({ containers: 'GTM_ABC123' }); // Underscore instead of hyphen
createGtmClient({ containers: 'GTM-ABC 123' }); // Contains space
createGtmClient({ containers: 'GTM-ABC@123' }); // Contains special character

// ✅ Correct
createGtmClient({ containers: 'GTM-ABC123' });
createGtmClient({ containers: 'GTM-WXYZ7890' });
createGtmClient({ containers: 'GTM-A1B2C3D4' });
```

---

### Noscript Errors

#### "Container ID is required to build noscript markup"

**Full Message:**

```
Container ID is required to build noscript markup.
Example: createNoscriptMarkup("GTM-XXXXXX")
```

**Trigger:** Container object is missing an `id` property.

**Solution:**

```typescript
// ❌ Wrong
createNoscriptMarkup({ queryParams: { env: 'prod' } });

// ✅ Correct
createNoscriptMarkup('GTM-ABC123');
createNoscriptMarkup({ id: 'GTM-ABC123', queryParams: { env: 'prod' } });
```

---

#### "At least one container is required to build noscript markup"

**Full Message:**

```
At least one container is required to build noscript markup.
Example: createNoscriptMarkup("GTM-XXXXXX") or createNoscriptMarkup(["GTM-ABC123", "GTM-XYZ789"])
```

**Trigger:** No containers provided to the function.

**Solution:**

```typescript
// ❌ Wrong
createNoscriptMarkup([]);
createNoscriptMarkup(undefined);

// ✅ Correct
createNoscriptMarkup('GTM-ABC123');
createNoscriptMarkup(['GTM-ABC123', 'GTM-XYZ789']);
```

---

## Framework Adapter Errors

### React Errors

#### "useGtm() was called outside of a GtmProvider"

**Full Message:**

```
[gtm-kit/react] useGtm() was called outside of a GtmProvider.
Make sure to wrap your app with <GtmProvider config={{ containers: "GTM-XXXXXX" }}>.
```

**Trigger:** Using GTM hooks in a component that's not wrapped by `GtmProvider`.

**Solution:**

```tsx
// ❌ Wrong
function App() {
  const { push } = useGtm(); // Error: No provider
  return <div>App</div>;
}

// ✅ Correct
function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-ABC123' }}>
      <MyComponent />
    </GtmProvider>
  );
}

function MyComponent() {
  const { push } = useGtm(); // Works!
  return <div>Component</div>;
}
```

---

### Vue Errors

#### "useGtm() was called outside of a Vue app with GtmPlugin installed"

**Full Message:**

```
[gtm-kit/vue] useGtm() was called outside of a Vue app with GtmPlugin installed.
Make sure to call app.use(GtmPlugin, { containers: "GTM-XXXXXX" }) before using GTM composables.
```

**Trigger:** Using GTM composables without installing the plugin.

**Solution:**

```typescript
// ❌ Wrong - main.ts
import { createApp } from 'vue';
const app = createApp(App);
app.mount('#app'); // Plugin not installed

// ✅ Correct - main.ts
import { createApp } from 'vue';
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';

const app = createApp(App);
app.use(GtmPlugin, { containers: 'GTM-ABC123' });
app.mount('#app');
```

---

### Svelte Errors

#### "getGtmContext() was called outside of a component tree with GTM context"

**Full Message:**

```
[gtm-kit/svelte] getGtmContext() was called outside of a component tree with GTM context.
Make sure to call setGtmContext() in a parent component.
```

**Trigger:** Trying to access GTM context before it's been set.

**Solution:**

```svelte
<!-- ❌ Wrong - Child.svelte -->
<script>
  import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';
  const gtm = getGtmContext(); // Error: No context set
</script>

<!-- ✅ Correct - Layout.svelte (parent) -->
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';

  const gtmStore = createGtmStore({ containers: 'GTM-ABC123' });
  setGtmContext(gtmStore);
</script>

<slot />

<!-- Child.svelte -->
<script>
  import { getGtmContext } from '@jwiedeman/gtm-kit-svelte';
  const gtm = getGtmContext(); // Works!
</script>
```

---

### SolidJS Errors

#### "useGtm() was called outside of a GtmProvider"

**Full Message:**

```
[gtm-kit/solid] useGtm() was called outside of a GtmProvider.
Make sure to wrap your app with <GtmProvider containers="GTM-XXXXXX">.
```

**Trigger:** Using GTM hooks outside of provider context.

**Solution:**

```tsx
// ❌ Wrong
function App() {
  const { push } = useGtm(); // Error: No provider
  return <div>App</div>;
}

// ✅ Correct
function App() {
  return (
    <GtmProvider containers="GTM-ABC123">
      <MyComponent />
    </GtmProvider>
  );
}

function MyComponent() {
  const { push } = useGtm(); // Works!
  return <div>Component</div>;
}
```

---

### Next.js Errors

#### "A GTM client is required to track page views"

**Full Message:**

```
A GTM client is required to track page views.
```

**Trigger:** Calling `useTrackPageViews` without providing a client.

**Solution:**

```tsx
// ❌ Wrong
function PageTracker() {
  useTrackPageViews({}); // Error: No client
  return null;
}

// ✅ Correct
function PageTracker() {
  const client = createGtmClient({ containers: 'GTM-ABC123' });
  useTrackPageViews({ client });
  return null;
}
```

---

#### "At least one GTM container is required to render script tags"

**Full Message:**

```
At least one GTM container is required to render script tags.
```

**Trigger:** Using `GtmHeadScript` without providing containers.

**Solution:**

```tsx
// ❌ Wrong
<GtmHeadScript /> // Error: No containers

// ✅ Correct
<GtmHeadScript containers="GTM-ABC123" />
```

---

### Nuxt Errors

#### "useTrackPageViews: No GTM client available"

**Full Message:**

```
[gtm-kit/nuxt] useTrackPageViews: No GTM client available.
Make sure GtmPlugin is installed or pass a client option.
```

**Trigger:** Calling `useTrackPageViews` without GTM being initialized.

**Solution:**

```vue
<!-- ❌ Wrong -->
<script setup>
useTrackPageViews({ route: useRoute() }); // Error if plugin not installed
</script>

<!-- ✅ Correct - ensure plugin is installed in nuxt.config.ts -->
// nuxt.config.ts export default defineNuxtConfig({ modules: ['@jwiedeman/gtm-kit-nuxt'], gtm: { containers:
'GTM-ABC123' } });

<!-- Or pass client explicitly -->
<script setup>
const client = useNuxtGtmClient();
useTrackPageViews({ route: useRoute(), client });
</script>
```

---

### Astro Errors

#### "GTM not initialized and dataLayer not found"

**Full Message:**

```
[gtm-kit/astro] GTM not initialized and dataLayer not found.
```

**Trigger:** Trying to push events before GTM is initialized.

**Solution:**

```javascript
// ❌ Wrong
import { push } from '@jwiedeman/gtm-kit-astro/client';
push({ event: 'page_view' }); // Warning: GTM not ready

// ✅ Correct
import { initGtm, push } from '@jwiedeman/gtm-kit-astro/client';

initGtm({ containers: 'GTM-ABC123' });
push({ event: 'page_view' }); // Works!
```

---

## Warning Messages

### Consent Warnings

#### "setConsentDefaults() called after init()"

**Full Message:**

```
setConsentDefaults() called after init(). Consent defaults should be set BEFORE calling init()
to ensure proper tag behavior. The defaults will still be pushed, but GTM may have already
fired tags with implied consent.
```

**Trigger:** Calling `setConsentDefaults()` after `init()` has been called.

**Why This Matters:** GTM tags may fire immediately when the script loads. If consent defaults aren't set first, tags may fire with implied consent before your consent settings are applied.

**Solution:**

```typescript
// ❌ Wrong order
const client = createGtmClient({ containers: 'GTM-ABC123' });
await client.init();
client.setConsentDefaults({ analytics_storage: 'denied' }); // Warning: Too late!

// ✅ Correct order
const client = createGtmClient({ containers: 'GTM-ABC123' });
client.setConsentDefaults({ analytics_storage: 'denied' });
await client.init();
```

---

#### "waitForUpdate value exceeds 30 minutes"

**Full Message:**

```
waitForUpdate value of [X]ms exceeds 30 minutes.
Consider using a shorter timeout to avoid excessive waiting.
```

**Trigger:** Setting `waitForUpdate` to more than 30 minutes (1,800,000ms).

**Solution:**

```typescript
// ⚠️ Warning
client.setConsentDefaults(
  { analytics_storage: 'denied' },
  {
    waitForUpdate: 3600000 // 1 hour - very long!
  }
);

// ✅ Better
client.setConsentDefaults(
  { analytics_storage: 'denied' },
  {
    waitForUpdate: 500 // 500ms is typically sufficient
  }
);
```

---

### DataLayer Warnings

#### "Using custom dataLayerName but global dataLayer already exists"

**Full Message:**

```
Using custom dataLayerName "[name]" but global "dataLayer" already exists.
The existing dataLayer will NOT be used. If you have existing GTM code using "dataLayer",
either remove the custom dataLayerName option or update your existing code to use the new name.
```

**Trigger:** Using a custom `dataLayerName` when a global `dataLayer` variable already exists.

**Why This Matters:** Your existing GTM implementation may be pushing to `window.dataLayer`, but GTM-Kit will create and use a different variable. Events may not be tracked correctly.

**Solution:**

```typescript
// ⚠️ Warning if window.dataLayer already exists
createGtmClient({
  containers: 'GTM-ABC123',
  dataLayerName: 'myCustomLayer'
});

// ✅ Solutions:
// Option 1: Use default dataLayer name
createGtmClient({ containers: 'GTM-ABC123' });

// Option 2: Update all existing code to use custom name
// And configure GTM container to use the same name
```

---

#### "Multiple GTM client instances are sharing the same dataLayer"

**Full Message:**

```
Multiple GTM client instances are sharing the same dataLayer "[name]".
This may cause unexpected behavior if one instance tears down while others are active.
Consider using different dataLayerName values for separate clients.
```

**Trigger:** Creating multiple GTM clients with the same `dataLayerName`.

**Solution:**

```typescript
// ⚠️ Warning
const client1 = createGtmClient({ containers: 'GTM-ABC123' });
const client2 = createGtmClient({ containers: 'GTM-XYZ789' }); // Same dataLayer

// ✅ Better
const client1 = createGtmClient({
  containers: 'GTM-ABC123',
  dataLayerName: 'dataLayer1'
});
const client2 = createGtmClient({
  containers: 'GTM-XYZ789',
  dataLayerName: 'dataLayer2'
});
```

---

#### "DataLayer size limit reached; trimmed oldest entries"

**Full Message:**

```
DataLayer size limit reached; trimmed oldest entries.
```

**Trigger:** DataLayer exceeds `maxDataLayerSize` (default: 500).

**Why This Happens:** To prevent memory issues, GTM-Kit automatically trims old entries when the dataLayer grows too large.

**Solution:**

```typescript
// Increase limit if needed
createGtmClient({
  containers: 'GTM-ABC123',
  maxDataLayerSize: 1000 // Increase from default 500
});

// Or handle trimming with callback
createGtmClient({
  containers: 'GTM-ABC123',
  onDataLayerTrim: (trimmedCount) => {
    console.log(`Trimmed ${trimmedCount} old entries`);
  }
});
```

---

#### "Skipped dataLayer push: value is null or undefined"

**Full Message:**

```
Skipped dataLayer push: value is null or undefined.
```

**Trigger:** Attempting to push `null` or `undefined` to the dataLayer.

**Solution:**

```typescript
// ⚠️ Warning
client.push(null);
client.push(undefined);

// ✅ Correct
client.push({ event: 'page_view' });

// Check before pushing
if (eventData) {
  client.push(eventData);
}
```

---

### Script Loading Warnings

#### "GTM script load failed, will retry"

**Full Message:**

```
GTM script load failed, will retry. retriesRemaining: [X]
```

**Trigger:** GTM script failed to load, but retries are available.

**What's Happening:** The script will automatically retry with exponential backoff.

**Solution:** Usually no action needed. If retries keep failing, check:

- Network connectivity
- Container ID is correct
- GTM container is published
- No ad blockers interfering

---

#### "GTM script load failed, no retries remaining"

**Full Message:**

```
GTM script load failed, no retries remaining.
```

**Trigger:** Script failed to load after all retry attempts.

**Solution:**

```typescript
createGtmClient({
  containers: 'GTM-ABC123',
  retry: {
    attempts: 3, // More retries
    delay: 1000, // Initial delay
    maxDelay: 30000 // Max delay between retries
  },
  onScriptError: (state) => {
    console.error('GTM failed to load:', state.error);
    // Show user-friendly error or fallback
  }
});
```

---

#### "GTM script load timeout"

**Full Message:**

```
GTM script load timeout.
```

**Trigger:** Script didn't load within the timeout period.

**Solution:**

```typescript
createGtmClient({
  containers: 'GTM-ABC123',
  scriptTimeout: 60000, // Increase from default 30000ms
  onScriptTimeout: (containerId) => {
    console.warn(`GTM ${containerId} timed out`);
  }
});
```

---

#### "GTM container loaded but failed to initialize"

**Full Message:**

```
GTM container loaded but failed to initialize.
```

**Trigger:** GTM script loaded but GTM didn't initialize properly.

**What This Means:** The script file was fetched successfully, but GTM's internal initialization failed. This could indicate:

- Container configuration issues
- JavaScript errors in GTM container
- Conflicts with other scripts

**Solution:**

```typescript
createGtmClient({
  containers: 'GTM-ABC123',
  verifyInitialization: true,
  onPartialLoad: (state) => {
    console.warn('GTM partially loaded:', state);
    // Consider notifying your monitoring system
  }
});
```

---

### Adapter-Specific Warnings

#### "Nested GtmProvider detected"

**Full Message:**

```
[gtm-kit/react] Nested GtmProvider detected. You should only have one GtmProvider at the root of your app.
The nested provider will be ignored.
```

**Trigger:** Wrapping components with multiple `GtmProvider` instances.

**Solution:**

```tsx
// ❌ Wrong
<GtmProvider config={{ containers: 'GTM-ABC123' }}>
  <GtmProvider config={{ containers: 'GTM-XYZ789' }}> {/* Ignored! */}
    <App />
  </GtmProvider>
</GtmProvider>

// ✅ Correct - Single provider at root
<GtmProvider config={{ containers: 'GTM-ABC123' }}>
  <App />
</GtmProvider>

// ✅ For multiple containers, pass array
<GtmProvider config={{ containers: ['GTM-ABC123', 'GTM-XYZ789'] }}>
  <App />
</GtmProvider>
```

---

#### "GtmProvider received new configuration; reconfiguration not supported"

**Full Message:**

```
[gtm-kit/react] GtmProvider received new configuration; reconfiguration after mount is not supported.
The initial configuration will continue to be used.
```

**Trigger:** Changing the `config` prop after the provider has mounted.

**Solution:**

```tsx
// ❌ Wrong - Config changes after mount
function App() {
  const [containerId, setContainerId] = useState('GTM-ABC123');
  return (
    <GtmProvider config={{ containers: containerId }}>
      <button onClick={() => setContainerId('GTM-XYZ789')}>Change Container {/* This won't work! */}</button>
    </GtmProvider>
  );
}

// ✅ Correct - Static configuration
function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-ABC123' }}>
      <MyApp />
    </GtmProvider>
  );
}

// ✅ If you need dynamic config, unmount and remount with key
function App() {
  const [containerId, setContainerId] = useState('GTM-ABC123');
  return (
    <GtmProvider key={containerId} config={{ containers: containerId }}>
      <MyApp />
    </GtmProvider>
  );
}
```

---

#### "Found pre-rendered GTM script that is not configured"

**Full Message:**

```
[gtm-kit/react] Found pre-rendered GTM script for container "[id]" that is not configured in GtmProvider.
```

**Trigger:** SSR/pre-rendered page has GTM scripts that don't match the client-side configuration.

**Solution:** Ensure server-rendered GTM scripts match the `GtmProvider` configuration:

```tsx
// Server (e.g., _document.tsx in Next.js)
<GtmHeadScript containers={['GTM-ABC123', 'GTM-XYZ789']} />

// Client must have matching containers
<GtmProvider config={{ containers: ['GTM-ABC123', 'GTM-XYZ789'] }}>
  <App />
</GtmProvider>
```

---

## Quick Reference: Error → Solution

| Error Keyword              | Quick Fix                                                                    |
| -------------------------- | ---------------------------------------------------------------------------- |
| "container ID is required" | Add `containers: 'GTM-XXXXXX'`                                               |
| "event name is required"   | Add event name to `pushEvent()`                                              |
| "outside of a GtmProvider" | Wrap app with `<GtmProvider>`                                                |
| "outside of a Vue app"     | Call `app.use(GtmPlugin, {...})`                                             |
| "invalid consent key"      | Use: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` |
| "invalid consent value"    | Use only `'granted'` or `'denied'`                                           |
| "invalid dataLayer name"   | Use valid JS identifier (no hyphens, spaces, or reserved words)              |
| "nested provider"          | Use only one provider at root                                                |
| "called after init"        | Call `setConsentDefaults()` before `init()`                                  |

---

_Generated for GTM-Kit v1.1.6_
