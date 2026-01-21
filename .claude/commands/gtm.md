# GTM Container Management Skill

> **Usage:** `/gtm [action] [options]`
> **Actions:** `import`, `export`, `list`, `add`, `modify`, `validate`, `build`, `diff`

---

## Overview

This skill manages Google Tag Manager container JSON files for GTM-Kit. It enables:

- Importing and parsing GTM container exports
- Creating/modifying tags, triggers, variables, and folders
- Validating container structure against GTM-Kit's event schema
- Building containers optimized for GTM-Kit integration
- Generating exportable container JSON

---

## Container File Location

GTM container files should be stored in: `containers/`

```
containers/
├── gtmkit-universal-container.json  # Main universal container for GTM-Kit
└── templates/                       # Reusable component templates
    ├── variables/
    ├── triggers/
    └── tags/
```

---

## Actions

### `/gtm import [filepath]`

Import and parse a GTM container JSON file. Display summary of components.

**When this action is requested:**

1. Read the specified JSON file (or prompt for path)
2. Parse the container structure
3. Display summary:
   - Container name and ID
   - Number of tags, triggers, variables
   - List each component with its name and type
4. Save parsed data for subsequent operations

### `/gtm export [filepath]`

Export the current working container to a JSON file.

**When this action is requested:**

1. Generate properly formatted GTM export JSON
2. Include all components (tags, triggers, variables, builtInVariables)
3. Update timestamps and fingerprints
4. Write to specified file path

### `/gtm list [component-type]`

List components in the current container.

**Component types:** `tags`, `triggers`, `variables`, `folders`, `all`

**When this action is requested:**

1. Parse the container JSON
2. Filter by component type if specified
3. Display in formatted table:
   - ID, Name, Type
   - For tags: firing triggers, blocking triggers
   - For triggers: type and conditions
   - For variables: type and data path

### `/gtm add [component-type] [options]`

Add a new component to the container.

**Component types and options:**

**Tag:**

- `--name "Tag Name"`
- `--type googtag|html|custom_image|etc`
- `--trigger "Trigger Name"` (can repeat)
- `--block "Blocking Trigger Name"` (can repeat)

**Trigger:**

- `--name "Trigger Name"`
- `--type CUSTOM_EVENT|PAGEVIEW|DOM_READY|WINDOW_LOADED|etc`
- `--event "event_name"` (for custom events)
- `--regex` (enable regex matching)

**Variable:**

- `--name "Variable Name"`
- `--type v|c|jsm|etc` (DLV, constant, custom JS)
- `--path "data.layer.path"` (for DLV)
- `--value "constant value"` (for constants)

### `/gtm modify [component-type] [id-or-name] [options]`

Modify an existing component.

**When this action is requested:**

1. Find the component by ID or name
2. Apply the specified changes
3. Update fingerprint
4. Show before/after diff

### `/gtm validate`

Validate the container against GTM-Kit's event schema and best practices.

**Validation checks:**

1. **Required components exist:**
   - Consent Default tag
   - Consent Update tag
   - GA4 Config tag
   - GA4 Omnitag

2. **Trigger patterns:**
   - consent_ready uses regex `consent_init|consent_update`
   - GTM-Kit Events trigger covers all standard events
   - Marketing block trigger exists

3. **Variable coverage:**
   - All integration variables defined
   - Consent variables with defaults
   - E-commerce variables for GTM-Kit

4. **Consent gating:**
   - Marketing tags have blocking trigger
   - GA4 tags do NOT have blocking trigger
   - Consent defaults fire on Consent Initialization

### `/gtm build [template]`

Build a container from a template/specification.

**Templates:**

- `universal` - Build the GTM-Kit Universal Container
- `ga4-only` - Minimal GA4-only container
- `custom` - Interactive builder

### `/gtm diff [file1] [file2]`

Compare two container files and show differences.

**When this action is requested:**

1. Parse both container files
2. Compare each component type
3. Show:
   - Added components
   - Removed components
   - Modified components (with field-level diff)

---

## GTM-Kit Event Schema

### Standard Events (from GTM-Kit)

The GTM-Kit library sends these events to the dataLayer:

