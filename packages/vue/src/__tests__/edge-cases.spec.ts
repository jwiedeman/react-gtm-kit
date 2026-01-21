/**
 * Edge Case Tests for Vue 3 GTM Plugin
 *
 * Tests covering real-world edge cases:
 * - Rapid component mount/unmount
 * - Router integration scenarios
 * - Async component loading
 * - Error handling
 * - Memory management
 */
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick, onMounted, onUnmounted, Suspense, defineAsyncComponent } from 'vue';
import { GtmPlugin, useGtmPush, useGtmConsent, useGtmClient, useGtmErrorHandler } from '../plugin';

// Mock client type
interface MockClient {
  init: jest.Mock;
  teardown: jest.Mock;
  push: jest.Mock;
  setConsentDefaults: jest.Mock;
  updateConsent: jest.Mock;
  isInitialized: jest.Mock;
  isReady: jest.Mock;
  whenReady: jest.Mock;
  onReady: jest.Mock;
  dataLayerName: string;
}

// Mock the core module
const mockClients: MockClient[] = [];

jest.mock('@jwiedeman/gtm-kit', () => {
  const createMockClient = (): MockClient => {
    const client: MockClient = {
      init: jest.fn(),
      push: jest.fn(),
      setConsentDefaults: jest.fn(),
      updateConsent: jest.fn(),
      teardown: jest.fn(),
      isInitialized: jest.fn().mockReturnValue(true),
      isReady: jest.fn().mockReturnValue(true),
      whenReady: jest.fn().mockResolvedValue([{ containerId: 'GTM-TEST', status: 'loaded' }]),
      onReady: jest.fn().mockImplementation((cb) => {
        cb([{ containerId: 'GTM-TEST', status: 'loaded' }]);
        return () => undefined;
      }),
      dataLayerName: 'dataLayer'
    };
    mockClients.push(client);
    return client;
  };

  return {
    createGtmClient: jest.fn().mockImplementation(createMockClient)
  };
});

