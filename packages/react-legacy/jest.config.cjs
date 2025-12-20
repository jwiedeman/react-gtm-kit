const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-react-legacy',
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '@testing-library/jest-dom'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src')
  },
  // HOC wrapper has some display name utilities that are hard to test
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 80,
      functions: 80,
      lines: 95
    }
  }
};
