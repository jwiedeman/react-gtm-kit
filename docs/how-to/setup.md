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
import { initGtm } from '@react-gtm-kit/core';

initGtm({
  containerIds: ['GTM-XXXXXXX'],
  dataLayerName: 'dataLayer',
  consentDefaults: {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  }
});
```

- Provide one or more container IDs in priority order.
- Set environment parameters (`gtm_auth`, `gtm_preview`) if you deploy GTM to
  multiple workspaces.

## 3. React adapter setup (optional)

Wrap your app with the provider to ensure initialization runs once even in StrictMode:

```tsx
import { GtmProvider } from '@react-gtm-kit/react-modern';

export function App() {
  return (
    <GtmProvider
      containerIds={['GTM-XXXXXXX']}
      consentDefaults={{ ad_storage: 'granted', analytics_storage: 'granted' }}
    >
      {/* rest of your app */}
    </GtmProvider>
  );
}
```

Inside the provider you can call `useGtmEvent()` or `useGtmConsent()` to push events or
update consent.

## 4. Verify installation

- Check the browser network tab for `https://www.googletagmanager.com/gtm.js` requests.
- Confirm the `dataLayer` array contains the `gtm.start` event followed by your custom pushes.
- Use the optional logger to surface debug output during development.