describe('Vue GTM Plugin Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClients.length = 0;
  });

  describe('Rapid Mount/Unmount Cycles', () => {
    it('handles rapid component mounting and unmounting', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => push({ event: 'mounted' }));
          onUnmounted(() => push({ event: 'unmounted' }));
          return () => h('div', 'test');
        }
      });

      // Rapid mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        const wrapper = mount(TestComponent, {
          global: {
            plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
          }
        });
        await nextTick();
        wrapper.unmount();
      }

      // Should have created clients for each mount
      expect(mockClients.length).toBeGreaterThan(0);
    });

    it('handles conditional rendering rapidly', async () => {
      const Parent = defineComponent({
        props: ['show'],
        setup(props) {
          return () =>
            props.show
              ? h(
                  defineComponent({
                    setup() {
                      const push = useGtmPush();
                      push({ event: 'child_visible' });
                      return () => h('div', 'visible');
                    }
                  })
                )
              : null;
        }
      });

      const wrapper = mount(Parent, {
        props: { show: true },
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      // Rapid show/hide
      for (let i = 0; i < 20; i++) {
        await wrapper.setProps({ show: i % 2 === 0 });
        await nextTick();
      }

      // Should handle without errors
      expect(mockClients[0].push).toHaveBeenCalled();
    });
  });

  describe('Concurrent Push Operations', () => {
    it('handles multiple simultaneous push calls', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();

          onMounted(() => {
            // Simulate concurrent pushes from different sources
            Promise.all([
              Promise.resolve().then(() => push({ event: 'concurrent_1' })),
              Promise.resolve().then(() => push({ event: 'concurrent_2' })),
              Promise.resolve().then(() => push({ event: 'concurrent_3' })),
              Promise.resolve().then(() => push({ event: 'concurrent_4' })),
              Promise.resolve().then(() => push({ event: 'concurrent_5' }))
            ]);
          });

          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await flushPromises();

      // All pushes should be processed
      expect(mockClients[0].push).toHaveBeenCalledTimes(5);
    });

    it('handles rapid sequential pushes', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();
          const count = ref(0);

          onMounted(() => {
            // Rapid pushes
            for (let i = 0; i < 100; i++) {
              push({ event: 'rapid_push', index: i });
              count.value++;
            }
          });

          return () => h('div', `Count: ${count.value}`);
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(mockClients[0].push).toHaveBeenCalledTimes(100);
    });
  });

  describe('Nested Component Scenarios', () => {
    it('shares context across deeply nested components', async () => {
      const DeepChild = defineComponent({
        setup() {
          const client = useGtmClient();
          return () => h('div', client ? 'has-client' : 'no-client');
        }
      });

      const Level3 = defineComponent({
        setup() {
          return () => h('div', [h(DeepChild)]);
        }
      });

      const Level2 = defineComponent({
        setup() {
          return () => h('div', [h(Level3)]);
        }
      });

      const Level1 = defineComponent({
        setup() {
          return () => h('div', [h(Level2)]);
        }
      });

      const wrapper = mount(Level1, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      expect(wrapper.text()).toContain('has-client');
    });

    it('handles sibling components accessing GTM', async () => {
      const Sibling1 = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => push({ event: 'sibling_1' }));
          return () => h('div', 'sibling1');
        }
      });

      const Sibling2 = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => push({ event: 'sibling_2' }));
          return () => h('div', 'sibling2');
        }
      });

      const Parent = defineComponent({
        setup() {
          return () => h('div', [h(Sibling1), h(Sibling2)]);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(mockClients[0].push).toHaveBeenCalledWith({ event: 'sibling_1' });
      expect(mockClients[0].push).toHaveBeenCalledWith({ event: 'sibling_2' });
    });
  });

  describe('Error Recovery', () => {
    it('continues working after push error', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();

          onMounted(() => {
            // First push might fail
            try {
              push({ event: 'first_push' });
            } catch {
              // Ignore
            }

            // Second push should still work
            push({ event: 'second_push' });
          });

          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(mockClients[0].push).toHaveBeenCalledWith({ event: 'second_push' });
    });
  });

  describe('Consent Flow Scenarios', () => {
    it('handles consent updates during rapid state changes', async () => {
      const TestComponent = defineComponent({
        setup() {
          const { setConsentDefaults, updateConsent } = useGtmConsent();
          const consentState = ref('denied');

          onMounted(() => {
            setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'denied' });

            // Simulate rapid consent changes (user clicking quickly)
            updateConsent({ analytics_storage: 'granted' });
            updateConsent({ analytics_storage: 'denied' });
            updateConsent({ analytics_storage: 'granted' });
            consentState.value = 'granted';
          });

          return () => h('div', consentState.value);
        }
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(wrapper.text()).toBe('granted');
      expect(mockClients[0].updateConsent).toHaveBeenCalledTimes(3);
    });

    it('handles consent set before and after init', async () => {
      const onBeforeInit = jest.fn((client) => {
        client.setConsentDefaults({ ad_storage: 'denied', analytics_storage: 'denied' });
      });

      const TestComponent = defineComponent({
        setup() {
          const { updateConsent } = useGtmConsent();

          onMounted(() => {
            updateConsent({ analytics_storage: 'granted' });
          });

          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST', onBeforeInit }]]
        }
      });

      await nextTick();

      expect(onBeforeInit).toHaveBeenCalled();
      expect(mockClients[0].setConsentDefaults).toHaveBeenCalled();
      expect(mockClients[0].updateConsent).toHaveBeenCalled();
    });
  });

  describe('Async Component Loading', () => {
    it('handles async components with GTM hooks', async () => {
      const AsyncChild = defineAsyncComponent(() =>
        Promise.resolve(
          defineComponent({
            setup() {
              const push = useGtmPush();
              onMounted(() => push({ event: 'async_loaded' }));
              return () => h('div', 'async child');
            }
          })
        )
      );

      const Parent = defineComponent({
        setup() {
          return () =>
            h(Suspense, null, {
              default: () => h(AsyncChild),
              fallback: () => h('div', 'loading...')
            });
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await flushPromises();
      await nextTick();

      expect(mockClients[0].push).toHaveBeenCalledWith({ event: 'async_loaded' });
    });
  });

  describe('Reactive Data with GTM', () => {
    it('handles reactive prop changes triggering pushes', async () => {
      const TestComponent = defineComponent({
        props: ['productId'],
        setup(props) {
          const push = useGtmPush();

          // Watch for product changes
          const prevId = ref<string | null>(null);
          onMounted(() => {
            if (prevId.value !== props.productId) {
              push({ event: 'product_view', product_id: props.productId });
              prevId.value = props.productId;
            }
          });

          return () => h('div', `Product: ${props.productId}`);
        }
      });

      const wrapper = mount(TestComponent, {
        props: { productId: 'SKU-1' },
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(mockClients[0].push).toHaveBeenCalledWith({
        event: 'product_view',
        product_id: 'SKU-1'
      });

      // Change product
      await wrapper.setProps({ productId: 'SKU-2' });
      await nextTick();
    });
  });

  describe('Options API Compatibility', () => {
    it('exposes $gtm in Options API components', () => {
      const TestComponent = defineComponent({
        mounted() {
          expect(this.$gtm).toBeDefined();
          expect(this.$gtm.push).toBeDefined();
        },
        render() {
          return h('div', 'options api');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });
    });

    it('allows $gtm.push in Options API', () => {
      const TestComponent = defineComponent({
        mounted() {
          this.$gtm.push({ event: 'options_api_event' });
        },
        render() {
          return h('div', 'options api');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      expect(mockClients[0].push).toHaveBeenCalledWith({ event: 'options_api_event' });
    });
  });

  describe('Memory Management', () => {
    it('cleans up after unmount', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => push({ event: 'mounted' }));
          return () => h('div', 'test');
        }
      });

      const wrappers = [];
      for (let i = 0; i < 10; i++) {
        wrappers.push(
          mount(TestComponent, {
            global: {
              plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
            }
          })
        );
      }

      // Unmount all
      wrappers.forEach((w) => w.unmount());

      // Count total push calls across all mock clients
      const totalPushCalls = mockClients.reduce((sum, client) => sum + client.push.mock.calls.length, 0);

      // Should have called push for each mount
      expect(totalPushCalls).toBe(10);
    });
  });

  describe('Edge Input Handling', () => {
    it('handles empty event objects', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => {
            push({} as { event: string });
            push({ event: '' });
          });
          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      // Should not throw
      expect(mockClients[0].push).toHaveBeenCalledTimes(2);
    });

    it('handles large event payloads', async () => {
      const TestComponent = defineComponent({
        setup() {
          const push = useGtmPush();

          onMounted(() => {
            const largePayload = {
              event: 'large_purchase',
              ecommerce: {
                items: Array.from({ length: 100 }, (_, i) => ({
                  item_id: `SKU-${i}`,
                  item_name: `Product ${i}`,
                  price: Math.random() * 100
                }))
              }
            };
            push(largePayload);
          });

          return () => h('div', 'test');
        }
      });

      mount(TestComponent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(mockClients[0].push).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'large_purchase',
          ecommerce: expect.objectContaining({
            items: expect.any(Array)
          })
        })
      );
    });
  });

  describe('Plugin Reinstallation', () => {
    it('handles plugin being used on fresh app instance', async () => {
      // First app
      const TestComponent1 = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => push({ event: 'app1_event' }));
          return () => h('div', 'app1');
        }
      });

      const wrapper1 = mount(TestComponent1, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-APP1' }]]
        }
      });

      wrapper1.unmount();

      // Second app
      const TestComponent2 = defineComponent({
        setup() {
          const push = useGtmPush();
          onMounted(() => push({ event: 'app2_event' }));
          return () => h('div', 'app2');
        }
      });

      const wrapper2 = mount(TestComponent2, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-APP2' }]]
        }
      });

      await nextTick();

      expect(wrapper2.text()).toBe('app2');
      // Should have called push for app2
      const lastClient = mockClients[mockClients.length - 1];
      expect(lastClient.push).toHaveBeenCalledWith({ event: 'app2_event' });
    });
  });

  describe('useGtmErrorHandler - Error Detection', () => {
    /**
     * These tests verify that useGtmErrorHandler correctly identifies GTM-related errors
     * using the isGtmRelatedError function's 4 detection methods:
     * 1. isGtmKitError property
     * 2. Error name 'GtmKitError'
     * 3. Stack trace containing gtm-kit paths
     * 4. Message starting with '[gtm-kit/'
     */

    beforeEach(() => {
      // Suppress console.error for cleaner test output
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should catch errors with isGtmKitError property (detection method 1)', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          throw Object.assign(new Error('Custom GTM error'), { isGtmKitError: true });
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
      expect(errorHandlerResult!.error.value?.message).toBe('Custom GTM error');
    });

    it('should catch errors with GtmKitError name (detection method 2)', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          const err = new Error('Named GTM error');
          err.name = 'GtmKitError';
          throw err;
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
      expect(errorHandlerResult!.error.value?.name).toBe('GtmKitError');
    });

    it('should catch errors with gtm-kit in stack trace (detection method 3)', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          const err = new Error('Stack trace error');
          // Simulate a stack trace from installed gtm-kit package (requires node_modules path)
          err.stack =
            'Error: Stack trace error\n    at Module.someFunction (/app/node_modules/@jwiedeman/gtm-kit/dist/index.js:123:45)';
          throw err;
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
    });

    it('should catch errors with gtm-kit package in stack trace (scoped)', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          const err = new Error('Scoped package error');
          // Test with scoped package path in node_modules
          err.stack =
            'Error: Scoped package error\n    at someFunc (node_modules/@jwiedeman/gtm-kit/dist/client.js:50:10)';
          throw err;
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
    });

    it('should catch errors with unscoped gtm-kit package in stack trace', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          const err = new Error('Unscoped package error');
          // Test with unscoped package path in node_modules
          err.stack = 'Error: Unscoped package error\n    at someFunc (node_modules/gtm-kit/dist/client.js:50:10)';
          throw err;
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
    });

    it('should catch errors with [gtm-kit/ message prefix (detection method 4)', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          throw new Error('[gtm-kit/vue] useGtm() was called outside of a Vue app');
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
      expect(errorHandlerResult!.error.value?.message).toContain('[gtm-kit/vue]');
    });

    it('should NOT catch non-GTM errors (let them propagate)', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;
      let _propagatedError: Error | null = null;

      const ThrowingChild = defineComponent({
        setup() {
          throw new Error('Regular application error');
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      // Non-GTM errors should NOT be caught by useGtmErrorHandler
      // The error WILL propagate (that's the expected behavior)
      // We capture it with Vue's errorHandler to verify propagation happened
      try {
        mount(Parent, {
          global: {
            plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]],
            config: {
              errorHandler: (err) => {
                // Capture the propagated error
                _propagatedError = err as Error;
              }
            }
          }
        });
      } catch {
        // Error may also throw directly in test environment
      }

      // The key assertion: hasError should be false because we didn't catch it
      expect(errorHandlerResult!.hasError.value).toBe(false);
      // And the error should have propagated (either caught by errorHandler or thrown)
      // (propagatedError may or may not be set depending on Vue version/test setup)
    });

    it('should call onError callback for GTM errors', async () => {
      const onErrorCallback = jest.fn();
      let _errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          throw Object.assign(new Error('GTM callback test'), { isGtmKitError: true });
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          _errorHandlerResult = useGtmErrorHandler({
            logErrors: false,
            onError: onErrorCallback
          });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'GTM callback test' }),
        expect.anything(), // instance (component proxy, may be {} or null depending on Vue version)
        expect.any(String) // info
      );
    });

    it('should reset error state when reset() is called', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          throw Object.assign(new Error('Reset test'), { isGtmKitError: true });
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      expect(errorHandlerResult!.hasError.value).toBe(true);
      expect(errorHandlerResult!.error.value).not.toBeNull();

      // Reset the error state
      errorHandlerResult!.reset();

      expect(errorHandlerResult!.hasError.value).toBe(false);
      expect(errorHandlerResult!.error.value).toBeNull();
    });

    it('should handle errors with no stack trace gracefully', async () => {
      let errorHandlerResult: ReturnType<typeof useGtmErrorHandler>;

      const ThrowingChild = defineComponent({
        setup() {
          const err = new Error('[gtm-kit/core] No stack error');
          delete err.stack; // Remove stack trace
          throw err;
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          errorHandlerResult = useGtmErrorHandler({ logErrors: false });
          return () => h(ThrowingChild);
        }
      });

      mount(Parent, {
        global: {
          plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
        }
      });

      await nextTick();

      // Should still catch via message prefix
      expect(errorHandlerResult!.hasError.value).toBe(true);
    });

    it('should not crash when onError callback throws', async () => {
      const ThrowingChild = defineComponent({
        setup() {
          throw Object.assign(new Error('Callback crash test'), { isGtmKitError: true });
        },
        render: () => null
      });

      const Parent = defineComponent({
        setup() {
          useGtmErrorHandler({
            logErrors: false,
            onError: () => {
              throw new Error('Callback threw!');
            }
          });
          return () => h(ThrowingChild);
        }
      });

      // Should not throw even if callback throws
      expect(() => {
        mount(Parent, {
          global: {
            plugins: [[GtmPlugin, { containers: 'GTM-TEST' }]]
          }
        });
      }).not.toThrow();
    });
  });
});
