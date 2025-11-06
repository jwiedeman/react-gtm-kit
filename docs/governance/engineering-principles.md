# Engineering principles

React GTM Kit keeps the core package lightweight and dependency-free so that teams can drop it into any runtime without pulling in unexpected code. Adapters add just enough glue to integrate with React and Next.js while deferring all heavy lifting to the shared core.

## Lightweight guarantees

- **Zero runtime dependencies in the core.** The core package ships only TypeScript output and relies on the platform primitives that exist in every browser. A repository script (`pnpm run verify:runtime-deps`) checks that no unintended dependencies slip into package manifests.
- **Tight bundle budgets.** Size limits guard against regressions across packages. `pnpm run size` uses Size Limit with esbuild to calculate minified + brotli bundles for the most common entry points. Budgets start at 3 kB for the core library, 6 kB for the React adapters, and 12 kB for the Next helpers; adjust only with explicit approval and documented rationale.
- **Shared primitives.** React adapters and Next helpers depend solely on `@react-gtm-kit/core` plus their framework peers via peer dependencies. Runtime behavior lives in the core so that adapters remain thin wrappers.

## Operational workflow

1. Run `pnpm run verify:lightweight` locally or in CI to execute both dependency and bundle size checks.
2. Investigate any failures immediately—runtime dependency additions or budget increases require a design discussion.
3. When new entry points are added, extend `size-limit.config.cjs` with the new file and a documented budget.

These rules ensure we maintain the "dead-simple" charter outlined in the README while leaving room for future enhancements without surprising consumers with weight or transitive dependencies.
