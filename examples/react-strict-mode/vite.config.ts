import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const workspaceRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@jwiedeman/gtm-kit': path.resolve(workspaceRoot, 'packages/core/src'),
      '@jwiedeman/gtm-kit-react': path.resolve(workspaceRoot, 'packages/react-modern/src')
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1'
  }
});
