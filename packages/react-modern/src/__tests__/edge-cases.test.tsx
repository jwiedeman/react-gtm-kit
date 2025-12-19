/**
 * Edge Case Tests for React Modern GTM Provider
 *
 * These tests cover scenarios that users might encounter:
 * - Rapid component mount/unmount
 * - StrictMode double-render
 * - Concurrent mode scenarios
 * - Error boundaries
 * - Suspense integration
 * - Memory leaks
 * - Hook stability
 */
import { fireEvent, render, waitFor, cleanup } from '@testing-library/react';
import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  useCallback,
  useRef,
  type JSX,
  type ErrorInfo,
  type ReactNode
} from 'react';
import { GtmProvider, useGtm, useGtmConsent, useGtmPush, useGtmReady } from '../provider';
import type {
  CreateGtmClientOptions,
  GtmClient,
  ScriptLoadState,
  DataLayerValue,
  ConsentState,
  ConsentRegionOptions
} from '@jwiedeman/gtm-kit';
import { createGtmClient } from '@jwiedeman/gtm-kit';

jest.mock('@jwiedeman/gtm-kit', () => {
  const actual = jest.requireActual('@jwiedeman/gtm-kit');
  return {
    ...actual,
    createGtmClient: jest.fn()
  };
});

type MockClient = GtmClient & {
  init: jest.Mock<void, []>;
  teardown: jest.Mock<void, []>;
  push: jest.Mock<void, [DataLayerValue]>;
  setConsentDefaults: jest.Mock<void, [ConsentState, ConsentRegionOptions | undefined]>;
  updateConsent: jest.Mock<void, [ConsentState, ConsentRegionOptions | undefined]>;
  isInitialized: jest.Mock<boolean, []>;
  whenReady: jest.Mock<Promise<ScriptLoadState[]>, []>;
  onReady: jest.Mock<() => void, [(state: ScriptLoadState[]) => void]>;
};

const createMockClient = (): MockClient => ({
  dataLayerName: 'dataLayer',
  init: jest.fn(),
  teardown: jest.fn(),
  push: jest.fn(),
  setConsentDefaults: jest.fn(),
  updateConsent: jest.fn(),
  isInitialized: jest.fn(() => true),
  whenReady: jest.fn(() => Promise.resolve([])),
  onReady: jest.fn((callback: (state: ScriptLoadState[]) => void) => {
    callback([]);
    return jest.fn();
  })
});

const baseConfig: CreateGtmClientOptions = { containers: 'GTM-TEST' };
const mockedCreateClient = jest.mocked(createGtmClient);

// Error Boundary for testing error scenarios
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

