# Consent Mode implementation guide

Consent Mode v2 ensures Google Tag Manager tags respect the choices surfaced by your consent management platform (CMP). The React GTM Kit core provides typed helpers and queueing guarantees so consent commands reach the data layer before any measurement events fire.

## Quickstart

```ts
import { consentPresets, createGtmClient } from '@react-gtm-kit/core';

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

- Defaults are safe to call before `init()`. The client queues the command and flushes it immediately after the `gtm.js` start event, before any other queued pushes.
- Updates run instantly after initialization. If you need to scope them to specific regions or delay tag execution, use the `region` and `waitForUpdate` options exposed by the helper API.

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
import { GtmProvider, useGtmConsent } from '@react-gtm-kit/react-modern';
import { consentPresets } from '@react-gtm-kit/core';

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

With these patterns, Consent Mode commands stay deterministic from hydration through user interaction, and downstream tags honour user preferences consistently across frameworks.
