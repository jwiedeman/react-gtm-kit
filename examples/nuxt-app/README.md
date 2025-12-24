# Nuxt 3 + GTM Kit Example

This example demonstrates how to integrate GTM Kit with a Nuxt 3 application, including SSR support and automatic page tracking.

## Quick Start

```bash
# From the monorepo root
pnpm install

# Start the development server
pnpm --filter @gtm-kit/example-nuxt-app dev
```

Open http://localhost:3000 to view the app.

## Features Demonstrated

- Client-side GTM initialization (SSR-safe)
- Automatic page view tracking with Nuxt Router
- Consent Mode v2 with GDPR defaults
- Cookie banner with consent management
- Event tracking from Vue components

## Project Structure

```
nuxt-app/
├── app.vue                  # Page tracking setup
├── nuxt.config.ts           # Nuxt configuration
├── plugins/
│   └── gtm.client.ts        # GTM plugin (client-only)
├── components/
│   └── CookieBanner.vue     # Consent management
├── layouts/
│   └── default.vue          # Main layout
├── pages/
│   ├── index.vue
│   ├── products.vue
│   └── about.vue
└── package.json
```

## Setup Walkthrough

### 1. Install Packages

```bash
npm install @jwiedeman/gtm-kit @jwiedeman/gtm-kit-nuxt @jwiedeman/gtm-kit-vue
```

### 2. Create GTM Plugin (plugins/gtm.client.ts)

The `.client.ts` suffix ensures this only runs on the client side.

```typescript
import { GtmPlugin, type GtmPluginOptions } from '@jwiedeman/gtm-kit-vue';
import { consentPresets } from '@jwiedeman/gtm-kit';

export default defineNuxtPlugin((nuxtApp) => {
  const gtmOptions: GtmPluginOptions = {
    containers: 'GTM-XXXXXX', // Replace with your GTM ID
    dataLayerName: 'nuxtAppDataLayer',
    onBeforeInit: (client) => {
      // Set GDPR-compliant consent defaults
      client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });
    }
  };

  // Install the Vue plugin on the Nuxt Vue app
  nuxtApp.vueApp.use(GtmPlugin, gtmOptions);
});
```

### 3. Add Automatic Page Tracking (app.vue)

```vue
<script setup lang="ts">
import { useTrackPageViews } from '@jwiedeman/gtm-kit-nuxt';

const route = useRoute();

useTrackPageViews({
  route,
  eventName: 'page_view',
  includeQueryParams: true,
  trackInitialPageView: true
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### 4. Track Events from Components

```vue
<script setup lang="ts">
import { useNuxtGtmPush } from '@jwiedeman/gtm-kit-nuxt';

const push = useNuxtGtmPush();

const handleClick = () => {
  push({
    event: 'button_click',
    button_name: 'cta_hero'
  });
};
</script>

<template>
  <button @click="handleClick">Click Me</button>
</template>
```

### 5. Manage Consent (components/CookieBanner.vue)

```vue
<script setup lang="ts">
import { useNuxtGtmConsent } from '@jwiedeman/gtm-kit-nuxt';

const { update } = useNuxtGtmConsent();

const acceptAll = () => {
  update({
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });
};
</script>

<template>
  <div class="cookie-banner">
    <button @click="acceptAll">Accept All</button>
  </div>
</template>
```

## SSR Considerations

GTM Kit is designed to work safely with Nuxt's SSR:

1. **Client-only plugin**: The `.client.ts` suffix ensures GTM only initializes on the client
2. **No server-side window access**: All window/document access is guarded
3. **Hydration-safe**: The data layer is initialized after Vue hydrates

## Available Composables

```typescript
import {
  useNuxtGtm, // Full GTM context (push, client, consent)
  useNuxtGtmPush, // Just the push function
  useNuxtGtmConsent, // Consent management (update, setDefaults)
  useNuxtGtmClient, // Raw GTM client instance
  useTrackPageViews // Automatic page view tracking
} from '@jwiedeman/gtm-kit-nuxt';
```

## Testing

```bash
# Build the app
pnpm --filter @gtm-kit/example-nuxt-app build

# Preview the built app
pnpm --filter @gtm-kit/example-nuxt-app preview

# Run E2E tests
pnpm e2e:test
```

## Debugging

1. Open Chrome DevTools
2. In the Console, type `nuxtAppDataLayer` to inspect events
3. Use GTM Preview mode for real-time debugging
4. Check that events fire on route changes

## Common Issues

### GTM not initializing

- Ensure the plugin file ends with `.client.ts`
- Verify the GTM ID is correct
- Check browser console for errors

### Page views not tracking on navigation

- Make sure `useTrackPageViews` is called in `app.vue` or a layout
- Verify `useRoute()` is available (should be auto-imported)
- Check that `trackInitialPageView` is set to `true`

### SSR errors

- Never access `window` or `document` in server-side code
- Use `.client.ts` for client-only plugins
- Guard browser APIs with `typeof window !== 'undefined'`

### Consent not persisting

- Implement cookie storage for consent preferences
- Update consent on app mount based on stored preferences

## Advanced: Alternative Plugin Setup

You can also use `createNuxtGtmPlugin` for a more explicit setup:

```typescript
// plugins/gtm.client.ts
import { createNuxtGtmPlugin } from '@jwiedeman/gtm-kit-nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  const client = createNuxtGtmPlugin(nuxtApp.vueApp, {
    containers: 'GTM-XXXXXX',
    trackPageViews: true,
    pageViewEventName: 'page_view'
  });

  // Optionally expose client globally
  return {
    provide: {
      gtmClient: client
    }
  };
});
```

## Learn More

- [GTM Kit Documentation](https://github.com/jwiedeman/GTM-Kit)
- [Nuxt 3 Documentation](https://nuxt.com/)
- [Google Tag Manager](https://tagmanager.google.com/)
- [Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent)
