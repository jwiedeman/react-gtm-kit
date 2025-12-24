# @jwiedeman/gtm-kit-astro

[![CI](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/jwiedeman/GTM-Kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@jwiedeman/gtm-kit-astro.svg)](https://www.npmjs.com/package/@jwiedeman/gtm-kit-astro)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@jwiedeman/gtm-kit-astro)](https://bundlephobia.com/package/@jwiedeman/gtm-kit-astro)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Astro-3.0+-BC52EE.svg?logo=astro)](https://astro.build/)

**Astro components and helpers for Google Tag Manager. Supports View Transitions API.**

The Astro integration for GTM Kit - includes ready-to-use components and client-side helpers for page tracking.

---

## Installation

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-astro
```

```bash
yarn add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-astro
```

```bash
pnpm add @jwiedeman/gtm-kit @jwiedeman/gtm-kit-astro
```

---

## Quick Start

### Option 1: Use the GtmHead Component (Recommended)

The easiest way to add GTM to your Astro site:

```astro
---
// src/layouts/Layout.astro
import { GtmHead } from '@jwiedeman/gtm-kit-astro/components';
---
<html>
  <head>
    <GtmHead
      containers="GTM-XXXXXX"
      enablePageTracking
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Option 2: Use Individual Components

For more control, use the script and noscript components separately:

```astro
---
// src/layouts/Layout.astro
import { GtmScript, GtmNoScript } from '@jwiedeman/gtm-kit-astro/components';
---
<html>
  <head>
    <GtmScript containers="GTM-XXXXXX" />
  </head>
  <body>
    <GtmNoScript containers="GTM-XXXXXX" />
    <slot />
  </body>
</html>
```

### Option 3: Client-Side API

For programmatic control:

```astro
---
// src/layouts/Layout.astro
---
<html>
  <head>
    <!-- Your head content -->
  </head>
  <body>
    <slot />
    <script>
      import { initGtm, push, setupPageTracking } from '@jwiedeman/gtm-kit-astro';

      initGtm({ containers: 'GTM-XXXXXX' });
      setupPageTracking();

      // Push custom events
      push({ event: 'page_loaded', page_type: 'home' });
    </script>
  </body>
</html>
```

---

## Features

| Feature              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| **View Transitions** | Automatic page tracking with Astro's View Transitions API |
| **Zero Config**      | Works out of the box with sensible defaults               |
| **Astro 3, 4, 5**    | Compatible with all modern Astro versions                 |
| **TypeScript**       | Full type definitions included                            |
| **Consent Mode v2**  | Built-in GDPR compliance support                          |
| **SSR Safe**         | Works with static and SSR modes                           |

---

## Components

### `<GtmHead />`

All-in-one component for the `<head>` section. Includes script loading, consent setup, and optional page tracking.

```astro
<GtmHead
  containers="GTM-XXXXXX"
  enablePageTracking
  defaultConsent={{
    ad_storage: 'denied',
    analytics_storage: 'denied'
  }}
  pageViewEventName="page_view"
/>
```

#### Props

| Prop                 | Type                 | Default                            | Description                     |
| -------------------- | -------------------- | ---------------------------------- | ------------------------------- |
| `containers`         | `string \| string[]` | Required                           | GTM container ID(s)             |
| `host`               | `string`             | `https://www.googletagmanager.com` | Custom GTM host                 |
| `dataLayerName`      | `string`             | `dataLayer`                        | Custom dataLayer name           |
| `defaultConsent`     | `ConsentState`       | -                                  | Default consent state           |
| `enablePageTracking` | `boolean`            | `false`                            | Enable automatic page tracking  |
| `pageViewEventName`  | `string`             | `page_view`                        | Custom page view event name     |
| `scriptAttributes`   | `object`             | -                                  | Script attributes (nonce, etc.) |

### `<GtmScript />`

Generates GTM script tags for the `<head>`.

```astro
<GtmScript
  containers="GTM-XXXXXX"
  scriptAttributes={{ nonce: 'abc123' }}
/>
```

### `<GtmNoScript />`

Generates noscript iframe fallback for the `<body>`.

```astro
<GtmNoScript containers="GTM-XXXXXX" />
```

---

## Client-Side API

### `initGtm(options)`

Initialize GTM on the client side.

```typescript
import { initGtm } from '@jwiedeman/gtm-kit-astro';

initGtm({
  containers: 'GTM-XXXXXX',
  dataLayerName: 'dataLayer'
});
```

### `push(data)`

Push data to the dataLayer.

```typescript
import { push } from '@jwiedeman/gtm-kit-astro';

push({ event: 'button_click', button_id: 'cta-main' });
```

### `setupPageTracking(options)`

Set up automatic page view tracking. Works with Astro's View Transitions.

```typescript
import { setupPageTracking } from '@jwiedeman/gtm-kit-astro';

setupPageTracking({
  eventName: 'page_view' // Optional, defaults to 'page_view'
});
```

### `setupViewTransitions(options)`

Alias for `setupPageTracking`. Sets up tracking for View Transitions API.

```typescript
import { setupViewTransitions } from '@jwiedeman/gtm-kit-astro';

setupViewTransitions({ eventName: 'virtual_page_view' });
```

### `trackPageView(options)`

Manually track a page view.

```typescript
import { trackPageView } from '@jwiedeman/gtm-kit-astro';

trackPageView({
  eventName: 'page_view',
  pagePath: '/custom-path',
  pageTitle: 'Custom Title'
});
```

---

## Consent Mode v2 (GDPR)

### Setting Default Consent

```astro
<GtmHead
  containers="GTM-XXXXXX"
  defaultConsent={{
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  }}
/>
```

### Updating Consent After User Choice

```typescript
import { updateConsent } from '@jwiedeman/gtm-kit-astro';

// User accepts analytics
updateConsent({
  analytics_storage: 'granted'
});

// User accepts all
updateConsent({
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted'
});
```

---

## View Transitions Integration

GTM Kit automatically tracks page views when using Astro's View Transitions. Just enable page tracking:

```astro
---
import { GtmHead } from '@jwiedeman/gtm-kit-astro/components';
import { ViewTransitions } from 'astro:transitions';
---
<html>
  <head>
    <ViewTransitions />
    <GtmHead
      containers="GTM-XXXXXX"
      enablePageTracking
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Page views are automatically tracked on:

- Initial page load
- Client-side navigation via View Transitions
- Browser back/forward navigation

---

## Multiple Containers

```astro
<GtmHead
  containers={['GTM-XXXXXX', 'GTM-YYYYYY']}
  enablePageTracking
/>
```

---

## CSP (Content Security Policy)

```astro
<GtmHead
  containers="GTM-XXXXXX"
  scriptAttributes={{ nonce: 'your-nonce-value' }}
/>
```

---

## Requirements

- Astro 3.0+, 4.0+, or 5.0+
- `@jwiedeman/gtm-kit` (peer dependency)

---

## License

MIT
