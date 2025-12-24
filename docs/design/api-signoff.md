# API sign-off – React GTM Kit core

_Status: Proposed_  
_Owner: Core engineering_  
_Reviewers: DX, Architecture_

This document freezes the public API surface for the `@jwiedeman/gtm-kit` package ahead of milestone M1. The goal is to provide
clear signatures, lifecycle expectations, and guardrails so adapters and documentation can rely on a stable contract.

## 1. Entry points

The package exposes the following named exports:

| Export                                | Type                                                                                               | Purpose                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `createGtmClient`                     | `(options: CreateGtmClientOptions) => GtmClient`                                                   | Factory that returns an idempotent GTM client instance.                |
| `createNoscriptMarkup`                | `(container: ContainerConfigInput \| ContainerConfigInput[], options?: NoscriptOptions) => string` | Generates standards-compliant `<noscript>` iframe markup for SSR.      |
| `DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES`  | `Record<string, string>`                                                                           | Baseline iframe attributes (height/width/style) used by the helper.    |
| `consent`                             | Namespace of typed consent helpers                                                                 | Convenience entry point to call `default` and `update` commands.       |
| `buildConsentCommand`                 | Factory used internally by adapters                                                                | Builds a `{ command, state, options }` payload for advanced scenarios. |
| `consentPresets` / `getConsentPreset` | Typed lookup for common regional defaults                                                          | Allows downstreams to seed consent state.                              |
| Type exports                          | `ContainerConfigInput`, `CreateGtmClientOptions`, `GtmClient`, `ConsentState`, etc.                | Compile-time surface area relied upon by adapters and apps.            |

No additional exports will be added without a new design review. Internal utilities (`script-manager`, `data-layer`, etc.) remain
private to allow refactors without API churn.

## 2. `createGtmClient` contract

### Options shape

```ts
interface CreateGtmClientOptions {
  containers: ContainerConfigInput[] | ContainerConfigInput; // required
  dataLayerName?: string; // default: "dataLayer"
  host?: string; // default: https://www.googletagmanager.com
  defaultQueryParams?: Record<string, string | number | boolean>; // appended to every container request
  scriptAttributes?: ScriptAttributes; // copied to injected <script>
  logger?: PartialLogger; // overrides for debug/info/warn/error hooks
}
```

- `containers` accepts either a GTM ID string (`"GTM-XXXX"`) or a descriptor object `{ id, queryParams? }`. Arrays are supported
  for multi-container setups and preserve order.
- `dataLayerName` allows advanced consumers to reuse an existing array. The client never overwrites non-array globals.
- `host`, `defaultQueryParams`, and per-container `queryParams` enable Consent Mode + environment workflows (e.g., `gtm_auth`).
- `scriptAttributes` covers CSP nonces, async/defer flags, and `data-*` instrumentation.
- `logger` provides opt-in diagnostics while preserving a no-op default to avoid console noise in production.

### Lifecycle and methods

`createGtmClient` returns an object implementing:

```ts
interface GtmClient {
  readonly dataLayerName: string;
  init(): void;
  push(value: DataLayerValue): void;
  setConsentDefaults(state: ConsentState, options?: ConsentRegionOptions): void;
  updateConsent(state: ConsentState, options?: ConsentRegionOptions): void;
  teardown(): void;
  isInitialized(): boolean;
}
```

- **`init()`** is idempotent. Repeat calls after initialization log and exit without side-effects.
- During `init()` the client:
  1. Claims or creates the `dataLayer` via `ensureDataLayer`.
  2. Pushes the standard `{ event: 'gtm.js', 'gtm.start': timestamp }` object.
  3. Flushes any queued `push()` or consent calls performed pre-init.
  4. Injects exactly one `<script>` per container using `ScriptManager.ensure`.
- **`push(value)`** accepts structured objects, arrays, or callback functions per GTM’s data layer contract. Falsy values are
  ignored with a warning. Calls pre-init are queued (FIFO) and flushed once `init()` completes.
- **`setConsentDefaults` / `updateConsent`** wrap the Consent Mode v2 commands (`default` and `update`). Both accept a
  `ConsentState` object with the keys `ad_storage`, `analytics_storage`, `ad_user_data`, and `ad_personalization`. Optional
  `ConsentRegionOptions` allow scoping by region lists (`region`, `wait_for_update` windows, etc.). Values are queued if invoked
  before `init()` to preserve ordering guarantees.
- **`teardown()`** removes injected scripts, restores any pre-existing data layer reference, and clears the queue. This is used for
  tests and hot-module reload scenarios.
- **`isInitialized()`** exposes client state for adapters to coordinate StrictMode double-invocation handling.

### Sequence overview

```
createGtmClient(options)
      │
      ▼
client.init()
      │
      ├─ ensureDataLayer(name)
      ├─ push({ event: 'gtm.js', 'gtm.start': ts })
      ├─ flushQueue() ──► pushToDataLayer(queued values)
      └─ ScriptManager.ensure(containers)
```

The queue is only flushed after the data layer exists, guaranteeing that pre-init pushes and consent updates execute in request
order. Re-initialization skips the entire sequence and logs a debug message.

## 3. Consent helpers

The consent module exposes:

- `consent.defaults(state, options?)` – shorthand for `setConsentDefaults` on the shared client.
- `consent.update(state, options?)` – shorthand for updating consent after defaults are applied.
- `buildConsentCommand({ command, state, options })` – emits the GTM command tuple used by the data layer. Intended for advanced
  integrations that push directly without instantiating a client.
- `consentPresets` & `getConsentPreset(name)` – curated sets of `ConsentState` objects (e.g., `full`, `denied`, `eeaPartial`).

All helpers validate that provided keys map to the known Consent Mode parameters. Unknown keys are rejected at compile time via
TypeScript interfaces.

## 4. Noscript helper

`createNoscriptMarkup(containers, options?)` mirrors the loader behavior for non-JavaScript scenarios:

- Accepts a single container ID or array. When an array is provided, multiple iframe tags are emitted in order.
- Applies `DEFAULT_NOSCRIPT_IFRAME_ATTRIBUTES` unless overridden via `options.iframeAttributes`.
- Merges container-level `queryParams` with global `defaultQueryParams`, matching the loader semantics.
- Escapes attribute values to prevent HTML injection when server-rendering the returned string.

This helper is pure: it does not touch the DOM and can be invoked at build time or request time.

## 5. Non-goals for the core API

- No automatic pageview or event semantics—framework adapters and examples own that behavior.
- No persistence or cookie management beyond what GTM performs.
- No implicit global singletons: each `createGtmClient` call returns an isolated manager (scripts dedupe via DOM markers).

## 6. Versioning commitment

- Breaking API changes require a new sign-off revision and a semantic major release.
- Additive, backward-compatible changes (e.g., new optional fields) require documentation updates and DX review.
- Internal refactors must preserve the behaviors enumerated in this document (idempotent init, queue ordering, consent mapping).

## 7. Open items before final sign-off

- Confirm logger defaults with DX (should we expose structured payload typing?).
- Validate whether the consent presets list needs expansion prior to beta.
- Produce a companion architecture diagram under `docs/design/architecture/` illustrating the loader + data layer interactions.
