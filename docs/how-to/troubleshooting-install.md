# Installation Troubleshooting

This guide helps you resolve common issues when installing and setting up GTM Kit.

## Quick Diagnosis

Run these commands to identify issues:

```bash
# Check if packages are installed
npm list @react-gtm-kit/core

# Verify GTM ID format
npx @react-gtm-kit/cli validate GTM-XXXXXX

# Check for conflicting GTM scripts
# Open browser console and run:
document.querySelectorAll('script[src*="googletagmanager"]')
```

## Common Issues

### 1. "Module not found" Error

**Symptoms:**
```
Error: Cannot find module '@react-gtm-kit/core'
```

**Solutions:**

```bash
# 1. Ensure packages are installed
npm install @react-gtm-kit/core

# 2. For framework-specific packages, install both
npm install @react-gtm-kit/core @react-gtm-kit/react-modern  # React
npm install @react-gtm-kit/core @react-gtm-kit/vue           # Vue
npm install @react-gtm-kit/core @react-gtm-kit/next          # Next.js
npm install @react-gtm-kit/core @react-gtm-kit/nuxt          # Nuxt

# 3. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 4. For monorepos, ensure workspace dependencies are linked
pnpm install  # or yarn install
```

### 2. GTM Script Not Loading

**Symptoms:**
- No script tag in DOM
- No network request to googletagmanager.com
- `dataLayer` is undefined

**Debug Steps:**

```javascript
// Check if client is initialized
console.log('GTM initialized:', client.isInitialized());

// Check data layer
console.log('dataLayer:', window.dataLayer);

// Check for script
console.log('GTM script:', document.querySelector('script[src*="googletagmanager"]'));
```

**Solutions:**

```typescript
// 1. Ensure init() is called
const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init(); // Don't forget this!

// 2. For React, wrap your app with GtmProvider
<GtmProvider containers="GTM-XXXXXX">
  <App />
</GtmProvider>

// 3. For Vue, install the plugin
app.use(GtmPlugin, { containers: 'GTM-XXXXXX' });

// 4. For SSR frameworks, ensure client-side initialization
// Next.js: Use 'use client' directive
// Nuxt: Use .client.ts plugin suffix
```

### 3. Invalid GTM Container ID

**Symptoms:**
```
Error: Invalid GTM container ID format
```

**Solution:**

GTM IDs must follow the format `GTM-XXXXXX`:
- Starts with `GTM-`
- Followed by 6-8 alphanumeric characters
- All uppercase

```typescript
// Valid
'GTM-ABC1234'
'GTM-ABCD12'
'GTM-ABCD1234'

// Invalid
'gtm-abc1234'    // lowercase
'G-ABC123'       // GA4 ID, not GTM
'UA-123456-1'    // Universal Analytics ID
'GTM-ABC'        // too short
```

### 4. Consent Mode Not Working

**Symptoms:**
- No consent commands in dataLayer
- Analytics firing before consent

**Solutions:**

```typescript
// 1. Set consent BEFORE init()
const client = createGtmClient({ containers: 'GTM-XXXXXX' });

// Set defaults first
client.setConsentDefaults({
  analytics_storage: 'denied',
  ad_storage: 'denied'
});

// Then initialize
client.init();

// 2. Use onBeforeInit callback
const client = createGtmClient({
  containers: 'GTM-XXXXXX',
  onBeforeInit: (c) => {
    c.setConsentDefaults({ analytics_storage: 'denied' });
  }
});
```

### 5. Multiple GTM Scripts Loading

**Symptoms:**
- Duplicate script tags
- Events firing twice
- Performance issues

**Debug:**
```javascript
console.log('GTM scripts:', document.querySelectorAll('script[src*="gtm.js"]').length);
```

**Solutions:**

```typescript
// 1. Remove any hardcoded GTM snippets from index.html
// GTM Kit handles script injection

// 2. Check for duplicate init() calls
if (!client.isInitialized()) {
  client.init();
}

// 3. In React, ensure single GtmProvider at root level
// Don't nest providers or call init multiple times

// 4. Use teardown() in tests
afterEach(() => {
  client.teardown();
});
```

### 6. TypeScript Errors

**Symptoms:**
```
Property 'push' does not exist on type...
Type '...' is not assignable to type...
```

**Solutions:**