**Page Events:**

- `page_view` - Page view with optional `page_title`, `page_location`, `page_path`

**E-commerce Events (GA4 Standard):**

- `view_item_list` - User viewed a product list
- `view_item` - User viewed a product
- `select_item` - User selected an item
- `select_promotion` - User selected a promotion
- `view_promotion` - User viewed a promotion
- `add_to_cart` - User added to cart
- `remove_from_cart` - User removed from cart
- `view_cart` - User viewed cart
- `add_shipping_info` - Shipping info added
- `add_payment_info` - Payment info added
- `begin_checkout` - Checkout started
- `purchase` - Purchase completed
- `refund` - Refund processed

**Conversion Events:**

- `conversion` - Ads conversion tracking

### E-commerce Data Structure

```javascript
{
  event: 'purchase',
  ecommerce: {
    transaction_id: 'TXN-001',
    value: 99.99,
    currency: 'USD',
    coupon: 'SAVE10',
    shipping: 5.99,
    tax: 8.25,
    affiliation: 'Online Store',
    items: [{
      item_id: 'SKU-123',
      item_name: 'Product Name',
      item_brand: 'Brand',
      item_category: 'Category',
      item_variant: 'Blue',
      price: 49.99,
      quantity: 2,
      coupon: 'ITEM10',
      discount: 5
    }]
  }
}
```

### Consent Signals

GTM-Kit sends consent commands using Consent Mode V2:

```javascript
// Default (before user choice)
[
  'consent',
  'default',
  {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  }
][
  // Update (after user choice)
  ('consent',
  'update',
  {
    ad_storage: 'granted',
    analytics_storage: 'granted'
  })
];
```

---

## GTM JSON Structure Reference

### Container Export Format

```json
{
  "exportFormatVersion": 2,
  "exportTime": "2026-01-20 00:00:00",
  "containerVersion": {
    "path": "accounts/{accountId}/containers/{containerId}/versions/0",
    "accountId": "{accountId}",
    "containerId": "{containerId}",
    "containerVersionId": "0",
    "container": {
      "name": "Container Name",
      "publicId": "GTM-XXXXXXX",
      "usageContext": ["WEB"],
      "features": { ... }
    },
    "tag": [ ... ],
    "trigger": [ ... ],
    "variable": [ ... ],
    "builtInVariable": [ ... ],
    "folder": [ ... ]
  }
}
```

### Tag Structure

```json
{
  "accountId": "{accountId}",
  "containerId": "{containerId}",
  "tagId": "{id}",
  "name": "Tag Name",
  "type": "googtag|html|custom_image|...",
  "parameter": [{ "type": "TEMPLATE|BOOLEAN|LIST|MAP", "key": "keyName", "value": "..." }],
  "fingerprint": "{timestamp}",
  "firingTriggerId": ["triggerId1", "triggerId2"],
  "blockingTriggerId": ["blockingTriggerId"],
  "tagFiringOption": "ONCE_PER_EVENT|ONCE_PER_PAGE|UNLIMITED",
  "monitoringMetadata": { "type": "MAP" },
  "consentSettings": { "consentStatus": "NOT_SET|NEEDED|NOT_NEEDED" }
}
```

### Tag Types Reference

| Type           | Description           | Common Parameters              |
| -------------- | --------------------- | ------------------------------ |
| `googtag`      | Google Tag (GA4, Ads) | `tagId`                        |
| `html`         | Custom HTML           | `html`, `supportDocumentWrite` |
| `custom_image` | Custom Image/Pixel    | `url`                          |
| `gclidw`       | Conversion Linker     | -                              |
| `gaawe`        | GA4 Event             | `eventName`, `measurementId`   |
| `flc`          | Floodlight Counter    | -                              |

### Trigger Structure

```json
{
  "accountId": "{accountId}",
  "containerId": "{containerId}",
  "triggerId": "{id}",
  "name": "Trigger Name",
  "type": "CUSTOM_EVENT|PAGEVIEW|DOM_READY|WINDOW_LOADED|...",
  "customEventFilter": [
    {
      "type": "EQUALS|STARTS_WITH|ENDS_WITH|CONTAINS|MATCH_REGEX",
      "parameter": [
        { "type": "TEMPLATE", "key": "arg0", "value": "{{_event}}" },
        { "type": "TEMPLATE", "key": "arg1", "value": "event_name" }
      ]
    }
  ],
  "filter": [ ... ],
  "fingerprint": "{timestamp}"
}
```

