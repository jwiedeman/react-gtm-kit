# Server-side GTM relay example

This example exposes a lightweight Node.js endpoint that accepts structured analytics
payloads and forwards them to a Google Tag Manager server-side tagging container using the
Measurement Protocol `/g/collect` endpoint. Pair it with the React GTM Kit core client when
you need to deliver server-confirmed conversions, enrichments, or other first-party events
without exposing Measurement Protocol secrets to the browser.

## Prerequisites

- Node.js 18.18 or newer (for the built-in `fetch`, `Headers`, and `AbortController` APIs).
- An existing GTM server container configured with a GA4 Measurement ID and API secret.
- (Optional) Preview credentials (`gtm_preview`/`gtm_auth`) if you want to target a preview
  workspace.

## Environment variables

| Variable                   | Required | Description                                                                                      |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `TAGGING_SERVER_URL`       | ✅       | Base URL for your server container, e.g. `https://gtm.example.com`.                              |
| `GTM_MEASUREMENT_ID`       | ✅       | GA4 Measurement ID associated with your server container destination.                            |
| `GTM_API_SECRET`           | ➕       | Measurement Protocol API secret. Strongly recommended for GA4 destinations.                      |
| `GTM_CONTAINER_ID`         | ➖       | Optional container ID (`GTM-XXXXX`) used for logging context only.                               |
| `GTM_PREVIEW` / `GTM_AUTH` | ➖       | Optional query params that route requests to a GTM preview environment.                          |
| `ALLOWED_ORIGINS`          | ➖       | Comma-separated list of origins allowed to POST (enables CORS). Leave empty to allow any origin. |
| `PORT`                     | ➖       | Port to listen on (defaults to `4001`).                                                          |
| `REQUEST_TIMEOUT_MS`       | ➖       | Upstream timeout when calling the server container (defaults to `5000`).                         |
| `DEBUG`                    | ➖       | Set to `1` to enable verbose logging.                                                            |

## Running locally

```bash
TAGGING_SERVER_URL="https://gtm.example.com" \
GTM_MEASUREMENT_ID="G-1234567" \
GTM_API_SECRET="shhh-secret" \
pnpm --filter @gtm-kit/example-server start
```

The server exposes two routes:

- `POST /events` — accepts a JSON payload describing one or more events.
- `GET /healthz` — liveness probe used by deployment platforms.

## Request payload shape

```json
{
  "client": {
    "id": "1234567890.1699305600",
    "sessionId": 1699305600,
    "userId": "user-42",
    "userAgent": "Mozilla/5.0",
    "ip": "203.0.113.25"
  },
  "consent": {
    "ad_storage": "granted",
    "analytics_storage": "granted"
  },
  "events": [
    {
      "name": "purchase",
      "timestampMicros": 1699305600123456,
      "params": {
        "currency": "USD",
        "value": 120,
        "transaction_id": "ORDER-1001",
        "items": [
          {
            "item_id": "SKU-123",
            "item_name": "Widget",
            "quantity": 3,
            "price": 40
          }
        ]
      }
    }
  ]
}
```

- `client.id` defaults to a generated value when omitted. Supply the GA4 client ID captured on
  the browser to stitch events correctly.
- `sessionId` populates the GA4 `session_id` event parameter when present.
- `consent` maps directly to Google Consent Mode v2 keys and is forwarded in the Measurement
  Protocol payload.
- Additional event parameters are sanitized to remove unsupported values before forwarding.

### Example request

```bash
curl -i \
  -X POST "http://localhost:4001/events" \
  -H "content-type: application/json" \
  -d @payload.json
```

If the relay succeeds you will receive a `202 Accepted` response summarizing the forwarded
request.

## Architecture notes

1. **First-party host** – Load `@jwiedeman/gtm-kit` with the `host` option set to your server
   container domain so the browser retrieves `gtm.js` from the same origin.
2. **Secure secrets** – The Measurement Protocol `api_secret` stays on the server; the browser
   never sees it. Use HTTPS and production secrets for live traffic.
3. **Propagate context** – Pass the GA4 client ID, session ID, and consent state from your
   front-end or CMP when calling the relay so downstream tags preserve identity and privacy
   expectations.
4. **Rate limiting** – This sample keeps logic simple. Introduce authentication, rate limiting,
   and structured logging before shipping to production.

For a full walkthrough that pairs this relay with the React adapters, see the
[server integration how-to](../../docs/how-to/server-integration.md).
