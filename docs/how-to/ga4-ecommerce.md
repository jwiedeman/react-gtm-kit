# Track GA4 ecommerce events with `pushEcommerce`

Use the `pushEcommerce` helper to send GA4-compliant ecommerce payloads without losing metadata to extra fields or non-object payloads.

## Model your items and totals

Define a reusable shape for items and include pricing, quantity, and attribution fields that GA4 expects. The helper enforces that `ecommerce` stays a plain object and will throw if the payload is `null` or malformed.

```ts
import { pushEcommerce } from '@jwiedeman/gtm-kit';

const items = [
  { item_id: 'SKU-123', item_name: 'Tote bag', price: 49, quantity: 2 },
  { item_id: 'SKU-456', item_name: 'Stickers', price: 5, quantity: 4 }
];

pushEcommerce(client, 'begin_checkout', { value: 118, currency: 'USD', items });
```

## Add extras without shadowing ecommerce data

`pushEcommerce` accepts an optional `extras` object for metadata that should live alongside the `ecommerce` payload (for example, coupons, attribution, or debug flags). If `extras` includes `ecommerce`, it will be overwritten to prevent accidental corruption of the GA4 payload.

```ts
pushEcommerce(
  client,
  'purchase',
  { value: 129, currency: 'USD', items },
  {
    extras: {
      coupon: 'SPRING-SALE',
      send_to: 'G-12345678',
      affiliation: 'web'
    }
  }
);
```

## Wire the helper into React flows

Combine `pushEcommerce` with the React adapter to fire ecommerce events from components while keeping StrictMode-safe behavior.

```tsx
import { useGtmPush } from '@jwiedeman/gtm-kit-react';
import { pushEcommerce } from '@jwiedeman/gtm-kit';

export function PurchaseButton() {
  const push = useGtmPush();

  return (
    <button
      onClick={() =>
        pushEcommerce(
          { push },
          'add_to_cart',
          {
            value: 54,
            currency: 'USD',
            items: [{ item_id: 'SKU-123', item_name: 'Tote bag', price: 54, quantity: 1 }]
          },
          { extras: { coupon: 'WELCOME10' } }
        )
      }
    >
      Add to cart
    </button>
  );
}
```

The helper preserves typing and runtime guards even when used with the adapter’s `push` function.

## Verify events in GA4 debug view

- Use your browser’s network tab to confirm `dataLayer` pushes include the `ecommerce` object and any extras you supplied.
- In GA4 DebugView, ensure events appear under the expected names (`add_to_cart`, `begin_checkout`, `purchase`) with item arrays intact.
- Align ecommerce amounts with receipt totals and consider adding tests that assert items and values remain unchanged when extras are present.
