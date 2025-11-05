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
- **Status:** Pending stakeholder sign-off (Architecture, DX). Target review meeting: 2025-11-08.
- **Follow-ups:**
  - Produce architecture diagram illustrating init/queue/flush for inclusion in the sign-off packet.
  - Capture reviewer approvals in this log once the meeting concludes.
