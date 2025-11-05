import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests'),
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    headless: true,
    trace: 'on-first-retry'
  },
  reporter: [['list'], ['html', { outputFolder: path.resolve(__dirname, 'playwright-report'), open: 'never' }]],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined
});
