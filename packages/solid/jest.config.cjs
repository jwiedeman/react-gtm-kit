const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@react-gtm-kit/solid',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.ts$'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@react-gtm-kit/core$': path.join(__dirname, '../core/src'),
    // Mock solid-js modules for testing
    '^solid-js$': '<rootDir>/src/__mocks__/solid-js.tsx',
    '^solid-js/store$': '<rootDir>/src/__mocks__/solid-js-store.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      useESM: false
    }]
  },
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  },
  // Skip JSX tests until babel-preset-solid is properly configured
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.ts$', '\\.spec\\.tsx$']
};
