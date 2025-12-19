const baseConfig = require('../../config/jest.base.cjs');

module.exports = {
  ...baseConfig,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 90,
      lines: 80
    }
  },
  rootDir: __dirname,
  displayName: '@jwiedeman/gtm-kit'
};
