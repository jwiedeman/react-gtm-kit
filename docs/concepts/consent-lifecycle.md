# Consent lifecycle

Consent Mode v2 support is built into the core package. Use this guide to align your
CMP integration with the kit's APIs.

## Consent categories

Google Consent Mode v2 tracks four categories:

| Category             | Purpose                                | When to grant                              |
| -------------------- | -------------------------------------- | ------------------------------------------ |
| `ad_storage`         | Stores advertising cookies/identifiers | User accepts advertising/marketing cookies |
| `analytics_storage`  | Stores analytics cookies               | User accepts analytics/statistics cookies  |
| `ad_user_data`       | Sends user data to Google for ads      | User consents to ad data sharing           |
| `ad_personalization` | Enables personalized advertising       | User consents to personalized ads          |

Each category accepts `'granted'` or `'denied'`. GTM Kit defaults all categories to `denied`
until you explicitly update them.

## Granular consent updates

GTM Kit supports **granular consent** - you can update individual categories independently
without affecting others. This is critical for CMPs that let users make selective choices.

### Update patterns

```ts
// All granted (user accepts everything)
client.updateConsent({
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});

// All denied (user rejects everything)
client.updateConsent({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});

// Mixed consent (user accepts analytics only)
client.updateConsent({
  ad_storage: 'denied',
  analytics_storage: 'granted',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});

// Partial update (only update specific categories)
// Other categories remain unchanged
client.updateConsent({ analytics_storage: 'granted' });

// Multiple partial updates over time
client.updateConsent({ analytics_storage: 'granted' });
// ...later, user changes ad preferences...
client.updateConsent({ ad_storage: 'granted', ad_user_data: 'granted' });
```

### Why partial updates matter

Many CMPs provide granular consent controls where users can:

- Accept analytics but reject advertising
- Change individual preferences over time
- Have different consent states per category

GTM Kit's `Partial<Record<ConsentKey, ConsentDecision>>` type ensures you only need to
pass the categories that changed. Unspecified categories retain their previous state.

## Event timeline

1. **Defaults** – Provide region-aware defaults by calling `client.setConsentDefaults`
   before `client.init()`. The defaults enqueue before GTM loads so Consent Mode
   applies to the very first request.
2. **CMP handshake** – Listen for your CMP's change event. Translate the payload into
   the four Consent Mode keys.
3. **Updates** – Call `updateConsent` with the translated values. The helper merges the
   update into GTM's consent state and records a diagnostic log entry when logging is
   enabled.
4. **Persist** – If you store consent in cookies or local storage, read the persisted
   value and feed it back into `setConsentDefaults` on the next page load so GTM stays
   consistent.

## Built-in presets

GTM Kit provides convenience presets for common scenarios:

| Preset                         | `ad_storage` | `analytics_storage` | `ad_user_data` | `ad_personalization` |
| ------------------------------ | ------------ | ------------------- | -------------- | -------------------- |
| `consentPresets.eeaDefault`    | denied       | denied              | denied         | denied               |
| `consentPresets.allGranted`    | granted      | granted             | granted        | granted              |
| `consentPresets.analyticsOnly` | denied       | granted             | denied         | denied               |

```ts
import { consentPresets } from '@jwiedeman/gtm-kit';

// Use preset for defaults
client.setConsentDefaults(consentPresets.eeaDefault, { region: ['EEA'] });

// Or use preset for updates
client.updateConsent(consentPresets.allGranted);
```

## Implementation checklist

- [ ] Map every CMP status (e.g., `accepted`, `rejected`, `partial`) to a corresponding
      Consent Mode state
- [ ] Support granular updates - don't assume all-or-nothing consent
- [ ] Keep consent updates on the main thread; GTM expects synchronous updates before tags
      fire
- [ ] Use the framework adapters' consent helpers to avoid duplicating logic
- [ ] Test all consent scenarios: all granted, all denied, and mixed states
- [ ] Document your CMP-to-Consent-Mode mapping strategy for audits

### CMP mapping example

| CMP Choice       | GTM Kit update                                       |
| ---------------- | ---------------------------------------------------- |
| Accept All       | `updateConsent(consentPresets.allGranted)`           |
| Reject All       | `updateConsent(consentPresets.eeaDefault)`           |
| Analytics Only   | `updateConsent(consentPresets.analyticsOnly)`        |
| Custom Selection | Map each CMP category to its Consent Mode equivalent |
