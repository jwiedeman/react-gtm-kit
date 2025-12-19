import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GtmProvider } from '@jwiedeman/gtm-kit-react';
import App from './App';

const rawContainers = import.meta.env.VITE_GTM_CONTAINERS ?? 'GTM-XXXX';
const containers = rawContainers
  .split(',')
  .map((id: string) => id.trim())
  .filter((id: string) => id.length > 0);

if (containers.length === 0) {
  containers.push('GTM-XXXX');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GtmProvider
      config={{
        containers,
        dataLayerName: import.meta.env.VITE_GTM_DATALAYER ?? 'dataLayer',
        logger: import.meta.env.DEV ? console : undefined
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GtmProvider>
  </React.StrictMode>
);
