import { Component, type ComponentType, type ReactNode } from 'react';
import {
  createGtmClient,
  type ConsentRegionOptions,
  type ConsentState,
  type CreateGtmClientOptions,
  type DataLayerValue,
  type GtmClient
} from '@react-gtm-kit/core';

export interface LegacyGtmApi {
  client: GtmClient;
  push: (value: DataLayerValue) => void;
  setConsentDefaults: (state: ConsentState, options?: ConsentRegionOptions) => void;
  updateConsent: (state: ConsentState, options?: ConsentRegionOptions) => void;
}

export interface WithGtmOptions<PropName extends string = 'gtm'> {
  config: CreateGtmClientOptions;
  propName?: PropName;
}

export type LegacyGtmProps<PropName extends string = 'gtm'> = {
  [Key in PropName]: LegacyGtmApi;
};

const createLegacyApi = (client: GtmClient): LegacyGtmApi => ({
  client,
  push: (value) => client.push(value),
  setConsentDefaults: (state, options) => client.setConsentDefaults(state, options),
  updateConsent: (state, options) => client.updateConsent(state, options)
});

export const withGtm = <PropName extends string = 'gtm'>(options: WithGtmOptions<PropName>) => {
  const { config, propName } = options;
  const resolvedPropName = (propName ?? 'gtm') as PropName;

  type InjectedProps = LegacyGtmProps<PropName>;

  return function wrapWithGtm<WrappedProps extends InjectedProps>(
    WrappedComponent: ComponentType<WrappedProps>
  ): ComponentType<Omit<WrappedProps, PropName>> {
    type OuterProps = Omit<WrappedProps, PropName>;

    class WithGtmComponent extends Component<OuterProps> {
      static displayName: string;

      private client: GtmClient;
      private api: LegacyGtmApi;

      constructor(props: OuterProps) {
        super(props);
        this.client = createGtmClient(config);
        this.api = createLegacyApi(this.client);
      }

      componentDidMount(): void {
        this.client.init();
      }

      componentWillUnmount(): void {
        this.client.teardown();
      }

      render(): ReactNode {
        const injectedProps = {
          [resolvedPropName]: this.api
        } as InjectedProps;

        return <WrappedComponent {...(this.props as WrappedProps)} {...injectedProps} />;
      }
    }

    WithGtmComponent.displayName = `withGtm(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithGtmComponent;
  };
};
