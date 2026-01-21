# GTM-Kit Privacy & Compliance Guide

This guide covers GDPR, CCPA, and other privacy compliance patterns when using GTM-Kit.

---

## Table of Contents

- [Understanding Consent Mode](#understanding-consent-mode)
- [GDPR Compliance (EU/EEA)](#gdpr-compliance-eueea)
- [CCPA Compliance (California)](#ccpa-compliance-california)
- [Other Regulations](#other-regulations)
- [Implementation Patterns](#implementation-patterns)
- [Testing Compliance](#testing-compliance)

---

## Understanding Consent Mode

Google Consent Mode v2 allows you to adjust how Google tags behave based on user consent status.

### Consent Categories

| Key                  | Purpose                           | When Granted                          |
| -------------------- | --------------------------------- | ------------------------------------- |
| `ad_storage`         | Stores advertising cookies        | User consents to advertising          |
| `analytics_storage`  | Stores analytics cookies          | User consents to analytics            |
| `ad_user_data`       | Sends user data to Google for ads | User consents to data sharing for ads |
| `ad_personalization` | Enables ad personalization        | User consents to personalized ads     |

### Consent Values

- `'granted'` - User has given consent
- `'denied'` - User has not given consent (or denied)

### How Consent Mode Works

1. **Default state**: Set before GTM loads to establish baseline
2. **GTM behavior**: Tags adjust behavior based on consent state
3. **Update state**: Change consent when user makes a choice
4. **Persistence**: Store user choice for future visits

---

## GDPR Compliance (EU/EEA)

The General Data Protection Regulation requires explicit consent before tracking EU/EEA users.

### Requirements

1. **Prior consent**: No tracking before explicit user consent
2. **Informed consent**: Clear explanation of what data is collected
3. **Granular control**: Allow users to choose specific consent categories
4. **Easy withdrawal**: Users can revoke consent at any time
5. **Documentation**: Record when and how consent was given

### Implementation

```typescript
import { createGtmClient, getConsentPreset } from '@jwiedeman/gtm-kit';

const client = createGtmClient({
  containers: 'GTM-XXXXXX'
});

// Step 1: Set default consent (deny all) BEFORE init
client.setConsentDefaults(getConsentPreset('eeaDefault'), {
  region: ['EEA', 'GB', 'CH'], // EU, UK, Switzerland
  waitForUpdate: 500
});

// For non-EEA regions, optionally set different defaults
client.setConsentDefaults(
  {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  },
  {
    // No region = global default (for non-EEA visitors)
  }
);

// Step 2: Initialize GTM
await client.init();

// Step 3: Update consent when user makes a choice
function handleConsentChoice(preferences) {
  client.updateConsent({
    ad_storage: preferences.advertising ? 'granted' : 'denied',
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_user_data: preferences.advertising ? 'granted' : 'denied',
    ad_personalization: preferences.personalization ? 'granted' : 'denied'
  });

  // Persist user choice
  localStorage.setItem('consent_preferences', JSON.stringify(preferences));
}
```

### Consent Banner Pattern

```tsx
// React example
function GDPRConsentBanner() {
  const { updateConsent } = useGtm();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const saved = localStorage.getItem('consent_preferences');
    if (!saved) {
      setVisible(true);
    } else {
      // Restore previous choice
      const preferences = JSON.parse(saved);
      updateConsent({
        ad_storage: preferences.advertising ? 'granted' : 'denied',
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_user_data: preferences.advertising ? 'granted' : 'denied',
        ad_personalization: preferences.personalization ? 'granted' : 'denied'
      });
    }
  }, []);

  const acceptAll = () => {
    updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    localStorage.setItem(
      'consent_preferences',
      JSON.stringify({
        analytics: true,
        advertising: true,
        personalization: true
      })
    );
    setVisible(false);
  };

  const rejectAll = () => {
    updateConsent({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    localStorage.setItem(
      'consent_preferences',
      JSON.stringify({
        analytics: false,
        advertising: false,
        personalization: false
      })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="consent-banner">
      <h2>We value your privacy</h2>
      <p>
        We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.
        By clicking "Accept All", you consent to our use of cookies.
      </p>
      <div className="consent-buttons">
        <button onClick={acceptAll}>Accept All</button>
        <button onClick={rejectAll}>Reject All</button>
        <button onClick={() => setShowPreferences(true)}>Customize</button>
      </div>
    </div>
  );
}
```

### Regional Consent Defaults

```typescript
// Different defaults for different regions
client.setConsentDefaults(
  {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  },
  {
    region: ['EEA', 'GB', 'CH'], // Strict for EU
    waitForUpdate: 500
  }
);

client.setConsentDefaults(
  {
    ad_storage: 'denied',
    analytics_storage: 'granted', // Analytics OK, ads denied
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  },
  {
    region: ['BR'], // Brazil LGPD
    waitForUpdate: 500
  }
);
```

---

## CCPA Compliance (California)

The California Consumer Privacy Act allows users to opt out of data sale.

### Requirements

1. **"Do Not Sell" link**: Provide clear opt-out mechanism
2. **No discrimination**: Same service regardless of privacy choice
3. **Annual disclosure**: Privacy policy updates

### Implementation

```typescript
// CCPA focuses on "sale" of data - typically ad personalization
client.setConsentDefaults(
  {
    ad_storage: 'granted', // Storage OK
    analytics_storage: 'granted', // Analytics OK
    ad_user_data: 'granted', // Default granted
    ad_personalization: 'granted' // Default granted
  },
  {
    region: ['US-CA'] // California only
  }
);

// When user opts out of data sale
function handleDoNotSell() {
  client.updateConsent({
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  // Persist choice
  localStorage.setItem('ccpa_opted_out', 'true');
}
```

### "Do Not Sell My Personal Information" Link

```tsx
function CCPAFooter() {
  const { updateConsent } = useGtm();
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    setOptedOut(localStorage.getItem('ccpa_opted_out') === 'true');
  }, []);

  const handleOptOut = () => {
    updateConsent({
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    localStorage.setItem('ccpa_opted_out', 'true');
    setOptedOut(true);
  };

  return (
    <footer>
      {!optedOut && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleOptOut();
          }}
        >
          Do Not Sell My Personal Information
        </a>
      )}
      {optedOut && <span>Your data is not being sold</span>}
    </footer>
  );
}
```

---

## Other Regulations

### Brazil LGPD

Similar to GDPR with some differences:

```typescript
client.setConsentDefaults(
  {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  },
  {
    region: ['BR'],
    waitForUpdate: 500
  }
);
```

### Canada PIPEDA

```typescript
// Generally requires implied consent model
client.setConsentDefaults(
  {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'denied', // Explicit consent for this
    ad_personalization: 'denied'
  },
  {
    region: ['CA'],
    waitForUpdate: 500
  }
);
```

### Australia Privacy Act

```typescript
client.setConsentDefaults(
  {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  },
  {
    region: ['AU'],
    waitForUpdate: 500
  }
);
```

---

## Implementation Patterns

### Pattern 1: Geo-Based Consent Defaults

```typescript
import { createGtmClient, getConsentPreset } from '@jwiedeman/gtm-kit';

const client = createGtmClient({ containers: 'GTM-XXXXXX' });

// Strictest regions first (EEA, UK, Switzerland)
client.setConsentDefaults(getConsentPreset('eeaDefault'), {
  region: ['EEA', 'GB', 'CH']
});

// Brazil LGPD
client.setConsentDefaults(
  {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  },
  {
    region: ['BR']
  }
);

// California CCPA
client.setConsentDefaults(
  {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  },
  {
    region: ['US-CA']
  }
);

// Global default (rest of world)
client.setConsentDefaults(getConsentPreset('allGranted'));

await client.init();
```

### Pattern 2: Consent Management Platform (CMP) Integration

```typescript
// OneTrust, Cookiebot, etc. integration
window.addEventListener('consent-updated', (event) => {
  const consent = event.detail;

  client.updateConsent({
    ad_storage: consent.advertising ? 'granted' : 'denied',
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_user_data: consent.advertising ? 'granted' : 'denied',
    ad_personalization: consent.personalization ? 'granted' : 'denied'
  });
});

// Cookiebot specific
if (typeof Cookiebot !== 'undefined') {
  Cookiebot.onaccept = function () {
    client.updateConsent({
      ad_storage: Cookiebot.consent.marketing ? 'granted' : 'denied',
      analytics_storage: Cookiebot.consent.statistics ? 'granted' : 'denied',
      ad_user_data: Cookiebot.consent.marketing ? 'granted' : 'denied',
      ad_personalization: Cookiebot.consent.marketing ? 'granted' : 'denied'
    });
  };
}
```

### Pattern 3: Server-Side Consent Detection

```typescript
// Use server to detect region and set appropriate defaults
async function initGtmWithRegion() {
  // Get user's region from API or header
  const region = await fetch('/api/user-region').then((r) => r.json());

  const client = createGtmClient({ containers: 'GTM-XXXXXX' });

  if (['EEA', 'GB', 'CH'].some((r) => region.startsWith(r) || region === r)) {
    client.setConsentDefaults(getConsentPreset('eeaDefault'), {
      waitForUpdate: 500
    });
  } else if (region === 'US-CA') {
    // California - less strict
    client.setConsentDefaults(getConsentPreset('allGranted'));
  } else {
    client.setConsentDefaults(getConsentPreset('allGranted'));
  }

  await client.init();
  return client;
}
```

### Pattern 4: Cookie Preference Restoration

```typescript
// On page load, restore previous consent choice
function restoreConsentChoice(client) {
  const saved = localStorage.getItem('user_consent');

  if (saved) {
    try {
      const consent = JSON.parse(saved);
      client.updateConsent(consent);
      return true; // Consent was restored
    } catch (e) {
      console.error('Failed to restore consent:', e);
    }
  }

  return false; // No saved consent
}

// Save consent choice
function saveConsentChoice(consent) {
  localStorage.setItem('user_consent', JSON.stringify(consent));
  localStorage.setItem('consent_timestamp', Date.now().toString());
}
```

---

## What NOT to Track

### Personally Identifiable Information (PII)

**Never push to dataLayer:**

- Email addresses
- Full names
- Phone numbers
- Physical addresses
- Social Security numbers
- Credit card numbers
- Passwords
- Health information
- Biometric data

```typescript
// ❌ WRONG - Contains PII
pushEvent(client, 'form_submit', {
  email: 'user@example.com', // PII!
  name: 'John Doe', // PII!
  phone: '555-123-4567' // PII!
});

// ✅ CORRECT - Anonymized/hashed
pushEvent(client, 'form_submit', {
  form_id: 'contact_form',
  form_type: 'contact',
  has_email: true,
  has_phone: true
});

// ✅ If you must identify users, use hashed values
import { createHash } from 'crypto';

const hashedEmail = createHash('sha256').update(email.toLowerCase()).digest('hex');

pushEvent(client, 'user_action', {
  user_pseudo_id: hashedEmail // Hashed, not raw email
});
```

### Authentication Tokens

```typescript
// ❌ WRONG - Never include tokens
pushEvent(client, 'api_call', {
  auth_token: 'eyJhbGciOiJIUzI1...', // Never!
  api_key: 'sk-123456...' // Never!
});

// ✅ CORRECT
pushEvent(client, 'api_call', {
  endpoint: '/api/users',
  method: 'GET',
  status: 200
});
```

### Financial Information

```typescript
// ❌ WRONG - Full credit card info
pushEvent(client, 'purchase', {
  card_number: '4111111111111111', // Never!
  cvv: '123' // Never!
});

// ✅ CORRECT - Anonymized payment info
pushEvent(client, 'purchase', {
  payment_method: 'credit_card',
  card_type: 'visa',
  card_last_four: '1111' // Only last 4 digits
});
```

---

## Testing Compliance

### 1. Verify Consent State

```typescript
// Check current consent state in GTM
// Open browser console on your site:
console.log(window.dataLayer.filter((d) => d.event === 'gtm.init_consent'));
```

### 2. Test Consent Flow

```javascript
// Test consent denied state
client.setConsentDefaults({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});

// Verify no tracking cookies are set
document.cookie; // Should not contain _ga, _gid, etc.

// Update consent and verify cookies appear
client.updateConsent({
  analytics_storage: 'granted'
});

// After a moment, cookies should appear
setTimeout(() => {
  console.log(document.cookie); // Should now contain analytics cookies
}, 1000);
```

### 3. GTM Preview Mode

1. Open GTM Preview Mode
2. Visit your site
3. Check "Consent" tab in Preview
4. Verify consent state matches expectations
5. Test consent changes and verify tag behavior

### 4. Google Tag Assistant

1. Install Google Tag Assistant extension
2. Enable recording
3. Visit your site
4. Check consent mode status in reports

### 5. Browser DevTools

```javascript
// Monitor dataLayer pushes
const originalPush = window.dataLayer.push;
window.dataLayer.push = function (...args) {
  console.log('dataLayer push:', args);
  return originalPush.apply(this, args);
};
```

---

## Compliance Checklist

### GDPR Checklist

- [ ] Consent defaults set to `denied` for EEA regions
- [ ] `waitForUpdate` configured for consent banner load time
- [ ] Clear consent banner with Accept/Reject options
- [ ] Granular consent controls available
- [ ] Consent choice persisted
- [ ] Easy way to withdraw consent
- [ ] Privacy policy updated
- [ ] No PII in dataLayer

### CCPA Checklist

- [ ] "Do Not Sell" link in footer
- [ ] Opt-out mechanism functional
- [ ] `ad_user_data` and `ad_personalization` denied on opt-out
- [ ] Opt-out choice persisted
- [ ] Privacy policy includes CCPA disclosures

### Technical Checklist

- [ ] Consent defaults set BEFORE `init()`
- [ ] Regional consent configured correctly
- [ ] Consent updates pushed after user choice
- [ ] Consent choice persisted across sessions
- [ ] No tracking before consent (for GDPR regions)
- [ ] Tested in GTM Preview mode
- [ ] No PII in any dataLayer push

---

## Resources

- [Google Consent Mode Documentation](https://support.google.com/tagmanager/answer/10718549)
- [GDPR Official Text](https://gdpr-info.eu/)
- [CCPA Official Text](https://oag.ca.gov/privacy/ccpa)
- [GTM Consent Mode Setup Guide](https://developers.google.com/tag-platform/security/guides/consent)

---

_This guide provides technical implementation patterns. For legal advice, consult with a privacy attorney familiar with your jurisdiction._
