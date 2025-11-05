# React GTM Kit

## Task tracker
Planning and delivery tasks now live in [`TASKS.md`](./TASKS.md). Keep that kanban up to date in-place (no deletions) and record status changes directly in the table so project history remains auditable.

---

## 1. Project charter
**Goal:** Ship a dead-simple, production-grade GTM client that works in any React era (legacy to current) and exposes all GTM capabilities (multi-container, Consent Mode v2, noscript fallback, environment params, SSR/Next, etc.).

**Core principles**
- Framework-agnostic by default; React is an adapter, not a dependency.
- Minimal public API with stable semantics.
- Zero runtime dependencies in the core.
- Test the scary parts (CSP, SSR hydration, StrictMode remounts) like maniacs.
- Documentation is task-based and copy-paste friendly.

**Why this approach is correct:** GTM’s contract is the data layer and a single container loader. Keep that contract pure and you’re compatible with past, current, and future frameworks. The official GTM model revolves around a shared data layer and a container snippet; our library should formalize those behaviors and get out of the way.[^cite-gtm-contract]

## 2. Scope & non-goals
**In scope**
- Web GTM containers (client) with SSR-aware helpers.
- Consent Mode v2 primitives (ad_storage, analytics_storage, ad_user_data, ad_personalization).[^cite-consent]
- Optional server-side tagging compatibility (env / custom domain handoff).[^cite-sst]
- Noscript fallback mechanics (SSR string helper).[^cite-noscript]
- First-party debug hooks (pluggable logger), not opinions.

**Out of scope**
- Authoring GTM tags or triggers (that lives in GTM UI).
- Analytics opinions (GA4 schemas, naming conventions)—we provide optional scaffolding only.
- Mobile SDKs (web only), SPA router integrations beyond “examples”.

## 3. Architecture at a glance
### Packages
**Core (framework-agnostic)**
- Responsibilities: create/claim the data layer; load one or more GTM containers exactly once; queue and flush pre-init pushes; support Consent Mode v2 updates; teardown/reset for tests; optional noscript string builder.
- Inputs: container id(s), data layer name, optional environment query (gtm_auth, gtm_preview), CSP nonce, custom host for advanced deployments (documented caveats).
- Outputs: data-layer push API; consent update API; lifecycle hooks.

**React adapter (optional)**
- Responsibilities: call core init on mount once (StrictMode-safe), provide trivial helpers to push events (e.g., pageviews on route change).
- Also provide a legacy wrapper for pre-hooks React.

**Next.js helpers (optional)**
- Responsibilities: pageview bridge for App Router; server utility for passing a CSP nonce; helper that returns the official noscript iframe markup for server layouts (string only, no client auto-injection).

### Design constraints
- Single shared data layer by default; support custom names as an advanced option (document risks of multiple layers). The data layer is the canonical contract in GTM.[^cite-gtm-contract]
- Default to Google’s host for the container script; allow custom host only for advanced setups (e.g., same-origin server-side tagging) and warn that standard GTM web containers expect the Google host.[^cite-sst]
- Provide a noscript iframe helper for server rendering, since Google recommends including it for users with JavaScript disabled.[^cite-noscript]

## 4. Functional requirements (FR)
- **FR-1 Initialization**
  - Accept one or more container IDs.
  - Create the data layer if missing; never overwrite an existing array.
  - Pre-push the standard “start” event semantics before network fetch (timing signal).
  - Inject exactly one script element per container ID; mark each deterministically for deduplication.
  - Support optional defer/async flags for script loading (default safe values).
- **FR-2 Data pushes**
  - Provide a push method that is safe pre- and post-init.
  - All pre-init pushes are queued and flushed in order once init completes.
  - Support a configurable data layer name (default “dataLayer”).
- **FR-3 Consent Mode v2**
  - Provide a minimal API to set or update consent signals that map 1:1 to Google’s parameters (ad_storage, analytics_storage, ad_user_data, ad_personalization).
  - Do not model a CMP; only expose setter semantics and allow consumers to plug in their consent provider.[^cite-consent]
- **FR-4 Environment & preview**
  - Allow appending arbitrary query params (e.g., gtm_auth, gtm_preview) to the container request for GTM environments and debugging.
- **FR-5 Noscript support**
  - Provide a pure function that returns the recommended noscript iframe markup as a string for server insertion near the opening body. No client runtime injection.[^cite-noscript]
- **FR-6 Teardown**
  - Provide a teardown that removes injected scripts and restores global state (for tests and microfrontends).
- **FR-7 Observability**
  - Optional pluggable logger interface for init, push, consent updates, and deduplication decisions; disabled by default.
