import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { spawnSync } from 'child_process';
import next from 'next';
import path from 'path';

const workspaceRoot = path.resolve(__dirname, '../../..');
const exampleDir = path.resolve(workspaceRoot, 'examples/next-app');

const buildNextExample = () => {
  const result = spawnSync('pnpm', ['--filter', '@react-gtm-kit/example-next-app', 'build'], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('Failed to build Next.js example application.');
  }
};

export interface NextAppServer {
  readonly url: string;
  close(): Promise<void>;
}

export const startNextAppServer = async (): Promise<NextAppServer> => {
  buildNextExample();

  const app = next({ dev: false, dir: exampleDir });
  await app.prepare();

  const handle = app.getRequestHandler();
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handle(req, res).catch((error) => {
      console.error('Next.js request handler failed', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine Next.js server address.');
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

      await app.close();
    }
  };
};
