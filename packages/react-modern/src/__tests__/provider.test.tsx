import { render, waitFor } from '@testing-library/react';
import { StrictMode, Suspense, lazy, useEffect } from 'react';
import type { JSX } from 'react';
import { GtmProvider, useGtm, useGtmConsent, useGtmPush } from '../provider';
import type {
  ConsentRegionOptions,
  ConsentState,
  CreateGtmClientOptions,
  DataLayerValue,
  GtmClient
} from '@react-gtm-kit/core';
import { createGtmClient } from '@react-gtm-kit/core';

jest.mock('@react-gtm-kit/core', () => {
  const actual = jest.requireActual('@react-gtm-kit/core');
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
};

const createMockClient = (): MockClient => ({
  dataLayerName: 'dataLayer',
  init: jest.fn(),
  teardown: jest.fn(),
  push: jest.fn(),
  setConsentDefaults: jest.fn(),
  updateConsent: jest.fn(),
  isInitialized: jest.fn(() => true)
});

const baseConfig: CreateGtmClientOptions = { containers: 'GTM-TEST' };

const mockedCreateClient = jest.mocked(createGtmClient);

describe('GtmProvider', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
  });

  it('throws when hooks are used outside of a provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const OutsideComponent = (): JSX.Element => {
      useGtm();
      return <div />;
    };

    expect(() => render(<OutsideComponent />)).toThrowErrorMatchingInlineSnapshot(
      '"useGtm hook must be used within a GtmProvider instance."'
    );

    consoleErrorSpy.mockRestore();
  });

  it('initializes the GTM client on mount and tears down on unmount', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    const { unmount } = render(
      <GtmProvider config={baseConfig}>
        <div />
      </GtmProvider>
    );

    await waitFor(() => {
      expect(client.init).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(client.teardown).toHaveBeenCalledTimes(1);
  });

  it('tears down between mounts to remain StrictMode-safe', async () => {
    const clients: MockClient[] = [];
    mockedCreateClient.mockImplementation(() => {
      const client = createMockClient();
      clients.push(client);
      return client;
    });

    const first = render(
      <StrictMode>
        <GtmProvider config={baseConfig}>
          <div />
        </GtmProvider>
      </StrictMode>
    );

    await waitFor(() => expect(clients.length).toBeGreaterThanOrEqual(1));

    const firstActiveIndex = clients.length - 1;

    await waitFor(() => {
      expect(clients[firstActiveIndex].init).toHaveBeenCalled();
    });

    clients.slice(0, firstActiveIndex).forEach((client) => {
      expect(client.teardown.mock.calls.length).toBe(client.init.mock.calls.length);
    });

    first.unmount();
    expect(clients[firstActiveIndex].teardown.mock.calls.length).toBe(
      clients[firstActiveIndex].init.mock.calls.length
    );

    const second = render(
      <StrictMode>
        <GtmProvider config={baseConfig}>
          <div />
        </GtmProvider>
      </StrictMode>
    );

    await waitFor(() => expect(clients.length).toBeGreaterThan(firstActiveIndex));

    const secondActiveIndex = clients.length - 1;

    await waitFor(() => {
      expect(clients[secondActiveIndex].init).toHaveBeenCalled();
    });

    clients.slice(firstActiveIndex + 1, secondActiveIndex).forEach((client) => {
      expect(client.teardown.mock.calls.length).toBe(client.init.mock.calls.length);
    });

    expect(clients[secondActiveIndex].teardown.mock.calls.length).toBeLessThanOrEqual(
      clients[secondActiveIndex].init.mock.calls.length
    );

    second.unmount();
    expect(clients[secondActiveIndex].teardown.mock.calls.length).toBe(
      clients[secondActiveIndex].init.mock.calls.length
    );
  });

  it('exposes a push hook that delegates to the GTM client', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    const TestComponent = (): JSX.Element => {
      const push = useGtmPush();
      useEffect(() => {
        push({ event: 'test-event' });
      }, [push]);
      return <div>ready</div>;
    };

    const { findByText } = render(
      <GtmProvider config={baseConfig}>
        <TestComponent />
      </GtmProvider>
    );

    await findByText('ready');

    expect(client.push).toHaveBeenCalledWith({ event: 'test-event' });
  });

  it('exposes consent helpers that proxy to the GTM client', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    const consentState: ConsentState = { ad_storage: 'denied', analytics_storage: 'granted' };
    const consentOptions: ConsentRegionOptions = { region: ['US'] };

    const ConsentComponent = (): JSX.Element => {
      const { setConsentDefaults, updateConsent } = useGtmConsent();
      useEffect(() => {
        setConsentDefaults(consentState, consentOptions);
        updateConsent({ ...consentState, ad_storage: 'granted' });
      }, [setConsentDefaults, updateConsent]);
      return <div>consent</div>;
    };

    const { findByText } = render(
      <GtmProvider config={baseConfig}>
        <ConsentComponent />
      </GtmProvider>
    );

    await findByText('consent');

    expect(client.setConsentDefaults).toHaveBeenCalledWith(consentState, consentOptions);
    expect(client.updateConsent).toHaveBeenCalledWith({ ...consentState, ad_storage: 'granted' }, undefined);
  });

  it('supports Suspense boundaries without losing access to the context', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    const LazyComponent = lazy(() =>
      Promise.resolve({
        default: () => {
          const push = useGtmPush();
          useEffect(() => {
            push({ event: 'lazy-event' });
          }, [push]);
          return <div>lazy-loaded</div>;
        }
      })
    );

    const { findByText } = render(
      <GtmProvider config={baseConfig}>
        <Suspense fallback={<div>loading</div>}>
          <LazyComponent />
        </Suspense>
      </GtmProvider>
    );

    await findByText('lazy-loaded');

    expect(client.push).toHaveBeenCalledWith({ event: 'lazy-event' });
  });
});
