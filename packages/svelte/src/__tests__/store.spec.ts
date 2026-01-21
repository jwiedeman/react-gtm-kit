/**
 * @jest-environment jsdom
 */

import { get } from 'svelte/store';
import { createGtmStore, destroyGtmStore } from '../store';

// Mock the core package
jest.mock('@jwiedeman/gtm-kit', () => ({
  createGtmClient: jest.fn((options) => ({
    init: jest.fn(),
    push: jest.fn(),
    setConsentDefaults: jest.fn(),
    updateConsent: jest.fn(),
    whenReady: jest.fn().mockResolvedValue([{ status: 'loaded' }]),
    onReady: jest.fn((cb) => {
      cb([{ status: 'loaded' }]);
      return () => {
        /* cleanup */
      };
    }),
    teardown: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    options
  }))
}));

describe('@jwiedeman/gtm-kit-svelte', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up any GTM scripts
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
  });

  describe('createGtmStore', () => {
    it('creates a store with initial value', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      expect(value.client).toBeDefined();
      expect(value.push).toBeInstanceOf(Function);
      expect(value.setConsentDefaults).toBeInstanceOf(Function);
      expect(value.updateConsent).toBeInstanceOf(Function);
      expect(value.whenReady).toBeInstanceOf(Function);
      expect(value.onReady).toBeInstanceOf(Function);
    });

    it('auto-initializes by default', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      expect(value.client.init).toHaveBeenCalled();
      expect(value.initialized).toBe(true);
    });

    it('does not auto-initialize when autoInit is false', () => {
      const store = createGtmStore({
        containers: 'GTM-TEST123',
        autoInit: false
      });
      const value = get(store);

      expect(value.client.init).not.toHaveBeenCalled();
      expect(value.initialized).toBe(false);
    });

    it('calls onBeforeInit before initialization', () => {
      const onBeforeInit = jest.fn();
      const store = createGtmStore({
        containers: 'GTM-TEST123',
        onBeforeInit
      });
      const value = get(store);

      expect(onBeforeInit).toHaveBeenCalledWith(value.client);
      expect(onBeforeInit).toHaveBeenCalledBefore(value.client.init as jest.Mock);
    });

    it('push function calls client.push', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      value.push({ event: 'test_event', data: 123 });

      expect(value.client.push).toHaveBeenCalledWith({ event: 'test_event', data: 123 });
    });

    it('setConsentDefaults calls client.setConsentDefaults', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      value.setConsentDefaults({ analytics_storage: 'denied' }, { region: ['US'] });

      expect(value.client.setConsentDefaults).toHaveBeenCalledWith({ analytics_storage: 'denied' }, { region: ['US'] });
    });

    it('updateConsent calls client.updateConsent', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      value.updateConsent({ analytics_storage: 'granted' });

      expect(value.client.updateConsent).toHaveBeenCalledWith({ analytics_storage: 'granted' }, undefined);
    });

    it('whenReady returns a promise', async () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      const result = await value.whenReady();

      expect(result).toEqual([{ status: 'loaded' }]);
    });

    it('onReady registers callback', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);
      const callback = jest.fn();

      const unsubscribe = value.onReady(callback);

      expect(callback).toHaveBeenCalledWith([{ status: 'loaded' }]);
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('store reactivity', () => {
    it('allows subscribing to store changes', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const subscriber = jest.fn();

      store.subscribe(subscriber);

      // Should have been called with initial value
      expect(subscriber).toHaveBeenCalled();
      expect(subscriber.mock.calls[0][0].initialized).toBe(true);
    });

    it('allows updating store value', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });

      store.update((s) => ({ ...s, initialized: false }));

      const value = get(store);
      expect(value.initialized).toBe(false);
    });
  });

  describe('multiple containers', () => {
    it('handles array of containers', () => {
      const store = createGtmStore({
        containers: [{ id: 'GTM-FIRST' }, { id: 'GTM-SECOND' }]
      });
      const value = get(store);

      expect(value.client).toBeDefined();
      expect(value.initialized).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty options gracefully', () => {
      expect(() => {
        createGtmStore({ containers: '' });
      }).not.toThrow();
    });

    it('handles multiple push calls', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      value.push({ event: 'event1' });
      value.push({ event: 'event2' });
      value.push({ event: 'event3' });

      expect(value.client.push).toHaveBeenCalledTimes(3);
    });

    it('handles consent update after initialization', () => {
      const store = createGtmStore({ containers: 'GTM-TEST123' });
      const value = get(store);

      // First deny, then grant
      value.updateConsent({ analytics_storage: 'denied' });
      value.updateConsent({ analytics_storage: 'granted' });

      expect(value.client.updateConsent).toHaveBeenCalledTimes(2);
    });
  });
});

// Extend Jest matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledBefore(mock: jest.Mock): R;
    }
  }
}

expect.extend({
  toHaveBeenCalledBefore(received: jest.Mock, other: jest.Mock) {
    const receivedOrder = received.mock.invocationCallOrder[0];
    const otherOrder = other.mock.invocationCallOrder[0];

    if (receivedOrder < otherOrder) {
      return {
        message: () => `expected ${received.getMockName()} not to have been called before ${other.getMockName()}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received.getMockName()} to have been called before ${other.getMockName()}`,
        pass: false
      };
    }
  }
});

describe('destroyGtmStore', () => {
  it('calls teardown on the client and marks as not initialized', () => {
    const store = createGtmStore({ containers: 'GTM-DESTROY' });

    // Store should be initialized
    let storeValue = get(store);
    expect(storeValue.initialized).toBe(true);

    // Destroy the store
    destroyGtmStore(store);

    // Should call teardown
    expect(storeValue.client.teardown).toHaveBeenCalled();

    // Store should be marked as not initialized
    storeValue = get(store);
    expect(storeValue.initialized).toBe(false);
  });

  it('handles multiple destroy calls gracefully', () => {
    const store = createGtmStore({ containers: 'GTM-MULTI-DESTROY' });

    destroyGtmStore(store);
    destroyGtmStore(store); // Second call should not throw

    const storeValue = get(store);
    expect(storeValue.initialized).toBe(false);
  });
});
