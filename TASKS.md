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
| TK-002 | Freeze API surface and finalize design sign-off package (M0). | Backlog | Requires confirmation from core, docs, and examples owners. |
| TK-003 | Implement core package alpha covering init/queue/flush, multi-container, teardown, and unit tests (M1). | Backlog | Depends on TK-002 completion. |
| TK-004 | Build Consent Mode v2 API with comprehensive tests (M2). | Backlog | Requires TK-003. |
| TK-005 | Deliver SSR noscript helper and CSP nonce handling with E2E coverage (M3). | Backlog | Requires TK-003. |
| TK-006 | Ship React adapters (modern + legacy) with integration tests (M4). | Backlog | Requires TK-003. |
| TK-007 | Publish Next.js helpers and App Router E2E scenario (M5). | Backlog | Requires TK-003 and TK-006. |
| TK-008 | Author task-based documentation and runnable examples (M6). | Backlog | Requires TK-003 through TK-007. |
| TK-009 | Complete hardening pass: coverage, size budgets, semantic-release wiring (M7). | Backlog | Requires TK-003 through TK-008. |
| TK-010 | Maintain compatibility matrix validation pipeline and monthly React release review cadence. | Backlog | Ongoing operational task post-initial release. |
