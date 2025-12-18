const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@react-gtm-kit/vue',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@react-gtm-kit/core$': path.join(__dirname, '../core/src')
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  }
};
