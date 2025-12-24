# Auto-Queue: Eliminating Race Conditions

GTM Kit's auto-queue feature automatically buffers dataLayer events that fire before GTM loads, then replays them in order once GTM is ready. This eliminates race conditions out of the box.

## The Problem

Race conditions are a common pain point with GTM implementations:

```
Timeline:
├─ Page starts loading
├─ Analytics code fires events ─────────────────┐
├─ User interactions trigger events ────────────┤  These events are LOST
├─ Third-party scripts push to dataLayer ───────┤  if GTM hasn't loaded yet
├─ ...                                          │
├─ GTM.js finally loads ◄───────────────────────┘
└─ GTM starts listening (too late!)
```

Events pushed to `dataLayer` before GTM.js loads are technically stored in the array, but GTM may not process them correctly depending on timing.

## The Solution

Auto-queue intercepts all dataLayer pushes, buffers them, and replays them when GTM is ready:

```
Timeline:
├─ installAutoQueue() called ◄─── Start buffering immediately
├─ Analytics code fires events ────► Buffered ✓
├─ User interactions trigger events ────► Buffered ✓
├─ Third-party scripts push to dataLayer ────► Buffered ✓
├─ ...
├─ GTM.js loads
├─ Auto-queue detects gtm.js event
├─ Replay all buffered events in order ◄─── Everything processed!
└─ GTM continues listening normally
```

## Quick Start

### Option 1: Call Before Client Creation

```ts
import { installAutoQueue, createGtmClient } from '@jwiedeman/gtm-kit';

// Install auto-queue FIRST
installAutoQueue();

// Now any dataLayer pushes are buffered
window.dataLayer.push({ event: 'early_event' }); // Buffered!

// Create and init client whenever you're ready
const client = createGtmClient({ containers: 'GTM-XXXXXX' });
client.init(); // Auto-queue detects this and replays
```

### Option 2: Inline Script in `<head>` (Earliest Possible)

For maximum protection, embed a minimal inline script in your HTML `<head>`:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Auto-queue: Capture events before ANY scripts load -->
    <script>
      (function (w, n) {
        w[n] = w[n] || [];
        var q = [],
          o = w[n].push.bind(w[n]);
        w[n].push = function () {
          for (var i = 0; i < arguments.length; i++) {
            q.push({ v: arguments[i], t: Date.now() });
            o(arguments[i]);
          }
          return w[n].length;
        };
        w.__gtmkit_buffer = { q: q, o: o, n: n };
      })(window, 'dataLayer');
    </script>

    <!-- Your other scripts can now safely push events -->
    <script>
      dataLayer.push({ event: 'head_script_event' }); // Captured!
    </script>
  </head>
  <body>
    <!-- GTM Kit loads later and takes over -->
  </body>
</html>
```

Or generate it programmatically for SSR:

```tsx
import { createAutoQueueScript } from '@jwiedeman/gtm-kit';

// In your SSR template
const inlineScript = createAutoQueueScript();
// Output: <script>{inlineScript}</script>
```

## Configuration Options

```ts
const queue = installAutoQueue({
  // Custom dataLayer name (default: 'dataLayer')
  dataLayerName: 'dataLayer',

  // How often to check if GTM loaded (default: 50ms)
  pollInterval: 50,

  // Max wait time before giving up (default: 30000ms, 0 = unlimited)
  timeout: 30000,

  // Max events to buffer (default: 1000)
  maxBufferSize: 1000,

  // Callback when buffer is replayed
  onReplay: (bufferedCount) => {
    console.log(`Replayed ${bufferedCount} buffered events`);
  },

  // Callback if timeout reached (GTM didn't load)
  onTimeout: (bufferedCount) => {
    console.warn(`GTM didn't load, ${bufferedCount} events waiting`);
  }
});
```

## State and Control

```ts
const queue = installAutoQueue();

// Check state
console.log(queue.active); // true if still buffering
console.log(queue.bufferedCount); // number of events waiting
console.log(queue.gtmReady); // true if GTM detected

// Manual control (usually not needed)
queue.replay(); // Force replay now
queue.uninstall(); // Remove interceptor, stop buffering
```

## How It Works

1. **Install**: `installAutoQueue()` creates/finds the dataLayer and overrides its `push` method
2. **Buffer**: All pushes are stored in an ordered buffer AND passed to the real dataLayer
3. **Detect**: When `{ event: 'gtm.js' }` is pushed (by GTM loading), auto-queue triggers
4. **Replay**: All buffered events are replayed to ensure GTM processes them
5. **Cleanup**: The interceptor removes itself, normal operation continues

## Framework Integration

### React

```tsx
// app/layout.tsx or _app.tsx
import { installAutoQueue } from '@jwiedeman/gtm-kit';

// Install immediately when module loads
if (typeof window !== 'undefined') {
  installAutoQueue();
}

function App() {
  // ... your app
}
```

### Next.js (App Router)

```tsx
// app/layout.tsx
import { createAutoQueueScript } from '@jwiedeman/gtm-kit';
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          id="gtm-auto-queue"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: createAutoQueueScript() }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Vue/Nuxt

```ts
// plugins/gtm-auto-queue.client.ts
import { installAutoQueue } from '@jwiedeman/gtm-kit';

export default defineNuxtPlugin(() => {
  installAutoQueue();
});
```

## Best Practices

1. **Install as early as possible** - The earlier you install, the more events you capture
2. **Use inline script for critical pages** - For landing pages or high-traffic pages, use the inline `<head>` script
3. **Monitor with callbacks** - Use `onReplay` and `onTimeout` to track performance
4. **Set reasonable limits** - `maxBufferSize` prevents memory issues if GTM never loads

## Troubleshooting

| Issue                | Solution                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| Events still missing | Ensure `installAutoQueue()` runs before any dataLayer pushes             |
| Memory growing       | GTM not loading - check network, reduce `maxBufferSize`                  |
| Duplicate events     | Auto-queue already handles this - events go to both buffer and dataLayer |
| SSR hydration issues | Use `typeof window !== 'undefined'` check before installing              |

## Why This Works

Unlike manual buffering solutions, auto-queue:

- **Captures everything** - Intercepts at the dataLayer level, not just your code
- **Preserves order** - Events replay in exact order they were pushed
- **Auto-detects GTM** - No manual "GTM is ready" calls needed
- **Self-cleans** - Removes itself after replay, zero overhead
- **Handles edge cases** - Already-loaded GTM, late loading, timeouts
