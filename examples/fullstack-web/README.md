# Full-stack web example

This example pairs the React adapters with the server relay under
[`examples/server`](../server/README.md) to demonstrate an end-to-end GTM
integration:

- Initialize the GTM client through `GtmProvider` with support for custom hosts,
  preview parameters, and consent defaults.
- Capture consent choices with the Consent Mode helpers and surface the current
  state in the UI.
- Emit purchase events into the data layer while forwarding the same payload to
  the relay so your GTM server container receives authenticated Measurement
  Protocol hits.
- Inspect the most recent data layer entries, relay requests, and responses to
  debug the flow locally.

Refer to the [server integration how-to](../../docs/how-to/server-integration.md)
for an architectural walkthrough and production hardening guidance.

## Getting started

1. Install dependencies at the monorepo root:

   ```bash
   pnpm install
   ```

2. Run the server relay with your GTM server container details:

   ```bash
   TAGGING_SERVER_URL="https://gtm.example.com" \
   GTM_MEASUREMENT_ID="G-1234567" \
   GTM_API_SECRET="shhh-secret" \
   pnpm --filter @react-gtm-kit/example-server start
   ```

   See the [relay README](../server/README.md) for the full list of supported
   environment variables and recommended hardening steps.

3. Copy the sample environment file (or create your own `.env.local`) inside the
   `examples/fullstack-web` directory:

   ```bash
   cd examples/fullstack-web
   cat <<'ENV' > .env.local
   VITE_GTM_CONTAINERS=GTM-XXXXXXX
   VITE_GTM_HOST=https://www.googletagmanager.com
   VITE_GTM_PREVIEW=
   VITE_GTM_AUTH=
   VITE_GTM_DATALAYER=dataLayer
   VITE_GA4_MEASUREMENT_ID=G-1234567
   VITE_RELAY_URL=http://localhost:4001/events
   ENV
   ```

   Adjust the values to match your GTM container(s), consent defaults, and relay
   endpoint. Leave `VITE_GTM_HOST` empty if you want to load from the Google
   host; set it to your first-party domain when using server-side tagging.

4. Start the Vite dev server:

   ```bash
   pnpm --filter @react-gtm-kit/example-fullstack-web dev
   ```

   The app renders on [http://127.0.0.1:5175](http://127.0.0.1:5175) by default.

## Available scripts

| Command        | Description                                             |
| -------------- | ------------------------------------------------------- |
| `pnpm dev`     | Start the Vite dev server.                              |
| `pnpm build`   | Type-check and produce an optimized production build.   |
| `pnpm preview` | Preview the production build locally.                   |
| `pnpm lint`    | Lint the TypeScript sources.                            |
| `pnpm smoke`   | Run the build command (used by repository smoke tests). |

## Feature tour

- **Consent controls** — toggles the Consent Mode defaults and updates exposed by
  `useGtmConsent`, mirroring a CMP integration.
- **Relay configuration** — lets you point the UI at any running relay and
  specify the GA4 measurement ID used for `gtag('get')` lookups.
- **Purchase simulator** — emits ecommerce payloads into the data layer and
  forwards the same payload to the relay, surfacing the raw request/response for
  debugging.
- **Data layer console** — snapshots the most recent pushes from the configured
  data layer (`VITE_GTM_DATALAYER`) so you can validate ordering and consent
  entries.

When paired with the relay, this example highlights how the React GTM Kit can
cover both browser and server tagging flows without duplicating consent logic or
exposing Measurement Protocol secrets on the client.
