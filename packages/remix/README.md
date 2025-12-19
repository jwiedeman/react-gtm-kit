# @react-gtm-kit/remix

[![CI](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/react-gtm-kit/graph/badge.svg?flag=remix)](https://codecov.io/gh/jwiedeman/react-gtm-kit)
[![npm version](https://img.shields.io/npm/v/@react-gtm-kit/remix.svg)](https://www.npmjs.com/package/@react-gtm-kit/remix)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@react-gtm-kit/remix)](https://bundlephobia.com/package/@react-gtm-kit/remix)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Remix](https://img.shields.io/badge/Remix-2.0+-000000.svg?logo=remix)](https://remix.run/)

**Remix adapter for Google Tag Manager. Route tracking included.**

The Remix adapter for GTM Kit - provides components and hooks optimized for Remix applications.

---

## Installation

```bash
npm install @react-gtm-kit/core @react-gtm-kit/remix
```

```bash
yarn add @react-gtm-kit/core @react-gtm-kit/remix
```

```bash
pnpm add @react-gtm-kit/core @react-gtm-kit/remix
```

---

## Quick Start

### Step 1: Add to Root

```tsx
// app/root.tsx
import { GtmProvider, GtmScripts, useTrackPageViews } from '@react-gtm-kit/remix';

function PageViewTracker() {
  useTrackPageViews();
  return null;
}

export default function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
        <GtmScripts containers="GTM-XXXXXX" />
      </head>
      <body>
        <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
          <PageViewTracker />
          <Outlet />
        </GtmProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

### Step 2: Push Events

```tsx
// app/routes/products.$id.tsx
import { useGtmPush } from '@react-gtm-kit/remix';

export default function ProductPage() {
  const push = useGtmPush();

  const handlePurchase = () => {
    push({ event: 'purchase', value: 49.99 });
  };

  return <button onClick={handlePurchase}>Buy Now</button>;
}
```

**That's it!** GTM is running with automatic page tracking.

---

## Features

| Feature | Description |
|---------|-------------|
| **Remix Native** | Built specifically for Remix |
| **Auto Page Tracking** | `useTrackPageViews` hook for route changes |
| **Server Scripts** | `GtmScripts` component for SSR |
| **React Router v6** | Uses Remix's routing system |
| **TypeScript** | Full type definitions included |
| **Consent Mode v2** | Built-in GDPR compliance |

---

## Components

### `<GtmScripts />`

Server-side component that renders GTM script tags. Place in your document head.

```tsx
import { GtmScripts } from '@react-gtm-kit/remix';

<GtmScripts
  containers="GTM-XXXXXX"
  host="https://www.googletagmanager.com"  // optional
  dataLayerName="dataLayer"                 // optional
  scriptAttributes={{ nonce: '...' }}       // optional: CSP
/>
```

### `<GtmProvider />`

Client-side provider that manages GTM state and provides context.

```tsx
import { GtmProvider } from '@react-gtm-kit/remix';

<GtmProvider
  config={{ containers: 'GTM-XXXXXX' }}
  onBeforeInit={(client) => {
    // Set consent defaults here
  }}
  onAfterInit={(client) => {
    // Called after GTM initializes
  }}
>
  {children}
</GtmProvider>
```

---

## Hooks

### `useTrackPageViews()`

Automatically tracks page views on route changes.

```tsx
import { useTrackPageViews } from '@react-gtm-kit/remix';

function PageViewTracker() {
  useTrackPageViews({
    eventName: 'page_view',           // default
    trackInitialPageView: true,        // default
    customData: { app_version: '1.0' }, // optional
    transformEvent: (data) => ({       // optional
      ...data,
      user_id: getCurrentUserId()
    })
  });

  return null;
}
```

### `useGtmPush()`

Get the push function for sending events.

```tsx
import { useGtmPush } from '@react-gtm-kit/remix';

function MyComponent() {
  const push = useGtmPush();

  return (
    <button onClick={() => push({ event: 'click', button: 'cta' })}>
      Click Me
    </button>
  );
}
```

### `useGtm()`

Get the full GTM context.

```tsx
import { useGtm } from '@react-gtm-kit/remix';

function MyComponent() {
  const { push, client, updateConsent } = useGtm();

  return <div>GTM Ready: {client.isInitialized() ? 'Yes' : 'No'}</div>;
}
```

### `useGtmConsent()`

Access consent management functions.

```tsx
import { useGtmConsent } from '@react-gtm-kit/remix';

function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  return (
    <button onClick={() => updateConsent({ analytics_storage: 'granted' })}>
      Accept
    </button>
  );
}
```

### `useGtmClient()`

Get the raw GTM client instance.

### `useGtmReady()`

Get a function that resolves when GTM is loaded.

---

## Consent Mode v2 (GDPR)

```tsx
// app/root.tsx
import { GtmProvider, GtmScripts, useGtmConsent } from '@react-gtm-kit/remix';
import { consentPresets } from '@react-gtm-kit/core';

function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  return (
    <div className="cookie-banner">
      <p>We use cookies to improve your experience.</p>
      <button onClick={() => updateConsent({
        ad_storage: 'granted',
        analytics_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      })}>
        Accept All
      </button>
      <button onClick={() => updateConsent({
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      })}>
        Reject All
      </button>
    </div>
  );
}

export default function App() {
  return (
    <html>
      <head>
        <GtmScripts containers="GTM-XXXXXX" />
      </head>
      <body>
        <GtmProvider
          config={{ containers: 'GTM-XXXXXX' }}
          onBeforeInit={(client) => {
            // Deny by default for EU users
            client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
          }}
        >
          <Outlet />
          <CookieBanner />
        </GtmProvider>
      </body>
    </html>
  );
}
```

---

## CSP (Content Security Policy)

For strict CSP configurations, generate and pass a nonce:

```tsx
// app/root.tsx
import { GtmScripts } from '@react-gtm-kit/remix';

export async function loader() {
  const nonce = generateNonce(); // Your nonce generation
  return json({ nonce });
}

export default function App() {
  const { nonce } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <GtmScripts
          containers="GTM-XXXXXX"
          scriptAttributes={{ nonce }}
        />
      </head>
      <body>
        {/* ... */}
      </body>
    </html>
  );
}
```

---

## Multiple Containers

```tsx
<GtmScripts
  containers={[
    { id: 'GTM-MAIN' },
    { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }
  ]}
