# Production readiness review

## Current strengths

- The kit's charter and functional requirements target a production-grade GTM bridge: multi-container loading, Consent Mode v2, noscript fallback, environment query parameters, SSR/Next helpers, and zero-dependency core semantics are all explicitly in scope and documented for adopters.【F:README.md†L37-L118】
- The core client preserves the existing dataLayer, queues pre-init pushes, pre-seeds the gtm.js start event, deduplicates consent commands during hydration, and flushes queued values after initialization so React/Next apps can safely push before the container loads.【F:packages/core/src/client.ts†L16-L178】
- Script injection supports multiple containers, custom hosts, environment/debug query params, CSP nonces, and deduplication via data attributes while tolerating missing `document.head` by falling back to `document.body`.【F:packages/core/src/script-manager.ts†L8-L158】

## Gaps before “all GTM features” readiness

- Script injection is fire-and-forget: the ScriptManager appends `<script>` elements without `load`/`error` listeners or a surfaced readiness state, so applications cannot block event pushes on container readiness, emit telemetry when GTM fails to load, or retry in degraded networks.【F:packages/core/src/script-manager.ts†L86-L158】
- The same injection path currently has no dedicated tests covering host overrides, query param propagation, CSP nonce copying, or duplicate detection; regressions here would quietly undermine container delivery even though the rest of the client is well exercised through queue/consent tests.【F:packages/core/src/**tests**/client.spec.ts†L1-L20】【F:packages/core/src/**tests**/noscript.spec.ts†L1-L17】

## Recommendations

- Add a surfaced “ready” signal (promise, callback, or event emitter) and error reporting for GTM script loads, then thread it through React/Next helpers so apps can gate business events on real container readiness.
- Add unit tests for ScriptManager covering custom host/query params, CSP/nonces, duplicate script detection, and teardown to align injection coverage with the rest of the suite.
