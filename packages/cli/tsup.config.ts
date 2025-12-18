import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true
  },
  // CLI binary
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    sourcemap: false,
    banner: {
      js: '#!/usr/bin/env node'
    }
  }
]);
