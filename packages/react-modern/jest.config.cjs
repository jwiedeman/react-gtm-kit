const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@react-gtm-kit/react-modern',
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '@testing-library/jest-dom'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@react-gtm-kit/core$': path.join(__dirname, '../core/src')
  }
};
