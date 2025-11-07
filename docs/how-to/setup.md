# Initialize React GTM Kit

Follow these steps to bootstrap Google Tag Manager with the core library or the React
adapters.

## 1. Install dependencies

```bash
pnpm add @react-gtm-kit/core
# Optional adapters:
pnpm add @react-gtm-kit/react-modern
```

## 2. Configure GTM containers

```ts
import { createGtmClient } from '@react-gtm-kit/core';

const gtmClient = createGtmClient({
  containers: ['GTM-XXXXXXX'],
  dataLayerName: 'dataLayer'
});

gtmClient.setConsentDefaults({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});

gtmClient.init();
```

- Provide one or more container IDs via the `containers` option in priority
  order.
- Set environment parameters (`gtm_auth`, `gtm_preview`) through the
  `defaultQueryParams` option if you deploy GTM to multiple workspaces.

## 3. React adapter setup (optional)

Wrap your app with the provider to ensure initialization runs once even in StrictMode:

```tsx
import { useEffect } from 'react';
import { GtmProvider, useGtmConsent, useGtmPush } from '@react-gtm-kit/react-modern';

function ConsentDefaults() {
  const { setConsentDefaults } = useGtmConsent();

  useEffect(() => {
    setConsentDefaults({ ad_storage: 'granted', analytics_storage: 'granted' });
  }, [setConsentDefaults]);

  return null;
}

function AppContent() {
  const push = useGtmPush();

  useEffect(() => {
    push({ event: 'page_view', page_path: window.location.pathname });
  }, [push]);

  return <>{/* rest of your app */}</>;
}

export function App() {
  return (
    <GtmProvider config={{ containers: ['GTM-XXXXXXX'] }}>
      <ConsentDefaults />
      <AppContent />
    </GtmProvider>
  );
}
```

Inside the provider you can call `useGtmPush()` to interact with the client or
`useGtmConsent()` to manage consent state.

## 4. Verify installation

- Check the browser network tab for `https://www.googletagmanager.com/gtm.js` requests.
- Confirm the `dataLayer` array contains the `gtm.start` event followed by your custom pushes.
- Use the optional logger to surface debug output during development.
