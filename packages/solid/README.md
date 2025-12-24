# @jwiedeman/gtm-kit-solid

[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/GTM-Kit/graph/badge.svg?flag=solid)](https://codecov.io/gh/jwiedeman/GTM-Kit)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-solid.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-solid)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jwiedeman/gtm-kit-solid)](https://bundlephobia.com/package/@jwiedeman/gtm-kit-solid)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.0+-2C4F7C.svg?logo=solid)](https://www.solidjs.com/)

**SolidJS primitives and context for Google Tag Manager. Fine-grained reactivity.**

The SolidJS adapter for GTM Kit - provides context and hooks for idiomatic Solid integration.

---

## Installation

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-solid
```

```bash
yarn add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-solid
```

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-solid
```

---

## Quick Start

### Step 1: Wrap Your App

```tsx
// App.tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-solid';

function App() {
  return (
    <GtmProvider containers="GTM-XXXXXX">
      <MyApp />
    </GtmProvider>
  );
}
```

### Step 2: Push Events

```tsx
import { useGtmPush } from '@jwiedeman/gtm-kit-solid';

function BuyButton() {
  const push = useGtmPush();

  return <button onClick={() => push({ event: 'purchase', value: 49.99 })}>Buy Now</button>;
}
```

**That's it!** GTM is now running.

---

## Features

| Feature             | Description                         |
| ------------------- | ----------------------------------- |
| **SolidJS Native**  | Built for Solid's reactivity system |
| **Fine-Grained**    | Only updates what needs to update   |
| **Context-Based**   | Uses Solid's context API            |
| **TypeScript**      | Full type definitions included      |
| **Consent Mode v2** | Built-in GDPR compliance            |
| **SSR Compatible**  | Safe for SolidStart SSR             |

---

## Available Hooks

### `useGtm()`

Get the full GTM context.

```tsx
import { useGtm } from '@jwiedeman/gtm-kit-solid';

function MyComponent() {
  const { push, client, updateConsent, initialized } = useGtm();

  return (
    <div>
      <p>GTM Initialized: {initialized ? 'Yes' : 'No'}</p>
      <button onClick={() => push({ event: 'click' })}>Track</button>
    </div>
  );
}
```

### `useGtmPush()`

Get just the push function.

```tsx
import { useGtmPush } from '@jwiedeman/gtm-kit-solid';

function MyComponent() {
  const push = useGtmPush();

  return <button onClick={() => push({ event: 'purchase', value: 99 })}>Buy</button>;
}
```

### `useGtmConsent()`

Access consent management functions.

```tsx
import { useGtmConsent } from '@jwiedeman/gtm-kit-solid';

function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  const acceptAll = () => {
    updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  };

  return <button onClick={acceptAll}>Accept All</button>;
}
```

### `useGtmClient()`

Get the raw GTM client instance.

```tsx
import { useGtmClient } from '@jwiedeman/gtm-kit-solid';

function MyComponent() {
  const client = useGtmClient();

  return <div>Initialized: {client.isInitialized() ? 'Yes' : 'No'}</div>;
}
```

### `useGtmReady()`

Get a function that resolves when GTM is loaded.

```tsx
import { useGtmReady } from '@jwiedeman/gtm-kit-solid';
import { onMount } from 'solid-js';

function MyComponent() {
  const whenReady = useGtmReady();

  onMount(async () => {
    const states = await whenReady();
    console.log('GTM loaded:', states);
  });

  return <div>Loading...</div>;
}
```

---

## Provider Options

```tsx
<GtmProvider
  containers="GTM-XXXXXX"
  autoInit={true}
  dataLayerName="dataLayer"
  host="https://www.googletagmanager.com"
  scriptAttributes={{ nonce: '...' }}
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

## SolidStart Integration

### Basic Setup

```tsx
// src/root.tsx
import { GtmProvider } from '@jwiedeman/gtm-kit-solid';

export default function Root() {
  return (
    <Html>
      <Head />
      <Body>
        <GtmProvider containers="GTM-XXXXXX">
          <Routes />
        </GtmProvider>
      </Body>
    </Html>
  );
}
```

### Page Tracking with Router

```tsx
import { useGtmPush } from '@jwiedeman/gtm-kit-solid';
import { useLocation } from '@solidjs/router';
import { createEffect } from 'solid-js';

function PageTracker() {
  const push = useGtmPush();
  const location = useLocation();

  createEffect(() => {
    push({
      event: 'page_view',
      page_path: location.pathname
    });
  });

  return null;
}
```

---

## Consent Mode v2 (GDPR)

```tsx
import { GtmProvider, useGtmConsent } from '@jwiedeman/gtm-kit-solid';
import { consentPresets } from '@jwiedeman/gtm-kit';

// In your root component
function App() {
  return (
    <GtmProvider
      containers="GTM-XXXXXX"
      onBeforeInit={(client) => {
        // Deny by default for EU users
        client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
      }}
    >
      <MyApp />
      <CookieBanner />
    </GtmProvider>
  );
}

// Cookie banner component
function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  return (
    <div class="cookie-banner">
      <p>We use cookies to improve your experience.</p>
      <button
        onClick={() =>
          updateConsent({
            ad_storage: 'granted',
            analytics_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted'
          })
        }
      >
        Accept All
      </button>
      <button
        onClick={() =>
          updateConsent({
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          })
        }
      >
        Reject All
      </button>
    </div>
  );
}
```

---

## Multiple Containers

```tsx
<GtmProvider
  containers={[{ id: 'GTM-MAIN' }, { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc', gtm_preview: 'env-1' } }]}
>
  {children}
</GtmProvider>
```

---

## TypeScript

Full TypeScript support is included:

```tsx
import type { GtmContextValue, GtmConsentApi } from '@jwiedeman/gtm-kit-solid';
import { useGtm, useGtmConsent } from '@jwiedeman/gtm-kit-solid';

function MyComponent() {
  const gtm: GtmContextValue = useGtm();
  const consent: GtmConsentApi = useGtmConsent();

  // Fully typed!
  gtm.push({ event: 'my_event', custom_param: 'value' });
}
```

---

## Requirements

- SolidJS 1.0+
- `@jwiedeman/gtm-kit` (peer dependency)

---

## License

MIT
