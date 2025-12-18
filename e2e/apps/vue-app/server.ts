import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { spawnSync } from 'child_process';
import path from 'path';
import { createReadStream, existsSync, statSync } from 'fs';
import { lookup } from 'mimetypes';

const workspaceRoot = path.resolve(__dirname, '../../..');
const exampleDir = path.resolve(workspaceRoot, 'examples/vue-app');
const distDir = path.resolve(exampleDir, 'dist');

const buildVueExample = () => {
  const result = spawnSync('pnpm', ['--filter', '@react-gtm-kit/example-vue-app', 'build'], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('Failed to build Vue example application.');
  }
};

export interface VueAppServer {
  readonly url: string;
  close(): Promise<void>;
}

/**
 * Simple static file server for the Vue app
 */
const serveStatic = (req: IncomingMessage, res: ServerResponse) => {
  let filePath = path.join(distDir, req.url === '/' ? '/index.html' : req.url || '/index.html');

  // Handle SPA fallback - if file doesn't exist, serve index.html
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    // Check if it's a route (no file extension)
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

  const mimeType = lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);

  const stream = createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', () => {
    res.statusCode = 500;
    res.end('Internal Server Error');
  });
};

export const startVueAppServer = async (): Promise<VueAppServer> => {
  buildVueExample();

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    serveStatic(req, res);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine Vue server address.');
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
