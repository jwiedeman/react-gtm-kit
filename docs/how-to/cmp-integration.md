# CMP integration and QA

A consent management platform (CMP) is usually the source of truth for Consent Mode
signals. GTM Kit does not ship a CMP, but it provides helpers and ordering guarantees
so your CMP callbacks can write defaults and updates to the data layer before any
measurement tags fire.

## Map CMP states to Consent Mode keys

Translate your CMP payloads into the four Consent Mode v2 keys. GTM Kit supports
**all consent scenarios**: all granted, all denied, and granular (mixed) consent.

### Common CMP scenarios

| CMP Status       | Consent Mode Update                           | Use Case                           |
| ---------------- | --------------------------------------------- | ---------------------------------- |
| Accept All       | `updateConsent(consentPresets.allGranted)`    | User clicks "Accept All"           |
| Reject All       | `updateConsent(consentPresets.eeaDefault)`    | User clicks "Reject All"           |
| Analytics Only   | `updateConsent(consentPresets.analyticsOnly)` | User accepts analytics but not ads |
| Custom Selection | Map each CMP category individually            | User makes granular choices        |

### Granular consent mapping

When your CMP provides per-category choices, map each to its Consent Mode equivalent:

```ts
// Example: CMP returns { analytics: true, marketing: false, personalization: true }
updateConsent({
  analytics_storage: cmp.analytics ? 'granted' : 'denied',
  ad_storage: cmp.marketing ? 'granted' : 'denied',
  ad_user_data: cmp.marketing ? 'granted' : 'denied',
  ad_personalization: cmp.personalization ? 'granted' : 'denied'
});
```

### Partial updates

When users change individual preferences (e.g., from a preference center), you only
need to update the categories that changed:

```ts
// User toggles advertising consent in preference center
updateConsent({ ad_storage: 'granted', ad_user_data: 'granted' });
// analytics_storage and ad_personalization remain unchanged
```

Keep the translator small and deterministic. Cache the last Consent Mode payload so
repeated CMP events with unchanged values do not spam your tag history.

## Bridge CMP callbacks to the GTM client

Wire the CMP lifecycle to the GTM client immediately after you register consent
defaults. The client queues consent commands ahead of other pre-init pushes so the
banner cannot be bypassed by early events.

```ts
import { createGtmClient } from '@react-gtm-kit/core';

const gtm = createGtmClient({ containers: 'GTM-XXXXXXX' });

gtm.setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'denied' }, { waitForUpdate: 2000 });

cmp.on('consent_changed', (payload) => {
  const state = mapCmpPayloadToConsentMode(payload);
  const options = payload.region ? { region: [payload.region] } : undefined;

  gtm.updateConsent(state, options);
});
```

> ℹ️ If your CMP resolves before the GTM client initializes, the update is queued in
> front of other pre-init events and will flush immediately after the `gtm.js` start
> event.

## Automate QA for consent ordering

Use browser automation to confirm CMP callbacks reach the data layer in order:

1. Load the page with consent defaults set to `denied`.
2. Emit a synthetic CMP callback before GTM initialization to mimic early resolution.
3. Initialize the GTM client and wait for scripts to load.
4. Assert that the data layer shows, in order: `gtm.js`, the consent default, the CMP
   update, and any pre-init events.
5. Emit another CMP update after initialization and confirm it appends a new
   `['consent', 'update', ...]` entry.

The core test suite includes a CMP ordering spec to guard this behavior (`packages/core/src/__tests__/client.spec.ts`). Pair it with a Playwright
smoke to validate your production CMP payloads and consent cookies end-to-end.
