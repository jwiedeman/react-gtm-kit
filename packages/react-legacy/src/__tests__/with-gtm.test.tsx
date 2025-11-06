import { render, waitFor } from '@testing-library/react';
import React, { StrictMode } from 'react';
import type { ComponentType, JSX } from 'react';
import { withGtm, type LegacyGtmApi, type LegacyGtmProps, type WithGtmOptions } from '../with-gtm';
import { createGtmClient } from '@react-gtm-kit/core';
import type {
  ConsentRegionOptions,
  ConsentState,
  CreateGtmClientOptions,
  DataLayerValue,
  GtmClient
} from '@react-gtm-kit/core';

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

const baseConfig: CreateGtmClientOptions = { containers: 'GTM-LEGACY' };

const mockedCreateClient = jest.mocked(createGtmClient);

describe('withGtm', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
  });

  const createHarness = <PropName extends string = 'gtm'>(options: WithGtmOptions<PropName>) => {
    return function wrapComponent<P extends LegacyGtmProps<PropName>>(ComponentToWrap: ComponentType<P>) {
      return withGtm(options)(ComponentToWrap);
    };
  };

  it('injects a GTM API prop and delegates calls to the client', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    type Props = LegacyGtmProps & { onRender: (api: LegacyGtmApi) => void };

    class LegacyComponent extends React.Component<Props> {
      componentDidMount(): void {
        const { gtm, onRender } = this.props;
        gtm.push({ event: 'legacy-event' });
        gtm.updateConsent({ ad_storage: 'granted' });
        onRender(gtm);
      }

      render(): JSX.Element {
        return <div>legacy-ready</div>;
      }
    }

    const Wrapped = createHarness({ config: baseConfig })(LegacyComponent);

    const onRender = jest.fn();

    const { findByText } = render(<Wrapped onRender={onRender} />);

    await findByText('legacy-ready');

    expect(client.init).toHaveBeenCalledTimes(1);
    expect(client.push).toHaveBeenCalledWith({ event: 'legacy-event' });
    expect(client.updateConsent).toHaveBeenCalledWith({ ad_storage: 'granted' }, undefined);
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender.mock.calls[0][0].client).toBe(client);
  });

  it('tears down the client on unmount', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    class LegacyComponent extends React.Component<LegacyGtmProps> {
      render(): JSX.Element {
        return <div>legacy</div>;
      }
    }

    const Wrapped = createHarness({ config: baseConfig })(LegacyComponent);

    const { unmount, findByText } = render(<Wrapped />);

    await findByText('legacy');

    unmount();

    expect(client.teardown).toHaveBeenCalledTimes(1);
  });

  it('remains StrictMode-safe by tearing down between development re-renders', async () => {
    const clients: MockClient[] = [];
    mockedCreateClient.mockImplementation(() => {
      const client = createMockClient();
      clients.push(client);
      return client;
    });

    class LegacyComponent extends React.Component<LegacyGtmProps> {
      render(): JSX.Element {
        return <div>strict</div>;
      }
    }

    const Wrapped = createHarness({ config: baseConfig })(LegacyComponent);

    const { unmount } = render(
      <StrictMode>
        <Wrapped />
      </StrictMode>
    );

    await waitFor(() => {
      expect(clients.length).toBeGreaterThanOrEqual(1);
    });

    const latest = clients[clients.length - 1];

    await waitFor(() => {
      expect(latest.init).toHaveBeenCalled();
    });

    clients.slice(0, -1).forEach((client) => {
      expect(client.teardown.mock.calls.length).toBe(client.init.mock.calls.length);
    });

    unmount();

    expect(latest.teardown.mock.calls.length).toBe(latest.init.mock.calls.length);
  });

  it('supports custom prop names for the injected API', async () => {
    const client = createMockClient();
    mockedCreateClient.mockReturnValue(client);

    type CustomProps = LegacyGtmProps<'tracker'>;

    class LegacyComponent extends React.Component<CustomProps> {
      render(): JSX.Element {
        this.props.tracker.push({ event: 'custom-prop' });
        return <div>custom</div>;
      }
    }

    const Wrapped = createHarness({ config: baseConfig, propName: 'tracker' })(LegacyComponent);

    const { findByText } = render(<Wrapped />);

    await findByText('custom');

    expect(client.push).toHaveBeenCalledWith({ event: 'custom-prop' });
  });
});
