# Send analytics events

Track pageviews and custom events through GTM using the React GTM Kit helpers.
The examples below assume you have already created and initialized a client via
`createGtmClient`.

## Pageviews

```ts
import { pushEvent } from '@react-gtm-kit/core';

pushEvent(client, 'page_view', {
  page_path: window.location.pathname,
  page_title: document.title
});
```

- In React apps, use the `useGtmPush` hook with your router's navigation listener to
  fire the same payload once per route change.

## Wait for GTM readiness

- The core client exposes a `whenReady()` promise that resolves after GTM scripts load (or rejects with
  failures) so you can gate business events until the container is available.
- In React, the `useGtmReady` hook returns the same promise from context; Next's `useTrackPageViews`
  hook accepts `waitForReady: true` to delay pageview pushes until script readiness settles.

```ts
await client.whenReady();
pushEvent(client, 'page_view', { page_path: '/', page_title: 'Home' });
```

## Custom events

```ts
pushEvent(client, 'purchase', {
  ecommerce: {
    transaction_id: '12345',
    value: 42.0,
    currency: 'USD'
  }
});
```

- Align event names with the triggers configured in GTM.
- Keep payloads serializable; GTM expects plain objects without functions or class instances.

## Consent-aware tracking

- Wrap event pushes in consent checks if your CMP differentiates between analytics and
  advertising storage.
- The React adapters expose `useGtmConsent` to read current consent state when deciding
  which events to push.

## Testing your setup

- Use the GTM preview mode to confirm events reach the container.
- Validate that ecommerce data maps correctly into your analytics platform (e.g., GA4).
- Automate smoke tests in examples to ensure critical events fire during CI runs.
