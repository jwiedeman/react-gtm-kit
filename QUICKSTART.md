# Quickstart Guide

Get React GTM Kit running in your project in under 5 minutes.

---

## Choose Your Setup

| Your Stack | Install | Time |
|------------|---------|------|
| React (hooks) | [React Setup](#react-with-hooks) | 2 min |
| Next.js App Router | [Next.js Setup](#nextjs-app-router) | 3 min |
| Vanilla JS/TypeScript | [Vanilla Setup](#vanilla-javascript) | 1 min |
| Legacy React (class components) | [Legacy Setup](#legacy-react) | 2 min |

---

## React with Hooks

### 1. Install

```bash
npm install @react-gtm-kit/core @react-gtm-kit/react-modern
```

### 2. Add the Provider

Wrap your app with `GtmProvider` at the root:

```tsx
// src/App.tsx (or main.tsx)
import { GtmProvider } from '@react-gtm-kit/react-modern';

function App() {
  return (
    <GtmProvider config={{ containers: 'GTM-XXXXXX' }}>
      <Router>
        <Routes />
      </Router>
    </GtmProvider>
  );
}
```

### 3. Push Events

Use the `useGtmPush` hook anywhere in your app:

```tsx
import { useGtmPush } from '@react-gtm-kit/react-modern';

function ProductPage({ product }) {
  const push = useGtmPush();

  useEffect(() => {
    push({
      event: 'view_item',
      item_id: product.id,
      item_name: product.name,
      value: product.price
    });
  }, [product.id]);

  return <div>{product.name}</div>;
}
```

### 4. Verify It Works

1. Open Chrome DevTools → Console
2. Type `dataLayer` and press Enter
3. You should see an array with your events

**Done!**

---

## Next.js App Router

### 1. Install

```bash
npm install @react-gtm-kit/core @react-gtm-kit/next
```

### 2. Add GTM to Layout

```tsx
// app/layout.tsx
import { GtmHeadScript, GtmNoScript } from '@react-gtm-kit/next';
import { GtmClientProvider } from './gtm-client-provider';

const GTM_ID = 'GTM-XXXXXX';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <GtmHeadScript containers={GTM_ID} />
      </head>
      <body>
        <GtmNoScript containers={GTM_ID} />
        <GtmClientProvider>
          {children}
        </GtmClientProvider>
      </body>
    </html>
  );
}
```

### 3. Create Client Provider

```tsx
// app/gtm-client-provider.tsx
'use client';

import { createGtmClient } from '@react-gtm-kit/core';
import { useTrackPageViews } from '@react-gtm-kit/next';
import { ReactNode } from 'react';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init();

export function GtmClientProvider({ children }: { children: ReactNode }) {
  // Automatically tracks page views on route changes
  useTrackPageViews({ client });
  return <>{children}</>;
}
```

### 4. Push Custom Events

```tsx
// components/AddToCartButton.tsx
'use client';

import { createGtmClient, pushEvent } from '@react-gtm-kit/core';

// Use the same client instance
const client = createGtmClient({ containers: 'GTM-XXXXXX' });

export function AddToCartButton({ product }) {
  const handleClick = () => {
    pushEvent(client, 'add_to_cart', {
      item_id: product.id,
      item_name: product.name,
      value: product.price
    });
  };

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

**Done!** Page views are tracked automatically on navigation.

---

## Vanilla JavaScript

### 1. Install

```bash
npm install @react-gtm-kit/core
```

### 2. Initialize

```ts
// src/analytics.ts
import { createGtmClient, pushEvent } from '@react-gtm-kit/core';

export const gtm = createGtmClient({ containers: 'GTM-XXXXXX' });
gtm.init();

// Helper function
export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  pushEvent(gtm, name, params);
};
```

### 3. Use It

```ts
import { trackEvent } from './analytics';

// Track page view
trackEvent('page_view', { page_path: window.location.pathname });

// Track click
document.getElementById('cta').addEventListener('click', () => {
  trackEvent('cta_click', { button_id: 'hero-cta' });
});
```

**Done!**

---

## Legacy React

For class components without hooks support (React < 16.8):

### 1. Install

```bash
npm install @react-gtm-kit/core @react-gtm-kit/react-legacy
```

### 2. Wrap Your Component

```tsx
import { withGtm } from '@react-gtm-kit/react-legacy';

class ProductPage extends React.Component {
  componentDidMount() {
    // gtm prop is injected by the HOC
    this.props.gtm.push({
      event: 'view_item',
      item_id: this.props.productId
    });
  }

  render() {
    return <div>Product Details</div>;
  }
}

export default withGtm({ config: { containers: 'GTM-XXXXXX' } })(ProductPage);
```

---

## Add Consent Mode (GDPR)

If you need GDPR compliance, set consent defaults **before** GTM loads:

### React

```tsx
import { GtmProvider } from '@react-gtm-kit/react-modern';
import { consentPresets } from '@react-gtm-kit/core';

<GtmProvider
  config={{ containers: 'GTM-XXXXXX' }}
  onBeforeInit={(client) => {
    // Deny all by default for EU users
    client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
  }}
>
```

### Vanilla

```ts
const gtm = createGtmClient({ containers: 'GTM-XXXXXX' });

// Set BEFORE init()
gtm.setConsentDefaults({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});

gtm.init();
```

Then update when user grants consent:

```ts
gtm.updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});
```

---

## Verify Your Setup

### Check dataLayer

```js
// In browser console
console.log(window.dataLayer);
```

You should see:
```js
[
  { event: 'gtm.js', 'gtm.start': 1234567890 },
  { event: 'page_view', page_path: '/' },
  // ... your events
]
```

### GTM Preview Mode

1. Go to GTM → Preview
2. Enter your site URL
3. Verify tags fire correctly

### Common Issues

See [GOTCHAS.md](./GOTCHAS.md) for common problems and solutions.

---

## Next Steps

- [Ecommerce tracking](./docs/how-to/ga4-ecommerce.md) - GA4 purchase events
- [CMP integration](./docs/how-to/cmp-integration.md) - Connect your consent platform
- [Full API reference](./docs/reference/api.md) - All options and methods
- [Examples](./examples/) - Complete working applications
