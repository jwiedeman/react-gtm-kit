# React GTM Kit

A lightweight, production-ready Google Tag Manager integration for React applications.

[![CI](https://github.com/react-gtm-kit/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/react-gtm-kit/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/react-gtm-kit/react-gtm-kit/graph/badge.svg)](https://codecov.io/gh/react-gtm-kit/react-gtm-kit)

## Features

- **Zero dependencies** in core (3.7KB gzipped)
- **Framework-agnostic** core with React/Next.js adapters
- **Consent Mode v2** with ready-to-use presets
- **Multi-container** support
- **SSR-safe** with noscript fallback
- **StrictMode-safe** (no double-firing)
- **TypeScript-first** with full type coverage

## Installation

```bash
# Core + React hooks (most users)
npm install @react-gtm-kit/core @react-gtm-kit/react-modern

# Next.js App Router
npm install @react-gtm-kit/core @react-gtm-kit/next

# Legacy React (class components)
npm install @react-gtm-kit/core @react-gtm-kit/react-legacy
```

## Quick Start

### React (Hooks)

```tsx
import { GtmProvider, useGtmPush } from '@react-gtm-kit/react-modern';

// 1. Wrap your app
function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <YourApp />
    </GtmProvider>
  );
}

// 2. Push events anywhere
function CheckoutButton() {
  const push = useGtmPush();

  return (
    <button onClick={() => push({ event: 'begin_checkout', value: 99.99 })}>
      Checkout
    </button>
  );
}
```

### Next.js (App Router)

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
        <GtmClientProvider>{children}</GtmClientProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/gtm-client-provider.tsx
'use client';
import { createGtmClient } from '@react-gtm-kit/core';
import { useTrackPageViews } from '@react-gtm-kit/next';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init();

export function GtmClientProvider({ children }) {
  useTrackPageViews({ client }); // Auto-tracks route changes
  return children;
}
```

### Vanilla JavaScript

```ts
import { createGtmClient, pushEvent } from '@react-gtm-kit/core';

const gtm = createGtmClient({ containers: 'GTM-XXXXXX' });
gtm.init();

// Push events
pushEvent(gtm, 'page_view', { page_path: '/', page_title: 'Home' });
```

## Consent Mode v2

```tsx
import { GtmProvider, useGtmConsent } from '@react-gtm-kit/react-modern';
import { consentPresets } from '@react-gtm-kit/core';

// Set defaults before init (GDPR-compliant)
<GtmProvider
  config={{ containers: 'GTM-XXXXXX' }}
  onBeforeInit={(client) => {
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }}
>

// Update after user consent
function ConsentBanner() {
  const { updateConsent } = useGtmConsent();

  const acceptAll = () => updateConsent({
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });

  return <button onClick={acceptAll}>Accept All</button>;
}
```

**Available presets:**
- `consentPresets.eeaDefault` - All denied (GDPR default)
- `consentPresets.allGranted` - All granted
- `consentPresets.analyticsOnly` - Analytics only, no ads

## Ecommerce Events

```ts
import { pushEcommerce } from '@react-gtm-kit/core';

pushEcommerce(client, 'purchase', {
  transaction_id: 'T-12345',
  value: 120.00,
  currency: 'USD',
  items: [
    { item_id: 'SKU-001', item_name: 'Widget', price: 40, quantity: 3 }
  ]
});
```

## API Reference

### Core Client

```ts
const client = createGtmClient({
  containers: 'GTM-XXXXXX',           // Required: container ID(s)
  dataLayerName: 'dataLayer',         // Optional: custom name
  host: 'https://www.googletagmanager.com', // Optional: custom host
  scriptAttributes: { nonce: '...' }  // Optional: CSP nonce
});

client.init();                        // Initialize GTM
client.push({ event: 'custom' });     // Push to dataLayer
client.setConsentDefaults(state);     // Set consent defaults
client.updateConsent(state);          // Update consent
client.teardown();                    // Clean up (for tests)
client.whenReady();                   // Promise when scripts load
```

### React Hooks

```ts
import {
  useGtm,           // Full context
  useGtmPush,       // push() function
  useGtmConsent,    // { setConsentDefaults, updateConsent }
  useGtmClient,     // Raw client instance
  useGtmReady       // whenReady() function
} from '@react-gtm-kit/react-modern';
```

### Next.js Helpers

```ts
import {
  GtmHeadScript,    // Server component for <head>
  GtmNoScript,      // Server component for noscript fallback
  useTrackPageViews // Hook for automatic page tracking
} from '@react-gtm-kit/next';
```

## Common Patterns

### Track Page Views (React Router)

```tsx
import { useLocation } from 'react-router-dom';
import { useGtmPush } from '@react-gtm-kit/react-modern';
import { useEffect, useRef } from 'react';

function PageViewTracker() {
  const location = useLocation();
  const push = useGtmPush();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path !== lastPath.current) {
      lastPath.current = path;
      push({ event: 'page_view', page_path: path });
    }
  }, [location, push]);

  return null;
}
```

### Multiple Containers

```ts
const client = createGtmClient({
  containers: [
    { id: 'GTM-MAIN' },
    { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }
  ]
});
```

### CSP Nonce (Server-Side)

```tsx
<GtmHeadScript
  containers="GTM-XXXXXX"
  scriptAttributes={{ nonce: serverNonce }}
/>
```

## Documentation

- [Full Documentation](./docs/) - Comprehensive guides and API reference
- [Examples](./examples/) - Working example applications
- [Quickstart Guide](./QUICKSTART.md) - Get running in 5 minutes
- [Troubleshooting](./GOTCHAS.md) - Common issues and solutions

## Package Sizes

| Package | Size (gzip) |
|---------|-------------|
| `@react-gtm-kit/core` | 3.7 KB |
| `@react-gtm-kit/react-modern` | 6.9 KB |
| `@react-gtm-kit/react-legacy` | 6.9 KB |
| `@react-gtm-kit/next` | 14.2 KB |

## Contributing

See [CONTRIBUTING.md](./docs/governance/contributing.md) for development setup and guidelines.

## License

MIT
