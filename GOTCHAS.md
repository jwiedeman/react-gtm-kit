# Common Issues & Gotchas

A guide to common problems when integrating React GTM Kit, and how to solve them.

---

## Table of Contents

- [Events Not Appearing](#events-not-appearing)
- [Duplicate Events](#duplicate-events)
- [Consent Mode Issues](#consent-mode-issues)
- [Next.js Specific](#nextjs-specific)
- [StrictMode & Development](#strictmode--development)
- [CSP & Security](#csp--security)
- [Testing](#testing)

---

## Events Not Appearing

### Problem: dataLayer is empty or undefined

**Cause:** GTM client not initialized.

**Solution:**
```ts
const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init(); // Don't forget this!
```

### Problem: Events pushed but not in dataLayer

**Cause:** Pushing events before `init()` without the client reference.

**Solution:** Events pushed before `init()` are queued and flushed automatically. Make sure you're using the same client instance:

```ts
// WRONG - creating new client
const client1 = createGtmClient({ containers: 'GTM-XXXXXX' });
client1.init();

const client2 = createGtmClient({ containers: 'GTM-XXXXXX' }); // Different instance!
client2.push({ event: 'test' }); // This goes to a different queue

// CORRECT - reuse the same client
export const gtm = createGtmClient({ containers: 'GTM-XXXXXX' });
gtm.init();

// Later, in another file
import { gtm } from './analytics';
gtm.push({ event: 'test' }); // Same instance, works correctly
```

### Problem: GTM container ID is wrong

**Check:**
```js
// In browser console
document.querySelector('script[data-gtm-container-id]')?.getAttribute('data-gtm-container-id')
```

Should return your container ID (e.g., `GTM-XXXXXX`).

---

## Duplicate Events

### Problem: Same event fires twice

**Common causes:**

1. **React StrictMode double-mount** (development only)

   This is expected behavior in development. The library handles cleanup correctly. Events will fire once in production.

2. **Multiple client instances**

   ```ts
   // WRONG - inside component (creates new instance each render)
   function App() {
     const client = createGtmClient({ containers: 'GTM-XXXXXX' });
     // ...
   }

   // CORRECT - outside component or useMemo
   const client = createGtmClient({ containers: 'GTM-XXXXXX' });
   function App() {
     // Use client here
   }
   ```

3. **Missing dependency array in useEffect**

   ```tsx
   // WRONG - fires on every render
   useEffect(() => {
     push({ event: 'page_view' });
   });

   // CORRECT - fires once
   useEffect(() => {
     push({ event: 'page_view' });
   }, []);
   ```

### Problem: Duplicate scripts in DOM

**Check:**
```js
document.querySelectorAll('script[data-gtm-container-id]').length
```

Should return `1` per container. If more, you're calling `init()` multiple times or have conflicting GTM implementations.

**Solution:** The library is idempotent—calling `init()` twice won't inject duplicate scripts. If you see duplicates, check for:
- Manual GTM snippets in your HTML
- Other GTM libraries
- Multiple `GtmProvider` components

---

## Consent Mode Issues

### Problem: Consent defaults not working

**Cause:** Setting defaults after `init()`.

```ts
// WRONG - defaults after init are ignored
client.init();
client.setConsentDefaults({ ad_storage: 'denied' }); // Too late!

// CORRECT - defaults before init
client.setConsentDefaults({ ad_storage: 'denied' });
client.init();
```

### Problem: Consent updates not reflecting in GTM

**Check the dataLayer:**
```js
window.dataLayer.filter(e => Array.isArray(e) && e[0] === 'consent')
```

Should show:
```js
[
  ['consent', 'default', { ad_storage: 'denied', ... }],
  ['consent', 'update', { ad_storage: 'granted', ... }]
]
```

**Common issues:**
1. Using wrong consent keys (must be exact: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`)
2. Using wrong values (must be `'granted'` or `'denied'`, not `true`/`false`)

```ts
// WRONG
updateConsent({ ad_storage: true }); // boolean

// CORRECT
updateConsent({ ad_storage: 'granted' }); // string literal
```

### Problem: Tags fire before consent is granted

**Cause:** GTM tags not configured for Consent Mode.

**Solution:** In GTM, ensure your tags have the correct consent settings:
1. Go to tag settings
2. Under "Consent Settings", add required consents
3. Publish the container

---

## Next.js Specific

### Problem: "use client" errors

**Cause:** Using hooks in server components.

```tsx
// WRONG - useTrackPageViews in server component
// app/layout.tsx (server component by default)
import { useTrackPageViews } from '@react-gtm-kit/next';

export default function Layout({ children }) {
  useTrackPageViews({ client }); // Error! Hooks can't run on server
}

// CORRECT - separate client component
// app/gtm-provider.tsx
'use client';
import { useTrackPageViews } from '@react-gtm-kit/next';

export function GtmProvider({ children }) {
  useTrackPageViews({ client });
  return <>{children}</>;
}
```

### Problem: Page views not tracking on navigation

**Cause:** Client not initialized or `useTrackPageViews` not called.

**Checklist:**
1. Is the client created and `init()` called?
2. Is `useTrackPageViews` in a client component?
3. Is the client component mounted in the layout?

```tsx
// Verify in browser console
window.dataLayer.filter(e => e.event === 'page_view')
```

### Problem: Hydration mismatch warnings

**Cause:** Server and client rendering different content.

The `GtmHeadScript` and `GtmNoScript` components are designed to be server-safe. If you see hydration warnings:

1. Ensure GTM container ID is the same on server and client
2. Don't conditionally render GTM based on client-only state

---

## StrictMode & Development

### Problem: Events fire twice in development

**Expected behavior.** React StrictMode intentionally double-invokes effects to help find bugs. The library handles cleanup correctly.

**To verify production behavior:**
```bash
npm run build && npm run start
```

Events should fire once in production builds.

### Problem: Warning about config changes

```
[react-gtm-kit] GtmProvider received new configuration...
```

**Cause:** Config object recreated on each render.

```tsx
// WRONG - new object every render
<GtmProvider config={{ containers: 'GTM-XXXXXX' }}>

// CORRECT - stable reference
const gtmConfig = { containers: 'GTM-XXXXXX' };

function App() {
  return <GtmProvider config={gtmConfig}>...</GtmProvider>;
}

// OR with useMemo
function App() {
  const gtmConfig = useMemo(() => ({ containers: 'GTM-XXXXXX' }), []);
  return <GtmProvider config={gtmConfig}>...</GtmProvider>;
}
```

---

## CSP & Security

### Problem: Script blocked by Content Security Policy

**Error:**
```
Refused to load the script 'https://www.googletagmanager.com/gtm.js'
because it violates the Content-Security-Policy directive
```

**Solution 1:** Add GTM to your CSP

```
script-src 'self' https://www.googletagmanager.com;
```

**Solution 2:** Use nonce-based CSP

```tsx
// Generate nonce on server
const nonce = generateNonce();

// Pass to GTM
<GtmHeadScript
  containers="GTM-XXXXXX"
  scriptAttributes={{ nonce }}
/>

// CSP header
script-src 'nonce-${nonce}';
```

### Problem: Noscript iframe blocked

Add to CSP:
```
frame-src https://www.googletagmanager.com;
```

---

## Testing

### Problem: Tests fail with "document is not defined"

**Cause:** Running in Node.js without DOM.

**Solution:** Use jsdom or mock the client:

```ts
// jest.setup.js
import '@testing-library/jest-dom';

// Mock for unit tests
jest.mock('@react-gtm-kit/core', () => ({
  createGtmClient: jest.fn(() => ({
    init: jest.fn(),
    push: jest.fn(),
    teardown: jest.fn(),
    // ... other methods
  }))
}));
```

### Problem: Tests pollute each other

**Cause:** GTM state persists between tests.

**Solution:** Call `teardown()` after each test:

```ts
let client;

beforeEach(() => {
  client = createGtmClient({ containers: 'GTM-TEST' });
  client.init();
});

afterEach(() => {
  client.teardown(); // Cleans up scripts and dataLayer
});
```

### Problem: Can't verify events in tests

**Solution:** Check the dataLayer directly:

```ts
test('tracks purchase', () => {
  const client = createGtmClient({ containers: 'GTM-TEST' });
  client.init();

  pushEvent(client, 'purchase', { value: 100 });

  const dataLayer = window.dataLayer;
  const purchaseEvent = dataLayer.find(e => e.event === 'purchase');

  expect(purchaseEvent).toEqual({
    event: 'purchase',
    value: 100
  });
});
```

---

## Still Stuck?

1. **Check the examples:** [examples/](./examples/) has working implementations
2. **Search existing issues:** [GitHub Issues](https://github.com/react-gtm-kit/react-gtm-kit/issues)
3. **Open a new issue:** Include your setup, code, and what you've tried

---

## Debug Checklist

When something isn't working, check these in order:

```
□ Is the container ID correct? (GTM-XXXXXX format)
□ Is client.init() being called?
□ Is there only one client instance?
□ Are events appearing in window.dataLayer?
□ Are scripts appearing in the DOM?
□ Is GTM Preview mode showing the tags?
□ Are there CSP errors in the console?
□ Is consent configured correctly in GTM?
```
