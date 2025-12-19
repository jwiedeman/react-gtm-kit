const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-next',
  setupFiles: [...(baseConfig.setupFiles ?? []), path.join(__dirname, 'jest.setup.ts')],
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '@testing-library/jest-dom'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src'),
    '^next/navigation$': path.join(__dirname, 'src/__mocks__/next/navigation.ts')
  }
};
