/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { GtmProvider, useGtmPush, useGtmConsent } from '@jwiedeman/gtm-kit-solid';
import { createEffect } from 'solid-js';
import { useLocation, A } from '@solidjs/router';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';

function Navigation() {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        background: '#f5f5f5',
        'border-bottom': '1px solid #ddd'
      }}
    >
      <A href="/" style={{ color: '#333', 'text-decoration': 'none' }}>
        Home
      </A>
      <A href="/products" style={{ color: '#333', 'text-decoration': 'none' }}>
        Products
      </A>
      <A href="/about" style={{ color: '#333', 'text-decoration': 'none' }}>
        About
      </A>
    </nav>
  );
}

function Layout(props: { children: JSX.Element }) {
  const location = useLocation();
  const push = useGtmPush();
  const { updateConsent } = useGtmConsent();

  // Track page views on route changes
  createEffect(() => {
    const path = location.pathname;
    push({
      event: 'page_view',
      page_path: path,
      page_title: document.title
    });
  });

  const handleGrantAnalytics = () => {
    updateConsent({ analytics_storage: 'granted' });
  };

  return (
    <div style={{ 'min-height': '100vh', display: 'flex', 'flex-direction': 'column' }}>
      <Navigation />
      <main style={{ flex: '1', padding: '1rem', 'max-width': '800px', margin: '0 auto' }}>{props.children}</main>
      <footer style={{ padding: '1rem', background: '#f5f5f5', 'text-align': 'center' }}>
        <button
          onClick={handleGrantAnalytics}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer'
          }}
        >
          Grant Analytics Consent
        </button>
      </footer>
    </div>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

render(
  () => (
    <GtmProvider
      containers="GTM-SOLIDAPP"
      dataLayerName="solidDataLayer"
      onBeforeInit={(client) => {
        client.setConsentDefaults({
          analytics_storage: 'denied',
          ad_storage: 'denied'
        });
      }}
    >
      <Router root={Layout}>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/about" component={About} />
      </Router>
    </GtmProvider>
  ),
  root
);
