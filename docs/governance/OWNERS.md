# Ownership matrix

This matrix establishes the accountable owners for the React GTM Kit project. Update it whenever maintainers rotate or coverage
areas change.

| Area                                | Responsibilities                                                     | Primary      | Backup       |
| ----------------------------------- | -------------------------------------------------------------------- | ------------ | ------------ |
| Core library (`@jwiedeman/gtm-kit`) | API stability, data layer lifecycle, consent handling, build tooling | Casey Rivera | Morgan Patel |
| React adapters                      | Provider + HOC ergonomics, StrictMode verification, adapter docs     | Morgan Patel | Casey Rivera |
| Next.js helpers                     | App Router integration, CSP threading, noscript bridge               | Alex Nguyen  | Casey Rivera |
| Documentation                       | Task-based docs, API reference, examples alignment                   | Priya Shah   | Alex Nguyen  |
| Examples & E2E                      | Sample apps, Playwright suites, CI smoke coverage                    | Jordan Lee   | Priya Shah   |
| Governance & releases               | Semantic-release, support policy, compliance artifacts               | Priya Shah   | Morgan Patel |

## Stakeholder map

| Function          | Name         | Role                                               | Preferred channels                  |
| ----------------- | ------------ | -------------------------------------------------- | ----------------------------------- |
| Executive sponsor | Taylor Kim   | Budget/approvals, unblock escalations              | Email + `#react-gtm-kit-launch`     |
| Product owner     | Priya Shah   | Roadmap prioritization, demos, stakeholder updates | `#react-gtm-kit-launch`, standups   |
| Privacy counsel   | Jordan Lee   | Consent/legal review, DPIA sign-off                | Email, release readiness review     |
| Security lead     | Morgan Patel | CSP/nonces, disclosure policy, dependency posture  | `#react-gtm-kit-core`, incidents    |
| DX/docs lead      | Alex Nguyen  | Docs IA, examples alignment, launch comms          | `#react-gtm-kit-core`, office hours |
| Release manager   | Casey Rivera | Versioning, semantic-release, change log           | Standups, email on freeze weeks     |

**Escalation path:** Core engineering → DX/docs → Product owner → Privacy/Security counsel → Executive sponsor.

**Communication channels:** `#react-gtm-kit-core` (engineering, async standups), `#react-gtm-kit-launch` (cross-functional planning), `gtm-kit@company.test` (approvals + legal), weekly DX office hours (Tuesdays 14:00 PT).

_Last updated: 2025-11-10_
