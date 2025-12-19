import { defineConfig } from 'tsup';
import baseConfig from '../../config/tsup.base';

export default defineConfig((options) => ({
  ...baseConfig,
  clean: !options.watch,
  entry: ['src/index.ts'],
  external: ['react', 'react-dom', '@remix-run/react']
}));