- **FR-8 React adapter**
  - Modern adapter: hook-based init on mount, StrictMode-safe.
  - Legacy adapter: optional small wrapper that does the same with class lifecycle.
  - Neither adapter adds state; they are convenience shims only.
- **FR-9 Next.js helpers**
  - Client helper that observes pathname/search changes and pushes pageviews.
  - Server helper to pass CSP nonce down to the client init.
  - Server helper to emit the noscript iframe string.

## 5. Non-functional requirements (NFR)
- Size: core ≤ 3 kB (min+gzip).
- Dependencies: none in core; adapters depend only on the relevant framework types.
- Performance: init must not block main thread; data pushes must be O(1).
- Security: CSP nonce attribute support; no eval; no dynamic codegen.
- Compatibility: React 16.x through 19+ stable (adapter), Next App Router supported. Verify with a test matrix. React’s own guidance evolves—track official release notes to adjust examples, not core logic.[^cite-react]
- Accessibility: noscript fallback supported and documented.[^cite-noscript]
- Docs: copy-paste, task-based; examples for CSR, SSR, multi-container, consent, and debugging.

## 6. Acceptance criteria (Definition of Done)
- Init is idempotent across: double mount (StrictMode), hot reload, and multiple consumer calls.
- Exactly one script per container ID in the DOM after repeated inits.
- Pre-init pushes appear in data layer in FIFO order after init.
- Consent updates change behavior as specified by Google’s Consent Mode (verified with network request inspection and tag firing).[^cite-consent]
- Noscript helper emits the standard iframe markup that loads when JS is disabled. Verified by E2E with JS disabled.[^cite-noscript]
- Optional custom host path works for server-side tagging deployments; documentation clearly warns about standard GTM expectations.[^cite-sst]
- Works in React 16/17/18/19 with StrictMode enabled; Next App Router pageview example behaves on client navigations.
- 95%+ coverage in core, 85%+ in adapters; bundle size guard in CI.

## 7. Compatibility matrix (continuous validation)
- **Browsers:** latest Chrome, Firefox, Safari, Edge (desktop and mobile).
- **React:** 16.8+ (hooks) and legacy wrapper for 16.0–16.7 if needed; spot-check 17, 18, 19+.[^cite-react]
- **Frameworks:** non-React CSR apps (vanilla), React CSR apps, Next App Router SSR+CSR.
- **CSP:** strict policies with nonces applied to all injected scripts.

## 8. Privacy & compliance requirements
- Provide a neutral consent update API that maps to Google’s Consent Mode v2 parameters; document expected values and their effects with links to Google’s docs.[^cite-consent]
- Document regional behavior notes (EEA enforcement) and clarify that policy compliance and UI prompts are owned by the integrator, not this library.[^cite-consent]
- Document the implications of noscript (limited coverage but still valuable).[^cite-noscript]

## 9. Testing strategy
- **Unit (headless DOM)**
  - State machine: init → queue → flush; re-init dedupe; teardown resets.
  - URL composition for multiple containers and environment params.
  - CSP nonce attribute applied to injected nodes.
- **Integration (DOM)**
  - StrictMode double-mount results in one script per container.
  - Hot reload simulation does not duplicate scripts or lose data layer state.
  - Multi-container injection order is deterministic.
- **E2E (browser)**
  - Next App Router example: initial pageview event appears; client navigations push subsequent pageview events.
  - JS disabled scenario: noscript iframe loads GTM endpoint.[^cite-noscript]
  - Consent changes reflect in network behavior consistent with Consent Mode docs.[^cite-consent]
  - Advanced: custom host with server-side tagging domain validates the request path and first-party context.[^cite-sst]
- **Type tests**
  - Lock public API through compile-time tests; ensure no breaking API drift without semver major.
- **Quality gates**
  - Coverage thresholds enforced; size budget enforced; conventional commits + semantic release.

## 10. Documentation plan (structure and content)
**A. Landing page (5-minute promise)**
- What this is, and why it’s different (framework-agnostic core, tiny adapters).
- The “three steps” quickstart for CSR, SSR, and Consent Mode (no jargon).
- “If you only copy one section, copy this” checklist.

**B. Concepts**
- Data layer: what it is, why a single shared array matters; renaming safely.[^cite-gtm-contract]
- Consent Mode v2: what the four keys mean; when to call update; what it changes.[^cite-consent]
- Noscript: when and why; limitations; how to place it server-side.[^cite-noscript]
- Server-side tagging and custom domain overview; benefits and caveats.[^cite-sst]

**C. How-to recipes (task-based, copy-paste)**
- Initialize GTM (single container).
- Use multiple containers safely.
- Push pageviews on route changes (React SPA / Next).
- Send custom events into the data layer (GA4 e-commerce examples, abstracted).
- Update consent based on CMP signal flow.
- Add noscript for users with JS disabled.
- Use a custom domain with server-side tagging (advanced).
- Troubleshoot duplicates, CSP blocks, and missing events.

