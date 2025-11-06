# Vanilla CSR GTM example

This example shows how to use `@react-gtm-kit/core` in a framework-agnostic, vanilla
TypeScript application. It renders a small control panel that pushes page views and
custom events to the data layer while demonstrating consent defaults and updates.

## Commands

```bash
pnpm install
pnpm --filter @react-gtm-kit/example-vanilla-csr dev
pnpm --filter @react-gtm-kit/example-vanilla-csr build
pnpm --filter @react-gtm-kit/example-vanilla-csr preview
```

Set the following environment variables (via `.env` or inline) to customize runtime behavior:

- `VITE_GTM_CONTAINERS` – comma-separated list of container IDs (defaults to `GTM-XXXX`).
- `VITE_GTM_DATALAYER` – custom data layer name (defaults to `dataLayer`).

During local development the example logs lifecycle events using `console` for quick
visibility into queueing, consent updates, and data layer pushes.
