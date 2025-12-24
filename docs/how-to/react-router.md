# React Router page view instrumentation

This guide shows how to pair the `@jwiedeman/gtm-kit-react` provider with React Router so every
navigation emits a `page_view` event exactly once, even when running inside
`<React.StrictMode>` where effects fire twice in development builds.

## 1. Wrap your app with the provider and router

Use the GTM provider at the top of your tree so child routes can access the context. Place the
`BrowserRouter` inside the provider so the hooks remain available anywhere within the router.

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GtmProvider } from '@jwiedeman/gtm-kit-react';

import App from './App';

const containers = ['GTM-XXXX'];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GtmProvider config={{ containers, logger: console }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GtmProvider>
  </React.StrictMode>
);
```

## 2. Track location changes inside the router

The `useGtmPush` hook exposes the underlying client. Combine it with `useLocation` to react to
pathname changes. A `useRef` guard prevents duplicate pushes when React double-invokes effects in
StrictMode.

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGtmPush } from '@jwiedeman/gtm-kit-react';

export const useRouteAwarePageView = (): void => {
  const push = useGtmPush();
  const location = useLocation();
  const lastPathRef = useRef<string>();

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    if (lastPathRef.current === path) {
      return;
    }

    lastPathRef.current = path;
    const frame = requestAnimationFrame(() => {
      push({
        event: 'page_view',
        page_path: path,
        page_title: document.title || 'App page'
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [location, push]);
};
```

Call the hook from a component rendered within the router—often near your layout shell.

```tsx
const PageViewTracker = () => {
  useRouteAwarePageView();
  return null;
};

export const AppLayout = () => (
  <main>
    <PageViewTracker />
    {/* routes go here */}
  </main>
);
```

The `requestAnimationFrame` wrapper ensures the push executes after the navigation commit so
`document.title` updates from the new route before the event fires.

## 3. Combine with custom events and consent updates

Because the router lives inside the provider, you can continue to use `useGtmPush` and
`useGtmConsent` anywhere in your route tree. The StrictMode-safe guard keeps page view pushes
idempotent while other custom events (such as CTA clicks or ecommerce steps) remain unaffected.

For a full working example, run the [`examples/react-strict-mode`](../../examples/react-strict-mode)
project which now includes a React Router integration.
