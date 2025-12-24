# Event helpers and type reference

React GTM Kit ships lightweight helpers that sit on top of the core client's `push` API. They provide
strong typing for the most common GTM scenarios (page views, Ads conversions, GA4 ecommerce flows) while
remaining extensible for custom events.

## Type exports

The `@jwiedeman/gtm-kit` entry point now exports a handful of primitives for authoring and refining event
shapes:

- `EventName`, `EventPayload`, and `GtmEvent` – generic building blocks for data layer pushes.
- `PageViewEvent` and `PageViewPayload` – GA4-flavoured page view metadata.
- `AdsConversionEvent` / `AdsConversionPayload` – Ads conversion helper with mandatory `send_to` routing.
- `EcommerceEvent`, `EcommerceEventName`, `EcommerceItem`, and `EcommercePayload` – GA4 ecommerce contracts.
- `EventForName` – maps an event name (`'page_view'`, `'conversion'`, ecommerce names, or custom strings)
  to the corresponding event type, enabling inference in helper returns.
- `PushEcommerceOptions` – optional `extras` bag for top-level metadata that lives alongside the ecommerce
  payload (e.g., attribution fields or debug flags).

These types are intended to be extended by consumers via intersection. For example, a team wanting to attach
site-wide metadata can define:

```ts
import type { CustomEvent, EventPayload } from '@jwiedeman/gtm-kit';

type SiteEvent<TName extends string, TPayload extends EventPayload = EventPayload> = CustomEvent<
  TName,
  TPayload & { siteLanguage: string; appVersion: string }
>;
```

## `pushEvent`

`pushEvent` is a thin wrapper around `client.push` that enforces a string event name and accepts an optional
payload object. The helper returns the same object that is queued into the data layer, enabling fluent TypeScript
inference.

```ts
import { createGtmClient, pushEvent } from '@jwiedeman/gtm-kit';

const client = createGtmClient({ containers: 'GTM-XXXX' });

pushEvent(client, 'page_view', {
  page_path: '/pricing',
  page_title: 'Pricing – React GTM Kit'
});

pushEvent(client, 'custom_event', {
  feature_flag: 'checkout_a',
  action: 'cta_click'
});
```

Invalid payload shapes (anything other than a plain object) will throw at runtime and surface a compile-time
error in TypeScript projects.

## `pushEcommerce`

`pushEcommerce` targets GA4 ecommerce events and guarantees that the `ecommerce` object survives intact even
when additional metadata is supplied.

```ts
import { pushEcommerce } from '@jwiedeman/gtm-kit';

pushEcommerce(
  client,
  'purchase',
  {
    value: 149,
    currency: 'USD',
    items: [{ item_id: 'SKU-123', item_name: 'Tote bag', price: 49, quantity: 3 }]
  },
  {
    extras: {
      coupon: 'SPRING-SALE',
      send_to: 'G-12345678'
    }
  }
);
```

Common safeguards:

- Passing a non-object ecommerce payload (e.g., `null`) throws immediately.
- Extra metadata must be a plain object; otherwise an error is raised.
- If an `extras` object includes `ecommerce`, the helper overwrites it with the authoritative payload to prevent
  accidental shadowing.

## Type tests

`packages/core/tsd/events.test-d.ts` exercises the exported types with [`tsd`](https://github.com/SamVerschueren/tsd)
to keep inference guarantees stable. Run `pnpm typecheck` to execute both `tsc --noEmit` and the `tsd` suite.
