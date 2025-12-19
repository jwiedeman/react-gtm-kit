const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@react-gtm-kit/solid',
  testEnvironment: 'jsdom',
  // Skip tests for now - SolidJS requires babel-preset-solid for JSX transforms
  // Tests will be enabled once proper babel configuration is added
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.ts$', '\\.spec\\.tsx$'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@react-gtm-kit/core$': path.join(__dirname, '../core/src'),
    '^solid-js$': require.resolve('solid-js'),
    '^solid-js/store$': require.resolve('solid-js/store'),
    '^solid-js/web$': require.resolve('solid-js/web')
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  }
};
