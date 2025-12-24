# React GTM Kit × Next.js example

This example demonstrates how to combine the Next.js App Router with React GTM Kit. It stitches together the head/no-script
helpers, the React provider, Consent Mode toggles, and the page-view listener so you can validate end-to-end flows locally.

## What it showcases

- **Head + noscript helpers** – `GtmHeadScript` and `GtmNoScript` render on the server with a CSP nonce so the bundle works with
  strict security headers.
- **React provider bridge** – `GtmProvider` initializes the GTM client, queues pre-init pushes, and exposes consent helpers.
- **App Router awareness** – `useTrackPageViews` automatically fires `page_view` events as you navigate between home, pricing,
  and parameterized product routes.
- **Consent Mode toggles** – The floating banner flips consent signals between denied and granted states using GTM’s Consent Mode
  command array.
- **Edge/runtime compatibility** – Middleware seeds a consent cookie in the Edge runtime so App Router layouts can safely share
  CSP nonces and consent defaults across requests.

## Running the example

```bash
pnpm install
pnpm --filter @gtm-kit/example-next-app dev
```

The dev server binds to `127.0.0.1:3000` by default. Navigate around the app and check the browser console for the
`nextAppDataLayer` contents to see page_view events and consent updates.

## Production build

```bash
pnpm --filter @gtm-kit/example-next-app build
pnpm --filter @gtm-kit/example-next-app start
```

This runs `next start` with the same CSP-aware markup so you can test route transitions in a production bundle.
