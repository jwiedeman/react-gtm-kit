# Security Review Summary

_Last updated: 2025-12-01_

This document captures the security posture of the React GTM Kit workspace. Update it after each dependency audit, threat modeling session, or major architectural change.

## Scope

- `packages/core` – Browser client responsible for data layer management, script injection, consent updates, teardown.
- `packages/react-modern` / `packages/react-legacy` – React bindings that wrap the core client for modern and legacy components.
- `packages/next` – Next.js helpers for App Router, CSP nonce propagation, and SSR noscript markup.
- Example and test applications under `examples/` and `e2e/` used for validation.

## Dependency health

- **Command:** `pnpm audit --prod`
- **Result:** No known vulnerabilities found (run locally on 2025-11-07).
- **Action:** Keep monthly reminders to rerun the audit and capture findings here. Dependabot now monitors npm workspaces and GitHub Actions weekly with scoped chore commits.

## Threat model highlights

1. **Script injection integrity**
   - Risk: Attackers modifying the GTM container host or injecting malicious scripts.
   - Mitigation: Default host locked to Google. Optional overrides require explicit configuration. Script manager copies nonce attributes to comply with strict CSP policies.
2. **Data layer poisoning**
   - Risk: External scripts pushing unexpected objects leading to analytics corruption.
   - Mitigation: Encourage teams to namespace events; future enhancement could include runtime validation hooks for enterprise adopters.
3. **Consent bypass**
   - Risk: Consent updates mis-ordered, enabling tracking before approval.
   - Mitigation: Pre-init queue stores consent defaults; integration tests cover ordering. Provide documentation emphasising CMP integration checks.

## Operational controls

- Versioned releases follow semantic versioning with automated changelog generation (planned via `semantic-release`).
- CI pipeline must run lint, unit, integration, Playwright, and size-limit checks before publish.
- Release checklist should confirm CSP nonce coverage, noscript rendering, and consent flows.

## Outstanding actions

- [x] Wire automated Dependabot alerts and document triage SLA. _(2025-12-01: Added weekly npm + GitHub Actions checks in `.github/dependabot.yml`; SLA captured in `SECURITY.md`.)_
- [x] Add security contact information and disclosure policy to `SECURITY.md` (future task). _(2025-12-01: Published disclosure guidance with security@react-gtm-kit.dev contact and response targets.)_
- [ ] Evaluate adding Subresource Integrity (SRI) hashes when custom GTM hosts are in use.

Track progress of the above items in `TASKS.md` or dedicated backlog tickets.
