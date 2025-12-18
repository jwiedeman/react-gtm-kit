# Launch Guide: Publishing react-gtm-kit to NPM

This guide walks you through launching `@react-gtm-kit/*` packages on NPM and building initial traction organically without marketing spend.

---

## Pre-Launch Checklist

### 1. NPM Organization Setup

```bash
# Create the npm organization (one-time)
npm login
npm org create react-gtm-kit
```

You'll publish packages under the `@react-gtm-kit` scope:
- `@react-gtm-kit/core`
- `@react-gtm-kit/react-modern`
- `@react-gtm-kit/react-legacy`
- `@react-gtm-kit/next`

### 2. Repository Configuration

Ensure your GitHub repo has:

- [ ] **Public visibility** - Required for organic discovery
- [ ] **Good README** - Already done ✅
- [ ] **MIT License** - Already done ✅
- [ ] **Issue templates** - Set up in `.github/ISSUE_TEMPLATE/`
- [ ] **Contributing guide** - Reference `docs/governance/`

### 3. NPM Token Setup

For automated releases via CI:

```bash
# Generate an automation token (not publish token)
npm token create --cidr-whitelist ""

# Add to GitHub repo secrets as NPM_TOKEN
```

---

## Publishing

### Option A: Manual First Release

For the initial 1.0.0 release, manual publishing gives you control:

```bash
# 1. Clean build
pnpm clean
pnpm install
pnpm build

# 2. Run all quality gates
pnpm test
pnpm lint
pnpm typecheck
pnpm size

# 3. Verify package contents before publishing
cd packages/core && npm pack --dry-run
cd ../react-modern && npm pack --dry-run
cd ../react-legacy && npm pack --dry-run
cd ../next && npm pack --dry-run
cd ../..

# 4. Publish (in dependency order)
cd packages/core && npm publish --access public
cd ../react-modern && npm publish --access public
cd ../react-legacy && npm publish --access public
cd ../next && npm publish --access public
```

### Option B: Automated Release (Post-1.0)

The repo is configured with semantic-release. After the first manual release:

```bash
# Dry run to preview
pnpm release:dry-run

# Actual release (usually via CI on main branch merge)
pnpm release
```

---

## Building Traction (No Marketing)

### Strategy: Be Discoverable Where Developers Already Are

#### 1. GitHub Discoverability

**Topics** - Add these to your repo:
```
google-tag-manager, gtm, react, nextjs, analytics,
consent-mode, ga4, typescript, hooks
```

**Good First Issues** - Label easy issues to attract contributors:
- Documentation improvements
- Example additions
- Type improvements

#### 2. Answer Questions (Don't Spam)

Monitor and genuinely help on:
- **Stack Overflow**: Tags `google-tag-manager`, `react`, `next.js`, `google-analytics-4`
- **Reddit**: r/reactjs, r/nextjs, r/webdev, r/analytics
- **Discord**: Reactiflux, Next.js Discord

**The Rule**: Only mention your library if it genuinely solves the asker's problem. Build reputation first.

#### 3. Issue Triage Workflow

When users report issues:

```
1. Acknowledge within 24 hours (even if just "looking into it")
2. Label appropriately: bug, enhancement, question, good-first-issue
3. Ask clarifying questions if needed
4. Fix or provide workaround
5. Thank contributor and close
```

**Labels to create:**
- `bug` - Something isn't working
- `enhancement` - New feature request
- `question` - Usage questions
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Docs improvements
- `wontfix` - Won't be worked on

#### 4. Documentation as Marketing

Your docs site (`pnpm docs:dev`) should be:
- **Indexed by Google** - Deploy to GitHub Pages or Vercel
- **Copy-paste friendly** - Every code block should work
- **Task-focused** - "How to do X" not "API reference for Y"

Deploy docs:
```bash
pnpm docs:build
# Deploy docs/.vitepress/dist to your hosting
```

#### 5. Changelog as Content

Each release is a mini blog post. Write changelogs that:
- Explain **why** changes matter
- Link to issues/discussions that drove the change
- Thank contributors by GitHub username

---

## Monitoring Traction

### NPM Stats
- https://npm-stat.com/charts.html?package=@react-gtm-kit/core
- https://npmtrends.com/@react-gtm-kit/core

### GitHub Insights
- Stars, forks, traffic in repo Insights tab
- Issue/PR velocity

### Search Rankings
- Google: "react google tag manager"
- NPM search: "react gtm"

---

## Issue Management

### Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report something that isn't working
labels: bug
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Install '...'
2. Configure '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment**
- @react-gtm-kit/core version:
- @react-gtm-kit/react-modern version:
- React version:
- Next.js version (if applicable):
- Browser:

**Additional context**
Code snippets, screenshots, etc.
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest an idea
labels: enhancement
---

**Problem**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Examples, mockups, related issues.
```

---

## Responding to Issues

### Bug Reports

```markdown
Thanks for reporting this! I can reproduce it.

**Root cause**: [explanation]

**Fix**: PR #XX addresses this. Should be in the next release.

**Workaround** (until then):
[code snippet]
```

### Feature Requests

```markdown
Interesting idea! Let me think through the implications:

**Pros**:
- [benefit]

**Concerns**:
- [tradeoff]

Would you be interested in contributing a PR for this? Happy to provide guidance.
```

### Questions

```markdown
Good question! Here's how to do that:

```typescript
// example code
```

I've also added this to the docs: [link]
```

---

## Release Cadence

Recommended schedule:
- **Patch releases** (0.1.x): As needed for bug fixes
- **Minor releases** (0.x.0): Monthly for new features
- **Major releases** (x.0.0): When breaking changes are necessary (rare)

---

## Success Metrics (First 6 Months)

| Metric | Target |
|--------|--------|
| Weekly NPM downloads | 500+ |
| GitHub stars | 100+ |
| Open issues (avg) | < 10 |
| Issue response time | < 48 hours |
| Contributors | 5+ |

---

## Quick Commands Reference

```bash
# Development
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm typecheck        # Type check
pnpm size             # Check bundle sizes

# Documentation
pnpm docs:dev         # Local docs server
pnpm docs:build       # Build docs for deployment

# Release
pnpm release:dry-run  # Preview release
pnpm release          # Publish release

# Verify before release
pnpm clean && pnpm install && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm size
```

---

## Getting Your First Users

1. **Use it yourself** - Dogfood in your own projects
2. **Tell colleagues** - Word of mouth in your network
3. **Open source projects** - Offer to help integrate in React/Next.js projects that need GTM
4. **Blog posts** - Write about GTM patterns, link to library naturally
5. **Conference talks** - If you speak, include it in analytics/React talks

The goal is **genuine helpfulness**. If the library solves real problems well, users will find it and recommend it.

---

## Support Channels

Set up (in order of priority):
1. **GitHub Issues** - Primary support channel
2. **GitHub Discussions** - Q&A and ideas
3. **Discord** (optional) - Community chat if traction grows

Start with just Issues. Add more channels only when volume justifies it.
