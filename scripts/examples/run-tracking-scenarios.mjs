#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const HOST = '127.0.0.1';
const BASE_PORT = 4300;
const SNAPSHOT_DIR = resolve(repoRoot, 'examples', '.snapshots');

/**
 * @typedef {import('@playwright/test').Page} Page
 */

const scenarios = [
  {
    id: 'vanilla-csr',
    packageName: '@react-gtm-kit/example-vanilla-csr',
    description:
      'Vanilla TypeScript control panel pushing page views, CTA events, and consent updates through the core client.',
    dataLayerName: 'dataLayer',
    previewCommand: (port) => ({
      command: 'pnpm',
      label: 'vanilla-csr',
      args: [
        '--filter',
        '@react-gtm-kit/example-vanilla-csr',
        'exec',
        'vite',
        'preview',
        '--host',
        HOST,
        '--port',
        String(port)
      ]
    }),
    buildCommand: {
      command: 'pnpm',
      args: ['--filter', '@react-gtm-kit/example-vanilla-csr', 'run', 'build']
    },
    url: (port) => `http://${HOST}:${port}/`,
    interactions: async (page) => {
      await page.waitForSelector('[data-role="data-layer"]');
      await page.click('button[data-action="cta"]');
      await page.click('button[data-action="grant-analytics"]');
      await page.click('button[data-action="pageview"]');
      await page.click('button[data-action="reset-consent"]');
      await page.waitForTimeout(200);
    }
  },
  {
    id: 'react-strict-mode',
    packageName: '@react-gtm-kit/example-react-strict-mode',
    description:
      'React StrictMode demo exercising router-driven page views, CTA events, conversion tracking, and consent flips.',
    dataLayerName: 'dataLayer',
    previewCommand: (port) => ({
      command: 'pnpm',
      label: 'react-strict-mode',
      args: [
        '--filter',
        '@react-gtm-kit/example-react-strict-mode',
        'exec',
        'vite',
        'preview',
        '--host',
        HOST,
        '--port',
        String(port)
      ]
    }),
    buildCommand: {
      command: 'pnpm',
      args: ['--filter', '@react-gtm-kit/example-react-strict-mode', 'run', 'build']
    },
    url: (port) => `http://${HOST}:${port}/`,
    interactions: async (page, { url }) => {
      console.log('    [react-strict-mode] granting consent on overview');
      await page.waitForSelector('text=GTM Provider demo');
      await page.waitForSelector('button:has-text("Grant consent")');
      await page.click('button:has-text("Grant consent")');
      console.log('    [react-strict-mode] emitting CTA event');
      await page.click('button:has-text("Emit CTA event")');
      console.log('    [react-strict-mode] navigating to pricing');
      await page.click('nav >> text=Pricing');
      await page.waitForURL('**/pricing');
      console.log('    [react-strict-mode] tracking conversion');
      await page.waitForSelector('button:has-text("Start free trial")');
      await page.click('button:has-text("Start free trial")');
      console.log('    [react-strict-mode] returning to overview');
      await page.click('nav >> text=Overview');
      await page.waitForSelector('button:has-text("Grant consent")');
      console.log('    [react-strict-mode] overview restored');
      await page.waitForTimeout(200);
    }
  },
  {
    id: 'fullstack-web',
    packageName: '@react-gtm-kit/example-fullstack-web',
    description: 'Full-stack web example wiring consent toggles, ecommerce purchase pushes, and relay forwarding.',
    dataLayerName: 'dataLayer',
    previewCommand: (port) => ({
      command: 'pnpm',
      label: 'fullstack-web',
      args: [
        '--filter',
        '@react-gtm-kit/example-fullstack-web',
        'exec',
        'vite',
        'preview',
        '--host',
        HOST,
        '--port',
        String(port)
      ]
    }),
    buildCommand: {
      command: 'pnpm',
      args: ['--filter', '@react-gtm-kit/example-fullstack-web', 'run', 'build']
    },
    url: (port) => `http://${HOST}:${port}/`,
    interactions: async (page) => {
      await page.waitForSelector('text=React GTM Kit + server relay');
      await page.click('button:has-text("Grant analytics & ads")');
      await page.route('**/events', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'ok' })
        });
      });
      await page.click('button:has-text("Send purchase event")');
      await page.waitForSelector('text=Relay accepted purchase', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  },
  {
    id: 'next-app',
    packageName: '@react-gtm-kit/example-next-app',
    description:
      'Next.js App Router sample covering server-rendered head scripts, client navigations, and consent banner interactions.',
    dataLayerName: 'nextAppDataLayer',
    previewCommand: (port) => ({
      command: 'pnpm',
      label: 'next-app',
      args: [
        '--filter',
        '@react-gtm-kit/example-next-app',
        'exec',
        'next',
        'start',
        '--hostname',
        HOST,
        '--port',
        String(port)
      ]
    }),
    buildCommand: {
      command: 'pnpm',
      args: ['--filter', '@react-gtm-kit/example-next-app', 'run', 'build']
    },
    url: (port) => `http://${HOST}:${port}/`,
    interactions: async (page, { url }) => {
      console.log('    [next-app] accepting analytics consent');
      await page.waitForSelector('text=React GTM Kit × Next.js');
      await page.click('button:has-text("Accept analytics")');
      await page.waitForSelector('button:has-text("Manage consent")');
      console.log('    [next-app] navigating to pricing');
      await page.click('nav >> text=Pricing');
      await page.waitForURL('**/pricing');
      console.log('    [next-app] navigating to analytics suite');
      await page.click('nav >> text=Analytics Suite');
      await page.waitForURL('**/products/analytics-suite');
      console.log('    [next-app] reopening consent banner');
      await page.click('button:has-text("Manage consent")');
      await page.waitForSelector('button:has-text("Keep essential only")');
      await page.click('button:has-text("Keep essential only")');
      await page.waitForTimeout(200);
    }
  }
];

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command \`${command} ${args.join(' ')}\` exited with code ${code}`));
      }
    });
  });