```typescript
// 1. Import types explicitly
import type { GtmClient, ConsentState } from '@react-gtm-kit/core';

// 2. Use proper typing for events
interface CustomEvent {
  event: string;
  [key: string]: unknown;
}

client.push<CustomEvent>({ event: 'custom', myField: 'value' });

// 3. Check tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16"
    "esModuleInterop": true
  }
}
```

### 7. CSP (Content Security Policy) Errors

**Symptoms:**
```
Refused to load the script 'https://www.googletagmanager.com/gtm.js'
because it violates the following Content Security Policy directive
```

**Solutions:**

```typescript
// 1. Add nonce to scripts
const client = createGtmClient({
  containers: 'GTM-XXXXXX',
  scriptAttributes: {
    nonce: 'your-nonce-value'
  }
});

// 2. For Next.js, get nonce from headers
import { headers } from 'next/headers';

export default function RootLayout() {
  const nonce = headers().get('x-nonce') ?? undefined;

  return (
    <GtmProvider
      containers="GTM-XXXXXX"
      scriptAttributes={{ nonce }}
    >
      {/* ... */}
    </GtmProvider>
  );
}

// 3. Update your CSP header to allow GTM
// script-src 'nonce-xxx' https://www.googletagmanager.com
```

### 8. SSR Hydration Mismatch

**Symptoms:**
```
Hydration failed because the initial UI does not match
Warning: Expected server HTML to contain a matching <script>
```

**Solutions:**

```typescript
// 1. For Next.js, use client components
'use client';

import { GtmProvider } from '@react-gtm-kit/react-modern';

// 2. For Nuxt, use .client.ts plugin
// plugins/gtm.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  // Only runs on client
});

// 3. Check for window/document access on server
if (typeof window !== 'undefined') {
  // Client-side only code
}
```

### 9. Events Not Appearing in GTM

**Symptoms:**
- dataLayer shows events
- GTM Preview mode shows nothing

**Checklist:**

1. **Container ID matches GTM**: Double-check the ID
2. **GTM Preview mode connected**: Use GTM debugger
3. **Triggers configured**: Events need triggers in GTM
4. **Data layer name matches**: Use same name in GTM container settings

```typescript
// If using custom data layer name
const client = createGtmClient({
  containers: 'GTM-XXXXXX',
  dataLayerName: 'customDataLayer'
});

// Make sure GTM container is configured to use 'customDataLayer'
```

### 10. Bundle Size Issues

**Symptoms:**
- Larger than expected bundle
- Warning about chunk size

**Solutions:**

```bash
# Check bundle size
pnpm size

# GTM Kit core is ~3.7KB gzipped
# If larger, check for duplicate dependencies
```

```typescript
// Use tree-shaking friendly imports
import { createGtmClient } from '@react-gtm-kit/core';
// Not: import * as GtmKit from '@react-gtm-kit/core';
```

## Framework-Specific Issues

### React

```typescript
// Issue: useGtmPush returns undefined
// Solution: Ensure component is inside GtmProvider
<GtmProvider containers="GTM-XXXXXX">
  <YourComponent /> {/* useGtmPush works here */}
</GtmProvider>
```

### Next.js

```typescript
// Issue: Server/client mismatch
// Solution: Mark GTM components as client-only
'use client';

import { GtmProvider } from '@react-gtm-kit/react-modern';
```

### Vue

```typescript
// Issue: Plugin not installed error
// Solution: Install plugin before mounting
app.use(GtmPlugin, { containers: 'GTM-XXXXXX' });
app.mount('#app'); // After plugin
```

### Nuxt

```typescript
// Issue: Composables not available
// Solution: Use inside setup() and ensure plugin is .client.ts
<script setup>
import { useNuxtGtmPush } from '@react-gtm-kit/nuxt';

const push = useNuxtGtmPush(); // Works
</script>
```

## Getting Help

If you're still stuck:

1. **Check existing issues**: [GitHub Issues](https://github.com/react-gtm-kit/react-gtm-kit/issues)
2. **Search documentation**: Review all docs in `/docs`
3. **Create minimal reproduction**: Isolate the issue
4. **Open an issue**: Include:
   - GTM Kit version
   - Framework and version
   - Error message
   - Code snippet
   - Steps to reproduce

## Debug Mode

Enable verbose logging:

```typescript
const client = createGtmClient({
  containers: 'GTM-XXXXXX',
  logger: {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  }
});
```
