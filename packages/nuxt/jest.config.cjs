const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-nuxt',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '__mocks__'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src'),
    '^@jwiedeman/gtm-kit-vue$': path.join(__dirname, '../vue/src'),
    '^@vue/test-utils$': require.resolve('@vue/test-utils'),
    // Mock Nuxt imports
    '^#app$': '<rootDir>/src/__tests__/__mocks__/nuxt.ts',
    '^#imports$': '<rootDir>/src/__tests__/__mocks__/nuxt.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  // Nuxt module has framework-specific code that's hard to test in isolation
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 65,
      functions: 80,
      lines: 80
    }
  }
};
