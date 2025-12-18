/**
 * Code generation utilities for GTM Kit CLI
 *
 * Generates framework-specific setup code that users can copy/paste
 */

import type { Framework } from './detect';

export interface SetupCodeOptions {
  /** Target framework */
  framework: Framework;
  /** GTM container ID(s) */
  containers: string | string[];
  /** Custom data layer name */
  dataLayerName?: string;
  /** Include consent mode setup */
  includeConsent?: boolean;
  /** Use TypeScript */
  typescript?: boolean;
}

interface GeneratedCode {
  /** Filename to create */
  filename: string;
  /** File contents */
  content: string;
  /** Description of what this file does */
  description: string;
}

/**
 * Generates setup code for the specified framework
 */
export const generateSetupCode = (options: SetupCodeOptions): GeneratedCode[] => {
  const { framework, containers, dataLayerName, includeConsent = false, typescript = true } = options;

  const ext = typescript ? 'ts' : 'js';
  const containerValue = Array.isArray(containers)
    ? `[${containers.map((c) => `'${c}'`).join(', ')}]`
    : `'${containers}'`;

  switch (framework) {
    case 'next':
      return generateNextSetupCode({ containerValue, dataLayerName, includeConsent, ext });
    case 'nuxt':
      return generateNuxtSetupCode({ containerValue, dataLayerName, includeConsent, ext });
    case 'react':
      return generateReactSetupCode({ containerValue, dataLayerName, includeConsent, ext });
    case 'vue':
      return generateVueSetupCode({ containerValue, dataLayerName, includeConsent, ext });
    case 'vanilla':
    default:
      return generateVanillaSetupCode({ containerValue, dataLayerName, includeConsent, ext });
  }
};

interface CodeGenContext {
  containerValue: string;
  dataLayerName?: string;
  includeConsent: boolean;
  ext: string;
}

/**
 * Generate Next.js App Router setup code
 */
const generateNextSetupCode = (ctx: CodeGenContext): GeneratedCode[] => {
  const { containerValue, dataLayerName, includeConsent, ext } = ctx;
  const dataLayerOption = dataLayerName ? `\n    dataLayerName: '${dataLayerName}',` : '';

  const providerCode = `// app/providers/gtm-provider.${ext}x
'use client';

import { GtmProvider } from '@react-gtm-kit/react-modern';
import { useTrackPageViews } from '@react-gtm-kit/next';
${ctx.ext === 'ts' ? "import type { ReactNode } from 'react';\n" : ''}
${includeConsent ? `import { eeaDefault } from '@react-gtm-kit/core';\n` : ''}
${ctx.ext === 'ts' ? `interface GtmProviderWrapperProps {\n  children: ReactNode;\n}\n` : ''}
export function GtmProviderWrapper({ children }${ctx.ext === 'ts' ? ': GtmProviderWrapperProps' : ''}) {
  return (
    <GtmProvider
      containers={${containerValue}}${dataLayerOption}${includeConsent ? '\n      consentDefaults={eeaDefault}' : ''}
    >
      <PageViewTracker />
      {children}
    </GtmProvider>
  );
}

function PageViewTracker() {
  useTrackPageViews();
  return null;
}
`;

  const layoutCode = `// app/layout.${ext}x
import { GtmProviderWrapper } from './providers/gtm-provider';
import { GtmNoScript } from '@react-gtm-kit/next';
${ctx.ext === 'ts' ? "import type { ReactNode } from 'react';\n" : ''}
export default function RootLayout({ children }${ctx.ext === 'ts' ? ': { children: ReactNode }' : ''}) {
  return (
    <html lang="en">
      <body>
        <GtmNoScript containerId="${Array.isArray(containerValue) ? containerValue[0] : containerValue.replace(/'/g, '')}" />
        <GtmProviderWrapper>
          {children}
        </GtmProviderWrapper>
      </body>
    </html>
  );
}
`;

  const exampleUsage = `// Example: Track a button click
'use client';

import { useGtmPush } from '@react-gtm-kit/react-modern';

export function MyButton() {
  const push = useGtmPush();

  const handleClick = () => {
    push({
      event: 'button_click',
      button_name: 'signup_cta'
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}
`;

  return [
    {
      filename: `app/providers/gtm-provider.${ext}x`,
      content: providerCode,
      description: 'GTM Provider wrapper with page view tracking'
    },
    {
      filename: `app/layout.${ext}x`,
      content: layoutCode,
      description: 'Root layout with GTM noscript tag'
    },
    {
      filename: `components/example-button.${ext}x`,
      content: exampleUsage,
      description: 'Example component showing how to track events'
    }
  ];
};

