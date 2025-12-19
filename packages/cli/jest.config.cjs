/** @type {import('jest').Config} */
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  testEnvironment: 'node',
  displayName: '@jwiedeman/gtm-kit-cli',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.{ts,tsx}'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 95,
      lines: 90
    }
  }
};
