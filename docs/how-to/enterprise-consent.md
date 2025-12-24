# Enterprise consent adoption patterns

Large organizations often have to coordinate Google Tag Manager consent updates across consent management platforms (CMPs),
regional policies, and multiple web properties. The core GTM Kit client exposes a predictable contract for sending Consent Mode v2
commands so you can keep those flows consistent. This guide covers proven approaches for orchestrating defaults, updates, and
presets in enterprise environments.

## Load defaults before your CMP resolves

Google recommends sending a `default` consent command synchronously during page load so tags remain blocked until a user choice
is recorded. Call `setConsentDefaults` immediately after creating your GTM client and before rendering UI that depends on a final
decision.

```ts
import { createGtmClient, consentPresets } from '@jwiedeman/gtm-kit';

const gtm = createGtmClient({ containers: ['GTM-XXXXXXX'] });

// Deny everything until the CMP signals the user's preference
// The presets are frozen so spread them if you need to extend values.
gtm.setConsentDefaults({
  ...consentPresets.eeaDefault
});

gtm.init();
```

The defaults queue safely even if `init()` has not run yet. When initialization completes, the client flushes the queued command
before loading container scripts so tags observe the expected blocked state.

## React adapters: keep StrictMode-safe flow

When using the modern React adapter, register defaults in a layout-level effect so rerenders and StrictMode remounts do not send
extra commands. The provider exposes a consent hook that proxies to the underlying client.

```tsx
import * as React from 'react';
import { consentPresets } from '@jwiedeman/gtm-kit';
import { GtmProvider, useGtmConsent } from '@jwiedeman/gtm-kit-react';

function App(): JSX.Element {
  return (
    <GtmProvider config={{ containers: ['GTM-XXXXXXX'] }}>
      <ConsentBootstrap />
      <Routes />
    </GtmProvider>
  );
}

function ConsentBootstrap(): null {
  const { setConsentDefaults } = useGtmConsent();

  React.useEffect(() => {
    setConsentDefaults(consentPresets.eeaDefault);
  }, [setConsentDefaults]);

  return null;
}
```

Because the provider reuses a single client instance, this pattern avoids duplicate defaults even when components mount twice
in development.

## Map CMP results to GTM updates

Most CMPs emit an event or promise once the user makes a choice. Translate that payload into the Consent Mode schema and call
`updateConsent`. Validate input before forwarding to GTM so malformed data does not enter the data layer.

```ts
cmp.on('consentChanged', (payload) => {
  const state = normalizeCmpPayload(payload);

  gtm.updateConsent(state, {
    region: ['US-CA', 'EEA'],
    waitForUpdate: 500
  });
});
```

- Use the `region` option to scope the command to specific jurisdictions. The helper validates the array so accidental typos are
  caught early.
- `waitForUpdate` delays tag execution (in milliseconds) while you wait for an explicit grant. This mirrors Google’s
  recommendations for handling slow CMP responses.
- Guard against CMP events firing multiple times—if the payload has not changed, skip the update to reduce noise in tag histories.

## Building reusable translators

Enterprises often need consistent consent mapping across many sites. Create a small utility that converts CMP states into the
four Consent Mode keys and reuse it wherever you instantiate the GTM client.

```ts
import type { ConsentState } from '@jwiedeman/gtm-kit';

interface CmpConsentState {
  advertising: boolean;
  analytics: boolean;
  personalisation: boolean;
}

export const toConsentState = (cmp: CmpConsentState): ConsentState => ({
  ad_storage: cmp.advertising ? 'granted' : 'denied',
  analytics_storage: cmp.analytics ? 'granted' : 'denied',
  ad_user_data: cmp.advertising ? 'granted' : 'denied',
  ad_personalization: cmp.personalisation ? 'granted' : 'denied'
});
```

Pair the translator with TypeScript unit tests so schema drifts in the CMP integration cannot silently break Consent Mode values.

## Tiered presets for regional rollouts

The `consentPresets` helper provides immutable baselines that mirror common enterprise policies. Compose them with additional
keys when certain regions require broader access.

```ts
const southAmericaDefault = {
  ...consentPresets.analyticsOnly,
  ad_user_data: 'granted'
};

gtm.setConsentDefaults(southAmericaDefault, { region: ['BR', 'AR'] });
```

Store regional presets in a central package (for example, `@company/gtm-consent`) so marketing and legal teams can review changes
without digging through application code.

## Testing and monitoring checklist

- **Unit tests:** cover translators, preset composition, and the guardrails that block invalid Consent Mode keys or values.
- **Integration tests:** mock CMP events to assert that defaults queue before `init()` and that updates reach the data layer once
  the client initializes.
- **Analytics validation:** record consent state changes in a first-party analytics stream so you can trace GTM behavior back to
  the originating CMP decision.
- **Incident response:** log consent command payloads (with PII removed) through the pluggable logger to accelerate debugging
  when marketing tags misfire.

## Troubleshooting tips

| Symptom                                        | Resolution                                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands never reach the data layer            | Ensure `gtm.init()` runs after setting defaults. When using React, place initialization inside the provider rather than per-page components. |
| Region-scoped updates fail silently            | Double-check that region codes follow ISO 3166-2 formatting. The helper throws if the array includes empty strings or non-strings.           |
| CMP fires multiple updates with identical data | Deduplicate by caching the last Consent Mode state and performing a shallow equality check before calling `updateConsent`.                   |
| Tags fire before consent choice                | Increase `waitForUpdate` or delay the CMP event handler until your banner finishes rendering.                                                |

With these patterns in place, teams can roll out Consent Mode v2 confidently across international surfaces while keeping GTM
behavior predictable and auditable.
