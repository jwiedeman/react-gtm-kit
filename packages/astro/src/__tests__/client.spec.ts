import { initGtm, getGtmClient, requireGtmClient, push, teardown, updateConsent, setConsentDefaults } from '../client';

// Mock the core module
jest.mock('@jwiedeman/gtm-kit', () => {
  const mockClient = {
    init: jest.fn(),
    push: jest.fn(),
    setConsentDefaults: jest.fn(),
    updateConsent: jest.fn(),
    teardown: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    whenReady: jest.fn().mockResolvedValue([{ containerId: 'GTM-TEST', status: 'loaded' }]),
    onReady: jest.fn().mockImplementation((cb) => {
      cb([{ containerId: 'GTM-TEST', status: 'loaded' }]);
      return () => undefined;
    }),
    dataLayerName: 'dataLayer'
  };

  return {
    createGtmClient: jest.fn().mockReturnValue(mockClient),
    DEFAULT_DATA_LAYER_NAME: 'dataLayer',
    __mockClient: mockClient
  };
});

const { __mockClient: mockClient, createGtmClient } = jest.requireMock('@jwiedeman/gtm-kit');

describe('Astro GTM Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teardown(); // Reset client state between tests
  });

  describe('initGtm', () => {
    it('should create and initialize a GTM client', () => {
      const client = initGtm({ containers: 'GTM-TEST123' });

      expect(createGtmClient).toHaveBeenCalledWith({ containers: 'GTM-TEST123' });
      expect(mockClient.init).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    it('should return existing client if called with same config', () => {
      const config = { containers: 'GTM-TEST123' };

      const client1 = initGtm(config);
      const client2 = initGtm(config);

      expect(client1).toBe(client2);
      expect(createGtmClient).toHaveBeenCalledTimes(1);
    });

    it('should return existing client even with different config (idempotent)', () => {
      // In Astro with view transitions, initGtm may be called multiple times
      // It should always return the existing client to prevent duplicate initialization
      const client1 = initGtm({ containers: 'GTM-TEST123' });

      // Clear mocks after first init so we can check that second call doesn't create new client
      jest.clearAllMocks();

      const client2 = initGtm({ containers: 'GTM-DIFFERENT' });

      expect(client1).toBe(client2);
      expect(createGtmClient).not.toHaveBeenCalled(); // Should not create new client
      expect(mockClient.teardown).not.toHaveBeenCalled(); // Should not teardown existing client
    });
  });

  describe('getGtmClient', () => {
    it('should return null if not initialized', () => {
      expect(getGtmClient()).toBeNull();
    });

    it('should return client after initialization', () => {
      initGtm({ containers: 'GTM-TEST123' });
      expect(getGtmClient()).toBe(mockClient);
    });
  });

  describe('requireGtmClient', () => {
    it('should throw if not initialized', () => {
      expect(() => requireGtmClient()).toThrow('[gtm-kit/astro] GTM client not initialized');
    });

    it('should return client after initialization', () => {
      initGtm({ containers: 'GTM-TEST123' });
      expect(requireGtmClient()).toBe(mockClient);
    });
  });

  describe('push', () => {
    it('should push to client when initialized', () => {
      initGtm({ containers: 'GTM-TEST123' });
      push({ event: 'test_event' });

      expect(mockClient.push).toHaveBeenCalledWith({ event: 'test_event' });
    });

    it('should warn when pushing without initialization', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Create a mock dataLayer
      const global = globalThis as unknown as Record<string, unknown>;
      global.dataLayer = [];

      push({ event: 'test_event' });

      expect(mockClient.push).not.toHaveBeenCalled();
      // Should push to dataLayer directly
      expect(global.dataLayer).toContainEqual({ event: 'test_event' });

      consoleSpy.mockRestore();
      delete global.dataLayer;
    });
  });

  describe('consent functions', () => {
    it('should call setConsentDefaults on client', () => {
      initGtm({ containers: 'GTM-TEST123' });
      setConsentDefaults({ analytics_storage: 'denied' });

      expect(mockClient.setConsentDefaults).toHaveBeenCalledWith({ analytics_storage: 'denied' }, undefined);
    });

    it('should call updateConsent on client', () => {
      initGtm({ containers: 'GTM-TEST123' });
      updateConsent({ analytics_storage: 'granted' });

      expect(mockClient.updateConsent).toHaveBeenCalledWith({ analytics_storage: 'granted' }, undefined);
    });

    it('should warn if consent called without initialization', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      updateConsent({ analytics_storage: 'granted' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('teardown', () => {
    it('should teardown client and reset state', () => {
      initGtm({ containers: 'GTM-TEST123' });
      teardown();

      expect(mockClient.teardown).toHaveBeenCalled();
      expect(getGtmClient()).toBeNull();
    });

    it('should be safe to call when not initialized', () => {
      expect(() => teardown()).not.toThrow();
    });
  });
});