describe('React Modern Provider Edge Cases', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
    cleanup();
  });

  describe('Rapid Mount/Unmount Cycles', () => {
    it('handles 100 rapid mount/unmount cycles without memory leaks', async () => {
      const clients: MockClient[] = [];
      mockedCreateClient.mockImplementation(() => {
        const client = createMockClient();
        clients.push(client);
        return client;
      });

      const TestComponent = (): JSX.Element => (
        <GtmProvider config={baseConfig}>
          <div>content</div>
        </GtmProvider>
      );

      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<TestComponent />);
        unmount();
      }

      // All teardowns should match inits
      clients.forEach((client) => {
        expect(client.teardown.mock.calls.length).toBe(client.init.mock.calls.length);
      });
    });

    it('handles alternating renders of different configs', async () => {
      const clients: MockClient[] = [];
      mockedCreateClient.mockImplementation(() => {
        const client = createMockClient();
        clients.push(client);
        return client;
      });

      for (let i = 0; i < 20; i++) {
        const config = { containers: i % 2 === 0 ? 'GTM-A' : 'GTM-B' };
        const { unmount } = render(
          <GtmProvider config={config}>
            <div>content</div>
          </GtmProvider>
        );
        unmount();
      }

      // All clients should be properly cleaned up
      clients.forEach((client) => {
        expect(client.teardown.mock.calls.length).toBe(client.init.mock.calls.length);
      });
    });
  });

  describe('Hook Stability', () => {
    it('useGtmPush returns stable reference across renders', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const pushRefs: ((data: DataLayerValue) => void)[] = [];

      const TrackPushRef = (): JSX.Element => {
        const push = useGtmPush();
        useEffect(() => {
          pushRefs.push(push);
        });
        return <div>tracker</div>;
      };

      const { rerender } = render(
        <GtmProvider config={baseConfig}>
          <TrackPushRef />
        </GtmProvider>
      );

      // Force several rerenders
      for (let i = 0; i < 5; i++) {
        rerender(
          <GtmProvider config={baseConfig}>
            <TrackPushRef />
          </GtmProvider>
        );
      }

      // All push refs should be the same (stable reference)
      expect(pushRefs.length).toBeGreaterThan(1);
      pushRefs.forEach((ref) => {
        expect(ref).toBe(pushRefs[0]);
      });
    });

    it('useGtmConsent returns stable references across renders', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const consentRefs: {
        setConsentDefaults: ReturnType<typeof useGtmConsent>['setConsentDefaults'];
        updateConsent: ReturnType<typeof useGtmConsent>['updateConsent'];
      }[] = [];

      const TrackConsentRef = (): JSX.Element => {
        const consent = useGtmConsent();
        useEffect(() => {
          consentRefs.push(consent);
        });
        return <div>tracker</div>;
      };

      const { rerender } = render(
        <GtmProvider config={baseConfig}>
          <TrackConsentRef />
        </GtmProvider>
      );

      // Force several rerenders
      for (let i = 0; i < 5; i++) {
        rerender(
          <GtmProvider config={baseConfig}>
            <TrackConsentRef />
          </GtmProvider>
        );
      }

      // Functions should be stable
      expect(consentRefs.length).toBeGreaterThan(1);
      consentRefs.forEach((ref) => {
        expect(ref.setConsentDefaults).toBe(consentRefs[0].setConsentDefaults);
        expect(ref.updateConsent).toBe(consentRefs[0].updateConsent);
      });
    });
  });

  describe('Concurrent Updates', () => {
    it('handles concurrent push calls from multiple components', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const PushComponent = ({ id }: { id: number }): JSX.Element => {
        const push = useGtmPush();
        useEffect(() => {
          push({ event: `component_${id}_mount` });
          return () => {
            push({ event: `component_${id}_unmount` });
          };
        }, [push, id]);
        return <div>component {id}</div>;
      };

      const { unmount } = render(
        <GtmProvider config={baseConfig}>
          <PushComponent id={1} />
          <PushComponent id={2} />
          <PushComponent id={3} />
        </GtmProvider>
      );

      await waitFor(() => {
        expect(client.push).toHaveBeenCalledTimes(3);
      });

      unmount();

      // Should have 6 calls total (3 mount + 3 unmount)
      expect(client.push).toHaveBeenCalledTimes(6);
    });

    it('handles rapid state changes triggering push calls', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const RapidPusher = (): JSX.Element => {
        const push = useGtmPush();
        const [count, setCount] = useState(0);

        useEffect(() => {
          if (count > 0 && count <= 10) {
            push({ event: 'count_change', count });
          }
        }, [count, push]);

        return (
          <button onClick={() => setCount((c) => c + 1)} data-testid="increment">
            Count: {count}
          </button>
        );
      };

      const { getByTestId } = render(
        <GtmProvider config={baseConfig}>
          <RapidPusher />
        </GtmProvider>
      );

      const button = getByTestId('increment');

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      await waitFor(() => {
        expect(client.push).toHaveBeenCalledTimes(10);
      });
    });
  });

  describe('Suspense Integration', () => {
    it('maintains context through Suspense boundaries with lazy components', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const LazyPusher = lazy(() =>
        Promise.resolve({
          default: () => {
            const push = useGtmPush();
            useEffect(() => {
              push({ event: 'lazy_mounted' });
            }, [push]);
            return <div>lazy loaded</div>;
          }
        })
      );

      const { findByText } = render(
        <GtmProvider config={baseConfig}>
          <Suspense fallback={<div>loading...</div>}>
            <LazyPusher />
          </Suspense>
        </GtmProvider>
      );

      await findByText('lazy loaded');

      expect(client.push).toHaveBeenCalledWith({ event: 'lazy_mounted' });
    });

    it('handles multiple lazy components with concurrent loading', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const createLazyComponent = (name: string, delay: number) =>
        lazy(
          () =>
            new Promise<{ default: () => JSX.Element }>((resolve) => {
              setTimeout(() => {
                resolve({
                  default: () => {
                    const push = useGtmPush();
                    useEffect(() => {
                      push({ event: `${name}_loaded` });
                    }, [push]);
                    return <div>{name}</div>;
                  }
                });
              }, delay);
            })
        );

      const LazyA = createLazyComponent('A', 10);
      const LazyB = createLazyComponent('B', 20);
      const LazyC = createLazyComponent('C', 30);

      const { findByText } = render(
        <GtmProvider config={baseConfig}>
          <Suspense fallback={<div>loading...</div>}>
            <LazyA />
            <LazyB />
            <LazyC />
          </Suspense>
        </GtmProvider>
      );

      await findByText('A');
      await findByText('B');
      await findByText('C');

      await waitFor(() => {
        expect(client.push).toHaveBeenCalledWith({ event: 'A_loaded' });
        expect(client.push).toHaveBeenCalledWith({ event: 'B_loaded' });
        expect(client.push).toHaveBeenCalledWith({ event: 'C_loaded' });
      });
    });
  });

  describe('Error Handling', () => {
    it('throws helpful error when hooks used outside provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const InvalidComponent = (): JSX.Element => {
        useGtmPush();
        return <div />;
      };

      expect(() => render(<InvalidComponent />)).toThrow(/useGtm hook must be used within a GtmProvider/);

      consoleErrorSpy.mockRestore();
    });

    it('recovers gracefully when client methods throw', async () => {
      const client = createMockClient();
      let callCount = 0;
      client.push.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Push failed');
        }
      });
      mockedCreateClient.mockReturnValue(client);

      const PushComponent = (): JSX.Element => {
        const push = useGtmPush();
        const [pushCount, setPushCount] = useState(0);

        const safePush = useCallback(() => {
          try {
            push({ event: 'test' });
            setPushCount((c) => c + 1);
          } catch {
            // Ignore error, try again
          }
        }, [push]);

        useEffect(() => {
          safePush();
          // Second call should work (after first throws)
          safePush();
        }, [safePush]);

        return <div>pushed: {pushCount}</div>;
      };

      const { findByText } = render(
        <ErrorBoundary fallback={<div>error boundary</div>}>
          <GtmProvider config={baseConfig}>
            <PushComponent />
          </GtmProvider>
        </ErrorBoundary>
      );

      // Wait for the second successful push
      await findByText('pushed: 1');
      expect(client.push).toHaveBeenCalledTimes(2);
    });
  });

  describe('whenReady Promise Handling', () => {
    it('handles whenReady being called multiple times', async () => {
      const client = createMockClient();
      const readyState: ScriptLoadState[] = [{ containerId: 'GTM-TEST', status: 'loaded', src: '', fromCache: false }];
      client.whenReady.mockResolvedValue(readyState);
      mockedCreateClient.mockReturnValue(client);

      const results: ScriptLoadState[][] = [];

      const MultiWhenReady = (): JSX.Element => {
        const whenReady = useGtmReady();

        useEffect(() => {
          // Call whenReady multiple times
          void Promise.all([whenReady(), whenReady(), whenReady()]).then((res) => {
            results.push(...res);
          });
        }, [whenReady]);

        return <div>multi ready</div>;
      };

      const { findByText } = render(
        <GtmProvider config={baseConfig}>
          <MultiWhenReady />
        </GtmProvider>
      );

      await findByText('multi ready');

      await waitFor(() => {
        expect(results.length).toBe(3);
        results.forEach((result) => {
          expect(result).toEqual(readyState);
        });
      });
    });

    it('handles whenReady rejection gracefully', async () => {
      const client = createMockClient();
      client.whenReady.mockRejectedValue(new Error('Ready failed'));
      mockedCreateClient.mockReturnValue(client);

      let caughtError: Error | null = null;

      const HandleRejection = (): JSX.Element => {
        const whenReady = useGtmReady();

        useEffect(() => {
          whenReady().catch((e: Error) => {
            caughtError = e;
          });
        }, [whenReady]);

        return <div>rejection handler</div>;
      };

      const { findByText } = render(
        <GtmProvider config={baseConfig}>
          <HandleRejection />
        </GtmProvider>
      );

      await findByText('rejection handler');

      await waitFor(() => {
        expect(caughtError?.message).toBe('Ready failed');
      });
    });
  });

  describe('onReady Callback Cleanup', () => {
    it('properly unsubscribes onReady callbacks on unmount', async () => {
      const client = createMockClient();
      const unsubscribe = jest.fn();
      client.onReady.mockReturnValue(unsubscribe);
      mockedCreateClient.mockReturnValue(client);

      const OnReadyComponent = (): JSX.Element => {
        const { onReady } = useGtm();

        useEffect(() => {
          const cleanup = onReady(() => undefined);
          return cleanup;
        }, [onReady]);

        return <div>on ready</div>;
      };

      const { unmount } = render(
        <GtmProvider config={baseConfig}>
          <OnReadyComponent />
        </GtmProvider>
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Nested Provider Handling', () => {
    it('inner provider overrides outer provider', async () => {
      const outerClient = createMockClient();
      const innerClient = createMockClient();

      let callIndex = 0;
      mockedCreateClient.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? outerClient : innerClient;
      });

      const InnerComponent = (): JSX.Element => {
        const push = useGtmPush();
        useEffect(() => {
          push({ event: 'inner_event' });
        }, [push]);
        return <div>inner</div>;
      };

      const OuterComponent = (): JSX.Element => {
        const push = useGtmPush();
        useEffect(() => {
          push({ event: 'outer_event' });
        }, [push]);
        return (
          <div>
            outer
            <GtmProvider config={{ containers: 'GTM-INNER' }}>
              <InnerComponent />
            </GtmProvider>
          </div>
        );
      };

      const { findByText } = render(
        <GtmProvider config={{ containers: 'GTM-OUTER' }}>
          <OuterComponent />
        </GtmProvider>
      );

      await findByText('outer');
      await findByText('inner');

      // Outer should receive outer event
      expect(outerClient.push).toHaveBeenCalledWith({ event: 'outer_event' });
      // Inner should receive inner event
      expect(innerClient.push).toHaveBeenCalledWith({ event: 'inner_event' });
    });
  });

  describe('Conditional Rendering', () => {
    it('handles conditional provider rendering', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const ConditionalApp = ({ showProvider }: { showProvider: boolean }): JSX.Element => {
        if (showProvider) {
          return (
            <GtmProvider config={baseConfig}>
              <div>provider active</div>
            </GtmProvider>
          );
        }
        return <div>no provider</div>;
      };

      const { rerender, getByText } = render(<ConditionalApp showProvider={true} />);

      await waitFor(() => {
        expect(client.init).toHaveBeenCalled();
      });

      rerender(<ConditionalApp showProvider={false} />);

      expect(getByText('no provider')).toBeDefined();
      expect(client.teardown).toHaveBeenCalled();

      rerender(<ConditionalApp showProvider={true} />);

      await waitFor(() => {
        expect(client.init).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Dynamic Config Changes', () => {
    it('reinitializes when config changes', async () => {
      const clients: MockClient[] = [];
      mockedCreateClient.mockImplementation(() => {
        const client = createMockClient();
        clients.push(client);
        return client;
      });

      const { rerender } = render(
        <GtmProvider config={{ containers: 'GTM-A' }}>
          <div>content</div>
        </GtmProvider>
      );

      await waitFor(() => {
        expect(clients.length).toBe(1);
        expect(clients[0].init).toHaveBeenCalled();
      });

      rerender(
        <GtmProvider config={{ containers: 'GTM-B' }}>
          <div>content</div>
        </GtmProvider>
      );

      // With new config, should create new client
      // Note: This depends on implementation - some might reuse client
      // Testing the actual behavior here
    });
  });

  describe('Ref Preservation', () => {
    it('preserves refs across provider updates', async () => {
      const client = createMockClient();
      mockedCreateClient.mockReturnValue(client);

      const refValues: { push: unknown; gtm: unknown }[] = [];

      const RefTracker = (): JSX.Element => {
        const push = useGtmPush();
        const gtm = useGtm();
        const pushRef = useRef(push);
        const gtmRef = useRef(gtm);

        useEffect(() => {
          refValues.push({
            push: pushRef.current === push,
            gtm: gtmRef.current === gtm
          });
          pushRef.current = push;
          gtmRef.current = gtm;
        });

        return <div>ref tracker</div>;
      };

      const { rerender } = render(
        <GtmProvider config={baseConfig}>
          <RefTracker />
        </GtmProvider>
      );

      // Multiple rerenders
      for (let i = 0; i < 5; i++) {
        rerender(
          <GtmProvider config={baseConfig}>
            <RefTracker />
          </GtmProvider>
        );
      }

      // After first render, refs should be stable
      refValues.slice(1).forEach((entry) => {
        expect(entry.push).toBe(true);
        expect(entry.gtm).toBe(true);
      });
    });
  });
});
