import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { GtmPlugin, useGtm, useGtmPush, useGtmConsent, useGtmClient, useGtmReady } from '../plugin';

// Mock the core module
jest.mock('@react-gtm-kit/core', () => {
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
      // Return a no-op cleanup function
      return () => undefined;
    }),
    dataLayerName: 'dataLayer'
  };

  return {
    createGtmClient: jest.fn().mockReturnValue(mockClient),
    __mockClient: mockClient
  };
});

const { createGtmClient, __mockClient: mockClient } = jest.requireMock('@react-gtm-kit/core');

describe('GtmPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('installation', () => {
    it('should create a GTM client with provided options', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(createGtmClient).toHaveBeenCalledWith({ containers: 'GTM-TEST123' });
    });

    it('should auto-initialize by default', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(mockClient.init).toHaveBeenCalled();
    });

    it('should not auto-initialize when autoInit is false', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123', autoInit: false }]]
        }
      });

      expect(mockClient.init).not.toHaveBeenCalled();
    });

    it('should call onBeforeInit before initialization', () => {
      const onBeforeInit = jest.fn();
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123', onBeforeInit }]]
        }
      });

      expect(onBeforeInit).toHaveBeenCalledWith(mockClient);
      // onBeforeInit should be called before init
      expect(onBeforeInit.mock.invocationCallOrder[0]).toBeLessThan(mockClient.init.mock.invocationCallOrder[0]);
    });

    it('should provide context via injection key', () => {
      let injectedContext: unknown;

      const TestComponent = defineComponent({
        setup() {
          injectedContext = useGtm();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(injectedContext).toBeDefined();
      expect((injectedContext as { client: unknown }).client).toBe(mockClient);
    });

    it('should expose $gtm global property for Options API', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(wrapper.vm.$gtm).toBeDefined();
      expect(wrapper.vm.$gtm.client).toBe(mockClient);
    });

    it('should handle multiple containers', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [
            [
              GtmPlugin,
              {
                containers: [{ id: 'GTM-MAIN' }, { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc' } }]
              }
            ]
          ]
        }
      });

      expect(createGtmClient).toHaveBeenCalledWith({
        containers: [{ id: 'GTM-MAIN' }, { id: 'GTM-ADS', queryParams: { gtm_auth: 'abc' } }]
      });
    });
  });

  describe('useGtm', () => {
    it('should return the full GTM context', () => {
      let context: ReturnType<typeof useGtm> | undefined;

      const TestComponent = defineComponent({
        setup() {
          context = useGtm();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(context).toBeDefined();
      expect(context!.client).toBe(mockClient);
      expect(typeof context!.push).toBe('function');
      expect(typeof context!.setConsentDefaults).toBe('function');
      expect(typeof context!.updateConsent).toBe('function');
      expect(typeof context!.whenReady).toBe('function');
      expect(typeof context!.onReady).toBe('function');
    });

    it('should throw error when used outside plugin', () => {
      const TestComponent = defineComponent({
        setup() {
          expect(() => useGtm()).toThrow(/useGtm\(\) was called outside/);
          return () => h('div', 'test');
        }
      });

      mount(TestComponent);
    });
  });

  describe('useGtmPush', () => {
    it('should return the push function', () => {
      let push: ReturnType<typeof useGtmPush> | undefined;

      const TestComponent = defineComponent({
        setup() {
          push = useGtmPush();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(typeof push).toBe('function');

      push!({ event: 'test_event', value: 123 });
      expect(mockClient.push).toHaveBeenCalledWith({ event: 'test_event', value: 123 });
    });

    it('should handle complex event data', () => {
      let push: ReturnType<typeof useGtmPush> | undefined;

      const TestComponent = defineComponent({
        setup() {
          push = useGtmPush();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      const complexEvent = {
        event: 'purchase',
        ecommerce: {
          transaction_id: 'T-123',
          value: 99.99,
          currency: 'USD',
          items: [{ item_id: 'SKU-001', item_name: 'Widget', quantity: 2 }]
        }
      };

      push!(complexEvent);
      expect(mockClient.push).toHaveBeenCalledWith(complexEvent);
    });
  });

  describe('useGtmConsent', () => {
    it('should return consent API methods', () => {
      let consentApi: ReturnType<typeof useGtmConsent> | undefined;

      const TestComponent = defineComponent({
        setup() {
          consentApi = useGtmConsent();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(typeof consentApi!.setConsentDefaults).toBe('function');
      expect(typeof consentApi!.updateConsent).toBe('function');
    });

    it('should call setConsentDefaults on client', () => {
      let consentApi: ReturnType<typeof useGtmConsent> | undefined;

      const TestComponent = defineComponent({
        setup() {
          consentApi = useGtmConsent();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      const consentState = {
        ad_storage: 'denied' as const,
        analytics_storage: 'denied' as const
      };

      consentApi!.setConsentDefaults(consentState, { region: ['US-CA'] });

      expect(mockClient.setConsentDefaults).toHaveBeenCalledWith(consentState, {
        region: ['US-CA']
      });
    });

    it('should call updateConsent on client', () => {
      let consentApi: ReturnType<typeof useGtmConsent> | undefined;

      const TestComponent = defineComponent({
        setup() {
          consentApi = useGtmConsent();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      const consentState = {
        ad_storage: 'granted' as const,
        analytics_storage: 'granted' as const,
        ad_user_data: 'granted' as const,
        ad_personalization: 'granted' as const
      };

      consentApi!.updateConsent(consentState);

      expect(mockClient.updateConsent).toHaveBeenCalledWith(consentState, undefined);
    });
  });

  describe('useGtmClient', () => {
    it('should return the raw client instance', () => {
      let client: ReturnType<typeof useGtmClient> | undefined;

      const TestComponent = defineComponent({
        setup() {
          client = useGtmClient();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(client).toBe(mockClient);
    });

    it('should allow direct client method calls', () => {
      let client: ReturnType<typeof useGtmClient> | undefined;

      const TestComponent = defineComponent({
        setup() {
          client = useGtmClient();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(client!.isInitialized()).toBe(true);
      expect(client!.dataLayerName).toBe('dataLayer');
    });
  });

  describe('useGtmReady', () => {
    it('should return the whenReady function', async () => {
      let whenReady: ReturnType<typeof useGtmReady> | undefined;

      const TestComponent = defineComponent({
        setup() {
          whenReady = useGtmReady();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(typeof whenReady).toBe('function');

      const states = await whenReady!();
      expect(states).toEqual([{ containerId: 'GTM-TEST', status: 'loaded' }]);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined/null push values gracefully', () => {
      let push: ReturnType<typeof useGtmPush> | undefined;

      const TestComponent = defineComponent({
        setup() {
          push = useGtmPush();
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      // These should not throw
      push!({ event: 'valid' });
      expect(mockClient.push).toHaveBeenCalled();
    });

    it('should work with custom dataLayerName', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123', dataLayerName: 'customLayer' }]]
        }
      });

      expect(createGtmClient).toHaveBeenCalledWith(expect.objectContaining({ dataLayerName: 'customLayer' }));
    });

    it('should work with custom host', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123', host: 'https://custom.gtm.example.com' }]]
        }
      });

      expect(createGtmClient).toHaveBeenCalledWith(expect.objectContaining({ host: 'https://custom.gtm.example.com' }));
    });

    it('should work with script attributes', () => {
      const TestComponent = defineComponent({
        setup() {
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123', scriptAttributes: { nonce: 'abc123' } }]]
        }
      });

      expect(createGtmClient).toHaveBeenCalledWith(expect.objectContaining({ scriptAttributes: { nonce: 'abc123' } }));
    });
  });

  describe('multiple component usage', () => {
    it('should share the same client across components', () => {
      let client1: ReturnType<typeof useGtmClient> | undefined;
      let client2: ReturnType<typeof useGtmClient> | undefined;

      const ChildComponent = defineComponent({
        setup() {
          client2 = useGtmClient();
          return () => h('div', 'child');
        }
      });

      const ParentComponent = defineComponent({
        setup() {
          client1 = useGtmClient();
          return () => h('div', [h(ChildComponent)]);
        }
      });

      mount(ParentComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(client1).toBe(client2);
      expect(client1).toBe(mockClient);
    });

    it('should allow multiple components to push events', () => {
      const ChildA = defineComponent({
        setup() {
          const push = useGtmPush();
          push({ event: 'child_a_event' });
          return () => h('div', 'child a');
        }
      });

      const ChildB = defineComponent({
        setup() {
          const push = useGtmPush();
          push({ event: 'child_b_event' });
          return () => h('div', 'child b');
        }
      });

      const ParentComponent = defineComponent({
        setup() {
          return () => h('div', [h(ChildA), h(ChildB)]);
        }
      });

      mount(ParentComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST123' }]]
        }
      });

      expect(mockClient.push).toHaveBeenCalledWith({ event: 'child_a_event' });
      expect(mockClient.push).toHaveBeenCalledWith({ event: 'child_b_event' });
    });
  });
});
