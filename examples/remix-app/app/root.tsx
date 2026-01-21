import { Links, Meta, Outlet, Scripts, ScrollRestoration, Link } from '@remix-run/react';
import { GtmProvider, useTrackPageViews, useGtmConsent } from '@jwiedeman/gtm-kit-remix';
import type { LinksFunction } from '@remix-run/node';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  }
];

function PageViewTracker() {
  useTrackPageViews();
  return null;
}

function Navigation() {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd'
      }}
    >
      <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>
        Home
      </Link>
      <Link to="/products" style={{ color: '#333', textDecoration: 'none' }}>
        Products
      </Link>
      <Link to="/about" style={{ color: '#333', textDecoration: 'none' }}>
        About
      </Link>
    </nav>
  );
}

function ConsentFooter() {
  const { updateConsent } = useGtmConsent();

  const handleGrantAnalytics = () => {
    updateConsent({ analytics_storage: 'granted' });
  };

  return (
    <footer style={{ padding: '1rem', background: '#f5f5f5', textAlign: 'center' }}>
      <button onClick={handleGrantAnalytics} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Grant Analytics Consent
      </button>
    </footer>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GtmProvider
      config={{
        containers: 'GTM-REMIXAPP',
        dataLayerName: 'remixDataLayer'
      }}
      onBeforeInit={(client) => {
        client.setConsentDefaults({
          analytics_storage: 'denied',
          ad_storage: 'denied'
        });
      }}
    >
      <PageViewTracker />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <main style={{ flex: '1', padding: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
        <ConsentFooter />
      </div>
    </GtmProvider>
  );
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          lineHeight: 1.6,
          color: '#333'
        }}
      >
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
