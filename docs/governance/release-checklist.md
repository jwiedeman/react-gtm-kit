# Release readiness checklist

Use this checklist before shipping any tagged release. Every step should pass or be
acknowledged with an owner, date, and follow-up issue.

## Planning

- [ ] Confirm milestone scope and outstanding bugs in the task tracker (`TASKS.md`).
- [ ] Align on semantic version (major/minor/patch) based on API changes.
- [ ] Draft release notes in `docs/releases/` including upgrade guidance and breaking
      changes, if any.

## Code health

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm typecheck`
- [ ] `pnpm run verify:lightweight` (runtime deps + size-limit budgets)
- [ ] `pnpm e2e:install && pnpm e2e:test`
- [ ] `pnpm examples:smoke`
- [ ] Verify Jest coverage meets enforced thresholds (see coverage report in CI artifacts).
- [ ] Confirm bundle artifacts from `pnpm -r build` include ESM and CJS outputs with
      correct package exports.

## Consent & privacy validation

- [ ] Validate consent banner flows in the Next.js example locally (accept/deny/update).
- [ ] Confirm consent cookies respect default + updated states across page refreshes.
- [ ] Re-run privacy checklist in `docs/governance/privacy.md` for any regulation updates.
- [ ] Archive consent evidence (defaults + first user update with timestamps/regions) alongside
      release artifacts per `docs/governance/dpia.md`.
- [ ] Confirm DPIA summary and refresh date are recorded with owners.

## Documentation

- [ ] `pnpm docs:build`
- [ ] Ensure new guides are linked from the VitePress navigation and sidebar.
- [ ] Update `README.md` quickstart or examples if public APIs changed.
- [ ] Snapshot screenshots or logs for new how-to guides (attach to PR or docs as needed).

## Release mechanics

- [ ] Run `pnpm release:dry-run` and ensure semantic-release plans the expected version bump.
- [ ] Check that `CHANGELOG.md` includes the new entry after the dry run.
- [ ] Verify npm dist-tags (`latest`, `next`) remain correct after release (post-deploy step).
- [ ] Announce release via agreed communication channels (Slack, mailing list, social posts).

## Post-release follow-up

- [ ] Monitor CI/CD and runtime telemetry dashboards for regressions in the first 24 hours.
- [ ] Close or move completed tasks in `TASKS.md` to "Done" with final notes.
- [ ] File follow-up tasks for deferred items or newly discovered issues.
