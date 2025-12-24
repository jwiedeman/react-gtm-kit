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

## React (modern) adapter (`@jwiedeman/gtm-kit-react`)

`<GtmProvider config={...}>` initializes the core client exactly once (StrictMode-safe) and tears it down on unmount. The config matches `createGtmClient` options and is treated as immutable after the first render (development warns on changes).

Hooks:

- `useGtm()` – Returns `{ client, push, setConsentDefaults, updateConsent }` from context.
- `useGtmClient()` – Accessor for the underlying client instance.
- `useGtmPush()` – Shortcut to the `push` function.
- `useGtmConsent()` – Returns `{ setConsentDefaults, updateConsent }` helpers.

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

- `useTrackPageViews({ client, eventName = 'page_view', buildPayload, includeSearchParams = true, trackHash = false, trackOnMount = true, skipSamePath = true, pushEventFn })` – Client-side hook for App Router that watches pathname/search (and optionally hash) changes and pushes pageview events via `pushEvent`.
- `<GtmHeadScript>` – Server component that renders one `<script>` tag per container with optional `host`, `defaultQueryParams`, `dataLayerName`, and `scriptAttributes` (inherits CSP `nonce` and sets `async` true by default). When `dataLayerName` is provided, the `l=` query parameter is appended automatically, including under custom hosts.
- `<GtmNoScript>` – Server component emitting `<noscript><iframe /></noscript>` markup with overridable `iframeAttributes`, merged query params, and optional `dataLayerName` that flows into the iframe URL.
