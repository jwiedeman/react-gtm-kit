/** @type {import('jest').Config} */
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  testEnvironment: 'node',
  displayName: '@react-gtm-kit/cli',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.{ts,tsx}'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 85,
      lines: 70
    }
  }
};
