import type { LegacyGtmProps } from '@react-gtm-kit/react-legacy';
import { withGtm } from '@react-gtm-kit/react-legacy';
import { Component } from 'react';

const styles: Record<string, string> = {
  shell: 'min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center py-16 px-6 gap-8',
  panel: 'w-full max-w-2xl rounded-2xl bg-white shadow-lg border border-zinc-200 p-8 space-y-4',
  heading: 'text-3xl font-semibold',
  badge:
    'inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-wide text-zinc-600',
  button:
    'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
  secondary: 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300',
  code: 'font-mono text-sm bg-zinc-900/90 text-white px-2 py-1 rounded'
};

type AppProps = LegacyGtmProps<'gtm'>;

interface AppState {
  orders: number;
  consent: 'denied' | 'granted';
}

class LegacyDashboard extends Component<AppProps, AppState> {
  state: AppState = {
    orders: 0,
    consent: 'denied'
  };

  componentDidMount(): void {
    this.props.gtm.push({
      event: 'legacy_dashboard_view',
      page_path: window.location.pathname
    });

    this.props.gtm.setConsentDefaults({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_personalization: 'denied',
      ad_user_data: 'denied'
    });
  }

  handleTrackOrder = (): void => {
    const nextOrders = this.state.orders + 1;
    this.setState({ orders: nextOrders });

    this.props.gtm.push({
      event: 'order_completed',
      order_id: `ORDER-${String(nextOrders).padStart(4, '0')}`,
      value: 99 + nextOrders
    });
  };

  handleGrantConsent = (): void => {
    this.setState({ consent: 'granted' });
    this.props.gtm.updateConsent({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_personalization: 'granted',
      ad_user_data: 'granted'
    });
  };

  handleRevokeConsent = (): void => {
    this.setState({ consent: 'denied' });
    this.props.gtm.updateConsent({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_personalization: 'denied',
      ad_user_data: 'denied'
    });
  };

  render() {
    const { orders, consent } = this.state;

    return (
      <main className={styles.shell}>
        <section className="text-center space-y-2">
          <div className={styles.badge}>React class component</div>
          <h1 className={styles.heading}>Legacy GTM adapter demo</h1>
          <p className="text-sm text-zinc-600 max-w-xl">
            The HOC keeps the GTM client lifecycle scoped to this component while exposing push and consent helpers
            through props. Inspect <span className={styles.code}>window.dataLayer</span> to see the events being
            enqueued.
          </p>
        </section>

        <div className={styles.panel}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Orders</h2>
            <span className="text-sm text-zinc-500">Tracked: {orders}</span>
          </div>
          <button type="button" onClick={this.handleTrackOrder} className={`${styles.button} ${styles.primary}`}>
            Record order event
          </button>
          <p className="text-xs text-zinc-500">
            Each click pushes an `order_completed` event with incrementing metadata.
          </p>
        </div>

        <div className={styles.panel}>
          <h2 className="text-xl font-semibold">Consent</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleGrantConsent}
              className={`${styles.button} ${styles.primary}`}
              disabled={consent === 'granted'}
            >
              Grant consent
            </button>
            <button
              type="button"
              onClick={this.handleRevokeConsent}
              className={`${styles.button} ${styles.secondary}`}
              disabled={consent === 'denied'}
            >
              Revoke consent
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Current consent state: <span className={styles.code}>{consent}</span>
          </p>
        </div>
      </main>
    );
  }
}

const rawContainers = import.meta.env.VITE_GTM_CONTAINERS ?? 'GTM-XXXX';
const containers = rawContainers
  .split(',')
  .map((id: string) => id.trim())
  .filter((id: string) => id.length > 0);

if (containers.length === 0) {
  containers.push('GTM-XXXX');
}

export default withGtm({
  config: {
    containers,
    dataLayerName: import.meta.env.VITE_GTM_DATALAYER ?? 'dataLayer',
    logger: import.meta.env.DEV ? console : undefined
  }
})(LegacyDashboard);
