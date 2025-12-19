/**
 * @jest-environment jsdom
 */

import { createRoot } from 'solid-js';
import { GtmProvider, useGtm, useGtmPush, useGtmConsent, useGtmClient, useGtmReady } from '../context';

// Mock the core package
jest.mock('@react-gtm-kit/core', () => ({
  createGtmClient: jest.fn((options) => ({
    init: jest.fn(),
    push: jest.fn(),
    setConsentDefaults: jest.fn(),
    updateConsent: jest.fn(),
    whenReady: jest.fn().mockResolvedValue([{ status: 'loaded' }]),
    onReady: jest.fn((cb) => {
      cb([{ status: 'loaded' }]);
      return () => { /* cleanup */ };
    }),
    teardown: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
    options
  }))
}));

describe('@react-gtm-kit/solid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((el) => el.remove());
  });

  describe('GtmProvider', () => {
    it('provides GTM context to children', () => {
      let result: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          result = useGtm();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(result).toBeDefined();
      expect(result.client).toBeDefined();
      expect(result.push).toBeInstanceOf(Function);
    });

    it('auto-initializes by default', () => {
      let result: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          result = useGtm();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(result.client.init).toHaveBeenCalled();
      expect(result.initialized).toBe(true);
    });

    it('does not auto-initialize when autoInit is false', () => {
      let result: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          result = useGtm();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123" autoInit={false}>
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(result.client.init).not.toHaveBeenCalled();
      expect(result.initialized).toBe(false);
    });

    it('calls onBeforeInit before initialization', () => {
      const onBeforeInit = jest.fn();
      let _client: unknown;

      createRoot((_dispose) => {
        const TestComponent = () => {
          const ctx = useGtm();
          _client = ctx.client;
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123" onBeforeInit={onBeforeInit}>
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(onBeforeInit).toHaveBeenCalled();
    });

    it('calls onAfterInit after initialization', () => {
      const onAfterInit = jest.fn();

      createRoot((_dispose) => {
        return (
          <GtmProvider containers="GTM-TEST123" onAfterInit={onAfterInit}>
            <div />
          </GtmProvider>
        );
      });

      expect(onAfterInit).toHaveBeenCalled();
    });
  });

  describe('useGtmPush', () => {
    it('returns the push function', () => {
      let push: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          push = useGtmPush();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(push).toBeInstanceOf(Function);
    });

    it('push function calls client.push', () => {
      let push: any;
      let client: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          push = useGtmPush();
          client = useGtmClient();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      push({ event: 'test_event', data: 123 });
      expect(client.push).toHaveBeenCalledWith({ event: 'test_event', data: 123 });
    });
  });

  describe('useGtmConsent', () => {
    it('returns consent functions', () => {
      let consent: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          consent = useGtmConsent();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(consent.setConsentDefaults).toBeInstanceOf(Function);
      expect(consent.updateConsent).toBeInstanceOf(Function);
    });

    it('updateConsent calls client.updateConsent', () => {
      let consent: any;
      let client: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          consent = useGtmConsent();
          client = useGtmClient();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      consent.updateConsent({ analytics_storage: 'granted' });
      expect(client.updateConsent).toHaveBeenCalledWith({ analytics_storage: 'granted' }, undefined);
    });
  });

  describe('useGtmClient', () => {
    it('returns the GTM client', () => {
      let client: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          client = useGtmClient();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(client).toBeDefined();
      expect(client.init).toBeDefined();
    });
  });

  describe('useGtmReady', () => {
    it('returns the whenReady function', async () => {
      let whenReady: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          whenReady = useGtmReady();
          return null;
        };

        return (
          <GtmProvider containers="GTM-TEST123">
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(whenReady).toBeInstanceOf(Function);
      const result = await whenReady();
      expect(result).toEqual([{ status: 'loaded' }]);
    });
  });

  describe('error handling', () => {
    it('throws error when useGtm is called outside provider', () => {
      expect(() => {
        createRoot((_dispose) => {
          useGtm();
          return null;
        });
      }).toThrow('[gtm-kit] useGtm() was called outside of a GtmProvider');
    });

    it('throws error when useGtmPush is called outside provider', () => {
      expect(() => {
        createRoot((_dispose) => {
          useGtmPush();
          return null;
        });
      }).toThrow('[gtm-kit] useGtm() was called outside of a GtmProvider');
    });
  });

  describe('multiple containers', () => {
    it('handles array of containers', () => {
      let result: any;

      createRoot((_dispose) => {
        const TestComponent = () => {
          result = useGtm();
          return null;
        };

        return (
          <GtmProvider containers={[{ id: 'GTM-FIRST' }, { id: 'GTM-SECOND' }]}>
            <TestComponent />
          </GtmProvider>
        );
      });

      expect(result.client).toBeDefined();
      expect(result.initialized).toBe(true);
    });
  });
});
