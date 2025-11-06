# Consent lifecycle

Consent Mode v2 support is built into the core package. Use this guide to align your
CMP integration with the kit's APIs.

## Consent states

Google tracks four keys:

- `ad_storage`
- `analytics_storage`
- `ad_user_data`
- `ad_personalization`

Each key accepts `granted` or `denied`. React GTM Kit defaults to `denied` until you
explicitly update consent.

## Event timeline

1. **Defaults** – Provide region-aware defaults when you call `initGtm`. The defaults
   enqueue before GTM loads so Consent Mode applies to the very first request.
2. **CMP handshake** – Listen for your CMP's change event. Translate the payload into
   the four Consent Mode keys.
3. **Updates** – Call `updateConsent` with the translated values. The helper merges the
   update into GTM's consent state and records a diagnostic log entry when logging is
   enabled.
4. **Persist** – If you store consent in cookies or local storage, read the persisted
   value and feed it back into `initGtm` on the next page load so GTM stays consistent.

## Implementation checklist

- Map every CMP status (e.g., `accepted`, `rejected`, `partial`) to a corresponding
  Consent Mode state.
- Keep consent updates on the main thread; GTM expects synchronous updates before tags
  fire.
- Use the React adapters' consent helpers to avoid duplicating logic when working in React.
- Document your mapping strategy so audits can confirm the data flow.
