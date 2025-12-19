const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-svelte',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.ts$'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src'),
    // Mock svelte/store since tests use mocks anyway
    '^svelte/store$': '<rootDir>/src/__mocks__/svelte-store.ts',
    '^svelte$': '<rootDir>/src/__mocks__/svelte.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 75,
      functions: 40,
      lines: 75
    }
  }
};
