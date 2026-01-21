import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { spawnSync } from 'child_process';
import path from 'path';
import { createReadStream, existsSync, statSync } from 'fs';

const workspaceRoot = path.resolve(__dirname, '../../..');

/**
 * Simple MIME type lookup for static file serving
 */
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json'
};

const getMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
};

const exampleDir = path.resolve(workspaceRoot, 'examples/vanilla-csr');
const distDir = path.resolve(exampleDir, 'dist');

const buildVanillaExample = () => {
  const result = spawnSync('pnpm', ['--filter', '@gtm-kit/example-vanilla-csr', 'build'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_GTM_CONTAINERS: 'GTM-VANILLA',
      VITE_GTM_DATALAYER: 'vanillaDataLayer'
    }
  });

  if (result.status !== 0) {
    throw new Error('Failed to build Vanilla CSR example application.');
  }
};

export interface VanillaAppServer {
  readonly url: string;
  close(): Promise<void>;
}

/**
 * Simple static file server for the Vanilla app
 */
const serveStatic = (req: IncomingMessage, res: ServerResponse) => {
  let filePath = path.join(distDir, req.url === '/' ? '/index.html' : req.url || '/index.html');

  // Handle SPA fallback - if file doesn't exist, serve index.html
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    if (!ext || ext === '.html') {
      filePath = path.join(distDir, 'index.html');
    }
  }

  if (!existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const mimeType = getMimeType(filePath);
  res.setHeader('Content-Type', mimeType);

  const stream = createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', () => {
    res.statusCode = 500;
    res.end('Internal Server Error');
  });
};

export const startVanillaAppServer = async (): Promise<VanillaAppServer> => {
  buildVanillaExample();

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    serveStatic(req, res);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine Vanilla server address.');
  }

  const { port } = address as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
};
