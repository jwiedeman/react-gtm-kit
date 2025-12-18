import type { AddressInfo } from 'net';
import { spawnSync, spawn, type ChildProcess } from 'child_process';
import path from 'path';

const workspaceRoot = path.resolve(__dirname, '../../..');
const exampleDir = path.resolve(workspaceRoot, 'examples/nuxt-app');

const buildNuxtExample = () => {
  const result = spawnSync('pnpm', ['--filter', '@react-gtm-kit/example-nuxt-app', 'build'], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('Failed to build Nuxt example application.');
  }
};

export interface NuxtAppServer {
  readonly url: string;
  close(): Promise<void>;
}

export const startNuxtAppServer = async (): Promise<NuxtAppServer> => {
  buildNuxtExample();

  // Find an available port
  const net = await import('net');
  const getPort = (): Promise<number> => {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        const port = address.port;
        server.close(() => resolve(port));
      });
      server.on('error', reject);
    });
  };

  const port = await getPort();

  // Start Nuxt preview server
  const nuxtProcess: ChildProcess = spawn('npx', ['nuxt', 'preview', '--port', port.toString()], {
    cwd: exampleDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: port.toString() }
  });

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Nuxt server startup timed out'));
    }, 60000);

    let output = '';

    const checkReady = (data: Buffer) => {
      output += data.toString();
      // Nuxt outputs this when ready
      if (output.includes('Listening') || output.includes('Local:') || output.includes('ready')) {
        clearTimeout(timeout);
        // Give a small delay for the server to fully initialize
        setTimeout(resolve, 1000);
      }
    };

    nuxtProcess.stdout?.on('data', checkReady);
    nuxtProcess.stderr?.on('data', checkReady);

    nuxtProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    nuxtProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Nuxt process exited with code ${code}`));
      }
    });
  });

  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      nuxtProcess.kill('SIGTERM');

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          nuxtProcess.kill('SIGKILL');
          resolve();
        }, 5000);

        nuxtProcess.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  };
};
