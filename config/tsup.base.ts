import { defineConfig } from 'tsup';

declare module 'tsup' {
  interface Options {
    minify?: boolean;
  }
}

export const sharedConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2018',
  minify: true,
  treeshake: true
});

export default sharedConfig;