/**
 * Generate Nuxt 3 setup code
 */
const generateNuxtSetupCode = (ctx: CodeGenContext): GeneratedCode[] => {
  const { containerValue, dataLayerName, includeConsent, ext } = ctx;
  const dataLayerOption = dataLayerName ? `\n    dataLayerName: '${dataLayerName}',` : '';

  const pluginCode = `// plugins/gtm.client.${ext}
import { createNuxtGtmPlugin } from '@react-gtm-kit/nuxt';
${includeConsent ? `import { eeaDefault } from '@react-gtm-kit/core';\n` : ''}
export default defineNuxtPlugin((nuxtApp) => {
  createNuxtGtmPlugin(nuxtApp.vueApp, {
    containers: ${containerValue},${dataLayerOption}
    trackPageViews: true${includeConsent ? ',\n    consentDefaults: eeaDefault' : ''}
  });
});
`;

  const pageTrackingCode = `// composables/usePageTracking.${ext}
import { useTrackPageViews } from '@react-gtm-kit/nuxt';

/**
 * Call this composable in your app.vue or layouts to enable automatic page tracking
 */
export function usePageTracking() {
  const route = useRoute();

  useTrackPageViews({
    route,
    eventName: 'page_view',
    includeQueryParams: true
  });
}
`;

  const appVueCode = `<!-- app.vue -->
<script setup${ext === 'ts' ? ' lang="ts"' : ''}>
import { usePageTracking } from '~/composables/usePageTracking';

// Enable automatic page view tracking
usePageTracking();
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
`;

  const exampleUsage = `<!-- Example: Track a button click -->
<script setup${ext === 'ts' ? ' lang="ts"' : ''}>
import { useNuxtGtmPush } from '@react-gtm-kit/nuxt';

const push = useNuxtGtmPush();

const handleClick = () => {
  push({
    event: 'button_click',
    button_name: 'signup_cta'
  });
};
</script>

<template>
  <button @click="handleClick">Sign Up</button>
</template>
`;

  return [
    {
      filename: `plugins/gtm.client.${ext}`,
      content: pluginCode,
      description: 'Nuxt plugin for GTM (client-side only)'
    },
    {
      filename: `composables/usePageTracking.${ext}`,
      content: pageTrackingCode,
      description: 'Composable for automatic page view tracking'
    },
    {
      filename: 'app.vue',
      content: appVueCode,
      description: 'App root with page tracking enabled'
    },
    {
      filename: `components/ExampleButton.vue`,
      content: exampleUsage,
      description: 'Example component showing how to track events'
    }
  ];
};

/**
 * Generate React (Vite/CRA) setup code
 */
