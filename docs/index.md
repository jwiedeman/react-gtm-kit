# React GTM Kit

A lightweight, production-ready Google Tag Manager integration for React applications.

## Quick Links

| I want to... | Go to |
|--------------|-------|
| Get started quickly | [Quickstart Guide](/QUICKSTART.md) |
| Understand the architecture | [Architecture Concepts](./concepts/architecture.md) |
| Set up consent mode | [Consent Guide](./how-to/consent.md) |
| Track ecommerce events | [GA4 Ecommerce](./how-to/ga4-ecommerce.md) |
| Debug issues | [Troubleshooting](./how-to/troubleshooting.md) |
| See the full API | [API Reference](./reference/api.md) |

## Installation

```bash
# React (hooks) - most common
npm install @react-gtm-kit/core @react-gtm-kit/react-modern

# Next.js App Router
npm install @react-gtm-kit/core @react-gtm-kit/next

# Vanilla JavaScript
npm install @react-gtm-kit/core
```

## Basic Setup

### React

```tsx
import { GtmProvider, useGtmPush } from '@react-gtm-kit/react-modern';

function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <YourApp />
    </GtmProvider>
  );
}

function TrackableButton() {
  const push = useGtmPush();
  return (
    <button onClick={() => push({ event: 'button_click' })}>
      Click me
    </button>
  );
}
```

### Next.js

```tsx
// app/layout.tsx
import { GtmHeadScript, GtmNoScript } from '@react-gtm-kit/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GtmHeadScript containers="GTM-XXXXXX" />
      </head>
      <body>
        <GtmNoScript containers="GTM-XXXXXX" />
        {children}
      </body>
    </html>
  );
}
```

### Vanilla JavaScript

```ts
import { createGtmClient, pushEvent } from '@react-gtm-kit/core';

const gtm = createGtmClient({ containers: 'GTM-XXXXXX' });
gtm.init();

pushEvent(gtm, 'page_view', { page_path: '/' });
```

## Key Features

- **Zero dependencies** in core (3.7KB gzipped)
- **Consent Mode v2** with presets for GDPR compliance
- **Multi-container** support for complex setups
- **StrictMode-safe** - no duplicate events in development
- **SSR-ready** with noscript fallback for SEO

## Documentation Sections

### Concepts

Understand how React GTM Kit works under the hood:

- [Architecture](./concepts/architecture.md) - Package structure and data flow
- [Consent Lifecycle](./concepts/consent-lifecycle.md) - How consent mode works
- [SSR Strategy](./concepts/ssr-strategy.md) - Server-side rendering approach

### How-To Guides

Task-focused guides for common scenarios:

- [Initial Setup](./how-to/setup.md)
- [Consent Mode](./how-to/consent.md)
- [GA4 Ecommerce](./how-to/ga4-ecommerce.md)
- [React Router Integration](./how-to/react-router.md)
- [Multi-Container Setup](./how-to/multi-container-custom-hosts.md)
- [CMP Integration](./how-to/cmp-integration.md)
- [Debugging](./how-to/debugging.md)
- [Troubleshooting](./how-to/troubleshooting.md)

### Reference

Technical specifications:

- [API Reference](./reference/api.md) - Complete API documentation
- [Event Types](./reference/events.md) - Event helper types

### Examples

Working example applications in the [examples/](https://github.com/react-gtm-kit/react-gtm-kit/tree/main/examples) directory:

| Example | Description |
|---------|-------------|
| `next-app` | Next.js 14 App Router with page tracking |
| `react-strict-mode` | React + React Router with StrictMode |
| `react-legacy` | Class components with HOC adapter |
| `vanilla-csr` | Plain TypeScript, no framework |
| `fullstack-web` | Full-stack app with Vite |

## Support

- [GitHub Issues](https://github.com/react-gtm-kit/react-gtm-kit/issues) - Bug reports and feature requests
- [Common Issues](../GOTCHAS.md) - Solutions to frequent problems
