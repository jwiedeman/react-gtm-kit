# Maintenance & compatibility cadence

Keep React GTM Kit healthy by pairing scheduled compatibility checks with clear ownership of release monitoring and support expectations.

## Compatibility matrix

| Surface                          | Supported versions   | Validation strategy                                                                                             | Notes                                                                                                   |
| -------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| React (modern + legacy adapters) | ^16.8, ^17, ^18, ^19 | Unit tests across adapters and shared core utilities; StrictMode + Suspense coverage in Testing Library suites. | Aligns with peer dependency ranges in `@jwiedeman/gtm-kit-react` and `@jwiedeman/gtm-kit-react-legacy`. |
| Next.js (App Router helpers)     | ^13.4, ^14, ^15      | Jest coverage for the App Router bridge plus Playwright SSR/CSP fixtures.                                       | Keep sample app dependencies within this window and validate against the latest patch each month.       |
| Tooling (Node.js)                | Active LTS releases  | CI runs on `ubuntu-latest` with Node 20. Bump the workflow matrix alongside Node LTS rollouts.                  | Ensure size-limit and runtime dependency checks stay green after upgrades.                              |

Update the matrix when peer dependency ranges change or when a new runtime ships.

## Monthly React release review

1. The scheduled **React release monitor** workflow (`.github/workflows/react-release-monitor.yml`) runs on the first of each month and on-demand.
2. The workflow compares the latest stable React release from GitHub against `config/react-release-baseline.json`.
3. If a newer version is detected, the workflow fails with upgrade instructions. Refresh the compatibility matrix, run smoke tests, and bump `latestKnown` once validation passes.

## Maintenance checklist

- [ ] Review React, Next.js, and Node.js release notes for breaking changes that affect adapters or build tooling.
- [ ] Run `pnpm lint`, `pnpm test`, and `pnpm run verify:lightweight` to confirm size and quality gates remain satisfied after dependency bumps.
- [ ] Refresh example app dependencies (React, Next.js, Vite) and rerun `pnpm run examples:smoke` if changes land.
- [ ] Update `docs/how-to/ssr.md` and related guides if CSP or SSR recommendations evolve.
- [ ] Record outcomes (pass/fail, blockers, actions) in the risk log when maintenance uncovers regressions.
