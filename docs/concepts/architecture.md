# Architecture overview

Understand how the React GTM Kit pieces work together so you can extend or debug the
system confidently.

## Layers of the system

### Core runtime

- Claims or creates the `dataLayer` array without clobbering existing pushes.
- Queues events until the GTM container script finishes loading, then flushes them in order.
- Injects one `<script>` element per configured container and cleans them up during teardown.
- Exposes consent helpers, logging hooks, and teardown utilities that higher layers can call.

### Adapter packages

- React adapters (`react-modern`, `react-legacy`) wrap the core client factory and
  push helpers with idiomatic hooks and higher-order components that are StrictMode-safe.
- The Next.js helper package wires pageview tracking into App Router navigations and
  threads CSP nonces from the server to the client.

### Examples and documentation

- Examples under `examples/` demonstrate how to compose the adapters with routers,
  consent managers, and full-stack setups.
- VitePress documentation in `docs/` provides task-based guidance tied directly to the
  core and adapter capabilities.

## Data flow lifecycle

1. **Initialization** – `createGtmClient` captures container IDs, optional environment
   params, and the data layer name before calling `client.init()`.
2. **Queueing** – Calls to `pushEvent(client, ...)` before initialization are stored until the
   loader resolves.
3. **Flush & observe** – Once GTM loads, queued events flush in FIFO order, and
   additional pushes go directly to the live data layer.
4. **Consent updates** – Consent helpers translate CMP responses into Consent Mode v2
   keys so GTM adjusts storage behavior.
5. **Teardown** – Utilities remove injected scripts and restore globals for tests or
   microfrontends.

## Extensibility tips

- Keep new adapters thin: reuse the core push and consent helpers instead of reimplementing
  data layer logic.
- When introducing new examples, alias workspace packages via `pnpm install` to ensure the
  example consumes the current source build.
- Document behavioral guarantees (ordering, dedupe, teardown) in the relevant how-to guides
  so downstream teams rely on stable contracts.
