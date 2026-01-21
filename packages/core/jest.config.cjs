const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 90,
      functions: 84,
      lines: 95
    }
  },
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit'
};
