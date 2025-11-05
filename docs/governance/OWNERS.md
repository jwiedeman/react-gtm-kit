# Ownership matrix

This matrix establishes the accountable owners for the React GTM Kit project. Update it whenever maintainers rotate or coverage
areas change.

| Area | Responsibilities | Primary | Backup |
| --- | --- | --- | --- |
| Core library (`@react-gtm-kit/core`) | API stability, data layer lifecycle, consent handling, build tooling | Casey Rivera | Morgan Patel |
| React adapters | Provider + HOC ergonomics, StrictMode verification, adapter docs | Morgan Patel | Casey Rivera |
| Next.js helpers | App Router integration, CSP threading, noscript bridge | Alex Nguyen | Casey Rivera |
| Documentation | Task-based docs, API reference, examples alignment | Priya Shah | Alex Nguyen |
| Examples & E2E | Sample apps, Playwright suites, CI smoke coverage | Jordan Lee | Priya Shah |
| Governance & releases | Semantic-release, support policy, compliance artifacts | Priya Shah | Morgan Patel |

**Escalation path:** Core engineering → DX (documentation) → Product/Compliance.

**Slack channels:** `#react-gtm-kit-core` (engineering), `#react-gtm-kit-launch` (cross-functional).

_Last updated: 2025-11-06_
