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

const exampleDir = path.resolve(workspaceRoot, 'examples/astro-app');
// Astro static builds to dist/
const distDir = path.resolve(exampleDir, 'dist');

const buildAstroExample = () => {
  const result = spawnSync('pnpm', ['--filter', '@gtm-kit/example-astro-app', 'build'], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('Failed to build Astro example application.');
  }
};

export interface AstroAppServer {
  readonly url: string;
  close(): Promise<void>;
}

/**
 * Simple static file server for the Astro app
 */
const serveStatic = (req: IncomingMessage, res: ServerResponse) => {
  let requestUrl = req.url || '/';

  // Remove query strings
  const queryIndex = requestUrl.indexOf('?');
  if (queryIndex !== -1) {
    requestUrl = requestUrl.slice(0, queryIndex);
  }

  // Astro generates /page/index.html for /page routes
  let filePath: string;
  if (requestUrl === '/') {
    filePath = path.join(distDir, 'index.html');
  } else if (requestUrl.endsWith('/')) {
    filePath = path.join(distDir, requestUrl, 'index.html');
  } else {
    // Try the path directly first
    filePath = path.join(distDir, requestUrl);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      // Try as a directory with index.html
      filePath = path.join(distDir, requestUrl, 'index.html');
    }
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
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

export const startAstroAppServer = async (): Promise<AstroAppServer> => {
  buildAstroExample();

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    serveStatic(req, res);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine Astro server address.');
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
