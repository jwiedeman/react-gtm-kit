'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { GtmProvider } from '@jwiedeman/gtm-kit-react';

import { GTM_CONTAINERS } from '../lib/gtm';
import { GtmBridge } from '../components/gtm-bridge';

export interface AppProvidersProps {
  children: ReactNode;
  nonce?: string;
}

export const AppProviders = ({ children, nonce }: AppProvidersProps) => {
  return (
    <GtmProvider
      config={{
        containers: GTM_CONTAINERS,
        dataLayerName: 'nextAppDataLayer',
        scriptAttributes: nonce ? { nonce } : undefined
      }}
    >
      <Suspense fallback={null}>
        <GtmBridge />
      </Suspense>
      {children}
    </GtmProvider>
  );
};
