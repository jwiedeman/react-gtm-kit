# Team rituals and cadence

This document captures the recurring ceremonies that keep the React GTM Kit team aligned across engineering, product, and compliance.

## Weekly standups

- **When:** Mondays and Thursdays @ 10:00 PT (30 minutes).
- **Who:** Core engineering, DX/docs, product owner, privacy counsel (optional), release manager.
- **Agenda:**
  - Blockers by workstream (core, adapters, Next helpers, docs, governance).
  - Review changes to `TASKS.md` status updates since the previous meeting.
  - Call out upcoming releases, dependencies on privacy/legal, and E2E coverage gaps.
- **Async fallback:** If a holiday or release freeze lands on a standup day, post updates in `#react-gtm-kit-core` using the format: _Status / Risks / Next steps_.

## Milestone demos

- **When:** Every other Wednesday @ 11:00 PT (45 minutes), aligned to milestone checkpoints (M0–M7).
- **Who:** Core + adapters engineers, DX/docs, product owner, PMM/devrel, privacy/security reps.
- **Content:**
  - Demo new capabilities (e.g., Consent Mode v2 updates, SSR helpers, examples) against acceptance criteria.
  - Validate tracking scenarios against the matrix in `docs/design/tracking-matrix.md`.
  - Capture follow-ups directly in `TASKS.md` and tag owners.

## Release readiness review

- **When:** Friday of the release week @ 12:00 PT (60 minutes).
- **Checklist:**
  - Privacy sign-off recorded (per `docs/governance/privacy.md` guidance) and risks updated in `docs/governance/risk-log.md`.
  - CI status (lint/test/e2e/size) and semantic-release dry run results.
  - Example smoke runs (`pnpm run examples:smoke`) outcomes.
  - Support docs and release notes staged.
- **Decision:** Go/no-go captured in `docs/design/DECISIONS.md` with responsible approvers.

## Communication channels and escalation

- **Slack:**
  - `#react-gtm-kit-core` – day-to-day engineering, standup async updates, incident chatter.
  - `#react-gtm-kit-launch` – milestone planning, demo invites, stakeholder updates.
- **Email:** `gtm-kit@company.test` distribution for exec/stakeholder summaries and legal approvals.
- **Escalation path:** Core engineering → DX/docs → Product owner → Privacy/Security counsel → Executive sponsor.
- **Office hours:** Weekly drop-in on Tuesdays @ 14:00 PT hosted by DX for docs/examples questions.
