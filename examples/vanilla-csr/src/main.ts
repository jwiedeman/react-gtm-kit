import './style.css';
import { createGtmClient, pushEvent } from '@react-gtm-kit/core';

type GtmWindow = Window & Record<string, unknown>;

type DataLayerArray = unknown[] & { push: (...values: unknown[]) => number };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Unable to locate #app root element.');
}

const rawContainers = (import.meta.env.VITE_GTM_CONTAINERS as string | undefined) ?? 'GTM-XXXX';
const containers = rawContainers
  .split(',')
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

if (containers.length === 0) {
  containers.push('GTM-XXXX');
}

const client = createGtmClient({
  containers,
  dataLayerName: (import.meta.env.VITE_GTM_DATALAYER as string | undefined) ?? 'dataLayer',
  logger: import.meta.env.DEV ? console : undefined
});

const dataLayerName = client.dataLayerName;
const formattedContainers = containers.map(escapeHtml).join(', ');

appRoot.innerHTML = `
  <main>
    <header>
      <h1>React GTM Kit · Vanilla CSR</h1>
      <small>
        Containers: <code>${formattedContainers}</code>
        · Data layer: <code>${escapeHtml(dataLayerName)}</code>
      </small>
    </header>

    <section class="card">
      <h2>Send demo events</h2>
      <p>
        These pushes go straight through the core GTM client without any React adapters.
        They run in any framework (or none at all).
      </p>
      <div>
        <button data-variant="primary" data-action="pageview">Push page view</button>
        <button data-variant="ghost" data-action="cta">Push CTA event</button>
      </div>
    </section>

    <section class="card">
      <h2>Consent defaults</h2>
      <p>
        Toggle Consent Mode signals to see how the client queues default updates before init and
        applies runtime changes afterwards.
      </p>
      <div>
        <button data-variant="primary" data-action="grant-analytics">Grant analytics</button>
        <button data-variant="ghost" data-action="reset-consent">Reset to essential</button>
      </div>
    </section>

    <section class="card">
      <h2>Data layer snapshot</h2>
      <p>
        Live view of <code>window.${escapeHtml(dataLayerName)}</code>. Updates whenever the data layer mutates.
      </p>
      <pre data-role="data-layer">[]</pre>
    </section>
  </main>
`;

const dataLayerOutput = appRoot.querySelector<HTMLPreElement>('[data-role="data-layer"]');

const readDataLayer = (): unknown[] => {
  const layer = (window as unknown as GtmWindow)[dataLayerName];
  return Array.isArray(layer) ? layer : [];
};

const renderDataLayer = () => {
  if (!dataLayerOutput) {
    return;
  }

  const snapshot = readDataLayer();
  dataLayerOutput.textContent = JSON.stringify(snapshot, null, 2);
};

client.setConsentDefaults({ analytics_storage: 'denied', ad_storage: 'denied' });
pushEvent(client, 'page_view', {
  page_title: 'Vanilla CSR landing',
  page_path: window.location.pathname || '/'
});
client.init();

const globalLayer = (window as unknown as GtmWindow)[dataLayerName];
if (Array.isArray(globalLayer)) {
  const array = globalLayer as DataLayerArray;
  const originalPush = array.push.bind(array);
  array.push = ((...values: unknown[]) => {
    const result = originalPush(...values);
    queueMicrotask(renderDataLayer);
    return result;
  }) as DataLayerArray['push'];
}

renderDataLayer();

const on = (action: string, handler: () => void) => {
  const button = appRoot.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
  if (!button) {
    return;
  }
  button.addEventListener('click', handler);
};

on('pageview', () => {
  pushEvent(client, 'page_view', {
    page_title: 'Manual page view',
    page_path: `/demo/${Date.now()}`
  });
  renderDataLayer();
});

on('cta', () => {
  pushEvent(client, 'cta_click', {
    cta_label: 'Get started',
    timestamp: new Date().toISOString()
  });
  renderDataLayer();
});

on('grant-analytics', () => {
  client.updateConsent({ analytics_storage: 'granted' });
  renderDataLayer();
});

on('reset-consent', () => {
  client.updateConsent({ analytics_storage: 'denied', ad_storage: 'denied' });
  renderDataLayer();
});
