const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-vue',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.ts$'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src'),
    '^@vue/test-utils$': require.resolve('@vue/test-utils')
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  // Some Vue composables are difficult to test in isolation
  // Coverage lowered due to useGtmErrorHandler composable which requires app context
  coverageThreshold: {
    global: {
      statements: 83,
      branches: 90,
      functions: 82,
      lines: 83
    }
  }
};
