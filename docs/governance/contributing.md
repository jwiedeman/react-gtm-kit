# Contributing workflow

The React GTM Kit workspace enforces shared linting, formatting, and commit standards to keep every package consistent.

## Formatting & linting

- Run `pnpm format:fix` to apply Prettier formatting across the repo. The root `.prettierrc.cjs` fans out to each package so editors can adopt the same defaults automatically.
- Run `pnpm lint` for ESLint coverage. Each package consumes the shared configuration at `config/eslint.base.cjs`, so linting rules stay aligned as we add adapters and examples.
- Run `pnpm typecheck` when you need a full TypeScript pass across the workspace. Packages can also execute `pnpm --filter <package> typecheck` for a focused sweep.

## Commit hygiene

- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) syntax. The `commitlint` hook validates the `<type>(<scope>): <subject>` pattern on every commit.
- Pre-commit hooks format staged files and run related tests automatically. Fix any reported issues before attempting the commit again.
- Prefer small, focused commits. When in doubt, split functionality changes and refactors into separate commits to simplify review.

## Recommended workflow

1. `pnpm install` – ensure tooling dependencies are available.
2. Implement your changes inside the relevant package or docs folder.
3. `pnpm lint` & `pnpm typecheck` – address any diagnostics.
4. `pnpm test` (or targeted package tests) – keep regression coverage healthy.
5. Stage files, then commit using a Conventional Commit message once the pre-commit hook succeeds.

## Support expectations & triage labels

- **Initial response:** Aim to triage new GitHub issues within two business days.
- **SLA targets:**
  - Production-impacting bugs: acknowledged within 48 hours; fix or mitigation within five business days.
  - Documentation or example gaps: acknowledged within three business days; resolution within two weeks.
  - Questions/usage help: acknowledged within three business days with pointers to docs or examples.
- **Labels:**
  - `type:bug`, `type:question`, `type:docs`, `type:enhancement` to categorize intake.
  - `priority:urgent`, `priority:normal`, `priority:low` to set expectations.
  - `needs-repro` when reproduction steps or logs are missing; `blocked` when waiting on upstream releases or decisions.
- Apply labels during triage so maintenance workflows and dashboards reflect current support load.
