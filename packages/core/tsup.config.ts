import path from 'path';
import { defineConfig } from 'tsup';
import baseConfig from '../../config/tsup.base';

export default defineConfig((options) => ({
  ...baseConfig,
  dts: {
    resolve: true,
    tsconfig: path.resolve(__dirname, 'tsconfig.json')
  },
  clean: !options.watch,
  entry: ['src/index.ts']
}));
