import { mount } from '@vue/test-utils';
import { defineComponent, h, reactive, nextTick } from 'vue';
import { createNuxtGtmPlugin, useTrackPageViews } from '../module';
import { GtmPlugin, useGtm } from '@jwiedeman/gtm-kit-vue';

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
    __mockClient: mockClient
  };
});

const { __mockClient: mockClient } = jest.requireMock('@jwiedeman/gtm-kit');

describe('Nuxt GTM Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNuxtGtmPlugin', () => {
    it('should install GtmPlugin on the Vue app', () => {
      const mockApp = {
        use: jest.fn(),
        config: {
          globalProperties: {} as Record<string, unknown>
        }
      };

      // Simulate what the Vue plugin does
      mockApp.use.mockImplementation((plugin, _options) => {
        if (plugin === GtmPlugin) {
          mockApp.config.globalProperties.$gtm = {
            client: mockClient
          };
        }
      });

      const client = createNuxtGtmPlugin(mockApp as unknown as import('vue').App, {
        containers: 'GTM-TEST123'
      });

      expect(mockApp.use).toHaveBeenCalledWith(GtmPlugin, expect.objectContaining({ containers: 'GTM-TEST123' }));
      expect(client).toBe(mockClient);
    });

    it('should pass through all options to GtmPlugin', () => {
      const mockApp = {
        use: jest.fn(),
        config: {
          globalProperties: {} as Record<string, unknown>
        }
      };

      mockApp.use.mockImplementation((plugin, _options) => {
        if (plugin === GtmPlugin) {
          mockApp.config.globalProperties.$gtm = {
            client: mockClient
          };
        }
      });

      createNuxtGtmPlugin(mockApp as unknown as import('vue').App, {
        containers: 'GTM-TEST123',
        dataLayerName: 'customLayer',
        autoInit: false
      });

      expect(mockApp.use).toHaveBeenCalledWith(GtmPlugin, {
        containers: 'GTM-TEST123',
        dataLayerName: 'customLayer',
        autoInit: false
      });
    });
  });

  describe('useTrackPageViews', () => {
    it('should track initial page view on mount', async () => {
      const route = reactive({
        fullPath: '/initial-path',
        path: '/initial-path',
        query: {}
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'page_view',
          page_path: '/initial-path'
        })
      );
    });

    it('should not track initial page view when disabled', async () => {
      const route = reactive({
        fullPath: '/initial-path',
        path: '/initial-path',
        query: {}
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route,
            trackInitialPageView: false
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).not.toHaveBeenCalled();
    });

    it('should track page views on route changes', async () => {
      const route = reactive({
        fullPath: '/initial-path',
        path: '/initial-path',
        query: {}
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      // Clear initial call
      mockClient.push.mockClear();

      // Simulate route change
      route.fullPath = '/new-path';
      route.path = '/new-path';
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'page_view',
          page_path: '/new-path'
        })
      );
    });

    it('should not track duplicate page views', async () => {
      const route = reactive({
        fullPath: '/same-path',
        path: '/same-path',
        query: {}
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      // Initial call
      expect(mockClient.push).toHaveBeenCalledTimes(1);

      // Trigger the watcher with same path (shouldn't happen normally but testing dedup)
      route.fullPath = '/same-path';
      await nextTick();

      // Should still be 1 call
      expect(mockClient.push).toHaveBeenCalledTimes(1);
    });

    it('should use custom event name', async () => {
      const route = reactive({
        fullPath: '/test-path',
        path: '/test-path',
        query: {}
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route,
            eventName: 'custom_page_view'
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'custom_page_view'
        })
      );
    });

    it('should exclude query params when configured', async () => {
      const route = reactive({
        fullPath: '/test-path?foo=bar',
        path: '/test-path',
        query: { foo: 'bar' }
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route,
            includeQueryParams: false
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          page_path: '/test-path' // Without query params
        })
      );
    });

    it('should include additional data', async () => {
      const route = reactive({
        fullPath: '/test-path',
        path: '/test-path',
        query: {}
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route,
            additionalData: { site_section: 'main', user_type: 'guest' }
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          site_section: 'main',
          user_type: 'guest'
        })
      );
    });

    it('should support function for additional data', async () => {
      const route = reactive({
        fullPath: '/test-path',
        path: '/test-path',
        query: {}
      });

      let callCount = 0;

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route,
            additionalData: () => {
              callCount++;
              return { call_count: callCount };
            }
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          call_count: 1
        })
      );

      // Change route
      mockClient.push.mockClear();
      route.fullPath = '/new-path';
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          call_count: 2
        })
      );
    });

    it('should handle route changes with query params', async () => {
      const route = reactive({
        fullPath: '/products?category=electronics',
        path: '/products',
        query: { category: 'electronics' }
      });

      const TestComponent = defineComponent({
        setup() {
          useTrackPageViews({
            client: mockClient,
            route,
            includeQueryParams: true
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          page_path: '/products?category=electronics'
        })
      );

      mockClient.push.mockClear();

      // Change query params
      route.fullPath = '/products?category=clothing';
      route.query = { category: 'clothing' };
      await nextTick();

      expect(mockClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          page_path: '/products?category=clothing'
        })
      );
    });
  });

  describe('re-exports', () => {
    it('should re-export Vue composables', async () => {
      const { useNuxtGtm, useNuxtGtmPush, useNuxtGtmConsent, useNuxtGtmClient } = await import('../module');

      expect(useNuxtGtm).toBe(useGtm);
      expect(useNuxtGtmPush).toBeDefined();
      expect(useNuxtGtmConsent).toBeDefined();
      expect(useNuxtGtmClient).toBeDefined();
    });
  });
});
