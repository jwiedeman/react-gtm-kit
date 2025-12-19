# @react-gtm-kit/react-modern

[![CI](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/react-gtm-kit/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/jwiedeman/react-gtm-kit/graph/badge.svg?flag=react-modern)](https://codecov.io/gh/jwiedeman/react-gtm-kit)
[![npm version](https://img.shields.io/npm/v/@react-gtm-kit/react-modern.svg)](https://www.npmjs.com/package/@react-gtm-kit/react-modern)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@react-gtm-kit/react-modern)](https://bundlephobia.com/package/@react-gtm-kit/react-modern)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-16.8+-61DAFB.svg?logo=react)](https://reactjs.org/)

**React hooks and provider for Google Tag Manager. StrictMode-safe. Zero double-fires.**

The modern React adapter for GTM Kit - uses hooks and Context API for clean, idiomatic React code.

---

## Installation

```bash
npm install @react-gtm-kit/core @react-gtm-kit/react-modern
```

```bash
yarn add @react-gtm-kit/core @react-gtm-kit/react-modern
```

```bash
pnpm add @react-gtm-kit/core @react-gtm-kit/react-modern
```

---

## Quick Start

### Step 1: Wrap Your App

```tsx
// App.tsx or index.tsx
import { GtmProvider } from '@react-gtm-kit/react-modern';

function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <YourApp />
    </GtmProvider>
  );
}
```

### Step 2: Push Events

```tsx
import { useGtmPush } from '@react-gtm-kit/react-modern';

function BuyButton() {
  const push = useGtmPush();

  const handleClick = () => {
    push({ event: 'purchase', value: 49.99 });
  };

  return <button onClick={handleClick}>Buy Now</button>;
}
```

**That's it!** GTM is now running.

---

## Features

| Feature             | Description                               |
| ------------------- | ----------------------------------------- |
| **StrictMode-Safe** | No double-fires in React development mode |
| **Hooks-Based**     | Modern React patterns with Context API    |
| **React 16.8+**     | Works with any modern React version       |
| **TypeScript**      | Full type definitions included            |
| **Consent Mode v2** | Built-in GDPR compliance hooks            |
| **SSR Compatible**  | Safe for Next.js, Remix, etc.             |

---

## Available Hooks

### `useGtmPush()`

Get a push function to send events to GTM.

```tsx
const push = useGtmPush();

push({ event: 'button_click', button_id: 'cta-main' });
```

### `useGtm()`

Get the full GTM context with all methods.

```tsx
const { client, push, updateConsent, setConsentDefaults } = useGtm();
```

### `useGtmConsent()`

Manage consent state.

```tsx
const { updateConsent, setConsentDefaults } = useGtmConsent();

// After user accepts cookies
updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted'
});
```

### `useGtmClient()`

Get the raw GTM client instance.

```tsx
const client = useGtmClient();
```

### `useGtmReady()`

Get a function that resolves when GTM is fully loaded.

```tsx
const whenReady = useGtmReady();

useEffect(() => {
  whenReady().then(() => {
    console.log('GTM is ready!');
  });
}, [whenReady]);
```

---

## Consent Mode v2 (GDPR)

```tsx
import { GtmProvider, useGtmConsent } from '@react-gtm-kit/react-modern';
import { consentPresets } from '@react-gtm-kit/core';

// Set defaults BEFORE GTM loads
<GtmProvider
  config={{ containers: 'GTM-XXXXXX' }}
  onBeforeInit={(client) => {
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }}
>
  <App />
</GtmProvider>;

// In your cookie banner
function CookieBanner() {
  const { updateConsent } = useGtmConsent();

  // Accept all tracking
  const acceptAll = () => updateConsent(consentPresets.allGranted);

  // Reject all tracking
  const rejectAll = () => updateConsent(consentPresets.eeaDefault);

  // Analytics only (mixed consent)
  const analyticsOnly = () => updateConsent(consentPresets.analyticsOnly);

  // Granular: update specific categories
  const customChoice = () =>
    updateConsent({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
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

**Partial Updates** - Only update what changed:

```tsx
// User later opts into ads from preference center
updateConsent({ ad_storage: 'granted', ad_user_data: 'granted' });
// Other categories (analytics_storage, ad_personalization) unchanged
```

---

## Provider Options

```tsx
<GtmProvider
  config={{
    containers: 'GTM-XXXXXX', // Required
    dataLayerName: 'dataLayer', // Optional
    host: 'https://custom.host.com', // Optional
    scriptAttributes: { nonce: '...' } // Optional: CSP
  }}
  onBeforeInit={(client) => {
    // Called before GTM initializes
    // Perfect for consent defaults
  }}
  onAfterInit={(client) => {
    // Called after GTM initializes
  }}
>
  {children}
</GtmProvider>
```

---

## React Router Integration

```tsx
import { useLocation } from 'react-router-dom';
import { useGtmPush } from '@react-gtm-kit/react-modern';
import { useEffect, useRef } from 'react';

function PageTracker() {
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

// Add to your app
function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <BrowserRouter>
        <PageTracker />
        <Routes>...</Routes>
      </BrowserRouter>
    </GtmProvider>
  );
}
```

---

## Why StrictMode-Safe Matters

In React development mode with StrictMode, components mount twice. This causes most GTM libraries to fire events twice. **GTM Kit handles this automatically** - you get exactly one initialization and no duplicate events.

---

## Requirements

- React 16.8+ (hooks support)
- `@react-gtm-kit/core` (peer dependency)

---

## License

MIT
