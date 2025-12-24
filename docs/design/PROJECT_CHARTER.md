# Project Charter

This document captures the original project charter, requirements, and design principles for React GTM Kit.

---

## 1. Project Goal

Ship a dead-simple, production-grade GTM client that works in any React era (legacy to current) and exposes all GTM capabilities (multi-container, Consent Mode v2, noscript fallback, environment params, SSR/Next, etc.). Complement the core library with reference implementations covering both a server-side integration and a web frontend experience so teams can adopt the kit in full-stack scenarios without guesswork.

## 2. Core Principles

- **Framework-agnostic by default** - React is an adapter, not a dependency
- **Minimal public API** with stable semantics
- **Zero runtime dependencies** in the core
- **Test the scary parts** (CSP, SSR hydration, StrictMode remounts) like maniacs
- **Documentation is task-based** and copy-paste friendly

**Why this approach is correct:** GTM's contract is the data layer and a single container loader. Keep that contract pure and you're compatible with past, current, and future frameworks.

---

## 3. Scope

### In Scope

- Web GTM containers (client) with SSR-aware helpers
- Consent Mode v2 primitives (ad_storage, analytics_storage, ad_user_data, ad_personalization)
- Optional server-side tagging compatibility (env / custom domain handoff)
- Noscript fallback mechanics (SSR string helper)
- First-party debug hooks (pluggable logger), not opinions

### Out of Scope

- Authoring GTM tags or triggers (that lives in GTM UI)
- Analytics opinions (GA4 schemas, naming conventions)—we provide optional scaffolding only
- Mobile SDKs (web only), SPA router integrations beyond "examples"

---

## 4. Architecture

### Packages

**Core (framework-agnostic)**

- Create/claim the data layer
- Load one or more GTM containers exactly once
- Queue and flush pre-init pushes
- Support Consent Mode v2 updates
- Teardown/reset for tests
- Optional noscript string builder

**React Adapters (optional)**

- Modern (`@jwiedeman/gtm-kit-react`): Hook-based, StrictMode-safe
- Legacy (`@jwiedeman/gtm-kit-react-legacy`): Class component HOC wrapper

**Next.js Helpers (optional)**

- Pageview bridge for App Router
- Server utility for CSP nonce
- Noscript iframe markup helper

### Design Constraints

- Single shared data layer by default; support custom names as advanced option
- Default to Google's host; allow custom host only for server-side tagging
- Provide noscript iframe helper for server rendering

---

## 5. Functional Requirements

| ID   | Requirement                                                                 |
| ---- | --------------------------------------------------------------------------- |
| FR-1 | **Initialization** - Accept container IDs, create dataLayer, inject scripts |
| FR-2 | **Data Pushes** - Safe pre/post-init with FIFO queue                        |
| FR-3 | **Consent Mode v2** - Minimal API for consent signals                       |
| FR-4 | **Environment & Preview** - Support gtm_auth, gtm_preview params            |
| FR-5 | **Noscript Support** - Pure function returning iframe markup                |
| FR-6 | **Teardown** - Remove scripts, restore global state                         |
| FR-7 | **Observability** - Pluggable logger interface                              |
| FR-8 | **React Adapter** - Modern (hooks) + Legacy (HOC)                           |
| FR-9 | **Next.js Helpers** - Page tracking, CSP nonce, noscript                    |

---

## 6. Non-Functional Requirements

| Requirement           | Target                     |
| --------------------- | -------------------------- |
| Bundle size (core)    | ≤ 4 KB gzip                |
| Dependencies (core)   | Zero                       |
| Init performance      | Non-blocking               |
| Push performance      | O(1)                       |
| Security              | CSP nonce support, no eval |
| React compatibility   | 16.x - 19+                 |
| Next.js compatibility | 13.4+ App Router           |

---

## 7. Acceptance Criteria

- [ ] Init is idempotent across double mount, hot reload, multiple calls
- [ ] Exactly one script per container ID after repeated inits
- [ ] Pre-init pushes appear in FIFO order after init
- [ ] Consent updates reflect in network behavior per Google docs
- [ ] Noscript helper emits standard iframe markup
- [ ] Works in React 16/17/18/19 with StrictMode
- [ ] 95%+ coverage in core, 85%+ in adapters
- [ ] Bundle size guard in CI

---

## 8. Testing Strategy

**Unit (headless DOM)**

- State machine: init → queue → flush; re-init dedupe; teardown resets
- URL composition for containers and environment params
- CSP nonce attribute applied

**Integration (DOM)**

- StrictMode double-mount = one script per container
- Hot reload doesn't duplicate scripts
- Multi-container order is deterministic

**E2E (browser)**

- Next.js: initial pageview + client navigation events
- JS disabled: noscript iframe loads GTM
- Consent Mode: network behavior matches Google docs

**Type Tests**

- Lock public API through compile-time tests

---

## 9. Privacy & Compliance

- Neutral consent update API mapping to Google's parameters
- Document regional behavior (EEA enforcement)
- Clarify that policy compliance is owner's responsibility
- Document noscript implications
- Centralized privacy guidance in docs/governance/

---

## 10. Milestones

| Milestone | Description                                             |
| --------- | ------------------------------------------------------- |
| M0        | Design sign-off: API, docs outline, acceptance criteria |
| M1        | Core alpha: init/queue/flush, multi-container, teardown |
| M2        | Consent Mode v2: consent API and tests                  |
| M3        | Noscript & CSP: SSR string, nonce handling              |
| M4        | React adapter: modern + legacy, integration tests       |
| M5        | Next helpers: pageview bridge, E2E                      |
| M6        | Docs & examples: CSR, SSR, consent, troubleshooting     |
| M7        | 1.0 hardening: size budgets, coverage, semantic-release |

---

## 11. Risks & Mitigations

| Risk                       | Mitigation                                 |
| -------------------------- | ------------------------------------------ |
| Duplicate script injection | Idempotent init, DOM markers, E2E tests    |
| CSP failures in prod       | Mandatory E2E with nonce enforcement       |
| Event loss before init     | FIFO queue with order validation tests     |
| Multiple dataLayers        | Default to one, document multi as advanced |
| Custom host misuse         | Document server-side tagging path          |
| React changes              | Tiny adapter, monitor official blog        |

---

## References

- [Google Tag Manager Data Layer](https://developers.google.com/tag-manager/devguide)
- [Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent)
- [Server-Side Tagging](https://developers.google.com/tag-platform/tag-manager/server-side)
- [Noscript Recommendations](https://developers.google.com/tag-manager/quickstart)
