# Server-side rendering and noscript integration

This guide outlines how to render Google Tag Manager noscript fallbacks and work with strict CSP policies when using the React GTM Kit core package.

## Rendering the noscript iframe

The core package exposes a `createNoscriptMarkup` helper that produces the recommended `<noscript>` iframe string for each GTM container. Render the string near the opening `<body>` tag when doing SSR so that users without JavaScript can still trigger GTM tags.

```ts
import { createNoscriptMarkup } from '@react-gtm-kit/core';

const noscript = createNoscriptMarkup('GTM-XXXX');
// Inject `noscript` into your server-rendered template near the opening <body>
```

Pass a container descriptor if you need to add environment parameters (`gtm_auth`, `gtm_preview`, etc.). You can also provide a custom host—for example when loading GTM through a server-side tagging domain.

```ts
const noscript = createNoscriptMarkup(
  { id: 'GTM-XXXX', queryParams: { gtm_preview: 'env-123' } },
  {
    host: 'https://tag.example.com',
    defaultQueryParams: { gtm_auth: 'auth-token' }
  }
);
```

The helper automatically merges default query params with container-specific params and ensures attributes match Google’s recommended defaults (`height="0"`, `width="0"`, `style="display:none;visibility:hidden"`). Override any of those by passing `iframeAttributes` if your layout requires additional metadata (for example a `class` for CSP tuning).

```ts
const noscript = createNoscriptMarkup('GTM-XXXX', {
  iframeAttributes: { class: 'gtm-noscript', title: 'GTM fallback' }
});
```

## Hydrating an existing data layer on the client

When you server-render GTM markup you can prime the `dataLayer` with consent defaults or page context. The core client now
inspects any existing array before it initializes and deduplicates values so hydration does not emit duplicate commands.

- If the server already pushed the `gtm.js` start event, the client skips injecting a second copy even though the timestamp
  differs from the server-rendered value.
- Consent commands (`default` and `update`) are serialized and compared so calling `setConsentDefaults` on both the server and
  client results in a single data layer entry.
- Repeated calls with the same payload before initialization are dropped from the queue, preventing noisy duplicates when CMPs
  or frameworks rerun bootstrap logic.

```ts
// Example server bootstrapping
res.locals.dataLayer = [
  { event: 'gtm.js', 'gtm.start': Date.now() },
  ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' }]
];

// Client hydration
import { createGtmClient } from '@react-gtm-kit/core';

const client = createGtmClient({ containers: 'GTM-XXXX', dataLayerName: 'dataLayer' });
client.setConsentDefaults({ analytics_storage: 'denied', ad_storage: 'denied' });
client.init();
```

After hydration the data layer still contains a single start event and consent command, keeping analytics tools aligned across
environments.

## CSP and sanitization considerations

- The helper escapes all attribute values so you can safely inject the generated string into HTML templates without additional escaping.
- If you rely on strict Content Security Policies, remember to allow the GTM host (or your custom host) in the `frame-src` directive so the iframe can load.
- When using non-default hosts, document the change with your team so they align with consent and data residency requirements.

## Testing recommendations

- Add server-side rendering tests that assert the noscript markup is present in the rendered HTML.
- Include automated smoke tests that render pages with JavaScript disabled to verify the iframe loads and triggers the expected GTM requests.
- Pair the noscript helper with the CSP nonce support provided by the loader utilities to cover both JavaScript-enabled and disabled scenarios.

## Applying CSP nonces to injected scripts

Strict Content Security Policies typically require that inline scripts include a nonce that matches the one issued for the request. Pass that nonce through the GTM client options so every injected `<script>` tag carries the correct attribute:

```ts
import { createGtmClient } from '@react-gtm-kit/core';

const client = createGtmClient({
  containers: 'GTM-XXXX',
  scriptAttributes: {
    nonce: cspNonce,
    async: true
  }
});

client.init();
```

Any additional attributes you provide in `scriptAttributes` will be copied onto the injected script elements, so you can include diagnostics hooks such as `data-*` attributes alongside the nonce.
