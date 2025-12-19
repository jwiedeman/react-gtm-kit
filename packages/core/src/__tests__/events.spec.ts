import type { EcommercePayload } from '../events';
import { pushEcommerce, pushEvent } from '../events';
import type { GtmClient } from '../types';

describe('event helpers', () => {
  const createClient = () => {
    const pushes: unknown[] = [];
    const client: Pick<GtmClient, 'push'> = {
      push: (value) => {
        pushes.push(value);
      }
    };
    return { client, pushes };
  };

  describe('pushEvent', () => {
    it('pushes an event with the provided payload', () => {
      const { client, pushes } = createClient();
      const payload = { page_path: '/home' } as const;

      const result = pushEvent(client, 'page_view', payload);

      expect(pushes).toHaveLength(1);
      expect(pushes[0]).toEqual({ event: 'page_view', page_path: '/home' });
      expect(result).toEqual({ event: 'page_view', page_path: '/home' });
      expect(payload).toEqual({ page_path: '/home' });
    });

    it('pushes an event without payload', () => {
      const { client, pushes } = createClient();

      const result = pushEvent(client, 'custom_event');

      expect(pushes).toHaveLength(1);
      expect(pushes[0]).toEqual({ event: 'custom_event' });
      expect(result).toEqual({ event: 'custom_event' });
    });

    it('throws when the payload is not an object', () => {
      const { client } = createClient();

      expect(() => pushEvent(client, 'invalid', 1 as unknown as Record<string, unknown>)).toThrow(
        'Event payloads must be plain objects when pushing to the dataLayer.'
      );
    });

    it('throws when the name is falsy', () => {
      const { client } = createClient();

      expect(() => pushEvent(client, '' as unknown as string)).toThrow(
        'An event name is required when pushing to the dataLayer.'
      );
    });
  });

  describe('pushEcommerce', () => {
    it('pushes an ecommerce event with extras merged in', () => {
      const { client, pushes } = createClient();
      const ecommerce = {
        currency: 'USD',
        value: 120,
        items: [
          {
            item_id: 'SKU-123',
            item_name: 'Widget'
          }
        ]
      } as const;

      const result = pushEcommerce(client, 'purchase', ecommerce, {
        extras: {
          coupon: 'WELCOME',
          send_to: 'GA4'
        }
      });

      expect(pushes).toHaveLength(1);
      expect(pushes[0]).toEqual({
        event: 'purchase',
        coupon: 'WELCOME',
        send_to: 'GA4',
        ecommerce
      });
      expect(result).toEqual({
        event: 'purchase',
        coupon: 'WELCOME',
        send_to: 'GA4',
        ecommerce
      });
    });

    it('throws when ecommerce payload is not an object', () => {
      const { client } = createClient();

      expect(() => pushEcommerce(client, 'purchase', null as unknown as EcommercePayload)).toThrow(
        'Ecommerce payload must be an object.'
      );
    });

    it('throws when extras are not objects', () => {
      const { client } = createClient();
      const ecommerce = { items: [], value: 0 };

      expect(() =>
        pushEcommerce(client, 'view_item', ecommerce, {
          extras: 42 as unknown as Record<string, unknown>
        })
      ).toThrow('Ecommerce extras must be an object when provided.');
    });

    it('ensures ecommerce payload overrides extras property', () => {
      const { client, pushes } = createClient();
      const ecommerce = { items: [], value: 0 };

      pushEcommerce(client, 'add_to_cart', ecommerce, {
        extras: {
          ecommerce: { items: [{ item_id: 'wrong' }] }
        }
      });

      expect(pushes[0]).toEqual({
        event: 'add_to_cart',
        ecommerce
      });
    });

    it('pushes ecommerce event without options', () => {
      const { client, pushes } = createClient();
      const ecommerce = { items: [], value: 100, currency: 'EUR' };

      pushEcommerce(client, 'view_item_list', ecommerce);

      expect(pushes[0]).toEqual({
        event: 'view_item_list',
        ecommerce
      });
    });

    it('pushes ecommerce event with undefined extras', () => {
      const { client, pushes } = createClient();
      const ecommerce = { items: [], value: 50 };

      pushEcommerce(client, 'begin_checkout', ecommerce, { extras: undefined });

      expect(pushes[0]).toEqual({
        event: 'begin_checkout',
        ecommerce
      });
    });
  });
});
