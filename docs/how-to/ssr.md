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

## CSP and sanitization considerations

- The helper escapes all attribute values so you can safely inject the generated string into HTML templates without additional escaping.
- If you rely on strict Content Security Policies, remember to allow the GTM host (or your custom host) in the `frame-src` directive so the iframe can load.
- When using non-default hosts, document the change with your team so they align with consent and data residency requirements.

## Testing recommendations

- Add server-side rendering tests that assert the noscript markup is present in the rendered HTML.
- Include automated smoke tests that render pages with JavaScript disabled to verify the iframe loads and triggers the expected GTM requests.
- Pair the noscript helper with the CSP nonce support provided by the loader utilities to cover both JavaScript-enabled and disabled scenarios.
