const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-react',
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '@testing-library/jest-dom'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src')
  }
};