const generateReactSetupCode = (ctx: CodeGenContext): GeneratedCode[] => {
  const { containerValue, dataLayerName, includeConsent, ext } = ctx;
  const dataLayerOption = dataLayerName ? `\n      dataLayerName: '${dataLayerName}',` : '';

  const appCode = `// src/App.${ext}x
import { GtmProvider } from '@react-gtm-kit/react-modern';
${includeConsent ? `import { eeaDefault } from '@react-gtm-kit/core';\n` : ''}
function App() {
  return (
    <GtmProvider
      containers={${containerValue}}${dataLayerOption}${includeConsent ? '\n      consentDefaults={eeaDefault}' : ''}
    >
      {/* Your app content */}
      <main>
        <h1>Hello GTM Kit!</h1>
      </main>
    </GtmProvider>
  );
}

export default App;
`;

  const routerCode = `// src/AppWithRouter.${ext}x
// Use this if you have react-router-dom
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { GtmProvider, useGtmPush } from '@react-gtm-kit/react-modern';
import { useEffect } from 'react';
${includeConsent ? `import { eeaDefault } from '@react-gtm-kit/core';\n` : ''}
// Automatic page view tracking
function PageViewTracker() {
  const location = useLocation();
  const push = useGtmPush();

  useEffect(() => {
    push({
      event: 'page_view',
      page_path: location.pathname + location.search
    });
  }, [location, push]);

  return null;
}

function App() {
  return (
    <GtmProvider
      containers={${containerValue}}${dataLayerOption}${includeConsent ? '\n      consentDefaults={eeaDefault}' : ''}
    >
      <BrowserRouter>
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add your routes */}
        </Routes>
      </BrowserRouter>
    </GtmProvider>
  );
}

function Home() {
  return <h1>Home Page</h1>;
}

export default App;
`;

  const exampleUsage = `// src/components/TrackingExample.${ext}x
import { useGtmPush } from '@react-gtm-kit/react-modern';

export function SignupButton() {
  const push = useGtmPush();

  const handleClick = () => {
    push({
      event: 'button_click',
      button_name: 'signup_cta'
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}

// Track form submission
export function ContactForm() {
  const push = useGtmPush();

  const handleSubmit = (e${ctx.ext === 'ts' ? ': React.FormEvent' : ''}) => {
    e.preventDefault();
    push({
      event: 'form_submit',
      form_name: 'contact'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}
`;

  return [
    {
      filename: `src/App.${ext}x`,
      content: appCode,
      description: 'Basic App setup with GTM Provider'
    },
    {
      filename: `src/AppWithRouter.${ext}x`,
      content: routerCode,
      description: 'App setup with React Router and page tracking'
    },
    {
      filename: `src/components/TrackingExample.${ext}x`,
      content: exampleUsage,
      description: 'Example components showing how to track events'
    }
  ];
};

/**
 * Generate Vue 3 setup code
 */
const generateVueSetupCode = (ctx: CodeGenContext): GeneratedCode[] => {
  const { containerValue, dataLayerName, includeConsent, ext } = ctx;
  const dataLayerOption = dataLayerName ? `\n    dataLayerName: '${dataLayerName}',` : '';

  const mainCode = `// src/main.${ext}
import { createApp } from 'vue';
import { GtmPlugin } from '@react-gtm-kit/vue';
${includeConsent ? `import { eeaDefault } from '@react-gtm-kit/core';\n` : ''}import App from './App.vue';

const app = createApp(App);

app.use(GtmPlugin, {
  containers: ${containerValue}${dataLayerOption}${includeConsent ? ',\n  consentDefaults: eeaDefault' : ''}
});

app.mount('#app');
`;

  const routerCode = `// src/router-tracking.${ext}
// Add this to your router setup for automatic page tracking
import { useGtmPush } from '@react-gtm-kit/vue';
import { watch } from 'vue';
import { useRoute } from 'vue-router';

export function usePageTracking() {
  const route = useRoute();
  const push = useGtmPush();

  watch(
    () => route.fullPath,
    (path) => {
      push({
        event: 'page_view',
        page_path: path,
        page_title: document.title
      });
    },
    { immediate: true }
  );
}
`;

  const appVueCode = `<!-- src/App.vue -->
<script setup${ext === 'ts' ? ' lang="ts"' : ''}>
import { usePageTracking } from './router-tracking';

// Enable page view tracking if using vue-router
// usePageTracking();
</script>

<template>
  <main>
    <h1>Hello GTM Kit!</h1>
    <RouterView v-if="$router" />
  </main>
</template>
`;

  const exampleUsage = `<!-- src/components/TrackingExample.vue -->
<script setup${ext === 'ts' ? ' lang="ts"' : ''}>
import { useGtmPush } from '@react-gtm-kit/vue';

const push = useGtmPush();

const handleClick = () => {
  push({
    event: 'button_click',
    button_name: 'signup_cta'
  });
};

const handleSubmit = () => {
  push({
    event: 'form_submit',
    form_name: 'contact'
  });
};
</script>

<template>
  <div>
    <!-- Track button click -->
    <button @click="handleClick">Sign Up</button>

    <!-- Track form submission -->
    <form @submit.prevent="handleSubmit">
      <input type="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  </div>
</template>
`;

  return [
    {
      filename: `src/main.${ext}`,
      content: mainCode,
      description: 'Main entry point with GTM Plugin'
    },
    {
      filename: `src/router-tracking.${ext}`,
      content: routerCode,
      description: 'Page tracking composable for Vue Router'
    },
    {
      filename: 'src/App.vue',
      content: appVueCode,
      description: 'App component with tracking setup'
    },
    {
      filename: 'src/components/TrackingExample.vue',
      content: exampleUsage,
      description: 'Example component showing how to track events'
    }
  ];
};

