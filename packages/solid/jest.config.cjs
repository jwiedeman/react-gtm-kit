const path = require('path');
const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit-solid',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.ts$'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper ?? {}),
    '^@jwiedeman/gtm-kit$': path.join(__dirname, '../core/src'),
    // Mock solid-js modules for testing
    '^solid-js$': '<rootDir>/src/__mocks__/solid-js.tsx',
    '^solid-js/store$': '<rootDir>/src/__mocks__/solid-js-store.ts',
    '^solid-js/web$': '<rootDir>/src/__mocks__/solid-js-web.ts'
  },
  transform: {
    // Use babel for JSX transformation with solid preset
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
          ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
          'babel-preset-solid'
        ]
      }
    ]
  },
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 60,
      lines: 70
    }
  }
};
