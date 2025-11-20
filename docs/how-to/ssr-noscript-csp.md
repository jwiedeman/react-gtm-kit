# SSR noscript rendering with CSP nonces

Render the GTM noscript fallback alongside CSP-compliant script tags to support users who disable JavaScript while satisfying strict content security policies.

## Generate noscript markup on the server

Use `createNoscriptMarkup` to build the iframe string during server rendering. Pair it with container descriptors so environment parameters and custom hosts are represented in the fallback URL.

```ts
import { createNoscriptMarkup } from '@react-gtm-kit/core';

const noscript = createNoscriptMarkup(
  { id: 'GTM-XXXX', queryParams: { gtm_auth: 'auth-token', gtm_preview: 'env-1' } },
  { host: 'https://tag.example.com' }
);

// Inject `noscript` near the opening <body> of your HTML template
```

The helper escapes all attributes and applies Google’s recommended defaults (`height="0"`, `width="0"`, `style="display:none;visibility:hidden"`). Override them with `iframeAttributes` if you need extra metadata (for example, `title` or `referrerpolicy`).

## Attach CSP nonces to injected scripts

Issue a per-request nonce from your server, then forward it to the GTM client via `scriptAttributes`. Every injected `<script>` tag inherits the nonce so it passes CSP checks.

```ts
// server.ts
const cspNonce = crypto.randomUUID();
res.render('page', { cspNonce });
```

```tsx
// app/layout.tsx (React/Next.js)
import { createGtmClient } from '@react-gtm-kit/core';

export function GtmBridge({ nonce }: { nonce: string }) {
  const client = createGtmClient({
    containers: 'GTM-XXXX',
    scriptAttributes: { nonce }
  });

  client.init();
  return null;
}
```

When running under strict CSP headers, add the GTM host (or your custom host) to `script-src` and `frame-src` directives to keep both the script and noscript iframe loading.

## Keep hydration aligned with existing data layer state

If the server pushes consent defaults or a `gtm.js` start event into the data layer before HTML is sent, the client deduplicates those entries during hydration. This prevents double events while still delivering noscript coverage for JavaScript-disabled users.

```ts
// Server-side hydration seed
const dataLayer = [
  { event: 'gtm.js', 'gtm.start': Date.now() },
  ['consent', 'default', { ad_storage: 'denied', analytics_storage: 'granted' }]
];
```

```ts
// Client
const client = createGtmClient({ containers: 'GTM-XXXX', dataLayerName: 'dataLayer' });
client.setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'granted' });
client.init();
```

The noscript iframe fires immediately for non-JS sessions, while JavaScript-enabled users keep a clean data layer with single instances of each command after hydration.

## Test the flow end-to-end

- Run SSR tests that assert the rendered HTML includes the noscript string and a nonce-bearing GTM `<script>` tag.
- Add a smoke test with JavaScript disabled (for example, via Playwright) to confirm the iframe hits the expected host.
- Validate that CSP headers include both the GTM domain and any custom hosts you configured.
