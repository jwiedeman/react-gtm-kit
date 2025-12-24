# Public API reference

This page summarizes the exported surface area across the core package, React adapters, and Next.js
helpers. Use it alongside the how-to guides for task-specific walkthroughs.

## Core client (`@jwiedeman/gtm-kit`)

### `createGtmClient(options)`

Creates a client instance that owns the data layer and script injection lifecycle.

- `containers` (required) – Single ID or array. Accepts strings (`'GTM-XXXX'`) or `{ id, queryParams }` objects.
- `dataLayerName` – Custom global name. Defaults to `dataLayer`. Non-default names automatically append `l=<dataLayerName>` to
  injected GTM URLs, honoring any custom `host` or `defaultQueryParams` you supply.
- `host` – Base URL for the loader. Defaults to `https://www.googletagmanager.com`.
- `defaultQueryParams` – Extra query parameters appended to every container request (e.g., `gtm_auth`).
- `scriptAttributes` – Additional attributes copied to injected `<script>` tags. `async` defaults to `true` and `defer` is opt-in; `nonce` is supported for CSP.
- `logger` – Partial logger implementation for observability hooks (debug/info/warn/error).

Returned client methods:

- `init()` – Idempotent initializer. Claims/creates the data layer, queues the `gtm.js` start event, flushes any pre-init pushes, and injects one script per container.
- `push(value)` – Adds values to the data layer immediately after init or queues them beforehand. Ignores `null`/`undefined`.
- `setConsentDefaults(state, options?)` – Emits a Consent Mode `default` command.
- `updateConsent(state, options?)` – Emits a Consent Mode `update` command.
- `teardown()` – Removes injected scripts and restores any pre-existing data layer array for test/microfrontend cleanup.
- `isInitialized()` – Returns the current init state.
- `whenReady()` – Returns a `Promise<ScriptLoadState[]>` that resolves when all GTM scripts have loaded (or failed).
- `onReady(callback)` – Registers a callback to fire when GTM scripts load. Returns an unsubscribe function.
- `dataLayerName` – Resolved name of the active data layer.

### Consent helpers

- `buildConsentCommand(command, state, options?)` (exported as `consent`) – Low-level helper for constructing consent commands without sending them.
- `consentPresets` / `getConsentPreset(name)` – Named sets for regional defaults.
- `ConsentState`, `ConsentRegionOptions`, and `ConsentCommand` types – Contracts for the consent payloads and region hints.

### Event helpers

- `pushEvent(client, name, payload?)` – Pushes `{ event: name, ...payload }` after validating that the payload is a plain object.
- `pushEcommerce(client, name, ecommercePayload, options?)` – Safely wraps GA4 ecommerce payloads (`event: name`, `ecommerce: payload`) while keeping optional `extras` metadata at the top level.
- Type exports for typed events: `EventName`, `EventPayload`, `GtmEvent`, `PageViewPayload`, `EcommercePayload`, `AdsConversionPayload`, and `EventForName` helpers for inference.

### Noscript helper

`createNoscriptMarkup(containers, options?)` returns the recommended GTM `<noscript>` iframe string for SSR:

- Accepts the same `containers` input as `createGtmClient`.
- `host` defaults to Google; `defaultQueryParams` merge with per-container params.
- `iframeAttributes` extend the default attributes (`height="0"`, `width="0"`, `style="display:none;visibility:hidden"`, `title="Google Tag Manager"`).

### Auto-queue (race condition protection)

The auto-queue system buffers dataLayer pushes that occur before GTM.js loads, then replays them in order once GTM is ready.

- `installAutoQueue(options?)` – Installs automatic buffering on the dataLayer. Returns an `AutoQueueState` object with:
  - `active` – Whether buffering is currently active.
  - `bufferedCount` – Number of events currently buffered.
  - `gtmReady` – Whether GTM has been detected as loaded.
  - `replay()` – Manually trigger replay (usually automatic).
  - `uninstall()` – Remove the interceptor and restore original push.

Options:

- `dataLayerName` – Custom dataLayer name (default: `'dataLayer'`).
- `pollInterval` – Interval in ms to check if GTM loaded (default: `50`).
- `timeout` – Max time in ms to wait before firing `onTimeout` (default: `30000`).
- `maxBufferSize` – Limit on buffered events to prevent memory issues (default: `1000`).
- `onReplay(count)` – Callback when buffer replays.
- `onTimeout(count)` – Callback if timeout reached before GTM loads.

- `createAutoQueueScript(dataLayerName?)` – Returns a minimal inline script string for earliest possible buffering in the HTML `<head>`. Embed this before any other scripts that push to dataLayer.

