# Production readiness review

## Current strengths

- The kit's charter and functional requirements target a production-grade GTM bridge: multi-container loading, Consent Mode v2, noscript fallback, environment query parameters, SSR/Next helpers, and zero-dependency core semantics are all explicitly in scope and documented for adopters.【F:README.md†L37-L118】
- The core client preserves the existing dataLayer, queues pre-init pushes, pre-seeds the gtm.js start event, deduplicates consent commands during hydration, and flushes queued values after initialization so React/Next apps can safely push before the container loads.【F:packages/core/src/client.ts†L16-L178】
- Script injection supports multiple containers, custom hosts, environment/debug query params, CSP nonces, and deduplication via data attributes while tolerating missing `document.head` by falling back to `document.body`.【F:packages/core/src/script-manager.ts†L8-L158】
- Script injection now surfaces readiness through a promise + callback API with load/error reporting, and carries dedicated unit coverage across host overrides, query param propagation, CSP nonces, duplicate detection, teardown cleanup, and readiness resolution so delivery regressions fail loudly.【F:packages/core/src/script-manager.ts†L4-L189】【F:packages/core/src/__tests__/script-manager.spec.ts†L1-L91】【F:packages/next/src/route-listener.ts†L1-L169】

## Gaps before “all GTM features” readiness

None identified for GTM script delivery after landing readiness signaling, error surfacing, and ScriptManager-specific coverage.

## Recommendations

- Encourage adopters to gate critical pushes on `whenReady()`/`waitForReady` and log readiness failures for telemetry to catch production regressions early.【F:packages/next/src/route-listener.ts†L1-L169】【F:packages/react-modern/src/provider.tsx†L20-L94】
- Extend E2E coverage to include readiness-gated flows alongside existing CSP and navigation scenarios so ScriptManager behavior stays validated across browsers.
