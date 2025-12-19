import { defineConfig } from 'tsup';
import baseConfig from '../../config/tsup.base';

export default defineConfig((options) => ({
  ...baseConfig,
  clean: !options.watch,
  entry: ['src/index.ts'],
  // Add 'use client' directive for Next.js App Router compatibility
  banner: {
    js: `'use client';`
  }
}));