- `attachToInlineBuffer(options?)` – Attaches to an existing buffer created by `createAutoQueueScript()`. Call when the full GTM Kit bundle loads to take over buffer management.

## React (modern) adapter (`@jwiedeman/gtm-kit-react`)

`<GtmProvider config={...}>` initializes the core client exactly once (StrictMode-safe) and tears it down on unmount. The config matches `createGtmClient` options and is treated as immutable after the first render (development warns on changes).

Hooks:

- `useGtm()` – Returns `{ client, push, setConsentDefaults, updateConsent, whenReady, onReady }` from context.
- `useGtmClient()` – Accessor for the underlying client instance.
- `useGtmPush()` – Shortcut to the `push` function.
- `useGtmConsent()` – Returns `{ setConsentDefaults, updateConsent }` helpers.
- `useGtmReady()` – Returns a function that resolves when GTM scripts are loaded.

Example:

```tsx
<GtmProvider config={{ containers: 'GTM-XXXX', dataLayerName: 'dataLayer' }}>
  <App />
</GtmProvider>
```

## React (legacy) adapter (`@jwiedeman/gtm-kit-react-legacy`)

`withGtm({ config, propName })` wraps class components and injects a `gtm` prop (customizable via `propName`, default `'gtm'`). The prop exposes `{ client, push, setConsentDefaults, updateConsent }`. Initialization occurs in `componentDidMount`; teardown runs on unmount.

```tsx
class Dashboard extends React.Component<{ gtm: LegacyGtmApi }> {
  componentDidMount() {
    this.props.gtm.push({ event: 'page_view' });
  }
  /* ... */
}

export default withGtm({ config: { containers: 'GTM-XXXX' } })(Dashboard);
```

## Next.js helpers (`@jwiedeman/gtm-kit-next`)

- `useTrackPageViews(options)` – Client-side hook for App Router that watches pathname/search (and optionally hash) changes and pushes pageview events via `pushEvent`.
  - `client` (required) – GTM client instance.
  - `eventName` – Event name to push (default: `'page_view'`).
  - `buildPayload` – Custom function to build the event payload.
  - `includeSearchParams` – Include search params in page path (default: `true`).
  - `trackHash` – Track hash changes (default: `false`).
  - `trackOnMount` – Track initial page view on mount (default: `true`).
  - `skipSamePath` – Skip tracking if path hasn't changed (default: `true`).
  - `waitForReady` – Wait for GTM scripts to load before tracking (default: `false`).
  - `readyPromise` – Custom promise to wait for (uses `client.whenReady()` if not provided).
  - `pushEventFn` – Custom push function (default: `pushEvent`).

- `<GtmHeadScript>` – Server component that renders one `<script>` tag per container with optional `host`, `defaultQueryParams`, `dataLayerName`, and `scriptAttributes` (inherits CSP `nonce` and sets `async` true by default). When `dataLayerName` is provided, the `l=` query parameter is appended automatically, including under custom hosts.
- `<GtmNoScript>` – Server component emitting `<noscript><iframe /></noscript>` markup with overridable `iframeAttributes`, merged query params, and optional `dataLayerName` that flows into the iframe URL.

## Vue adapter (`@jwiedeman/gtm-kit-vue`)

`GtmPlugin` is a Vue 3 plugin that initializes GTM and provides composables for accessing the client.

```ts
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';
app.use(GtmPlugin, { containers: 'GTM-XXXX' });
```

Plugin options match `createGtmClient` plus lifecycle callbacks:

- `onBeforeInit(client)` – Called before GTM initializes (set consent defaults here).
- `onAfterInit(client)` – Called after GTM initializes.

Composables:

- `useGtm()` – Returns `{ client, push, setConsentDefaults, updateConsent }`.
- `useGtmClient()` – Returns the raw GTM client instance.
- `useGtmPush()` – Returns the `push` function.
- `useGtmConsent()` – Returns `{ setConsentDefaults, updateConsent }`.
- `useGtmReady()` – Returns a function that resolves when GTM is loaded.
- `GTM_INJECTION_KEY` – Symbol for manual injection if needed.

## Nuxt adapter (`@jwiedeman/gtm-kit-nuxt`)

Extends the Vue adapter with Nuxt-specific helpers. Install as a client-only plugin (`plugins/gtm.client.ts`).

```ts
import { GtmPlugin } from '@jwiedeman/gtm-kit-nuxt';
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, { containers: 'GTM-XXXX' });
});
```

Exports:

- `createNuxtGtmPlugin(options)` – Factory for creating the plugin with options.
- `useNuxtGtm()`, `useNuxtGtmPush()`, `useNuxtGtmConsent()`, `useNuxtGtmClient()` – Nuxt-specific composables.
- `useTrackPageViews()` – Automatic page view tracking on route changes.
- Re-exports all Vue composables (`useGtm`, `useGtmPush`, etc.) for convenience.

