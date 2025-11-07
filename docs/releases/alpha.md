# Alpha Release Notes

## Overview

The alpha release of **React GTM Kit** delivers a workspace-wide set of packages that make it easy to initialize Google Tag Manager, manage consent, and orchestrate pageview analytics across React applications. This milestone focuses on hardening the core client surface, providing production-ready React adapters, and shipping reference helpers for Next.js App Router projects.

## What’s Included

### Core client (`@react-gtm-kit/core`)

- Idempotent initialization that accepts single or multiple container IDs and preserves pre-existing `dataLayer` state.
- Queueing of pre-init pushes with FIFO flush semantics once the GTM script loads.
- Consent Mode v2 helpers that expose typed setters for Google’s consent signals and propagate updates through the shared data layer.
- Noscript iframe string builder for SSR environments and teardown utilities for tests and microfrontends.

### React adapters

- `@react-gtm-kit/react-modern` provider + hooks that guard against StrictMode double mounts and support Suspense-wrapped trees.
- `@react-gtm-kit/react-legacy` higher-order component that injects the same client surface into class components while handling lifecycle teardown automatically.

### Next.js helpers (`@react-gtm-kit/next`)

- Client-side router listener for App Router navigation events that emits GTM pageview pushes with the configured data layer name.
- Server utilities that bridge CSP nonces to injected scripts and expose the recommended noscript markup for server components.

### Tooling & quality gates

- Shared workspace build tooling via `tsup`, Jest unit tests with high coverage targets, size-limit guardrails, and Playwright E2E scaffolding for SSR + Next scenarios.

## Known Limitations (Alpha)

- CI-hosted Playwright browsers are pending provisioning; run `pnpm e2e:install && pnpm e2e:test` locally until the shared cache is available.
- Consent regression matrix and SSR hydration hardening tests are planned for the beta milestone (see TK-048 and TK-049).
- Documentation site and full tracking scenario examples remain in progress (M6 milestone).

## Upgrade Notes for Beta

- Expect additive consent regression tests and SSR hydration utilities that preserve server-rendered `dataLayer` entries without duplication.
- Playwright suites will be extended to cover Next.js Edge runtime and routing nuances once CI browsers are stabilized (TK-051).
- Beta will introduce docs site navigation, runnable example smoke tests, and semantic-release automation; monitor `TASKS.md` for milestone rollouts.

## Getting Help & Sharing Feedback

- File issues or feature requests in the repository issue tracker.
- Use discussions for implementation questions or share findings via pull requests with repro cases.
- Security or privacy concerns should follow the process outlined in `docs/governance/security-review.md` and `docs/governance/privacy.md`.