**D. Framework guides**
- Vanilla JS app, React CSR, Next App Router.
- Legacy React (no hooks) quick steps.

**E. Reference**
- Public API reference with parameter descriptions, defaults, and side-effects.
- Error messages and resolution checklist.

**F. FAQ**
- “Why only one data layer?”
- “Why didn’t you autoload pageviews?”
- “Can I self-host gtm.js?” (Explain standard expectations and server-side tagging alternative).[^cite-sst]

## 11. Example scenarios (step-by-step, no code)
- **CSR SPA minimum:** add the provider once at app root, initialize with your GTM ID, and record a pageview on each route change using your router’s “after navigation” hook.
- **Next SSR:** render the noscript iframe string near the start of the body on the server; pass a CSP nonce to the client; initialize once in a client-only provider; on pathname or search change, push a pageview event.
- **Consent Mode:** listen for your CMP’s “consent changed” event; translate to the four consent keys; call the consent update API; verify requests adopt limited or full behavior per Google’s docs.[^cite-consent]
- **Multiple containers:** supply an ordered list of container IDs; confirm only one data layer is used; ensure event pushes are visible to tags in each container.
- **Custom domain (advanced):** if using server-side tagging, configure a first-party domain for the tagging server; set the library’s host option to that domain; verify cookie behavior and request paths.[^cite-sst]

## 12. CI/CD and release management
- **Pipelines:** lint → unit → integration → E2E (Next example, CSP scenario) → bundle size check → publish dry-run.
- **Versioning:** semantic-release with conventional commits; “core” is the stability anchor—adapters can iterate faster.
- **Support policy:** keep examples aligned with the latest stable React, while guaranteeing “no-break” for React 16+. Track React release notes via the official blog and run the matrix monthly.[^cite-react]

## 13. Governance & ownership
- **Maintainers:** one “core” owner, one “docs” owner, and one “examples” owner.
- **Issue templates:** bug (with repro), feature request (with GTM use case), security (private).
- **Contribution guide:** how to add a new adapter in under an hour; how to write an E2E that proves behavior instead of mocking.

## 14. Risks & mitigations
- Duplicate script injection (StrictMode remounts): idempotent init; explicit DOM markers; E2E that double-mounts.
- CSP failures in prod only: add a mandatory E2E with CSP nonce enforcement that fails the build if blocked.
- Event loss before init: strict FIFO queue and flush; unit tests validate order.
- Multiple data layers cause chaos: default to one; clearly mark multi-layer as advanced with red-flag docs.
- Custom host misuse: document that standard GTM web containers expect Google host; explain server-side tagging path if a custom domain is required.[^cite-sst]
- React changes: keep adapter tiny; rely on browser APIs in core only; monitor React’s official blog for breaking notes.[^cite-react]

## 15. Milestones & rough LOE (complexity sizing)
- **M0 – Design sign-off:** API, docs outline, acceptance criteria frozen.
- **M1 – Core alpha:** init/queue/flush, multi-container, teardown; unit tests.
- **M2 – Consent Mode v2:** consent update API and tests.
- **M3 – Noscript & CSP:** SSR noscript string, CSP nonce handling; E2E with JS disabled.
- **M4 – React adapter:** modern + legacy wrapper; integration tests.
- **M5 – Next helpers:** pageview bridge; E2E with App Router and route changes.
- **M6 – Docs & examples:** CSR, SSR, consent, multi-container, troubleshooting.
- **M7 – 1.0 hardening:** size budgets, coverage gates, semantic-release, example repos green.

_(Use internal S/M/L/XL complexity sizing; previous estimates put this at L/XL to first stable.)_

## 16. Hand-off checklist for Codex
- Final API spec document (the call names, parameters, defaults, side-effects).
- Completed acceptance criteria list with “how we prove it” notes for each.
- Test plan doc with required unit, integration, and E2E scenarios (including JS-disabled run and CSP).
- Docs outline with assigned owners per page.
- Example app requirements: one CSR SPA, one Next App Router SSR+CSR, both wired into CI to run E2E.
- Governance file (owners, release process, support matrix).

---

[^cite-gtm-contract]: Google Tag Manager documentation on the data layer contract and container snippet behavior.
[^cite-consent]: Google Consent Mode v2 developer documentation describing consent parameters and effects.
[^cite-sst]: Google Tag Manager server-side tagging documentation covering custom domains and environment parameters.
[^cite-noscript]: Google Tag Manager recommendations for including noscript fallbacks for users with JavaScript disabled.
[^cite-react]: Official React release notes and support guidance covering versions 16.x through 19.
