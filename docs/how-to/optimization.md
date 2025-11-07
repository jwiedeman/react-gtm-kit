# Keep React GTM Kit bundles lightweight

React GTM Kit promises tiny runtime footprints so you can drop the libraries into any
application without bloating first page loads. This guide explains how to monitor bundle
size, debug regressions, and keep budgets under control across the workspace packages.

## Run the automated checks

Use the workspace script to execute both runtime dependency and bundle size checks in a
single command:

```bash
pnpm run verify:lightweight
```

The script first validates that runtime dependency lists contain only the approved
packages (React adapters may depend on `@react-gtm-kit/core`, but nothing else). It then
runs [Size Limit](https://github.com/ai/size-limit) against the main entry point for each
package using minified **gzip** output. Budgets currently stand at:

- `@react-gtm-kit/core`: **3.5 kB**
- `@react-gtm-kit/react-modern`: **6.5 kB**
- `@react-gtm-kit/react-legacy`: **6.5 kB**
- `@react-gtm-kit/next`: **14.5 kB**

The CI pipeline executes the same script, so any regression will block the build.

## Investigate regressions

When Size Limit reports a failure:

1. Re-run the command with the `--why` flag to inspect the dependency graph:
   ```bash
   pnpm exec size-limit --why --config size-limit.config.cjs
   ```
2. Look for large additions (new polyfills, helper libraries, or expanded type exports).
3. Confirm that tree-shaking is working. All packages compile to ESM, so unused exports
   should be dropped—verify that new utilities do not execute side effects on import.
4. Audit dependency additions. Prefer sharing helpers within `@react-gtm-kit/core` over
   adding new third-party packages.

## Reducing bundle size

- **Avoid runtime utilities** when TypeScript or browser APIs suffice.
- **Gate optional features** behind explicit imports so consumers only pay for what they
  use.
- **Keep logging lightweight**: rely on the pluggable logger and strip debug helpers from
  production builds.
- **Share primitives**: if React adapters need new helpers, place them in the core package
  and import them—duplicate implementations cost bytes and maintenance time.

## Raising budgets (rare)

If a feature legitimately requires more bytes:

1. Document the rationale in the task tracker and reference performance measurements.
2. Update the relevant entry in `size-limit.config.cjs` with the new target.
3. Add a note in the release changelog so downstream teams understand the trade-off.
4. Secure approval from the maintainers listed in `docs/governance/OWNERS.md` before
   merging.

Following this workflow keeps React GTM Kit aligned with the project charter’s “dead
simple, production-grade” promise without sacrificing performance.
