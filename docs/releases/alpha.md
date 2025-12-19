# Alpha Release Notes

## Overview

The alpha release of **GTM Kit** delivers a complete set of 10 packages that make it easy to add Google Tag Manager to any JavaScript application. This milestone provides production-ready adapters for React, Vue, Next.js, Nuxt, Svelte, SolidJS, and Remix—plus a zero-dependency core and an interactive CLI.

## What's Included

### Core client (`@jwiedeman/gtm-kit`)

- **3.7 KB gzipped** with zero runtime dependencies
- Idempotent initialization that accepts single or multiple container IDs
- Pre-init event queueing with FIFO flush semantics
- Consent Mode v2 helpers with typed setters and built-in presets (`eeaDefault`, `allGranted`, `analyticsOnly`)
- Noscript iframe builder for SSR environments
- CSP nonce support for Content Security Policy compliance
- Custom data layer name support

### React adapters

- `@jwiedeman/gtm-kit-react` — Provider + hooks, StrictMode-safe, Suspense-compatible (React 16.8+)
- `@jwiedeman/gtm-kit-react-legacy` — HOC for class components with automatic lifecycle cleanup

### Meta-framework packages

- `@jwiedeman/gtm-kit-next` — App Router support with server components, CSP nonces, and automatic page view tracking (Next.js 13+)
- `@jwiedeman/gtm-kit-nuxt` — Nuxt 3 module with Vue composables and route tracking
- `@jwiedeman/gtm-kit-remix` — Remix 2+ adapter with SSR support

### Other frameworks

- `@jwiedeman/gtm-kit-vue` — Vue 3 plugin and composables
- `@jwiedeman/gtm-kit-svelte` — Svelte 4+ stores and actions
- `@jwiedeman/gtm-kit-solid` — SolidJS 1+ primitives and context

### CLI tool

- `@jwiedeman/gtm-kit-cli` — Interactive setup wizard that auto-detects your framework

### Quality & testing

- **366 tests** across all packages with 80%+ coverage
- E2E test suite with Playwright covering SSR, CSP, and route tracking
- Bundle size limits enforced via size-limit
- TypeScript strict mode throughout
- ESLint with zero warnings allowed

## Version Support Matrix

| Framework | Minimum Version | Notes                    |
| --------- | --------------- | ------------------------ |
| React     | 16.8+           | Hooks required           |
| Vue       | 3.3+            | Composition API required |
| Next.js   | 13+             | App Router support       |
| Nuxt      | 3+              | Vue 3 required           |
| Svelte    | 4+              | Stores API               |
| SolidJS   | 1+              | Primitives API           |
| Remix     | 2+              | React Router v6          |
| Node      | 18+             | For CLI                  |

## Known Limitations (Alpha)

- **NPM packages not yet published** — Install from GitHub or wait for npm release
- **Docs site not yet deployed** — Use README and `/docs` folder for now
- **No official Discord/community** — GitHub Issues is the primary support channel

## Upgrade Path to Beta

The beta release will include:

- Published npm packages under `@jwiedeman/gtm-kit*` scope
- Deployed VitePress documentation site
- Expanded E2E test coverage
- Performance benchmarks and optimization guides

## Getting Help

- **Bug reports**: [GitHub Issues](https://github.com/jwiedeman/GTM-Kit/issues)
- **Feature requests**: [GitHub Issues](https://github.com/jwiedeman/GTM-Kit/issues)
- **Security concerns**: See [SECURITY.md](../../SECURITY.md)

## Thank You

This project exists to help the web analytics community implement GTM correctly. If you find it useful, star the repo and tell a friend.