## Svelte adapter (`@jwiedeman/gtm-kit-svelte`)

Uses Svelte stores and context for reactive GTM access.

```svelte
<script>
  import { createGtmStore, setGtmContext } from '@jwiedeman/gtm-kit-svelte';
  const gtm = createGtmStore({ containers: 'GTM-XXXX' });
  setGtmContext(gtm);
</script>
```

Exports:

- `createGtmStore(options)` – Creates a GTM store. Options match `createGtmClient` plus `autoInit` (default: `true`) and `onBeforeInit` callback.
- `setGtmContext(store)` – Sets the store in Svelte context for child components.
- `getGtmContext()` – Gets the store from context.
- `gtmPush()` – Derived store for just the push function.
- `gtmConsent()` – Derived store for consent functions.
- `gtmClient()` – Derived store for the raw client.
- `gtmReady()` – Derived store for the `whenReady` function.

## SolidJS adapter (`@jwiedeman/gtm-kit-solid`)

Uses Solid's fine-grained reactivity and context.

```tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-solid';
<GtmProvider containers="GTM-XXXX">
  <App />
</GtmProvider>;
```

Provider props match `createGtmClient` options plus `autoInit`, `onBeforeInit`, and `onAfterInit`.

Hooks:

- `useGtm()` – Returns `{ client, push, updateConsent, initialized }`.
- `useGtmPush()` – Returns the push function.
- `useGtmConsent()` – Returns `{ setConsentDefaults, updateConsent }`.
- `useGtmClient()` – Returns the raw client instance.
- `useGtmReady()` – Returns a function that resolves when GTM is loaded.

## Remix adapter (`@jwiedeman/gtm-kit-remix`)

Provides React components and hooks optimized for Remix's architecture.

```tsx
import { GtmProvider, GtmScripts, useTrackPageViews } from '@jwiedeman/gtm-kit-remix';

// In root.tsx
<head>
  <GtmScripts containers="GTM-XXXX" />
</head>
<body>
  <GtmProvider config={{ containers: 'GTM-XXXX' }}>
    <PageViewTracker />
    <Outlet />
  </GtmProvider>
</body>
```

Components:

- `<GtmScripts>` – Server-side component for script tags (place in `<head>`).
- `<GtmProvider>` – Client-side provider with `config`, `onBeforeInit`, and `onAfterInit` props.

Hooks:

- `useTrackPageViews(options?)` – Tracks page views on route changes with customizable event name, custom data, and transform function.
- `useGtm()`, `useGtmPush()`, `useGtmConsent()`, `useGtmClient()`, `useGtmReady()` – Same as React modern adapter.

## Astro adapter (`@jwiedeman/gtm-kit-astro`)

Client-side GTM management for Astro with page tracking helpers.

```ts
import { initGtm, push, whenReady } from '@jwiedeman/gtm-kit-astro';

initGtm({ containers: 'GTM-XXXX' });
await whenReady();
push({ event: 'page_view' });
```

Exports:

- `initGtm(options)` – Initializes GTM with options matching `createGtmClient`.
- `getGtmClient()` – Returns the client if initialized, or `null`.
- `requireGtmClient()` – Returns the client or throws if not initialized.
- `push(value)` – Pushes to the dataLayer (warns if not initialized).
- `setConsentDefaults(state, options?)` – Sets consent defaults.
- `updateConsent(state, options?)` – Updates consent.
- `whenReady()` – Returns a promise that resolves when GTM is loaded.
- `teardown()` – Cleans up GTM.
- `trackPageView(data?)` – Tracks a page view event.
- `setupPageTracking(options?)` – Sets up automatic page view tracking.
- `setupViewTransitions()` – Integrates with Astro's View Transitions API.

## CLI (`@jwiedeman/gtm-kit-cli`)

Zero-config setup tool for GTM Kit.

```bash
npx @jwiedeman/gtm-kit-cli init GTM-XXXXXX
```

Commands:

- `init [GTM-ID]` – Interactive or quick setup. Auto-detects framework and package manager, installs packages, and generates starter code.
- `detect` – Shows detected framework and package manager.
- `validate <GTM-ID>` – Validates a GTM container ID format.
- `generate <GTM-ID>` – Generates setup code without installing packages.

Programmatic API:

- `detectFramework(cwd?)` – Returns `{ name, confidence }` for the detected framework.
- `validateGtmId(id)` – Returns `{ valid, error?, suggestion? }`.
- `validateConfig(config)` – Validates full configuration object.
- `generateSetupCode(options)` – Generates framework-specific setup code.
- `run()` – Runs the CLI programmatically.
