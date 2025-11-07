# RFC: GTM loader lifecycle and container orchestration

_Status: Approved_
_Owner: Core engineering_
_Reviewers: Architecture, Developer Experience_
_Linked task: [TK-015](../../TASKS.md)_

## 1. Problem statement

The React GTM Kit must provide a deterministic, framework-agnostic way to initialize Google Tag Manager containers while
respecting pre-existing globals, Consent Mode updates, and teardown requirements for tests and microfrontend shells. Earlier
spikes validated the data layer manager and script injection primitives, but we still needed an end-to-end lifecycle contract that
codifies how these pieces interact, what invariants must hold, and which extension points we will support.

## 2. Goals

- Guarantee idempotent initialization regardless of StrictMode double renders or repeated hooks.
- Preserve any pre-existing `dataLayer` state and allow consumers to seed values before initialization.
- Support one or more containers with deterministic ordering and CSP nonce propagation.
- Provide a first-class teardown that restores globals and removes injected DOM nodes.
- Expose observability hooks so downstream adapters can diagnose queue flushes, consent updates, and loader deduplication.

## 3. Non-goals

- Building a router-aware pageview layer (owned by adapters and examples).
- Modelling a consent management platform; we only forward the Consent Mode commands.
- Injecting noscript markup automatically (remains a pure helper for SSR contexts).

## 4. Proposed architecture

The GTM client owns the lifecycle for data layer management, queueing, and script orchestration. The following diagram captures
the interaction order and teardown responsibilities:

[Loader lifecycle sequence](./architecture/gtm-loader-sequence.md)

Key lifecycle phases:

1. **Construction** – `createGtmClient` normalises container descriptors and composes dependencies (`ScriptManager`, logger).
2. **Initialization** – `init()` ensures the data layer exists, snapshots pre-existing entries, emits the `gtm.js` start event,
   flushes queued pushes, and asks the `ScriptManager` to inject scripts for each container.
3. **Runtime pushes** – `push()` deduplicates consent commands, drops falsy payloads, and either queues (pre-init) or forwards to
   the live data layer (post-init).
4. **Teardown** – `teardown()` removes injected scripts and restores the original data layer contents (or deletes it when created
   by the client).

## 5. Data layer isolation

- `ensureDataLayer` guards against overwriting pre-existing arrays and provides a `restore()` helper invoked during teardown.
- Snapshots capture both the array contents and signatures of previously-delivered payloads so queued entries are only flushed
  once.
- Custom data layer names remain opt-in and are documented as an advanced configuration with associated risks.

## 6. Script loading and CSP

- The `ScriptManager` injects one `<script>` per container, tagging each with `data-gtm-container-id="{id}"` to guarantee
  deduplication across remounts.
- Additional attributes (`async`, `defer`, `nonce`, arbitrary key/value pairs) are merged from `scriptAttributes` to support CSP
  policies and enterprise requirements.
- When a custom `host` is provided we only rewrite the domain, preserving the `gtm.js` path to remain compatible with server-side
  tagging deployments.

## 7. Consent command handling

- Consent defaults may be supplied before `init()`; the client queues them and ensures the corresponding `'consent', 'default'`
  push is delivered before any other queued payload.
- Subsequent updates reuse the same command signature so they can be deduplicated when adapters or applications spam the same
  state.
- We do not attempt to infer consent transitions; responsibility for correctness stays with the caller and the CMP they integrate.

## 8. Error handling and observability

- All public methods guard against invalid inputs (e.g., falsy pushes) and log structured warnings via the pluggable logger.
- Script injection failures bubble as errors with container context, allowing adapters to surface actionable telemetry.
- Teardown failures never throw synchronously; instead they log warnings because cleanup typically occurs in test environments.
- We expose timestamps for queue flushes and script loads so downstream tooling (e.g., devtools overlays) can measure latency.

## 9. Rollout & verification

- Unit tests cover queue ordering, multi-container injection, teardown restoration, consent gating, and CSP attribute propagation.
- Playwright scenarios (Next.js App Router and SSR + CSP fixtures) validate behaviour with and without JavaScript enabled.
- Documentation in `docs/how-to/ssr.md` and `docs/how-to/consent.md` references this lifecycle so adopters understand the
  guarantees and responsibilities.

## 10. Open questions

| Topic                                  | Resolution                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Multiple data layers per page          | Out of scope for v1. We warn via documentation and require a follow-up RFC if business needs emerge. |
| Automatic pageview tracking            | Owned by adapters/examples; the core will not implicitly hook router events.                         |
| Support for script attribute callbacks | Rejected. Callers should pass explicit attribute objects to keep the API serialisable.               |

## 11. Decision

- The architecture review committee approved this lifecycle on **2025-11-09** with no blocking concerns.
- Follow-up for the docs team: add the sequence diagram to the VitePress navigation under "Architecture".
- Follow-up for release management: include teardown guidance in the 1.0 checklist to ensure test harnesses clean up correctly.
