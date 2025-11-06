import type { Metadata } from 'next';
import { GtmHeadScript, GtmNoScript } from '@react-gtm-kit/next';

import { Navigation } from '../components/navigation';
import { ConsentBanner } from '../components/consent-banner';
import { GTM_CONTAINERS } from '../lib/gtm';
import { createNonce } from '../lib/nonce';
import { AppProviders } from './providers';

import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'React GTM Kit Next.js example',
  description:
    'Demonstrates App Router integration with GTM scripts, route tracking, and Consent Mode toggles using React GTM Kit.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = createNonce();

  return (
    <html lang="en">
      <head>
        <GtmHeadScript containers={GTM_CONTAINERS} scriptAttributes={{ nonce }} />
      </head>
      <body>
        <GtmNoScript containers={GTM_CONTAINERS} />
        <AppProviders nonce={nonce}>
          <header className="site-header">
            <h1>React GTM Kit × Next.js</h1>
            <p>Route transitions push page_view events and consent toggles drive Consent Mode updates.</p>
            <Navigation />
          </header>
          <main className="site-main">{children}</main>
          <ConsentBanner />
        </AppProviders>
      </body>
    </html>
  );
}