/>

<GtmProvider
  config={{
    containers: [
      { id: 'GTM-MAIN' },
      { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }
    ]
  }}
>
  {children}
</GtmProvider>
```

---

## Full Example

```tsx
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import {
  GtmProvider,
  GtmScripts,
  useTrackPageViews,
  useGtmConsent
} from '@react-gtm-kit/remix';
import { consentPresets } from '@react-gtm-kit/core';

const GTM_ID = 'GTM-XXXXXX';

function PageViewTracker() {
  useTrackPageViews();
  return null;
}

function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <p>We use cookies to improve your experience.</p>
        <div className="space-x-2">
          <button
            onClick={() => updateConsent({
              ad_storage: 'granted',
              analytics_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted'
            })}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            Accept All
          </button>
          <button
            onClick={() => updateConsent({
              ad_storage: 'denied',
              analytics_storage: 'denied'
            })}
            className="bg-gray-600 px-4 py-2 rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <GtmScripts containers={GTM_ID} />
      </head>
      <body>
        <GtmProvider
          config={{ containers: GTM_ID }}
          onBeforeInit={(client) => {
            client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
          }}
        >
          <PageViewTracker />
          <Outlet />
          <CookieBanner />
        </GtmProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

---

## Requirements

- Remix 2.0+
- React 18+
- `@react-gtm-kit/core` (peer dependency)

---

## License

MIT
