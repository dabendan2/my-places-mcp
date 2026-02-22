module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/test-*.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^\\.\\./src/core/(.*)\\.js$': '<rootDir>/src/core/$1',
    '^\\.\\./src/utils/(.*)\\.js$': '<rootDir>/src/utils/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
};
