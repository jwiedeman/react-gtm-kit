# Content Security Policy (CSP) Troubleshooting Guide

This guide helps you configure Content Security Policy headers to work with GTM-Kit and Google Tag Manager.

---

## Table of Contents

- [Understanding CSP](#understanding-csp)
- [Common CSP Errors](#common-csp-errors)
- [Required CSP Directives](#required-csp-directives)
- [Nonce-Based CSP](#nonce-based-csp)
- [Framework-Specific Configuration](#framework-specific-configuration)
- [Debugging CSP Issues](#debugging-csp-issues)

---

## Understanding CSP

Content Security Policy (CSP) is a security feature that helps prevent XSS attacks by controlling which resources can be loaded on your page.

### How CSP Affects GTM

Google Tag Manager requires:

1. Loading the GTM script from Google's servers
2. Executing inline scripts (the GTM snippet)
3. Loading additional scripts from various domains (depending on your tags)
4. Creating iframes for certain features

A restrictive CSP can block any of these, breaking GTM functionality.

---

## Common CSP Errors

### Error: "Refused to load the script"

```
Refused to load the script 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXX'
because it violates the following Content Security Policy directive: "script-src 'self'"
```

**Cause:** `script-src` doesn't include `googletagmanager.com`

**Solution:**

```
script-src 'self' https://www.googletagmanager.com;
```

---

### Error: "Refused to execute inline script"

```
Refused to execute inline script because it violates the following Content Security Policy
directive: "script-src 'self'". Either the 'unsafe-inline' keyword, a hash, or a nonce
is required to enable inline execution.
```

**Cause:** Inline scripts blocked without nonce or hash

**Solution (using nonce):**

```
script-src 'self' 'nonce-abc123' https://www.googletagmanager.com;
```

And add the nonce to your scripts:

```html
<script nonce="abc123">
  // GTM initialization
</script>
```

---

### Error: "Refused to frame"

```
Refused to frame 'https://www.googletagmanager.com/' because it violates the following
Content Security Policy directive: "frame-src 'self'"
```

**Cause:** `frame-src` doesn't include GTM domain (for noscript iframe or preview mode)

**Solution:**

```
frame-src 'self' https://www.googletagmanager.com;
```

---

### Error: "Refused to connect"

```
Refused to connect to 'https://www.google-analytics.com/g/collect'
because it violates the following Content Security Policy directive: "connect-src 'self'"
```

**Cause:** Analytics beacons blocked

**Solution:**

```
connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com;
```

---

## Required CSP Directives

### Minimal CSP for GTM

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com;
  connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com;
  img-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com;
  frame-src 'self' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
```

### Full CSP with Common Google Services

```
Content-Security-Policy:
  default-src 'self';

  script-src
    'self'
    'nonce-{NONCE}'
    https://www.googletagmanager.com
    https://www.google-analytics.com
    https://ssl.google-analytics.com
    https://tagmanager.google.com
    https://www.googleadservices.com
    https://googleads.g.doubleclick.net
    https://www.google.com/recaptcha/
    https://www.gstatic.com/recaptcha/;

  connect-src
    'self'
    https://www.google-analytics.com
    https://analytics.google.com
    https://*.google-analytics.com
    https://*.analytics.google.com
    https://stats.g.doubleclick.net
    https://www.googleadservices.com;

  img-src
    'self'
    data:
    https://www.google-analytics.com
    https://www.googletagmanager.com
    https://*.google-analytics.com
    https://www.google.com
    https://www.google.com.au
    https://googleads.g.doubleclick.net
    https://www.google.com/ads/;

  frame-src
    'self'
    https://www.googletagmanager.com
    https://www.google.com/recaptcha/
    https://recaptcha.google.com
    https://td.doubleclick.net
    https://www.youtube.com;

  style-src
    'self'
    'unsafe-inline'
    https://tagmanager.google.com
    https://fonts.googleapis.com;

  font-src
    'self'
    https://fonts.gstatic.com;
```

---

## Nonce-Based CSP

Nonces (number used once) are the recommended approach for allowing inline scripts with CSP.

### How Nonces Work

1. Server generates a unique random nonce for each request
2. Nonce is added to CSP header: `script-src 'nonce-abc123'`
3. Nonce is added to script tags: `<script nonce="abc123">`
4. Browser only executes scripts with matching nonce

### Generating Nonces

```javascript
// Node.js
const crypto = require('crypto');
const nonce = crypto.randomBytes(16).toString('base64');

// Alternatively
const nonce = crypto.randomUUID();
```

### Using Nonces with GTM-Kit

```typescript
// Pass nonce to script attributes
createGtmClient({
  containers: 'GTM-XXXXXX',
  scriptAttributes: {
    nonce: yourGeneratedNonce
  }
});
```

### Server Components (Next.js, Remix)

```tsx
// Next.js App Router
import { headers } from 'next/headers';
import { GtmHeadScript } from '@jwiedeman/gtm-kit-next';

export default function RootLayout({ children }) {
  const headersList = headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html>
      <head>
        <GtmHeadScript containers="GTM-XXXXXX" scriptAttributes={{ nonce }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// Remix
import { GtmScripts } from '@jwiedeman/gtm-kit-remix';

export default function Document() {
  // Get nonce from loader or context
  const nonce = useLoaderData().nonce;

  return (
    <html>
      <head>
        <GtmScripts containers="GTM-XXXXXX" scriptAttributes={{ nonce }} />
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

### Astro

```astro
---
import { GtmHead } from '@jwiedeman/gtm-kit-astro';

// Generate nonce (in middleware or here)
const nonce = crypto.randomUUID();
---

<html>
  <head>
    <GtmHead
      containers="GTM-XXXXXX"
      scriptAttributes={{ nonce }}
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

---

## Framework-Specific Configuration

### Next.js

```javascript
// next.config.js
const crypto = require('crypto');

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'nonce-{nonce}' https://www.googletagmanager.com;
              connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com;
              img-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;
              frame-src 'self' https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline';
            `
              .replace(/\s+/g, ' ')
              .trim()
          }
        ]
      }
    ];
  }
};
```

For dynamic nonces, use middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  response.headers.set('x-nonce', nonce);
  response.headers.set(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com;`
  );

  return response;
}
```

### Remix

```typescript
// entry.server.tsx
import crypto from 'crypto';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const nonce = crypto.randomBytes(16).toString('base64');

  responseHeaders.set(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com;`
  );

  // Pass nonce to your app via context or loader
  return renderToString(
    <RemixServer context={{ ...remixContext, nonce }} url={request.url} />
  );
}
```

### Express

```javascript
const express = require('express');
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, 'https://www.googletagmanager.com'],
      connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://*.google-analytics.com'],
      imgSrc: ["'self'", 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
      frameSrc: ["'self'", 'https://www.googletagmanager.com'],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  })
);
```

### Nginx

```nginx
# nginx.conf
set $nonce $request_id;  # Or use a module for proper nonce generation

add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-$nonce' https://www.googletagmanager.com;
  connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com;
  img-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;
  frame-src 'self' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
" always;

# Pass nonce to application
proxy_set_header X-Nonce $nonce;
```

### Apache

```apache
# .htaccess or httpd.conf
Header set Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com; img-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; frame-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline';"
```

---

## Debugging CSP Issues

### 1. Browser DevTools

Open DevTools Console (F12) and look for CSP violation errors:

```
[Report Only] Refused to load the script 'https://...' because it violates...
```

### 2. Report-Only Mode

Test CSP changes without breaking your site:

```
Content-Security-Policy-Report-Only: script-src 'self' https://www.googletagmanager.com;
```

### 3. CSP Reporting

Collect CSP violation reports:

```
Content-Security-Policy: ...; report-uri /csp-report-endpoint;

# Or newer report-to directive
Content-Security-Policy: ...; report-to csp-endpoint;
Report-To: {"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"/csp-report"}]}
```

### 4. GTM Preview Mode

GTM Preview mode may require additional CSP directives:

```
frame-src 'self' https://www.googletagmanager.com https://tagassistant.google.com;
connect-src 'self' ... https://www.googletagmanager.com wss://www.googletagmanager.com;
```

### 5. Common Debugging Steps

1. **Start permissive, then restrict:**

   ```
   script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
   ```

   Then gradually remove permissions until you find what's needed.

2. **Check all console errors:**
   Each blocked resource will have a separate error.

3. **Test with different tags:**
   Disable GTM tags one by one to identify which tag requires specific CSP permissions.

4. **Check third-party requirements:**
   Each tag vendor (Facebook, LinkedIn, etc.) has their own CSP requirements.

---

## GTM Tags CSP Requirements

### Google Analytics 4

```
script-src https://www.googletagmanager.com https://www.google-analytics.com;
connect-src https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com;
img-src https://www.google-analytics.com;
```

### Google Ads Conversion

```
script-src https://www.googleadservices.com https://googleads.g.doubleclick.net;
connect-src https://www.googleadservices.com;
img-src https://www.google.com https://googleads.g.doubleclick.net;
frame-src https://td.doubleclick.net;
```

### Facebook Pixel

```
script-src https://connect.facebook.net;
connect-src https://www.facebook.com;
img-src https://www.facebook.com;
```

### LinkedIn Insight

```
script-src https://snap.licdn.com;
connect-src https://px.ads.linkedin.com;
img-src https://px.ads.linkedin.com https://www.linkedin.com;
```

### Hotjar

```
script-src https://*.hotjar.com;
connect-src https://*.hotjar.com wss://*.hotjar.com;
img-src https://*.hotjar.com;
frame-src https://*.hotjar.com;
font-src https://*.hotjar.com;
```

---

## Security Best Practices

### Do's

1. **Use nonces** instead of `'unsafe-inline'` when possible
2. **Be specific** with domains (use `https://www.googletagmanager.com` not `https:`)
3. **Use report-only** mode first to test changes
4. **Keep CSP updated** when adding new GTM tags
5. **Document** which tags require which CSP directives

### Don'ts

1. **Don't use `'unsafe-eval'`** unless absolutely required
2. **Don't use wildcard `*`** for script sources
3. **Don't disable CSP** just because GTM isn't working
4. **Don't forget** to update CSP when adding new marketing tags

---

## Troubleshooting Checklist

- [ ] CSP includes `https://www.googletagmanager.com` in `script-src`
- [ ] Nonces are properly generated and passed to script tags
- [ ] `connect-src` includes analytics domains
- [ ] `frame-src` includes GTM for noscript iframe
- [ ] All GTM tags' third-party domains are included
- [ ] Tested in GTM Preview mode
- [ ] No CSP errors in browser console
- [ ] Report-Only mode tested before enforcing

---

_For the latest CSP requirements, check Google's official documentation as requirements may change._
