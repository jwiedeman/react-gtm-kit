# Tracking scenario matrix

This matrix enumerates the Google Tag Manager event flows that React GTM Kit must
support across milestones. It complements the API sign-off by mapping concrete
tracking requirements to examples, consent expectations, and validation steps so
stakeholders can quickly confirm coverage.

## How to read this document

- **Scenario** – Human-readable name for the tracking flow.
- **Events & payloads** – Canonical `dataLayer` pushes (structured for GA4-style
  analytics) that must be emitted. Additional parameters are allowed when teams
  extend instrumentation.
- **Consent dependency** – Whether the scenario requires prior consent or may
  run under denied storage. Reference consent presets in
  `@react-gtm-kit/core/consent` when wiring examples.
- **Surfaces** – Where the scenario is exercised (examples, adapters, server
  relay). Each surface should expose the same semantics even if the UI differs.
- **Validation** – Manual or automated checks required for sign-off. Prefer
  automation when feasible (Playwright, smoke scripts, Jest).
- **Milestone** – The roadmap target from the README to track sequencing.

## Scenario catalog

| Scenario                       | Events & payloads                                                                                                     | Consent dependency                                                                                       | Surfaces                                                                                | Validation                                                                                                             | Milestone                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Baseline page view**         | `{ event: 'page_view', page_path, page_title }` pushed on initial load and subsequent navigations.                    | Allowed under denied analytics storage; defer marketing tags until consent granted.                      | Vanilla CSR, React Strict Mode, Next App Router.                                        | Jest integration for router helpers, Playwright navigation test (`e2e/tests/next-app.spec.ts`), smoke build snapshots. | M1 (core init + queue), M4/M5 (adapters & Next). |
| **Marketing CTA click**        | `{ event: 'cta_click', cta_label, page_section }` for primary buttons.                                                | Requires consent when analytics storage is denied; wrap behind consent hooks in adapters.                | Vanilla CSR, React Strict Mode, React Legacy.                                           | Unit test ensuring push helper accepts custom payloads; Testing Library click assertions in React examples.            | M1 (event helpers) & M4 (React adapters).        |
| **Checkout funnel**            | `{ event: 'begin_checkout', value, currency }` and follow-up `{ event: 'purchase', transaction_id, items[] }`.        | Requires analytics storage and ad_user_data when remarketing tags fire; default to denied until granted. | React Strict Mode pricing route, Next App Router `/checkout` flow, Server relay sample. | Example smoke snapshots to confirm payload shape, consent banner gating verified in Playwright after opt-in.           | M2 (consent) & M5 (Next helpers).                |
| **Lead form submission**       | `{ event: 'generate_lead', lead_type, metadata }` fired from marketing pages or modals.                               | Allowed with denied analytics storage if anonymised; include gating toggle for PII fields.               | React Legacy example contact form, Next App Router marketing page.                      | Unit coverage for `pushEvent` payload validation; manual QA checklist for GTM Preview screenshot.                      | M4 (legacy adapter) & M5 (Next).                 |
| **Consent defaults & updates** | `[ 'consent', 'default' \| 'update', state, options? ]` tuples seeded before init and updated from UI.                | Always required; defaults must run before first event.                                                   | All examples (consent banner, toggle controls), server relay for persistence.           | Jest coverage for queue ordering, Playwright consent toggles, cookie snapshot comparison.                              | M2 (Consent Mode v2).                            |
| **Server relay forwarding**    | Node relay forwards `{ event, ... }` payloads to GTM HTTP endpoint with consent metadata.                             | Mirrors client consent; ensure denied states prevent restricted parameters.                              | `examples/server`, planned full-stack web example (TK-056).                             | Unit tests on relay normalization, smoke script `node --check server.mjs`, integration pairing once frontend lands.    | M5 (server helper) & M6 (full-stack demo).       |
| **Noscript fallback**          | `<noscript><iframe src="https://.../ns.html?id=...&l=dataLayer"></iframe></noscript>` served for JS-disabled clients. | Allowed irrespective of consent; document reduced capabilities.                                          | Next App Router layout helper, SSR how-to guide.                                        | Playwright SSR CSP test with JS disabled, visual diff confirming iframe markup.                                        | M3 (SSR/CSP).                                    |

## Acceptance checklist

1. Each surface listed above links to runnable code with clear README
   instructions.
2. Consent gating rules are mirrored between client and server helpers.
3. QA artifacts (tests, smoke scripts, or manual checklists) remain referenced
   from the scenario rows so regressions surface quickly.
4. Updates to GTM or Consent Mode requirements must revise this matrix and note
   the change in `docs/design/DECISIONS.md`.

## Ownership

- **Primary owner:** Core engineering.
- **Reviewers:** DX, Analytics, Privacy.
- **Update cadence:** Revisit before each milestone exit and whenever a new
  tracking scenario or consent rule is introduced.
