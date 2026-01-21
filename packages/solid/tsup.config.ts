import { defineConfig } from 'tsup';
import baseConfig from '../../config/tsup.base';
import { solidPlugin } from 'esbuild-plugin-solid';

export default defineConfig((options) => ({
  ...baseConfig,
  clean: !options.watch,
  entry: ['src/index.ts'],
  external: ['solid-js', 'solid-js/web', 'solid-js/store'],
  esbuildPlugins: [solidPlugin({ solid: { generate: 'dom' } })]
}));