/**
 * Generate Vanilla JavaScript setup code
 */
const generateVanillaSetupCode = (ctx: CodeGenContext): GeneratedCode[] => {
  const { containerValue, dataLayerName, includeConsent, ext } = ctx;
  const dataLayerOption = dataLayerName ? `\n  dataLayerName: '${dataLayerName}',` : '';

  const esmCode = `// gtm-setup.${ext}
import { createGtmClient${includeConsent ? ', eeaDefault' : ''} } from '@react-gtm-kit/core';

// Create the GTM client
const gtm = createGtmClient({
  containers: ${containerValue}${dataLayerOption}
});
${includeConsent ? '\n// Set consent defaults BEFORE init (for GDPR compliance)\ngtm.setConsentDefaults(eeaDefault);\n' : ''}
// Initialize GTM
gtm.init();

// Track events
export function trackEvent(event${ctx.ext === 'ts' ? ': string' : ''}, data${ctx.ext === 'ts' ? '?: Record<string, unknown>' : ''} = {}) {
  gtm.push({
    event,
    ...data
  });
}

// Track page views
export function trackPageView(path${ctx.ext === 'ts' ? '?: string' : ''}) {
  gtm.push({
    event: 'page_view',
    page_path: path || window.location.pathname + window.location.search,
    page_title: document.title
  });
}

// Update consent (call this when user accepts/rejects)
export function updateConsent(analytics${ctx.ext === 'ts' ? ': boolean' : ''}, marketing${ctx.ext === 'ts' ? ': boolean' : ''}) {
  gtm.updateConsent({
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied'
  });
}

// Example usage
trackPageView();

// Export client for advanced usage
export { gtm };
`;

  const htmlCode = `<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GTM Kit - Vanilla JS</title>
</head>
<body>
  <!-- GTM noscript fallback (optional but recommended) -->
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id=${Array.isArray(containerValue) ? 'YOUR-GTM-ID' : containerValue.replace(/'/g, '')}"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>

  <main>
    <h1>Hello GTM Kit!</h1>
    <button id="signup-btn">Sign Up</button>
    <button id="consent-btn">Accept Cookies</button>
  </main>

  <script type="module">
    import { trackEvent, updateConsent } from './gtm-setup.${ext}';

    // Track button click
    document.getElementById('signup-btn').addEventListener('click', () => {
      trackEvent('button_click', { button_name: 'signup_cta' });
    });

    // Handle consent
    document.getElementById('consent-btn').addEventListener('click', () => {
      updateConsent(true, true);
    });
  </script>
</body>
</html>
`;

  const umdCode = `<!-- Alternative: UMD/Script Tag Setup -->
<!-- Add this in your HTML head -->
<script src="https://unpkg.com/@react-gtm-kit/core/dist/index.umd.js"></script>
<script>
  // GTM Kit is available as window.GtmKit
  var gtm = GtmKit.createGtmClient({
    containers: ${containerValue}${dataLayerOption ? dataLayerOption.replace(/\n/g, ' ') : ''}
  });
${includeConsent ? '\n  // Set consent defaults\n  gtm.setConsentDefaults(GtmKit.eeaDefault);\n' : ''}
  // Initialize
  gtm.init();

  // Track page view
  gtm.push({
    event: 'page_view',
    page_path: window.location.pathname
  });

  // Make gtm available globally for other scripts
  window.gtm = gtm;
</script>
`;

  return [
    {
      filename: `gtm-setup.${ext}`,
      content: esmCode,
      description: 'ESM setup with helper functions'
    },
    {
      filename: 'index.html',
      content: htmlCode,
      description: 'Example HTML with tracking'
    },
    {
      filename: 'umd-setup.html',
      content: umdCode,
      description: 'Alternative UMD/script tag setup'
    }
  ];
};

/**
 * Format generated code for display
 */
export const formatGeneratedCode = (files: GeneratedCode[]): string => {
  return files
    .map((file) => {
      const separator = '─'.repeat(60);
      return `${separator}\n📄 ${file.filename}\n${file.description}\n${separator}\n${file.content}`;
    })
    .join('\n\n');
};
