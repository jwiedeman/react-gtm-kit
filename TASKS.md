# Task Tracker & Kanban

This file maintains the persistent planning board for the React GTM Kit project. Update task status and notes in-place as work progresses; never delete a task. Append new tasks instead of replacing existing entries so the project history remains auditable.

**Status definitions**
- **Backlog** – Planned work that has not yet started.
- **In Progress** – Actively being delivered.
- **Review** – Awaiting peer review, testing, or verification.
- **Blocked** – Requires external input or prerequisite completion.
- **Done** – Finished and documented.

| ID | Task | Status | Notes (last updated: 2025-11-05) |
| --- | --- | --- | --- |
| TK-001 | Consolidate charter, scope, architecture, and governance into README for single-source documentation. | Done | Captured full project brief, requirements, and governance in README refresh. |
| TK-002 | Freeze API surface and finalize design sign-off package (M0). | Backlog | Prep: reconfirm scope/non-goals in README with stakeholders;<br>Draft API signatures + lifecycle diagrams in `docs/design/api-signoff.md`;<br>Author governance/ownership matrix in `docs/governance/OWNERS.md`;<br>Record sign-off in `docs/design/DECISIONS.md`. |
| TK-003 | Implement core package alpha covering init/queue/flush, multi-container, teardown, and unit tests (M1). | Backlog | Tasks: scaffold `packages/core/` with build tooling;<br>Implement data layer manager, loader, queue, teardown utilities, logger;<br>Add Jest unit tests for init idempotency, FIFO queue, multi-container ordering, teardown;<br>Wire lint/test/build scripts in root. |
| TK-004 | Build Consent Mode v2 API with comprehensive tests (M2). | Backlog | Steps: extend core with type-safe `consent.ts` setters mapping Google keys;<br>Cover updates before/after init and network parameter composition in tests;<br>Document usage in `docs/how-to/consent.md`. |
| TK-005 | Deliver SSR noscript helper and CSP nonce handling with E2E coverage (M3). | Backlog | Steps: add noscript iframe generator utility;<br>Allow loader CSP nonce option for injected scripts;<br>Create Playwright E2E `e2e/csp-noscript.spec.ts` verifying nonce + noscript;<br>Document SSR/CSP setup in `docs/how-to/ssr.md`. |
| TK-006 | Ship React adapters (modern + legacy) with integration tests (M4). | Backlog | Plan: create `packages/react-modern/` hook/provider handling StrictMode double mount;<br>Create `packages/react-legacy/` HOC for class components;<br>Add Testing Library integration tests for StrictMode behavior;<br>Update examples to include CRA/Vite sample using adapters. |
| TK-007 | Publish Next.js helpers and App Router E2E scenario (M5). | Backlog | Plan: scaffold `packages/next/` with CSP nonce bridge, route listener, noscript export;<br>Build `examples/next-app/` exercising helpers across navigations;<br>Write Playwright E2E covering initial load + client transitions with dataLayer pushes. |
| TK-008 | Author task-based documentation and runnable examples (M6). | Backlog | Plan: set up docs site (Docusaurus/VitePress) with landing, concepts, how-to pages;<br>Produce runnable examples: vanilla CSR, React SPA, Next App Router, consent integration;<br>Integrate examples into CI smoke tests via npm scripts. |
| TK-009 | Complete hardening pass: coverage, size budgets, semantic-release wiring (M7). | Backlog | Plan: enforce coverage thresholds in Jest + CI;<br>Add bundle size check (≤3 kB gzip) via `size-limit`;<br>Configure GitHub Actions for lint/test/E2E/size + `semantic-release` pipeline;<br>Automate compatibility matrix (React versions, browsers) via scheduled workflow;<br>Prepare release notes template and dry-run publish. |
| TK-010 | Maintain compatibility matrix validation pipeline and monthly React release review cadence. | Backlog | Ongoing: draft maintenance checklist in `docs/governance/maintenance.md`;<br>Automate React release monitoring (RSS/API trigger);<br>Document support SLA + triage labels in `CONTRIBUTING.md`. |
