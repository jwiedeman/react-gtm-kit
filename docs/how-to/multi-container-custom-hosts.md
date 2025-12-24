# Multi-container setups with custom hosts

Use this guide when you need to load multiple GTM containers from a first-party or server-side tagging host while keeping data layer pushes synchronized.

## Configure containers and a shared host

Pass an array of container descriptors into `createGtmClient`. This allows you to mix default containers with host overrides and environment parameters while keeping one shared data layer.

```ts
import { createGtmClient } from '@jwiedeman/gtm-kit';

const client = createGtmClient({
  containers: [
    { id: 'GTM-PRIMARY', queryParams: { gtm_auth: 'auth1', gtm_preview: 'env-1' } },
    { id: 'GTM-SECONDARY' }
  ],
  host: 'https://tag.example.com',
  defaultQueryParams: { gtm_preview: 'env-default' },
  dataLayerName: 'dataLayer',
  scriptAttributes: { nonce: cspNonce, 'data-environment': 'production' }
});

client.init();
```

Key behaviors:

- `defaultQueryParams` merge with each container’s `queryParams`, so shared environment tokens or auth parameters are applied consistently.
- Script attributes (such as CSP nonces or `data-*` markers) are applied to every injected `<script>` tag, making it easier to audit host usage.
- The client deduplicates scripts per container ID, so repeated calls to `init` will not inject duplicate tags.

## Push events to all configured containers

All pushes flow through the same data layer regardless of host or container. Pair the client with the React adapters to keep StrictMode-safe semantics.

```tsx
import { GtmProvider, useGtmPush } from '@jwiedeman/gtm-kit-react';

function CheckoutTracker() {
  const push = useGtmPush();

  return (
    <button onClick={() => push({ event: 'begin_checkout', items: [{ item_id: 'SKU-123', price: 49, quantity: 1 }] })}>
      Start checkout
    </button>
  );
}

export function App() {
  return (
    <GtmProvider
      config={{
        containers: [{ id: 'GTM-PRIMARY', queryParams: { gtm_auth: 'auth1' } }, { id: 'GTM-SECONDARY' }],
        host: 'https://tag.example.com'
      }}
    >
      <CheckoutTracker />
    </GtmProvider>
  );
}
```

The data layer queue flushes once per container after initialization, preserving event order and consent commands for every host.

## Validate host configuration and CSP rules

- Allow the custom host under `script-src` and `frame-src` directives when using first-party tagging domains.
- Monitor the injected script URLs (`https://tag.example.com/gtm.js?id=...`) to confirm environment parameters are present.
- If you use multiple hosts, prefer a single data layer name across them so server-side tagging setups can correlate pushes.
- Pair the script attributes with server-provided nonces or request IDs to simplify debugging across containers.
