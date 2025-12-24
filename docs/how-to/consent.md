# Consent Mode implementation guide

Consent Mode v2 ensures Google Tag Manager tags respect the choices surfaced by your consent management platform (CMP). The React GTM Kit core provides typed helpers and queueing guarantees so consent commands reach the data layer before any measurement events fire.

## Quickstart

```ts
import { consentPresets, createGtmClient } from '@jwiedeman/gtm-kit';

const gtm = createGtmClient({ containers: ['GTM-XXXXXXX'] });

// Block tags until a choice is recorded.
gtm.setConsentDefaults(consentPresets.eeaDefault);

gtm.init();

// Later, translate your CMP payload into Consent Mode keys.
gtm.updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});
```

## Consent scenarios

GTM Kit supports **all consent patterns** - from all-or-nothing to fully granular per-category updates.

### All granted

User accepts all tracking:

```ts
gtm.updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});
// Or use the preset:
gtm.updateConsent(consentPresets.allGranted);
```

### All denied

User rejects all tracking:

```ts
gtm.updateConsent({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
// Or use the preset:
gtm.updateConsent(consentPresets.eeaDefault);
```

### Mixed consent (granular)

User makes selective choices - this is where granular consent shines:

```ts
// Analytics only - user allows measurement but not ads
gtm.updateConsent({
  ad_storage: 'denied',
  analytics_storage: 'granted',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
// Or use the preset:
gtm.updateConsent(consentPresets.analyticsOnly);

// Ads without personalization
gtm.updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'denied' // No personalized ads
});
```

### Partial updates

Only update specific categories - unchanged categories keep their previous state:

```ts
// User initially accepts only analytics
gtm.updateConsent({ analytics_storage: 'granted' });

// Later, user opts into advertising too
gtm.updateConsent({
  ad_storage: 'granted',
  ad_user_data: 'granted'
});
// Note: analytics_storage stays 'granted' from the previous update
```

This is critical for CMPs with preference centers where users update individual choices over time.

- Defaults are safe to call before `init()`. The client queues the command and flushes it immediately after the `gtm.js` start event, before any other queued pushes.
- Updates run instantly after initialization. If you need to scope them to specific regions or delay tag execution, use the `region` and `waitForUpdate` options exposed by the helper API.

When you need to seed consent commands outside the client (for example, serialising defaults during SSR or pushing directly into a shared data layer), use the low-level helpers:

```ts
import { consentPresets, createConsentDefaultsCommand, createConsentUpdateCommand } from '@jwiedeman/gtm-kit';

window.dataLayer.push(createConsentDefaultsCommand(consentPresets.eeaDefault, { region: ['EEA'] }));

window.dataLayer.push(createConsentUpdateCommand({ analytics_storage: 'granted' }));
```

## Data layer ordering guarantees

Consent defaults must reach the data layer before any pre-init events so GTM can block measurement until a user grants access. The client enforces this by prioritising queued default commands.

| Scenario                         | Resulting data layer order                                                                     | Impact                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Default queued, no other events  | `gtm.js` → `['consent','default',…]`                                                           | Tags start in the blocked state.                                         |
| Event queued first, then default | `gtm.js` → `['consent','default',…]` → `{ event: 'page_view' }`                                | Default is promoted ahead of the event so measurement waits for consent. |
| Multiple defaults queued         | `gtm.js` → `['consent','default', first]` → `['consent','default', second]` → … → other events | Commands flush in the order you defined, keeping overrides predictable.  |
| Consent update before init       | Queued until init completes; flushes immediately after defaults                                | Late updates cannot race ahead of defaults.                              |

These semantics prevent accidental data pushes before consent is established, even when components race to enqueue events during hydration or StrictMode remounts.

## Bridging CMP events in React

The React adapter exposes a `useGtmConsent` hook that proxies to the core client. Pair it with your CMP emitter to keep updates in sync:

