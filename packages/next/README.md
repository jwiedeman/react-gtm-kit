# @react-gtm-kit/next

[![CI](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/react-gtm-kit/graph/badge.svg?flag=next)](https://codecov.io/gh/jwiedeman/react-gtm-kit)
[![npm version](https://img.shields.io/npm/v/@react-gtm-kit/next.svg)](https://www.npmjs.com/package/@react-gtm-kit/next)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@react-gtm-kit/next)](https://bundlephobia.com/package/@react-gtm-kit/next)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13+-000000.svg?logo=next.js)](https://nextjs.org/)

**Next.js App Router components for Google Tag Manager. Server components ready.**

The Next.js adapter for GTM Kit - provides server components and route tracking hooks.

---

## Installation

```bash
npm install @react-gtm-kit/core @react-gtm-kit/next
```

```bash
yarn add @react-gtm-kit/core @react-gtm-kit/next
```

```bash
pnpm add @react-gtm-kit/core @react-gtm-kit/next
```

---

## Quick Start

### Step 1: Add to Layout

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

### Step 2: Create Client Provider

```tsx
// app/providers/gtm.tsx
'use client';
import { createGtmClient } from '@react-gtm-kit/core';
import { useTrackPageViews } from '@react-gtm-kit/next';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init();

export function GtmProvider({ children }) {
  useTrackPageViews({ client }); // Auto-tracks route changes
  return children;
}
```

### Step 3: Push Events

```tsx
'use client';
import { pushEvent } from '@react-gtm-kit/core';

// In any client component
function BuyButton({ client }) {
  return <button onClick={() => pushEvent(client, 'purchase', { value: 49.99 })}>Buy Now</button>;
}
```

---

## Features

| Feature                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| **Server Components**  | `GtmHeadScript` and `GtmNoScript` are server components |
| **App Router**         | Built for Next.js 13+ App Router                        |
| **Auto Page Tracking** | `useTrackPageViews` hook for route changes              |
| **CSP Support**        | Nonce support for Content Security Policy               |
| **TypeScript**         | Full type definitions included                          |
| **Lightweight**        | Only what you need for Next.js                          |

---

## Server Components

### `<GtmHeadScript />`

Renders the GTM script tag. Place in your `<head>`.

```tsx
import { GtmHeadScript } from '@react-gtm-kit/next';

<GtmHeadScript
  containers="GTM-XXXXXX"
  scriptAttributes={{ nonce: 'your-csp-nonce' }} // Optional
/>;
```

### `<GtmNoScript />`

Renders the noscript fallback iframe. Place at the start of `<body>`.

```tsx
import { GtmNoScript } from '@react-gtm-kit/next';

<GtmNoScript containers="GTM-XXXXXX" />;
```

---

## Client Hooks

### `useTrackPageViews()`

Automatically tracks page views on route changes.

```tsx
'use client';
import { useTrackPageViews } from '@react-gtm-kit/next';

export function GtmProvider({ children, client }) {
  useTrackPageViews({ client });
  return children;
}
```

---

## Full Setup Example

### 1. Root Layout

```tsx
// app/layout.tsx
import { GtmHeadScript, GtmNoScript } from '@react-gtm-kit/next';
import { GtmProvider } from './providers/gtm';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GtmHeadScript containers="GTM-XXXXXX" />
      </head>
      <body>
        <GtmNoScript containers="GTM-XXXXXX" />
        <GtmProvider>{children}</GtmProvider>
      </body>
    </html>
  );
}
```

### 2. GTM Provider

```tsx
// app/providers/gtm.tsx
'use client';
import { createGtmClient } from '@react-gtm-kit/core';
import { useTrackPageViews } from '@react-gtm-kit/next';
import { createContext, useContext } from 'react';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init();

const GtmContext = createContext(client);

export function GtmProvider({ children }) {
  useTrackPageViews({ client });
  return <GtmContext.Provider value={client}>{children}</GtmContext.Provider>;
}

export function useGtmClient() {
  return useContext(GtmContext);
}
```

### 3. Use in Components

```tsx
// app/components/BuyButton.tsx
'use client';
import { pushEvent } from '@react-gtm-kit/core';
import { useGtmClient } from '../providers/gtm';

export function BuyButton() {
  const client = useGtmClient();

  return <button onClick={() => pushEvent(client, 'purchase', { value: 49.99 })}>Buy Now</button>;
}
```

---

## Consent Mode v2 (GDPR)

```tsx
// app/providers/gtm.tsx
'use client';
import { createGtmClient, consentPresets } from '@react-gtm-kit/core';
import { useTrackPageViews } from '@react-gtm-kit/next';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });

// Set consent defaults BEFORE init
client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
client.init();

export function GtmProvider({ children }) {
  useTrackPageViews({ client });
  return children;
}

// Export for consent updates
export { client };
```

```tsx
// app/components/CookieBanner.tsx
'use client';
import { client } from '../providers/gtm';
import { consentPresets } from '@react-gtm-kit/core';

export function CookieBanner() {
  // Accept all tracking
  const acceptAll = () => client.updateConsent(consentPresets.allGranted);

  // Reject all tracking
  const rejectAll = () => client.updateConsent(consentPresets.eeaDefault);

  // Analytics only (mixed consent)
  const analyticsOnly = () => client.updateConsent(consentPresets.analyticsOnly);

  // Partial update - only change specific categories
  const customChoice = () =>
    client.updateConsent({
      analytics_storage: 'granted',
      ad_storage: 'denied'
    });

  return (
    <div>
      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject All</button>
      <button onClick={analyticsOnly}>Analytics Only</button>
    </div>
  );
}
```

**Granular Updates** - Update individual categories without affecting others:

```tsx
// User later changes ad preferences from settings page
client.updateConsent({ ad_storage: 'granted', ad_user_data: 'granted' });
// analytics_storage and ad_personalization remain unchanged
```

---

## CSP (Content Security Policy)

For strict CSP configurations, pass a nonce:

```tsx
// app/layout.tsx
import { headers } from 'next/headers';
import { GtmHeadScript, GtmNoScript } from '@react-gtm-kit/next';

export default function RootLayout({ children }) {
  const nonce = headers().get('x-nonce') || '';

  return (
    <html>
      <head>
        <GtmHeadScript containers="GTM-XXXXXX" scriptAttributes={{ nonce }} />
      </head>
      <body>
        <GtmNoScript containers="GTM-XXXXXX" />
        {children}
      </body>
    </html>
  );
}
```

---

## Multiple Containers

```tsx
<GtmHeadScript
  containers={[{ id: 'GTM-MAIN' }, { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }]}
/>
```

---

## Pages Router (Legacy)

For Next.js Pages Router, use `@react-gtm-kit/react-modern` instead:

```tsx
// pages/_app.tsx
import { GtmProvider } from '@react-gtm-kit/react-modern';

export default function App({ Component, pageProps }) {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <Component {...pageProps} />
    </GtmProvider>
  );
}
```

---

## Requirements

- Next.js 13.4+ (App Router)
- React 18+
- `@react-gtm-kit/core` (peer dependency)

---

## License

MIT
