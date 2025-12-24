# Release process

GTM Kit uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate versioning, changelog generation, and package publishing. This section outlines how maintainers prepare releases and what automation expects from the repository configuration.

## Branch strategy

- **`main`** – Source of truth for stable releases. Every merge must follow the Conventional Commits specification so semantic-release can infer the next version number.
- **`next`** – Optional prerelease channel. Commits merged here will produce `rc` builds with the same automation, enabling staged validation before promoting to `main`.

Semantic-release applies tags in the form of `vX.Y.Z` to match the generated versions. Prerelease tags append the prerelease identifier (for example, `v1.2.0-rc.1`).

## Required automation secrets

Configure the following repository secrets so GitHub Actions can publish artifacts:

| Secret                | Purpose                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN`           | Authenticates `npm publish` for each workspace package. Generate from the npm account that owns the `@jwiedeman/gtm-kit-*` scope and grant automation publish rights. |
| `GH_TOKEN` (optional) | Overrides the default `GITHUB_TOKEN` when you need cross-repo release permissions. The default token is sufficient for creating GitHub releases in most cases.        |

> **Tip:** Update the npm tokens whenever maintainers rotate their credentials. Semantic-release fails fast if authentication is missing, preventing partial releases.

## Local verification (dry run)

Run a dry run to confirm commit history, changelog output, and publishing targets before merging release commits:

```bash
pnpm run release:dry-run
```

The dry run prints the calculated next version, generated notes, and which packages would publish, without modifying the repository or creating tags.

## CI workflow

GitHub Actions provides two release entry points:

1. **Dry run on pull requests** – Ensures incoming changes do not break the release pipeline and keeps maintainers aware of the version that would be cut after merge.
2. **Publish on pushes to `main`** – Builds the workspace, runs semantic-release, publishes packages to npm, commits generated changelog updates, and creates GitHub releases.

### Release checklist

Before triggering a production release ensure:

- `pnpm lint`, `pnpm test`, and `pnpm build` pass in CI.
- All relevant documentation and examples have been updated for the release scope.
- Consent, SSR, and adapter smoke tests are green so consumers receive a stable build.
- The release notes capture key highlights and breaking changes.

If any step fails, fix the underlying issue and rerun the workflow. Semantic-release is idempotent: rerunning after fixes will produce the same version unless additional commits land.

## Manual invocation

Use the workflow dispatch action when you need to republish or troubleshoot automation. The workflow prompts for the branch to release from and runs the same steps as a push to `main`.

## Troubleshooting

- **Authentication errors** – Verify `NPM_TOKEN` is present and scoped correctly. A 403 from npm usually means the token lacks publish rights.
- **Missing changelog updates** – Confirm commits follow Conventional Commit syntax (`fix:`, `feat:`, `chore:`, etc.). Nonconformant commits are ignored when determining release notes.
- **Package build failures** – The workflow executes `pnpm build` prior to publishing. Inspect the build logs to identify which workspace needs attention.

Document release-specific learnings here as new scenarios arise so future releases stay smooth.
