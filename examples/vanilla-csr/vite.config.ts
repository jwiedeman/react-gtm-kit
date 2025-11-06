import path from 'node:path';
import { defineConfig } from 'vite';

const workspaceRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@react-gtm-kit/core': path.resolve(workspaceRoot, 'packages/core/src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    host: '127.0.0.1'
  },
  preview: {
    host: '127.0.0.1'
  }
});
