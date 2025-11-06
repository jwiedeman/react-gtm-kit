import { expectError, expectType } from 'tsd';
import type { AdsConversionEvent, EcommerceEvent, PageViewEvent } from '../dist';
import { pushEcommerce, pushEvent } from '../dist';

const client = { push: (_value: unknown) => undefined };

declare const value: number;

const pageView = pushEvent(client, 'page_view', { page_path: '/home' });
expectType<PageViewEvent>(pageView);

const conversion = pushEvent(client, 'conversion', { send_to: 'AW-123/example' });
expectType<AdsConversionEvent>(conversion);

const ecommerceViaHelper = pushEcommerce(client, 'purchase', {
  items: [],
  value
});
expectType<EcommerceEvent<'purchase'>>(ecommerceViaHelper);

const ecommerceWithExtras = pushEcommerce(
  client,
  'view_item',
  { items: [] },
  {
    extras: {
      send_to: 'G-123456',
      section: 'pricing'
    }
  }
);
expectType<EcommerceEvent<'view_item', { send_to: string; section: string }>>(ecommerceWithExtras);

expectError(pushEvent(client, 'custom', 'not-object'));
expectError(
  pushEcommerce(
    client,
    'purchase',
    {
      items: []
    },
    {
      extras: 'invalid'
    }
  )
);
