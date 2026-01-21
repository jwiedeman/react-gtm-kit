# GTM Kit Event Schema Documentation

This document provides comprehensive documentation for all event types supported by GTM Kit, including GA4 recommended events and industry-specific extended events.

## Table of Contents

- [Overview](#overview)
- [Event Categories](#event-categories)
- [GA4 Recommended Events](#ga4-recommended-events)
- [Ecommerce Events](#ecommerce-events)
- [Booking/Reservation Events](#bookingreservation-events)
- [Video Tracking Events](#video-tracking-events)
- [Form Tracking Events](#form-tracking-events)
- [SaaS/Subscription Events](#saassubscription-events)
- [Error Events](#error-events)
- [File/Download Events](#filedownload-events)
- [Authentication Events](#authentication-events)
- [Engagement Events](#engagement-events)
- [Communication Events](#communication-events)
- [Social Events](#social-events)
- [Search/Filter Events](#searchfilter-events)
- [Gaming/Gamification Events](#gaminggamification-events)
- [Extending the Schema](#extending-the-schema)
- [GTM Container Setup](#gtm-container-setup)

---

## Overview

GTM Kit provides a comprehensive, type-safe event schema that covers:

- **GA4 Recommended Events**: Official Google Analytics 4 events with full autocomplete support
- **Extended Events**: Industry-specific events for booking, video, forms, SaaS, and more
- **Custom Events**: Support for any custom event names with full TypeScript support

### Key Benefits

1. **Type Safety**: Full TypeScript support with IntelliSense for event names and payloads
2. **Industry Coverage**: Pre-built events for 15+ industries and use cases
3. **GA4 Compatibility**: All events map directly to GA4 parameters
4. **GTM Ready**: Included universal GTM container with pre-configured variables and triggers
5. **Extensible**: Easy to add custom events while maintaining type safety

---

## Event Categories

| Category      | Event Count | Description                       |
| ------------- | ----------- | --------------------------------- |
| Core/GA4      | 29          | Standard GA4 recommended events   |
| Ecommerce     | 14          | Shopping and transaction events   |
| Booking       | 10          | Travel, hospitality, appointments |
| Video         | 9           | Video player tracking             |
| Form          | 10          | Form interaction lifecycle        |
| SaaS          | 18          | Subscription and feature usage    |
| Error         | 8           | Error and exception tracking      |
| File          | 7           | Downloads and uploads             |
| Auth          | 21          | Authentication lifecycle          |
| Engagement    | 13          | User interaction depth            |
| Communication | 16          | Chat, notifications, messaging    |
| Social        | 17          | Social engagement and referrals   |
| Search/Filter | 13          | Search and filtering behavior     |
| Gaming        | 16          | Gamification and achievements     |
| **Total**     | **201**     | Comprehensive event coverage      |

---

## GA4 Recommended Events

These events are officially recommended by Google Analytics 4 and provide the best reporting capabilities.

### Page/Screen Events

#### `page_view`

Track page views in web applications.

```typescript
import { pushEvent } from '@jwiedeman/gtm-kit';

pushEvent(client, 'page_view', {
  page_title: 'Home Page',
  page_location: 'https://example.com/',
  page_path: '/'
});
```

| Parameter       | Type   | Required | Description          |
| --------------- | ------ | -------- | -------------------- |
| `page_title`    | string | No       | Title of the page    |
| `page_location` | string | No       | Full URL of the page |
| `page_path`     | string | No       | Path portion of URL  |
| `send_to`       | string | No       | GA4 measurement ID   |

#### `screen_view`

Track screen views in mobile/SPA applications.

```typescript
pushEvent(client, 'screen_view', {
  screen_name: 'Dashboard',
  screen_class: 'DashboardScreen'
});
```

### User Events

#### `login`

Track user logins.

```typescript
pushEvent(client, 'login', {
  method: 'google'
});
```

#### `sign_up`

Track new user registrations.

```typescript
pushEvent(client, 'sign_up', {
  method: 'email'
});
```

### Engagement Events

#### `search`

Track site searches.

```typescript
pushEvent(client, 'search', {
  search_term: 'wireless headphones'
});
```

#### `share`

Track content sharing.

```typescript
pushEvent(client, 'share', {
  method: 'twitter',
  content_type: 'article',
  item_id: 'article_123'
});
```

#### `generate_lead`

Track lead generation.

```typescript
pushEvent(client, 'generate_lead', {
  currency: 'USD',
  value: 100
});
```

---

## Ecommerce Events

Full GA4 ecommerce event support with typed item arrays.

### Product Views

#### `view_item`

Track when a user views a product.

```typescript
import { pushEcommerce } from '@jwiedeman/gtm-kit';

pushEcommerce(client, 'view_item', {
  currency: 'USD',
  value: 29.99,
  items: [
    {
      item_id: 'SKU-001',
      item_name: 'Wireless Headphones',
      item_brand: 'Sony',
      item_category: 'Electronics',
      item_category2: 'Audio',
      item_variant: 'Black',
      price: 29.99,
      quantity: 1
    }
  ]
});
```

#### `view_item_list`

Track when a user views a list of products.

```typescript
pushEcommerce(client, 'view_item_list', {
  item_list_id: 'search_results',
  item_list_name: 'Search Results',
  items: [
    { item_id: 'SKU-001', item_name: 'Product 1', price: 29.99 },
    { item_id: 'SKU-002', item_name: 'Product 2', price: 39.99 }
  ]
});
```

### Cart Actions

#### `add_to_cart`

Track when a user adds an item to cart.

```typescript
pushEcommerce(client, 'add_to_cart', {
  currency: 'USD',
  value: 29.99,
  items: [
    {
      item_id: 'SKU-001',
      item_name: 'Wireless Headphones',
      price: 29.99,
      quantity: 1
    }
  ]
});
```

#### `remove_from_cart`

Track when a user removes an item from cart.

```typescript
pushEcommerce(client, 'remove_from_cart', {
  currency: 'USD',
  value: 29.99,
  items: [
    {
      item_id: 'SKU-001',
      item_name: 'Wireless Headphones',
      price: 29.99,
      quantity: 1
    }
  ]
});
```

### Checkout Flow

#### `begin_checkout`

Track when a user begins checkout.

```typescript
pushEcommerce(client, 'begin_checkout', {
  currency: 'USD',
  value: 89.97,
  coupon: 'SAVE10',
  items: [
    /* cart items */
  ]
});
```

#### `add_shipping_info`

Track when shipping info is added.

```typescript
pushEcommerce(client, 'add_shipping_info', {
  currency: 'USD',
  value: 89.97,
  shipping_tier: 'express',
  items: [
    /* cart items */
  ]
});
```

#### `add_payment_info`

Track when payment info is added.

```typescript
pushEcommerce(client, 'add_payment_info', {
  currency: 'USD',
  value: 89.97,
  payment_type: 'credit_card',
  items: [
    /* cart items */
  ]
});
```

#### `purchase`

Track completed purchases.

```typescript
pushEcommerce(client, 'purchase', {
  transaction_id: 'TXN-12345',
  currency: 'USD',
  value: 99.97,
  tax: 8.0,
  shipping: 5.99,
  coupon: 'SAVE10',
  affiliation: 'Main Store',
  items: [
    /* purchased items */
  ]
});
```

### Ecommerce Item Schema

| Parameter            | Type   | Required | Description       |
| -------------------- | ------ | -------- | ----------------- |
| `item_id`            | string | Yes\*    | SKU or product ID |
| `item_name`          | string | Yes\*    | Product name      |
| `item_brand`         | string | No       | Brand name        |
| `item_category`      | string | No       | Primary category  |
| `item_category2`-`5` | string | No       | Sub-categories    |
| `item_variant`       | string | No       | Product variant   |
| `price`              | number | No       | Unit price        |
| `quantity`           | number | No       | Quantity          |
| `coupon`             | string | No       | Item-level coupon |
| `discount`           | number | No       | Discount amount   |
| `index`              | number | No       | Position in list  |

\*Either `item_id` or `item_name` is required.

---

## Booking/Reservation Events

Track bookings across travel, hospitality, healthcare, and service industries.

### Event Types

| Event                     | Description                            |
| ------------------------- | -------------------------------------- |
| `booking_requested`       | Booking request initiated              |
| `booking_confirmed`       | Booking confirmed                      |
| `booking_cancelled`       | Booking cancelled                      |
| `booking_modified`        | Booking details changed                |
| `reservation_created`     | Restaurant/service reservation created |
| `reservation_confirmed`   | Reservation confirmed                  |
| `reservation_cancelled`   | Reservation cancelled                  |
| `appointment_scheduled`   | Appointment scheduled                  |
| `appointment_cancelled`   | Appointment cancelled                  |
| `appointment_rescheduled` | Appointment rescheduled                |

### Example: Hotel Booking

```typescript
pushEvent(client, 'booking_confirmed', {
  booking_id: 'BK-12345',
  booking_type: 'hotel',
  value: 450.0,
  currency: 'USD',
  check_in_date: '2024-03-15',
  check_out_date: '2024-03-18',
  guests: 2,
  nights: 3,
  room_type: 'deluxe_suite',
  location: 'New York',
  provider: 'Marriott',
  lead_time_days: 14
});
```

### Example: Restaurant Reservation

```typescript
pushEvent(client, 'reservation_confirmed', {
  booking_id: 'RES-789',
  booking_type: 'restaurant',
  party_size: 4,
  start_date: '2024-03-20',
  start_time: '19:00',
  location: 'Downtown',
  provider: 'Fancy Restaurant'
});
```

### Example: Appointment

```typescript
pushEvent(client, 'appointment_scheduled', {
  booking_id: 'APT-456',
  booking_type: 'appointment',
  service_type: 'consultation',
  start_date: '2024-03-15',
  start_time: '14:00',
  provider: 'Dr. Smith',
  value: 150.0,
  currency: 'USD'
});
```

---

## Video Tracking Events

Track video engagement across YouTube, Vimeo, HTML5 video, and custom players.

### Event Types

| Event                  | Description                             |
| ---------------------- | --------------------------------------- |
| `video_start`          | Video playback started                  |
| `video_progress`       | Video reached milestone (25%, 50%, 75%) |
| `video_complete`       | Video playback completed                |
| `video_pause`          | Video paused                            |
| `video_resume`         | Video resumed                           |
| `video_seek`           | User seeked in video                    |
| `video_error`          | Video playback error                    |
| `video_quality_change` | Quality changed                         |
| `video_fullscreen`     | Fullscreen toggled                      |

### Example: Video Tracking

```typescript
// Video started
pushEvent(client, 'video_start', {
  video_id: 'abc123',
  video_title: 'Product Demo',
  video_provider: 'youtube',
  video_duration: 240,
  video_url: 'https://youtube.com/watch?v=abc123'
});

// Video progress (25%)
pushEvent(client, 'video_progress', {
  video_id: 'abc123',
  video_title: 'Product Demo',
  video_percent: 25,
  video_current_time: 60,
  video_duration: 240
});

// Video completed
pushEvent(client, 'video_complete', {
  video_id: 'abc123',
  video_title: 'Product Demo',
  video_duration: 240
});
```

---

## Form Tracking Events

Track the complete form interaction lifecycle from start to submission.

### Event Types

| Event                 | Description                    |
| --------------------- | ------------------------------ |
| `form_start`          | User started filling form      |
| `form_field_focus`    | User focused on field          |
| `form_field_blur`     | User left field                |
| `form_field_change`   | Field value changed            |
| `form_error`          | Validation error occurred      |
| `form_submit`         | Form submission attempted      |
| `form_submit_success` | Form submitted successfully    |
| `form_submit_failure` | Form submission failed         |
| `form_abandon`        | User abandoned form            |
| `form_step_complete`  | Multi-step form step completed |

### Example: Contact Form Tracking

```typescript
// Form started
pushEvent(client, 'form_start', {
  form_id: 'contact-form',
  form_name: 'Contact Us',
  form_type: 'contact',
  form_fields_count: 5
});

// Field interaction
pushEvent(client, 'form_field_focus', {
  form_id: 'contact-form',
  field_name: 'email',
  field_type: 'email',
  field_label: 'Email Address',
  field_position: 3
});

// Validation error
pushEvent(client, 'form_error', {
  form_id: 'contact-form',
  field_name: 'email',
  error_type: 'validation',
  error_message: 'Invalid email format',
  error_count: 1
});

// Successful submission
pushEvent(client, 'form_submit_success', {
  form_id: 'contact-form',
  form_name: 'Contact Us',
  time_to_complete_ms: 45000,
  value: 500,
  currency: 'USD'
});
```

---

## SaaS/Subscription Events

Track the complete subscription lifecycle for software products.

### Event Types

| Event                    | Description               |
| ------------------------ | ------------------------- |
| `trial_start`            | Trial period started      |
| `trial_end`              | Trial period ended        |
| `trial_convert`          | Trial converted to paid   |
| `subscription_start`     | New subscription started  |
| `subscription_cancel`    | Subscription cancelled    |
| `subscription_renew`     | Subscription renewed      |
| `subscription_upgrade`   | Plan upgraded             |
| `subscription_downgrade` | Plan downgraded           |
| `subscription_pause`     | Subscription paused       |
| `subscription_resume`    | Subscription resumed      |
| `plan_select`            | User selected a plan      |
| `feature_used`           | Feature usage tracked     |
| `limit_reached`          | Usage limit reached       |
| `onboarding_start`       | Onboarding started        |
| `onboarding_step`        | Onboarding step completed |
| `onboarding_complete`    | Onboarding completed      |
| `invite_sent`            | Team invite sent          |
| `invite_accepted`        | Team invite accepted      |

### Example: Subscription Lifecycle

```typescript
// Trial started
pushEvent(client, 'trial_start', {
  plan_id: 'pro_trial',
  plan_name: 'Pro Trial',
  trial_days: 14
});

// Trial converted
pushEvent(client, 'trial_convert', {
  plan_id: 'pro_monthly',
  plan_name: 'Pro Monthly',
  value: 29.99,
  currency: 'USD'
});

// Subscription started
pushEvent(client, 'subscription_start', {
  subscription_id: 'sub_abc123',
  plan_id: 'pro_monthly',
  plan_name: 'Pro Monthly',
  plan_tier: 'pro',
  billing_period: 'monthly',
  value: 29.99,
  mrr: 29.99,
  currency: 'USD',
  trial_converted: true,
  payment_method: 'credit_card'
});

// Feature usage
pushEvent(client, 'feature_used', {
  feature_id: 'export_csv',
  feature_name: 'CSV Export',
  feature_category: 'data_export',
  usage_count: 5
});

// Limit reached
pushEvent(client, 'limit_reached', {
  limit_type: 'api_calls',
  current_usage: 1000,
  max_usage: 1000
});
```

---

## Error Events

Track errors and exceptions for debugging and monitoring.

### Event Types

| Event               | Description                |
| ------------------- | -------------------------- |
| `error`             | General error event        |
| `exception`         | JavaScript exception       |
| `api_error`         | API request error          |
| `validation_error`  | Validation error           |
| `page_not_found`    | 404 error                  |
| `permission_denied` | Access denied              |
| `timeout`           | Request timeout            |
| `network_error`     | Network connectivity error |

### Example: Error Tracking

```typescript
// JavaScript exception
pushEvent(client, 'exception', {
  error_message: 'Cannot read property of undefined',
  error_type: 'TypeError',
  error_stack: 'Error: Cannot read...',
  error_file: 'app.js',
  error_line: 42,
  fatal: true
});

// API error
pushEvent(client, 'api_error', {
  api_endpoint: '/api/users',
  http_method: 'POST',
  error_code: '500',
  error_message: 'Internal server error',
  request_id: 'req_abc123'
});
```

---

## Extending the Schema

GTM Kit is designed to be extensible. Here's how to add custom events while maintaining type safety.

### Option 1: Use Custom Event Names (Simple)

Any string event name works with the `pushEvent` function:

```typescript
// Custom event with any payload
pushEvent(client, 'custom_button_click', {
  button_id: 'cta-main',
  button_text: 'Get Started',
  page_section: 'hero'
});
```

### Option 2: Extend Types (Type-Safe)

Create a custom types file for your project:

```typescript
// types/gtm-events.ts
import { EventPayload, GtmEvent } from '@jwiedeman/gtm-kit';

// Define your custom event names
export type MyAppEventName = 'product_configurator_open' | 'product_configurator_complete' | 'custom_quote_requested';

// Define your custom payload
export interface ProductConfiguratorPayload extends EventPayload {
  product_id: string;
  configuration_id?: string;
  options_selected?: number;
  total_price?: number;
  currency?: string;
}

// Create typed event types
export type ProductConfiguratorOpenEvent = GtmEvent<'product_configurator_open', ProductConfiguratorPayload>;
export type ProductConfiguratorCompleteEvent = GtmEvent<'product_configurator_complete', ProductConfiguratorPayload>;

// Helper function with type safety
export function pushConfiguratorEvent(
  client: GtmClient,
  event: 'product_configurator_open' | 'product_configurator_complete',
  payload: ProductConfiguratorPayload
) {
  return pushEvent(client, event, payload);
}
```

### Option 3: Module Augmentation (Advanced)

Extend GTM Kit's types directly:

```typescript
// types/gtm-kit.d.ts
import '@jwiedeman/gtm-kit';

declare module '@jwiedeman/gtm-kit' {
  // Extend the event names
  export interface CustomEventNames {
    my_custom_event: MyCustomPayload;
    another_event: AnotherPayload;
  }

  interface MyCustomPayload extends EventPayload {
    custom_field: string;
    custom_value: number;
  }
}
```

---

## GTM Container Setup

GTM Kit includes a universal GTM container (`containers/gtmkit-universal-container.json`) with pre-configured variables, triggers, and tags.

### Importing the Container

1. Download `gtmkit-universal-container.json`
2. Go to GTM Admin > Import Container
3. Choose "Merge" to add to existing container
4. Review and publish

### Included Components

#### Data Layer Variables

All event parameters are pre-configured as Data Layer Variables:

- Ecommerce: `ecommerce.currency`, `ecommerce.value`, `ecommerce.transaction_id`, `ecommerce.items`
- Booking: `booking_id`, `booking_type`, `check_in_date`, `check_out_date`, `guests`, `nights`
- Video: `video_id`, `video_title`, `video_provider`, `video_percent`, `video_duration`
- Form: `form_id`, `form_name`, `form_type`, `field_name`, `error_message`
- SaaS: `subscription_id`, `plan_id`, `plan_name`, `plan_tier`, `feature_id`
- Error: `error_message`, `error_type`, `error_code`, `error_stack`
- And more...

#### Triggers

Pre-configured triggers for each event category:

- `GTM Kit - Ecommerce Events`
- `GTM Kit - Booking Events`
- `GTM Kit - Video Events`
- `GTM Kit - Form Events`
- `GTM Kit - SaaS Events`
- `GTM Kit - Extended Events`

#### Tags

Example GA4 Event tags configured for:

- All ecommerce events
- Page views and screen views
- Lead generation
- Custom events

### Customizing for Your Setup

1. **GA4 Configuration**: Update the GA4 Configuration tag with your Measurement ID
2. **Event Parameters**: Add/remove parameters based on your tracking needs
3. **Triggers**: Modify trigger conditions for your specific events
4. **Tags**: Create additional tags for other platforms (Facebook, LinkedIn, etc.)

---

## Best Practices

### 1. Use Typed Events

Always prefer typed events over generic objects:

```typescript
// Good
pushEvent(client, 'purchase', { transaction_id: '123', ... });

// Avoid
client.push({ event: 'purchase', transaction_id: '123', ... });
```

### 2. Include Required Parameters

Check the spec sheet for required parameters for each event type.

### 3. Use Consistent Naming

Follow the existing naming conventions:

- Event names: `snake_case`
- Parameters: `snake_case`
- IDs: Include prefixes like `TXN-`, `BK-`, `SKU-`

### 4. Clear Ecommerce Before New Events

Use the `clearEcommerce` option to prevent data bleeding:

```typescript
pushEcommerce(client, 'view_item', payload, { clearEcommerce: true });
```

### 5. Test in GTM Preview Mode

Always verify events in GTM's Preview mode before publishing.

---

## Resources

- [CSV Spec Sheet](./EVENT_SPEC_SHEET.csv) - Full parameter reference
- [GTM Container](../containers/gtmkit-universal-container.json) - Universal container
- [Core Package](../packages/core/README.md) - API documentation
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events) - Official GA4 docs