const startPreview = ({ command, args, label }) => {
  const child = spawn(command, args, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout?.on('data', (data) => {
    const prefix = label ? `[${label}] ` : '';
    process.stdout.write(`${prefix}${data}`);
  });

  child.stderr?.on('data', (data) => {
    const line = data.toString();
    if (line.toLowerCase().includes('error')) {
      process.stderr.write(line);
    }
  });

  return child;
};

const stopPreview = async (child) => {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 2000);
    child.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};

const waitForServer = async (url, attempts = 120) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for preview server at ${url}`);
};

const readDataLayerSnapshot = async (page, dataLayerName) =>
  page.evaluate((layerName) => {
    const globalObject = globalThis;
    const layer = globalObject[layerName];

    if (!Array.isArray(layer)) {
      return [];
    }

    return layer.map((entry) => {
      if (typeof entry === 'function') {
        return '[Function]';
      }

      try {
        return JSON.parse(JSON.stringify(entry));
      } catch {
        return entry;
      }
    });
  }, dataLayerName);

const main = async () => {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  const browser = await chromium.launch();

  const results = [];

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    const port = BASE_PORT + index;
    const url = scenario.url(port);

    console.log(`\n▶ Running scenario: ${scenario.id}`);

    await runCommand(scenario.buildCommand.command, scenario.buildCommand.args);

    const preview = startPreview(scenario.previewCommand(port));

    try {
      await waitForServer(url);

      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForFunction(
        (layerName) => {
          const candidate = globalThis[layerName];
          return Array.isArray(candidate) && candidate.length > 0;
        },
        scenario.dataLayerName,
        { timeout: 15000 }
      );

      await scenario.interactions(page, { url, port });

      const snapshot = await readDataLayerSnapshot(page, scenario.dataLayerName);
      const snapshotPath = resolve(SNAPSHOT_DIR, `${scenario.id}.json`);
      const payload = {
        scenario: scenario.id,
        description: scenario.description,
        dataLayerName: scenario.dataLayerName,
        url,
        capturedAt: new Date().toISOString(),
        entries: snapshot
      };

      await writeFile(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      console.log(`✓ Wrote snapshot to ${snapshotPath}`);
      results.push({ id: scenario.id, path: snapshotPath, entries: snapshot.length });

      await context.close();
    } finally {
      await stopPreview(preview);
    }
  }

  await browser.close();

  console.log('\nTracking scenario summary:');
  results.forEach((result) => {
    console.log(` • ${result.id}: ${result.entries} entries captured (${result.path})`);
  });
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
