# Server-side GTM integration

Server-side tagging lets you load `gtm.js` from a first-party domain, keep Measurement
Protocol secrets off the client, and enrich events with server-verified context. The React GTM
Kit ships a reference relay under [`examples/server`](../../examples/server/README.md) that you can
use as a starting point for forwarding events to a GTM server container. Pair it with the
[full-stack web example](../../examples/fullstack-web/README.md) to see how the React adapters wire
Consent Mode updates, data layer pushes, and relay calls together in a single UI.

## 1. Point the core client at your tagging server

Configure `@react-gtm-kit/core` to load containers from the same origin that fronts your server
container. Supply preview credentials when you need to target a specific workspace.

```ts
import { createGtmClient } from '@react-gtm-kit/core';

const gtm = createGtmClient({
  containers: 'GTM-XXXXXXX',
  host: 'https://gtm.example.com',
  defaultQueryParams: {
    // Optional: route to a preview workspace during development.
    gtm_preview: process.env.NEXT_PUBLIC_GTM_PREVIEW,
    gtm_auth: process.env.NEXT_PUBLIC_GTM_AUTH
  }
});

gtm.init();
```

> ❗️ Only point the `host` option at a GTM server container or a trusted proxy. Standard web
> containers must continue using `https://www.googletagmanager.com` to function as expected.

## 2. Run the relay example (or your own equivalent)

The relay accepts JSON payloads over `POST /events` and forwards them to
`https://<TAGGING_SERVER_URL>/g/collect`. Configure it with the measurement ID and API secret tied
to the GA4 destination that lives inside your server container.

```bash
TAGGING_SERVER_URL="https://gtm.example.com" \
GTM_MEASUREMENT_ID="G-1234567" \
GTM_API_SECRET="shhh-secret" \
ALLOWED_ORIGINS="https://app.example.com" \
pnpm --filter @react-gtm-kit/example-server start
```

The response returns `202 Accepted` when the upstream call succeeds. Preview credentials
(`GTM_PREVIEW`/`GTM_AUTH`) and custom timeouts are supported via environment variables—see the
example README for the full list.

## 3. Collect identifiers and consent from the browser

Forwarding events requires the GA4 client ID, session ID, and current Consent Mode state so that
server-side hits stitch to the same user and respect privacy choices. When the GA4 tag is loaded
in your GTM container you can access those values through `gtag`:

```ts
const loadClientContext = async () => {
  return new Promise<{
    clientId: string;
    sessionId?: number;
  }>((resolve) => {
    window.dataLayer?.push(() => {
      if (typeof window.gtag !== 'function') {
        resolve({ clientId: `${Date.now()}.${Math.floor(Math.random() * 1_000_000)}` });
        return;
      }

      window.gtag('get', 'G-1234567', 'client_id', (clientId: string) => {
        window.gtag('get', 'G-1234567', 'session_id', (sessionId: number | undefined) => {
          resolve({ clientId, sessionId });
        });
      });
    });
  });
};
```

Pair the identifiers with the consent defaults or updates you already pass to `createGtmClient`.
The relay simply forwards those keys to the Measurement Protocol payload.

## 4. Send high-value events to the relay

Use the relay for events where server confirmation or secret enrichment matters (orders,
subscriptions, refunds). Keep the regular client-side data layer pushes in place so your web
container tags still fire.

```ts
import { pushEvent } from '@react-gtm-kit/core';

const sendPurchase = async (details: PurchasePayload) => {
  // Still notify the client container so web tags run.
  pushEvent(gtm, 'purchase', details);

  const { clientId, sessionId } = await loadClientContext();
  const consent = window.dataLayer?.find(
    (entry): entry is [string, 'update' | 'default', Record<string, string>] =>
      Array.isArray(entry) && entry[0] === 'consent'
  )?.[2];

  await fetch('https://api.example.com/gtm/events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      client: {
        id: clientId,
        sessionId,
        userAgent: navigator.userAgent
      },
      consent,
      events: [
        {
          name: 'purchase',
          params: details
        }
      ]
    })
  });
};
```

The example relay automatically adds `session_id`, propagates consent, and forwards the original
user agent and IP address (if provided) so the server container can apply the same consent rules
as the browser.

## 5. Harden for production

- Protect the relay with authentication and rate limiting to prevent abuse.
- Store secrets (API secret, preview tokens) in a managed secret store, not the repository.
- Monitor upstream failures—the relay returns `502` when the server container rejects a request.
- Consider queuing or retrying failed requests so transient outages do not drop conversions.

With these pieces in place you can run GTM end-to-end on a first-party domain while still taking
advantage of React GTM Kit’s client adapters for browser interactions.
