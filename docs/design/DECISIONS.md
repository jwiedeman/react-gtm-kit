# Decision log

## 2025-11-06 – M0 API surface freeze (TK-002)

- **Context:** Stabilize the core API before adapter implementation and downstream documentation.
- **Decision:** Adopt the API contract defined in [`api-signoff.md`](./api-signoff.md) as the frozen surface for M1 delivery.
  - `createGtmClient` remains the sole factory entry point with idempotent lifecycle semantics.
  - Consent helpers (`setConsentDefaults`, `updateConsent`, namespace helpers) map 1:1 to Google Consent Mode commands.
  - Noscript support is exposed as a pure helper returning iframe markup; no automatic DOM injection.
  - No additional public exports will be introduced without a new review.
- **Rationale:** Keeps adapters and docs aligned, prevents churn during multi-package rollout, and satisfies the charter’s
  minimal-API principle.
- **Status:** Approved on 2025-11-09 by Architecture & DX following the TK-015 lifecycle review.
- **Approvals:** Architecture (J. Patel), Developer Experience (M. Chen).
- **Follow-ups:**
  - Produce architecture diagram illustrating init/queue/flush for inclusion in the sign-off packet. ✅ (See TK-015)
  - Capture reviewer approvals in this log once the meeting concludes. ✅

## 2025-11-09 – GTM loader lifecycle architecture review (TK-015)

- **Context:** Validate the end-to-end lifecycle for container orchestration, queue flushing, consent delivery, and teardown
  semantics before finalising adapter contracts.
- **Decision:** Adopt the architecture defined in [`rfc-gtm-loader.md`](./rfc-gtm-loader.md), including the sequence diagram in
  [`architecture/gtm-loader-sequence.md`](./architecture/gtm-loader-sequence.md), as the authoritative reference for
  implementation and documentation.
  - Snapshot the data layer prior to mutation so teardown can restore the pre-existing global state.
  - Delegate script deduplication and CSP propagation to the shared `ScriptManager` abstraction.
  - Treat consent defaults as high-priority queued entries that must flush before any other payload.
- **Rationale:** The lifecycle design protects multi-container ordering, enforces deterministic teardown, and keeps Consent Mode
  behavior explicit without constraining adapters. It also aligns with the project’s framework-agnostic charter.
- **Status:** Approved by Architecture & DX on 2025-11-09.
- **Approvals:** Architecture (J. Patel), Developer Experience (M. Chen), Core Engineering (L. Rivera).
- **Follow-ups:**
  - Surface the sequence diagram in the VitePress docs navigation under "Architecture" (Docs).
  - Reference teardown requirements in the release checklist (Release Management).
  - Monitor adapter implementations for adherence to the queue/flush invariants (Core Engineering).