### Trigger Types Reference

| Type             | Description            | Built-in ID |
| ---------------- | ---------------------- | ----------- |
| `PAGEVIEW`       | Page View              | -           |
| `DOM_READY`      | DOM Ready              | -           |
| `WINDOW_LOADED`  | Window Loaded          | -           |
| `CUSTOM_EVENT`   | Custom Event           | -           |
| `HISTORY_CHANGE` | History Change         | -           |
| `CLICK`          | All Clicks             | -           |
| `LINK_CLICK`     | Just Links             | -           |
| `FORM_SUBMIT`    | Form Submission        | -           |
| `TIMER`          | Timer                  | -           |
| `SCROLL`         | Scroll Depth           | -           |
| `YOUTUBE_VIDEO`  | YouTube Video          | -           |
| `CONSENT_INIT`   | Consent Initialization | 2147479572  |
| `INIT`           | Initialization         | 2147479573  |

### Variable Structure

```json
{
  "accountId": "{accountId}",
  "containerId": "{containerId}",
  "variableId": "{id}",
  "name": "Variable Name",
  "type": "v|c|jsm|k|smm|...",
  "parameter": [{ "type": "TEMPLATE", "key": "name|value|...", "value": "..." }],
  "fingerprint": "{timestamp}",
  "formatValue": {}
}
```

### Variable Types Reference

| Type   | Description         | Key Parameters                    |
| ------ | ------------------- | --------------------------------- |
| `v`    | Data Layer Variable | `name` (path), `dataLayerVersion` |
| `c`    | Constant            | `value`                           |
| `jsm`  | Custom JavaScript   | `javascript`                      |
| `k`    | 1st Party Cookie    | `name`                            |
| `smm`  | Lookup Table        | `input`, `map`                    |
| `remm` | Regex Table         | `input`, `map`                    |
| `aev`  | Auto-Event Variable | `varType`                         |
| `u`    | URL Variable        | `component`                       |
| `d`    | DOM Element         | `elementId/selector`              |
| `f`    | JavaScript Variable | `name`                            |

### Built-in Variables

| Type                     | Name                   |
| ------------------------ | ---------------------- |
| `PAGE_URL`               | Page URL               |
| `PAGE_HOSTNAME`          | Page Hostname          |
| `PAGE_PATH`              | Page Path              |
| `REFERRER`               | Referrer               |
| `EVENT`                  | Event                  |
| `CLICK_ELEMENT`          | Click Element          |
| `CLICK_CLASSES`          | Click Classes          |
| `CLICK_ID`               | Click ID               |
| `CLICK_URL`              | Click URL              |
| `CLICK_TEXT`             | Click Text             |
| `FORM_ELEMENT`           | Form Element           |
| `FORM_ID`                | Form ID                |
| `HISTORY_SOURCE`         | History Source         |
| `NEW_HISTORY_STATE`      | New History State      |
| `OLD_HISTORY_STATE`      | Old History State      |
| `SCROLL_DEPTH_THRESHOLD` | Scroll Depth Threshold |
| `SCROLL_DEPTH_UNITS`     | Scroll Depth Units     |
| `SCROLL_DEPTH_DIRECTION` | Scroll Depth Direction |
| `VIDEO_PROVIDER`         | Video Provider         |
| `VIDEO_STATUS`           | Video Status           |
| `VIDEO_PERCENT`          | Video Percent          |
| `VIDEO_VISIBLE`          | Video Visible          |
| `VIDEO_DURATION`         | Video Duration         |
| `VIDEO_CURRENT_TIME`     | Video Current Time     |
| `VIDEO_TITLE`            | Video Title            |
| `VIDEO_URL`              | Video URL              |

---

## GTM-Kit Universal Container Components

### Required Variables (24)

**Integration Variables:**