```tsx
import { GtmProvider, useGtmConsent } from '@jwiedeman/gtm-kit-react';
import { consentPresets } from '@jwiedeman/gtm-kit';

// Example CMP payload - yours may differ
interface CmpPayload {
  advertising: boolean;
  analytics: boolean;
  personalization: boolean;
}

interface Cmp {
  on(event: 'consent', cb: (payload: CmpPayload) => void): void;
  off(event: 'consent', cb: (payload: CmpPayload) => void): void;
}

function ConsentBridge({ cmp }: { cmp: Cmp }): JSX.Element {
  const { setConsentDefaults, updateConsent } = useGtmConsent();

  useEffect(() => {
    setConsentDefaults(consentPresets.eeaDefault);

    const handler = (payload: CmpPayload) => {
      // Map each CMP category to its Consent Mode equivalent
      // This supports all combinations: all granted, all denied, or mixed
      updateConsent({
        ad_storage: payload.advertising ? 'granted' : 'denied',
        ad_user_data: payload.advertising ? 'granted' : 'denied',
        analytics_storage: payload.analytics ? 'granted' : 'denied',
        ad_personalization: payload.personalization ? 'granted' : 'denied'
      });
    };

    cmp.on('consent', handler);
    return () => cmp.off('consent', handler);
  }, [cmp, setConsentDefaults, updateConsent]);

  return null;
}

// Example: CMP with individual category updates
function GranularConsentBridge({ cmp }: { cmp: GranularCmp }): JSX.Element {
  const { setConsentDefaults, updateConsent } = useGtmConsent();

  useEffect(() => {
    setConsentDefaults(consentPresets.eeaDefault);

    // Some CMPs fire events per category change
    cmp.on('analytics_changed', (granted: boolean) => {
      updateConsent({ analytics_storage: granted ? 'granted' : 'denied' });
    });

    cmp.on('advertising_changed', (granted: boolean) => {
      updateConsent({
        ad_storage: granted ? 'granted' : 'denied',
        ad_user_data: granted ? 'granted' : 'denied',
        ad_personalization: granted ? 'granted' : 'denied'
      });
    });
  }, [cmp, setConsentDefaults, updateConsent]);

  return null;
}

function App({ cmp }: { cmp: Cmp }): JSX.Element {
  return (
    <GtmProvider config={{ containers: ['GTM-XXXXXXX'] }}>
      <ConsentBridge cmp={cmp} />
      {/* your routes */}
    </GtmProvider>
  );
}
```

- Register defaults during the same effect that wires CMP listeners so StrictMode double mounts do not emit duplicate commands.
- Normalize CMP payloads before forwarding them. The helper validates keys and ensures you only send `granted` or `denied` decisions.

## Troubleshooting matrix

| Symptom                                                     | How to fix                                                                                                                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Events appear before consent defaults in the data layer     | Ensure defaults run before rendering components that push events. The client will prioritise them when queued, but late events might still execute if they run before you call `setConsentDefaults`. |
| Updates fire repeatedly with the same payload               | Cache the last consent state and skip redundant `updateConsent` calls. The React hook accepts stable functions, so memoise your handler or compare payloads before updating.                         |
| Tags ignore CMP choices in specific regions                 | Pass the correct ISO 3166-2 region codes via the `region` option. Invalid codes throw during development so you can catch typos early.                                                               |
| CMP promises resolve slowly causing premature tag execution | Provide a `waitForUpdate` value in milliseconds when calling `setConsentDefaults` to hold tags until explicit consent arrives.                                                                       |
| Partial updates don't seem to work                          | Ensure you're calling `updateConsent()` after `init()`. Partial updates only affect specified categories; check that your CMP is sending the categories you expect.                                  |
| Mixed consent state not reflected in GTM                    | Verify you're passing a valid `ConsentState` object. Each key must be exactly `'granted'` or `'denied'` (strings, not booleans).                                                                     |

## Quick reference

| Scenario          | Code                                                                |
| ----------------- | ------------------------------------------------------------------- |
| All granted       | `updateConsent(consentPresets.allGranted)`                          |
| All denied        | `updateConsent(consentPresets.eeaDefault)`                          |
| Analytics only    | `updateConsent(consentPresets.analyticsOnly)`                       |
| Single category   | `updateConsent({ analytics_storage: 'granted' })`                   |
| Multiple specific | `updateConsent({ ad_storage: 'granted', ad_user_data: 'granted' })` |

With these patterns, Consent Mode commands stay deterministic from hydration through user interaction, and downstream tags honour user preferences consistently across frameworks.
