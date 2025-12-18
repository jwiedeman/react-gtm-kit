const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@react-gtm-kit/nuxt',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '__mocks__'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@react-gtm-kit/core$': path.join(__dirname, '../core/src'),
    '^@react-gtm-kit/vue$': path.join(__dirname, '../vue/src'),
    '^@vue/test-utils$': require.resolve('@vue/test-utils'),
    // Mock Nuxt imports
    '^#app$': '<rootDir>/src/__tests__/__mocks__/nuxt.ts',
    '^#imports$': '<rootDir>/src/__tests__/__mocks__/nuxt.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  }
};
