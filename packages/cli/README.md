# @jwiedeman/gtm-kit-cli

[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/GTM-Kit/graph/badge.svg?flag=cli)](https://codecov.io/gh/jwiedeman/GTM-Kit)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-cli.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?logo=node.js)](https://nodejs.org/)

**Zero-config GTM Kit setup. Auto-detects your framework. Installs everything you need.**

The CLI tool for GTM Kit - get up and running in under 60 seconds.

---

## Quick Start

```bash
npx @jwiedeman/gtm-kit-cli init
```

That's it. The CLI will:

1. Detect your framework (React, Vue, Next.js, Nuxt, etc.)
2. Detect your package manager (npm, yarn, pnpm, bun)
3. Install the right packages
4. Generate setup code for your project
5. Optionally configure Consent Mode v2

---

## Commands

### `init` - Interactive Setup

```bash
npx @jwiedeman/gtm-kit-cli init
```

Walks you through the complete setup with prompts for:

- GTM container ID
- Consent Mode v2 configuration
- File locations

### `init <GTM-ID>` - Quick Setup

```bash
npx @jwiedeman/gtm-kit-cli init GTM-XXXXXX
```

Skip the prompts if you already know your GTM ID.

### `detect` - Framework Detection

```bash
npx @jwiedeman/gtm-kit-cli detect
```

Shows what framework and package manager the CLI detected.

### `validate <GTM-ID>` - ID Validation

```bash
npx @jwiedeman/gtm-kit-cli validate GTM-XXXXXX
```

Validates a GTM container ID format.

### `generate <GTM-ID>` - Code Generation

```bash
npx @jwiedeman/gtm-kit-cli generate GTM-XXXXXX
```

Generates setup code without installing packages.

---

## Supported Frameworks

| Framework | Detection               | Priority |
| --------- | ----------------------- | -------- |
| Nuxt 3    | `nuxt.config.ts/js`     | Highest  |
| Next.js   | `next.config.ts/js/mjs` | High     |
| Vue 3     | `vue` in dependencies   | Medium   |
| React     | `react` in dependencies | Low      |
| Vanilla   | Default fallback        | Lowest   |

The CLI uses priority order because some projects have multiple frameworks (e.g., Next.js includes React).

---

## Package Manager Detection

The CLI automatically detects your package manager:

| Package Manager | Detection        |
| --------------- | ---------------- |
| pnpm            | `pnpm-lock.yaml` |
| yarn            | `yarn.lock`      |
| bun             | `bun.lockb`      |
| npm             | Default fallback |

---

## Generated Code Examples

### React

```tsx
// src/gtm.tsx (generated)
import { GtmProvider } from '@jwiedeman/gtm-kit-react';

export function GtmWrapper({ children }) {
  return <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>{children}</GtmProvider>;
}
```

### Vue

```ts
// src/plugins/gtm.ts (generated)
import { GtmPlugin } from '@jwiedeman/gtm-kit-vue';

export function setupGtm(app) {
  app.use(GtmPlugin, { containers: 'GTM-XXXXXX' });
}
```

### Next.js

```tsx
// app/layout.tsx additions (generated)
import { GtmHeadScript, GtmNoScript } from '@jwiedeman/gtm-kit-next';

// Add to <head>: <GtmHeadScript containers="GTM-XXXXXX" />
// Add to <body>: <GtmNoScript containers="GTM-XXXXXX" />
```

### Nuxt

```ts
// plugins/gtm.client.ts (generated)
import { GtmPlugin } from '@jwiedeman/gtm-kit-nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(GtmPlugin, { containers: 'GTM-XXXXXX' });
});
```

---

## Options

### `--dry-run`

Preview what would happen without making changes.

```bash
npx @jwiedeman/gtm-kit-cli init --dry-run
```

### `--typescript` / `--no-typescript`

Force TypeScript or JavaScript output.

```bash
npx @jwiedeman/gtm-kit-cli init --typescript
npx @jwiedeman/gtm-kit-cli init --no-typescript
```

### `--consent`

Include Consent Mode v2 configuration.

```bash
npx @jwiedeman/gtm-kit-cli init --consent
```

---

## Troubleshooting

### "Framework not detected correctly"

The CLI checks for config files and dependencies. If detection is wrong:

```bash
# Check what was detected
npx @jwiedeman/gtm-kit-cli detect

# You can manually install the right packages
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react
```

### "Permission denied"

On Unix systems, you may need to use `npx` or install globally:

```bash
# Use npx (recommended)
npx @jwiedeman/gtm-kit-cli init

# Or install globally
npm install -g @jwiedeman/gtm-kit-cli
gtm-kit init
```

### "Package installation failed"

If automatic installation fails:

1. Check your internet connection
2. Try installing manually:
   ```bash
   npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-react
   ```
3. Check for npm registry issues

---

## Programmatic Usage

```ts
import { detectFramework, detectPackageManager, validateGtmId, generateCode } from '@jwiedeman/gtm-kit-cli';

// Detect framework
const framework = await detectFramework('./my-project');
console.log(framework); // { name: 'react', confidence: 90 }

// Detect package manager
const pm = await detectPackageManager('./my-project');
console.log(pm); // 'pnpm'

// Validate GTM ID
const isValid = validateGtmId('GTM-XXXXXX');
console.log(isValid); // true

// Generate code
const code = generateCode({
  framework: 'react',
  gtmId: 'GTM-XXXXXX',
  typescript: true,
  consent: true
});
```

---

## Requirements

- Node.js 18+
- npm, yarn, pnpm, or bun

---

## License

MIT
