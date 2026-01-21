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
  // Disable minification - library packages should not minify as it can cause
  // variable name collisions (e.g., 'h' conflicts with Vue's createElement).
  // The consuming bundler will handle minification of the final bundle.
  minify: false,
  treeshake: true
});

export default sharedConfig;