- [ ] DLV - integrations.ga4
- [ ] DLV - integrations.meta
- [ ] DLV - integrations.tiktok
- [ ] DLV - integrations.snapchat
- [ ] DLV - integrations.bing
- [ ] DLV - integrations.pinterest

**Consent Variables:**

- [ ] DLV - consent.analytics (default: false)
- [ ] DLV - consent.marketing (default: false)
- [ ] Consent - analytics_storage (lookup table)
- [ ] Consent - ad_storage (lookup table)

**E-commerce Variables:**

- [ ] DLV - ecommerce
- [ ] DLV - ecommerce.items
- [ ] DLV - ecommerce.value
- [ ] DLV - ecommerce.currency
- [ ] DLV - ecommerce.transaction_id
- [ ] DLV - ecommerce.affiliation
- [ ] DLV - ecommerce.coupon
- [ ] DLV - ecommerce.shipping
- [ ] DLV - ecommerce.tax

**Page Variables:**

- [ ] DLV - page_title
- [ ] DLV - page_location
- [ ] DLV - page_path

**Config Variables:**

- [ ] DLV - send_to
- [ ] DLV - user_data

### Required Triggers (4)

- [ ] consent_ready (regex: consent_init|consent_update)
- [ ] GTM-Kit Events (regex of all standard events)
- [ ] All Custom Events (regex: .\*)
- [ ] Block - No Marketing Consent

### Required Tags (14)

**Consent Tags:**

- [ ] Consent - Defaults (fires on Consent Initialization)
- [ ] Consent - Update (fires on consent_ready)

**Config Tags:**

- [ ] GA4 - Config
- [ ] Meta - Config (blocked without marketing consent)
- [ ] TikTok - Config (blocked without marketing consent)
- [ ] Snapchat - Config (blocked without marketing consent)
- [ ] Bing - Config (blocked without marketing consent)
- [ ] Pinterest - Config (blocked without marketing consent)

**Omnitag Tags:**

- [ ] GA4 - Omnitag
- [ ] Meta - Omnitag (blocked without marketing consent)
- [ ] TikTok - Omnitag (blocked without marketing consent)
- [ ] Snapchat - Omnitag (blocked without marketing consent)
- [ ] Bing - Omnitag (blocked without marketing consent)
- [ ] Pinterest - Omnitag (blocked without marketing consent)

---

## ID Generation

When creating new components, IDs must be unique integers as strings.

**Strategy:**

1. Find the highest existing ID for that component type
2. Increment by 1
3. Convert to string

**Fingerprints:**

- Use current timestamp in milliseconds
- Format: `"{Date.now()}"`

---

## Examples

### Import and analyze a container:

```
/gtm import containers/gtmkit-universal-container.json
```

### List all tags:

```
/gtm list tags
```

### Add a new Data Layer variable:

```
/gtm add variable --name "DLV - user.email" --type v --path "user.email"
```

### Validate against GTM-Kit spec:

```
/gtm validate
```

### Build the GTM-Kit Universal Container:

```
/gtm build universal
```

### Compare two containers:

```
/gtm diff containers/old.json containers/new.json
```

---

## Integration with GTM-Kit

### Site Implementation Example

```javascript
import { createGtmClient, pushEvent, pushEcommerce } from '@gtm-kit/core';

// Create client
const client = createGtmClient({
  containers: 'GTM-XXXXXXX'
});

// Push config with integrations
client.push({
  event: 'consent_init',
  integrations: {
    ga4: 'G-XXXXXXXXXX', // Required: GA4 ID
    meta: '1234567890', // Optional: Meta Pixel ID
    tiktok: null, // null = disabled
    snapchat: null,
    bing: null,
    pinterest: null
  },
  consent: {
    analytics: true,
    marketing: false
  }
});

// Push page view
pushEvent(client, 'page_view', {
  page_title: document.title,
  page_location: window.location.href
});

// Push e-commerce event
pushEcommerce(client, 'purchase', {
  transaction_id: 'TXN-001',
  value: 99.99,
  currency: 'USD',
  items: [
    {
      item_id: 'SKU-123',
      item_name: 'Product',
      price: 99.99,
      quantity: 1
    }
  ]
});
```
