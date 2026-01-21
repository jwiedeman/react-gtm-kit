/**
 * GA4 Schema Validation Tests
 *
 * These tests verify that the GTM-Kit event helpers and types correctly
 * support GA4's Enhanced Ecommerce specification and other standard events.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

import { pushEcommerce, pushEvent } from '../events';
import type {
  EcommercePayload,
  EcommerceItem,
  PageViewPayload,
  AdsConversionPayload,
  EcommerceEventName
} from '../events/types';
import type { GtmClient } from '../types';

describe('GA4 Schema Validation', () => {
  const createClient = () => {
    const pushes: unknown[] = [];
    const client: Pick<GtmClient, 'push'> = {
      push: (value) => {
        pushes.push(value);
      }
    };
    return { client, pushes };
  };

  describe('E-commerce Event Types', () => {
    const ecommerceEvents: EcommerceEventName[] = [
      'add_payment_info',
      'add_shipping_info',
      'add_to_cart',
      'begin_checkout',
      'purchase',
      'refund',
      'remove_from_cart',
      'select_item',
      'select_promotion',
      'view_cart',
      'view_item',
      'view_item_list',
      'view_promotion'
    ];

    it.each(ecommerceEvents)('pushes %s event with minimal valid payload', (eventName) => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        items: [{ item_id: 'SKU-001', item_name: 'Test Product' }]
      };

      pushEcommerce(client, eventName, ecommerce);

      expect(pushes).toHaveLength(1);
      expect(pushes[0]).toEqual({
        event: eventName,
        ecommerce
      });
    });

    it.each(ecommerceEvents)('pushes %s event with full item attributes', (eventName) => {
      const { client, pushes } = createClient();
      const item: EcommerceItem = {
        item_id: 'SKU-12345',
        item_name: 'Premium Widget',
        item_brand: 'WidgetCo',
        item_category: 'Electronics',
        item_category2: 'Gadgets',
        item_category3: 'Smart Devices',
        item_category4: 'Home Automation',
        item_category5: 'Controllers',
        item_variant: 'Blue',
        price: 99.99,
        quantity: 2,
        coupon: 'SUMMER10',
        discount: 9.99
      };

      const ecommerce: EcommercePayload = {
        currency: 'USD',
        value: 179.98,
        items: [item]
      };

      pushEcommerce(client, eventName, ecommerce);

      expect(pushes[0]).toEqual({
        event: eventName,
        ecommerce
      });
    });
  });

  describe('Purchase Event (GA4 Required Fields)', () => {
    it('pushes purchase event with transaction details', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        transaction_id: 'T-12345',
        value: 199.99,
        currency: 'USD',
        tax: 15.99,
        shipping: 5.99,
        coupon: 'FREESHIP',
        affiliation: 'Google Store',
        items: [
          {
            item_id: 'SKU-001',
            item_name: 'Product A',
            price: 99.99,
            quantity: 2
          }
        ]
      };

      pushEcommerce(client, 'purchase', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'purchase',
        ecommerce
      });
    });

    it('handles purchase with multiple items', () => {
      const { client, pushes } = createClient();
      const items: EcommerceItem[] = Array.from({ length: 10 }, (_, i) => ({
        item_id: `SKU-${String(i).padStart(3, '0')}`,
        item_name: `Product ${i + 1}`,
        price: 10 + i,
        quantity: 1
      }));

      const ecommerce: EcommercePayload = {
        transaction_id: 'T-MULTI-001',
        value: items.reduce((sum, item) => sum + (item.price ?? 0), 0),
        currency: 'USD',
        items
      };

      pushEcommerce(client, 'purchase', ecommerce);

      const pushed = pushes[0] as { event: string; ecommerce: EcommercePayload };
      expect(pushed.event).toBe('purchase');
      expect(pushed.ecommerce.items).toHaveLength(10);
    });
  });

  describe('Refund Event', () => {
    it('pushes full refund with transaction_id only', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        transaction_id: 'T-REFUND-001',
        items: []
      };

      pushEcommerce(client, 'refund', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'refund',
        ecommerce
      });
    });

    it('pushes partial refund with specific items', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        transaction_id: 'T-REFUND-002',
        value: 25.0,
        currency: 'USD',
        items: [
          {
            item_id: 'SKU-PARTIAL',
            item_name: 'Refunded Item',
            quantity: 1,
            price: 25.0
          }
        ]
      };

      pushEcommerce(client, 'refund', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'refund',
        ecommerce
      });
    });
  });

  describe('Cart Operations', () => {
    it('pushes add_to_cart with item details', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'EUR',
        value: 49.99,
        items: [
          {
            item_id: 'SKU-CART-001',
            item_name: 'New Item',
            item_brand: 'Brand X',
            item_category: 'Clothing',
            item_variant: 'Medium',
            price: 49.99,
            quantity: 1
          }
        ]
      };

      pushEcommerce(client, 'add_to_cart', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'add_to_cart',
        ecommerce
      });
    });

    it('pushes remove_from_cart with item details', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'EUR',
        value: 49.99,
        items: [
          {
            item_id: 'SKU-CART-001',
            item_name: 'Removed Item',
            price: 49.99,
            quantity: 1
          }
        ]
      };

      pushEcommerce(client, 'remove_from_cart', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'remove_from_cart',
        ecommerce
      });
    });

    it('pushes view_cart with cart contents', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'USD',
        value: 150.0,
        items: [
          { item_id: 'ITEM-1', item_name: 'First Item', price: 50, quantity: 2 },
          { item_id: 'ITEM-2', item_name: 'Second Item', price: 50, quantity: 1 }
        ]
      };

      pushEcommerce(client, 'view_cart', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'view_cart',
        ecommerce
      });
    });
  });

  describe('Checkout Flow', () => {
    it('pushes begin_checkout event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'USD',
        value: 75.0,
        coupon: 'CHECKOUT10',
        items: [{ item_id: 'CHECKOUT-001', item_name: 'Checkout Item' }]
      };

      pushEcommerce(client, 'begin_checkout', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'begin_checkout',
        ecommerce
      });
    });

    it('pushes add_shipping_info event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'USD',
        value: 75.0,
        shipping: 9.99,
        items: [{ item_id: 'SHIP-001', item_name: 'Shipping Item' }]
      };

      pushEcommerce(client, 'add_shipping_info', ecommerce, {
        extras: { shipping_tier: 'Express' }
      });

      expect(pushes[0]).toEqual({
        event: 'add_shipping_info',
        shipping_tier: 'Express',
        ecommerce
      });
    });

    it('pushes add_payment_info event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'USD',
        value: 75.0,
        items: [{ item_id: 'PAY-001', item_name: 'Payment Item' }]
      };

      pushEcommerce(client, 'add_payment_info', ecommerce, {
        extras: { payment_type: 'Credit Card' }
      });

      expect(pushes[0]).toEqual({
        event: 'add_payment_info',
        payment_type: 'Credit Card',
        ecommerce
      });
    });
  });

  describe('Product Discovery', () => {
    it('pushes view_item event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        currency: 'USD',
        value: 29.99,
        items: [
          {
            item_id: 'VIEW-001',
            item_name: 'Product Detail View',
            item_brand: 'ViewBrand',
            item_category: 'Category A',
            price: 29.99
          }
        ]
      };

      pushEcommerce(client, 'view_item', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'view_item',
        ecommerce
      });
    });

    it('pushes view_item_list event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        items: [
          { item_id: 'LIST-001', item_name: 'List Item 1' },
          { item_id: 'LIST-002', item_name: 'List Item 2' },
          { item_id: 'LIST-003', item_name: 'List Item 3' }
        ]
      };

      pushEcommerce(client, 'view_item_list', ecommerce, {
        extras: { item_list_id: 'search_results', item_list_name: 'Search Results' }
      });

      expect(pushes[0]).toEqual({
        event: 'view_item_list',
        item_list_id: 'search_results',
        item_list_name: 'Search Results',
        ecommerce
      });
    });

    it('pushes select_item event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        items: [{ item_id: 'SELECT-001', item_name: 'Selected Item' }]
      };

      pushEcommerce(client, 'select_item', ecommerce, {
        extras: { item_list_id: 'featured', item_list_name: 'Featured Products' }
      });

      expect(pushes[0]).toEqual({
        event: 'select_item',
        item_list_id: 'featured',
        item_list_name: 'Featured Products',
        ecommerce
      });
    });
  });

  describe('Promotions', () => {
    it('pushes view_promotion event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        items: [{ item_id: 'PROMO-001', item_name: 'Promotion Item' }]
      };

      pushEcommerce(client, 'view_promotion', ecommerce, {
        extras: {
          promotion_id: 'SUMMER_SALE',
          promotion_name: 'Summer Sale',
          creative_name: 'Banner_Top',
          creative_slot: 'slot1'
        }
      });

      expect(pushes[0]).toEqual({
        event: 'view_promotion',
        promotion_id: 'SUMMER_SALE',
        promotion_name: 'Summer Sale',
        creative_name: 'Banner_Top',
        creative_slot: 'slot1',
        ecommerce
      });
    });

    it('pushes select_promotion event', () => {
      const { client, pushes } = createClient();
      const ecommerce: EcommercePayload = {
        items: [{ item_id: 'PROMO-CLICK-001', item_name: 'Clicked Promo Item' }]
      };

      pushEcommerce(client, 'select_promotion', ecommerce, {
        extras: {
          promotion_id: 'FLASH_DEAL',
          promotion_name: 'Flash Deal'
        }
      });

      expect(pushes[0]).toEqual({
        event: 'select_promotion',
        promotion_id: 'FLASH_DEAL',
        promotion_name: 'Flash Deal',
        ecommerce
      });
    });
  });

  describe('Page View Events', () => {
    it('pushes page_view with standard payload', () => {
      const { client, pushes } = createClient();
      const payload: PageViewPayload = {
        page_title: 'Home Page',
        page_location: 'https://example.com/',
        page_path: '/'
      };

      pushEvent(client, 'page_view', payload);

      expect(pushes[0]).toEqual({
        event: 'page_view',
        ...payload
      });
    });

    it('pushes page_view with send_to parameter', () => {
      const { client, pushes } = createClient();
      const payload: PageViewPayload = {
        page_title: 'Product Page',
        page_location: 'https://example.com/product',
        page_path: '/product',
        send_to: 'G-XXXXXXXX'
      };

      pushEvent(client, 'page_view', payload);

      expect(pushes[0]).toEqual({
        event: 'page_view',
        ...payload
      });
    });
  });

  describe('Ads Conversion Events', () => {
    it('pushes conversion event with required fields', () => {
      const { client, pushes } = createClient();
      const payload: AdsConversionPayload = {
        send_to: 'AW-XXXXXXXXX/XXXXXXXXXXXX'
      };

      pushEvent(client, 'conversion', payload);

      expect(pushes[0]).toEqual({
        event: 'conversion',
        ...payload
      });
    });

    it('pushes conversion event with full details', () => {
      const { client, pushes } = createClient();
      const payload: AdsConversionPayload = {
        send_to: 'AW-XXXXXXXXX/XXXXXXXXXXXX',
        value: 100.0,
        currency: 'USD',
        transaction_id: 'ORDER-12345',
        user_data: {
          email: 'sha256_hashed_email',
          phone_number: 'sha256_hashed_phone'
        }
      };

      pushEvent(client, 'conversion', payload);

      expect(pushes[0]).toEqual({
        event: 'conversion',
        ...payload
      });
    });
  });

  describe('Edge Cases', () => {
    describe('Currency Handling', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'BRL', 'AUD'];

      it.each(currencies)('handles %s currency correctly', (currency) => {
        const { client, pushes } = createClient();
        const ecommerce: EcommercePayload = {
          currency,
          value: 100.0,
          items: [{ item_id: `${currency}-ITEM`, item_name: 'Currency Test' }]
        };

        pushEcommerce(client, 'purchase', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.currency).toBe(currency);
      });
    });

    describe('Numeric Precision', () => {
      it('handles decimal prices correctly', () => {
        const { client, pushes } = createClient();
        const ecommerce: EcommercePayload = {
          currency: 'USD',
          value: 99.99,
          items: [
            {
              item_id: 'DECIMAL-001',
              item_name: 'Decimal Price Item',
              price: 33.333333,
              quantity: 3,
              discount: 0.01
            }
          ]
        };

        pushEcommerce(client, 'purchase', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items[0].price).toBe(33.333333);
        expect(pushed.ecommerce.items[0].discount).toBe(0.01);
      });

      it('handles zero values', () => {
        const { client, pushes } = createClient();
        const ecommerce: EcommercePayload = {
          currency: 'USD',
          value: 0,
          shipping: 0,
          tax: 0,
          items: [
            {
              item_id: 'FREE-001',
              item_name: 'Free Item',
              price: 0,
              quantity: 1,
              discount: 0
            }
          ]
        };

        pushEcommerce(client, 'purchase', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.value).toBe(0);
        expect(pushed.ecommerce.items[0].price).toBe(0);
      });

      it('handles large values', () => {
        const { client, pushes } = createClient();
        const largeValue = 9999999.99;
        const ecommerce: EcommercePayload = {
          currency: 'USD',
          value: largeValue,
          items: [
            {
              item_id: 'EXPENSIVE-001',
              item_name: 'Expensive Item',
              price: largeValue,
              quantity: 1
            }
          ]
        };

        pushEcommerce(client, 'purchase', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.value).toBe(largeValue);
      });
    });

    describe('Special Characters', () => {
      it('handles special characters in item names', () => {
        const { client, pushes } = createClient();
        const specialNames = [
          'Product & Accessories',
          "Product 'Special'",
          'Product "Quoted"',
          'Product <script>',
          'Product\nNewline',
          'Product\tTab',
          'Prodüct Üñícode',
          '商品 中文',
          'מוצר עברית'
        ];

        const items: EcommerceItem[] = specialNames.map((name, i) => ({
          item_id: `SPECIAL-${i}`,
          item_name: name
        }));

        const ecommerce: EcommercePayload = {
          items
        };

        pushEcommerce(client, 'view_item_list', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items).toHaveLength(specialNames.length);
        pushed.ecommerce.items.forEach((item, i) => {
          expect(item.item_name).toBe(specialNames[i]);
        });
      });

      it('handles special characters in transaction IDs', () => {
        const { client, pushes } = createClient();
        const transactionId = 'ORDER-2024/01-TEST#123_ABC';
        const ecommerce: EcommercePayload = {
          transaction_id: transactionId,
          items: [{ item_id: 'ITEM-001', item_name: 'Test' }]
        };

        pushEcommerce(client, 'purchase', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.transaction_id).toBe(transactionId);
      });
    });

    describe('Empty and Minimal Payloads', () => {
      it('handles empty items array', () => {
        const { client, pushes } = createClient();
        const ecommerce: EcommercePayload = {
          items: []
        };

        pushEcommerce(client, 'view_cart', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items).toHaveLength(0);
      });

      it('handles items with only item_id', () => {
        const { client, pushes } = createClient();
        const ecommerce: EcommercePayload = {
          items: [{ item_id: 'MINIMAL-001' }]
        };

        pushEcommerce(client, 'view_item', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items[0]).toEqual({ item_id: 'MINIMAL-001' });
      });

      it('handles items with only item_name', () => {
        const { client, pushes } = createClient();
        const ecommerce: EcommercePayload = {
          items: [{ item_name: 'Name Only Product' }]
        };

        pushEcommerce(client, 'view_item', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items[0]).toEqual({ item_name: 'Name Only Product' });
      });
    });

    describe('Large Item Arrays', () => {
      it('handles maximum recommended items (100)', () => {
        const { client, pushes } = createClient();
        const items: EcommerceItem[] = Array.from({ length: 100 }, (_, i) => ({
          item_id: `ITEM-${String(i).padStart(3, '0')}`,
          item_name: `Product ${i + 1}`,
          price: 10.0,
          quantity: 1
        }));

        const ecommerce: EcommercePayload = {
          currency: 'USD',
          value: 1000.0,
          items
        };

        pushEcommerce(client, 'view_item_list', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items).toHaveLength(100);
      });

      it('handles items beyond GA4 limit (200 items)', () => {
        const { client, pushes } = createClient();
        const items: EcommerceItem[] = Array.from({ length: 200 }, (_, i) => ({
          item_id: `ITEM-${i}`,
          item_name: `Product ${i}`
        }));

        const ecommerce: EcommercePayload = {
          items
        };

        // Should still push - GA4 may truncate, but client should not fail
        pushEcommerce(client, 'view_item_list', ecommerce);

        const pushed = pushes[0] as { ecommerce: EcommercePayload };
        expect(pushed.ecommerce.items).toHaveLength(200);
      });
    });
  });

  describe('Custom Events', () => {
    it('pushes custom event with arbitrary payload', () => {
      const { client, pushes } = createClient();
      const payload = {
        custom_field_1: 'value1',
        custom_field_2: 123,
        custom_field_3: true,
        nested: {
          field: 'nested_value'
        }
      };

      pushEvent(client, 'my_custom_event', payload);

      expect(pushes[0]).toEqual({
        event: 'my_custom_event',
        ...payload
      });
    });

    it('pushes user engagement events', () => {
      const { client, pushes } = createClient();

      pushEvent(client, 'scroll', { percent_scrolled: 90 });
      pushEvent(client, 'file_download', { file_name: 'report.pdf', file_extension: 'pdf' });
      pushEvent(client, 'video_start', { video_title: 'Demo Video', video_duration: 120 });

      expect(pushes).toHaveLength(3);
      expect(pushes[0]).toEqual({ event: 'scroll', percent_scrolled: 90 });
      expect(pushes[1]).toEqual({
        event: 'file_download',
        file_name: 'report.pdf',
        file_extension: 'pdf'
      });
      expect(pushes[2]).toEqual({
        event: 'video_start',
        video_title: 'Demo Video',
        video_duration: 120
      });
    });
  });
});
