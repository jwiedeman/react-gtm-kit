# Example applications & smoke tests

The React GTM Kit workspace ships with runnable examples that exercise the core client,
React adapters, and Next.js helpers. Each example has a dedicated `smoke` script so CI
can verify builds stay healthy without launching full end-to-end browsers.

## Available examples

| Package                                    | Description                                                              | Key features                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `@react-gtm-kit/example-vanilla-csr`       | Framework-agnostic Vite setup using only `@react-gtm-kit/core`.          | Consent defaults, manual event pushes, live data layer viewer.  |
| `@react-gtm-kit/example-react-strict-mode` | React Router SPA running in Strict Mode.                                 | Modern adapter provider + hooks, router-driven page views.      |
| `@react-gtm-kit/example-react-legacy`      | Class component demo using the legacy adapter.                           | `withGtm` HOC lifecycle integration.                            |
| `@react-gtm-kit/example-next-app`          | Next.js App Router sample with consent banner and CSP nonce propagation. | Server helpers, route analytics, consent persistence.           |
| `@react-gtm-kit/example-server`            | Node relay for server-side tagging setups.                               | Request normalization, consent forwarding, diagnostics logging. |

Cross-reference the [tracking scenario matrix](/design/tracking-matrix) for a
full list of required events, consent expectations, and validation coverage per
example.

## Running locally

Install workspace dependencies once from the repo root:

```bash
pnpm install
```

Then run any example by filtering with its package name:

```bash
# Vanilla CSR example
pnpm --filter @react-gtm-kit/example-vanilla-csr dev

# React Strict Mode example
pnpm --filter @react-gtm-kit/example-react-strict-mode dev
```

Each example inherits the shared ESLint + TypeScript configs. `pnpm run build` performs a
production build and (for Vite/Next apps) runs type-checking first.

## Automated smoke suite

The workspace exposes a consolidated smoke script that runs each example’s lightweight
check:

```bash
pnpm run examples:smoke
```

Under the hood this command executes every `smoke` script sequentially via
`pnpm --filter @react-gtm-kit/example-*`. CI can invoke the same command to confirm
examples continue to build after code changes without spawning browsers.

The server relay does not perform network requests during smoke runs—it uses
`node --check server.mjs` to validate syntax and catch missing dependencies early.
