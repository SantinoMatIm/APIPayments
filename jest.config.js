module.exports = {
    testEnvironment: 'node',
    testMatch: [
      '**/tests/**/*.test.js',
      '**/tests/**/*.spec.js'
    ],
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/index.js'
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80
      }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js']
  };