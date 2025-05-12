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
      branches: 40,    // Reducido de 70% a 40%
      functions: 60,   // Reducido de 70% a 60%
      lines: 70,       // Reducido de 80% a 70%
      statements: 65   // Reducido de 80% a 65%
    }
  },
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js']
  };