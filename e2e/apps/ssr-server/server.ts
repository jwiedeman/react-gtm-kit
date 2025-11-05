import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { buildSync } from 'esbuild';
import path from 'path';

import { createNoscriptMarkup } from '../../../packages/core/src/noscript';

const GTM_CONTAINER_ID = 'GTM-TEST';
const DATA_LAYER_NAME = 'dataLayer';
const NONCE = 'test-nonce-123';

const bundle = buildSync({
  entryPoints: [path.resolve(__dirname, '../../../packages/core/src/index.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'ReactGtmKitCore',
  platform: 'browser',
  target: ['es2018'],
  write: false,
  sourcemap: 'inline'
});

if (!bundle.outputFiles?.length) {
  throw new Error('Failed to build GTM client runtime bundle for E2E server.');
}

const clientRuntime = bundle.outputFiles[0]!.text;

const buildHtml = (): string => {
  const noscriptMarkup = createNoscriptMarkup(
    { id: GTM_CONTAINER_ID, queryParams: { l: DATA_LAYER_NAME } },
    { defaultQueryParams: { l: DATA_LAYER_NAME } }
  );

  const bootstrap = `(() => {
    const { createGtmClient } = window.ReactGtmKitCore;
    const client = createGtmClient({
      containers: [{ id: '${GTM_CONTAINER_ID}', queryParams: { l: '${DATA_LAYER_NAME}' } }],
      dataLayerName: '${DATA_LAYER_NAME}',
      scriptAttributes: { nonce: '${NONCE}' }
    });
    client.init();
  })();`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SSR CSP Fixture</title>
  </head>
  <body>
    <main>
      <h1>SSR with CSP</h1>
      <p id="status">waiting</p>
    </main>
    ${noscriptMarkup}
    <script nonce="${NONCE}">${clientRuntime}</script>
    <script nonce="${NONCE}">${bootstrap}</script>
  </body>
</html>`;
};

const handleRequest = (_req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'nonce-${NONCE}'`);
  res.end(buildHtml());
};

export interface SsrServer {
  readonly url: string;
  close(): Promise<void>;
}

export const startSsrServer = async (): Promise<SsrServer> => {
  const server = createServer(handleRequest);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine server address.');
  }

  const { port } = address as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
};
