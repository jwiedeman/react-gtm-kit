# GTM-Kit Release Process

This document outlines the release process, versioning strategy, and quality gates for GTM-Kit.

---

## Table of Contents

- [Versioning Strategy](#versioning-strategy)
- [Pre-Release Checklist](#pre-release-checklist)
- [Release Process](#release-process)
- [Post-Release Verification](#post-release-verification)
- [Rollback Procedure](#rollback-procedure)
- [Hotfix Process](#hotfix-process)

---

## Versioning Strategy

GTM-Kit follows [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

### Version Bumps

| Change Type                        | Version Bump | Example       |
| ---------------------------------- | ------------ | ------------- |
| Breaking API changes               | MAJOR        | 1.0.0 → 2.0.0 |
| New features (backward compatible) | MINOR        | 1.0.0 → 1.1.0 |
| Bug fixes (backward compatible)    | PATCH        | 1.0.0 → 1.0.1 |

### Package Version Synchronization

All packages in the monorepo **MUST** have the same version number:

```json
// packages/core/package.json
{ "version": "1.1.6" }

// packages/react-modern/package.json
{ "version": "1.1.6" }

// packages/vue/package.json
{ "version": "1.1.6" }
// ... etc
```

### Pre-Release Versions

For testing before official release:

```
1.2.0-beta.1
1.2.0-rc.1
```

---

## Pre-Release Checklist

### Code Quality

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No `console.log` statements in production code
- [ ] No `TODO` or `FIXME` comments for this release

### Documentation

- [ ] CHANGELOG.md updated with all changes
- [ ] README.md updated if API changed
- [ ] API documentation updated
- [ ] Migration guide written (for breaking changes)

### Testing

- [ ] Unit tests: 90%+ coverage
- [ ] E2E tests: All passing
- [ ] Manual testing in example apps
- [ ] Tested in all supported frameworks

### Bundle Verification

- [ ] All packages within size limits (`pnpm size`)
- [ ] Tree-shaking works correctly
- [ ] No unexpected dependencies bundled

### Security

- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [ ] Dependencies up to date
- [ ] No secrets in code

---

## Release Process

### Step 1: Prepare Release Branch

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create release branch (optional for minor/patch)
git checkout -b release/v1.2.0
```

### Step 2: Update Version Numbers

```bash
# Use the version bump script
pnpm version:bump 1.2.0

# Or manually update all package.json files
# Ensure all packages have the same version
```

### Step 3: Update CHANGELOG

Add entry to CHANGELOG.md:

```markdown
## [1.2.0] - 2026-01-21

### Added

- New feature X
- Support for Y

### Changed

- Updated behavior of Z

### Fixed

- Bug in A
- Issue with B

### Security

- Updated dependency C to address CVE-XXXX
```

### Step 4: Run Full Test Suite

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Check bundle sizes
pnpm size

# Run security audit
pnpm audit
```

### Step 5: Build All Packages

```bash
# Clean and rebuild
pnpm clean
pnpm build

# Verify builds
ls packages/*/dist
```

### Step 6: Prepare for Publishing

```bash
# Run the prepare-publish script
# This replaces workspace:* with actual versions
node scripts/prepare-publish.mjs
```

### Step 7: Create Git Tag

```bash
# Commit version changes
git add .
git commit -m "chore(release): 1.2.0"

# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0"

# Push to remote
git push origin main --tags
```

### Step 8: Publish to npm

```bash
# Publish all packages
pnpm publish -r --access public

# Or publish individually
cd packages/core && npm publish --access public
cd packages/react-modern && npm publish --access public
# ... etc
```

### Step 9: Create GitHub Release

1. Go to GitHub Releases
2. Click "Create a new release"
3. Select the tag (v1.2.0)
4. Title: "v1.2.0"
5. Body: Copy from CHANGELOG.md
6. Publish release

---

## Post-Release Verification

### Verify npm Packages

```bash
# Check packages are published
npm view @jwiedeman/gtm-kit versions
npm view @jwiedeman/gtm-kit-react versions
# ... etc

# Verify latest version
npm view @jwiedeman/gtm-kit version
```

### Smoke Test Installation

```bash
# Create temp directory
mkdir /tmp/gtm-kit-test && cd /tmp/gtm-kit-test

# Initialize project
npm init -y

# Install packages
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react

# Verify import works
node -e "const gtm = require('@jwiedeman/gtm-kit'); console.log(Object.keys(gtm));"
```

### Test in Example Apps

```bash
# Update example apps to use published packages
cd examples/react-app
npm install @jwiedeman/gtm-kit@latest @jwiedeman/gtm-kit-react@latest
npm run build
npm run dev
# Test manually
```

### Verify Documentation

- [ ] npm package pages show correct README
- [ ] Version badge updated
- [ ] API documentation accessible

---

## Rollback Procedure

If a critical issue is discovered after release:

### Option 1: Deprecate and Release Patch

```bash
# Deprecate the problematic version
npm deprecate @jwiedeman/gtm-kit@1.2.0 "Critical bug, please use 1.2.1"

# Create and publish fix
git checkout -b hotfix/v1.2.1
# ... fix the issue ...
pnpm version:bump 1.2.1
pnpm publish -r --access public
```

### Option 2: Unpublish (within 72 hours)

```bash
# Only possible within 72 hours of publish
# Only for packages with no dependents
npm unpublish @jwiedeman/gtm-kit@1.2.0
```

**Note:** Unpublishing is generally discouraged. Prefer deprecation.

### Option 3: Revert Git and Re-release

```bash
# Revert the release commit
git revert HEAD

# Delete the tag
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0

# Fix the issue
# ... make changes ...

# Re-release with same version
git tag -a v1.2.0 -m "Release v1.2.0 (fixed)"
git push origin main --tags
pnpm publish -r --access public
```

---

## Hotfix Process

For urgent fixes to released versions:

### Step 1: Create Hotfix Branch

```bash
# From the release tag
git checkout v1.2.0
git checkout -b hotfix/v1.2.1
```

### Step 2: Make Fix

```bash
# Make the minimal fix needed
# Add tests for the fix
# Update CHANGELOG
```

### Step 3: Test

```bash
pnpm test
pnpm build
```

### Step 4: Release Hotfix

```bash
# Bump patch version
pnpm version:bump 1.2.1

# Commit and tag
git commit -am "fix: critical bug in X"
git tag -a v1.2.1 -m "Hotfix v1.2.1"

# Publish
pnpm publish -r --access public

# Merge back to main
git checkout main
git merge hotfix/v1.2.1
git push origin main --tags
```

---

## Quality Gates

### Automated Checks (CI)

These must pass before release:

| Check       | Command         | Requirement      |
| ----------- | --------------- | ---------------- |
| TypeScript  | `pnpm build`    | No errors        |
| Unit Tests  | `pnpm test`     | 100% pass        |
| E2E Tests   | `pnpm test:e2e` | 100% pass        |
| Linting     | `pnpm lint`     | No errors        |
| Bundle Size | `pnpm size`     | Within limits    |
| Security    | `pnpm audit`    | No high/critical |

### Manual Checks

- [ ] Reviewed by at least one maintainer
- [ ] CHANGELOG entry reviewed
- [ ] Breaking changes documented
- [ ] Example apps tested manually

---

## Release Schedule

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly (if features ready)
- **Major releases**: Announced in advance with migration guide

---

## Communication

### Pre-Release

- Announce planned major releases 2 weeks in advance
- Share beta versions for testing
- Collect feedback from users

### Post-Release

- Update GitHub release notes
- Post on social media (if applicable)
- Respond to issues/questions

---

## Troubleshooting

### "Cannot publish - version already exists"

```bash
# Check existing versions
npm view @jwiedeman/gtm-kit versions

# Bump to next available version
pnpm version:bump 1.2.1
```

### "workspace:\* not replaced"

```bash
# Run prepare-publish script
node scripts/prepare-publish.mjs

# Verify package.json dependencies
cat packages/react-modern/package.json | grep gtm-kit
```

### "Build failed"

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### "Tests failing"

```bash
# Run specific test file
pnpm -F @jwiedeman/gtm-kit test -- src/__tests__/client.spec.ts

# Run with verbose output
pnpm test -- --verbose
```

---

_Last updated: 2026-01-21_
