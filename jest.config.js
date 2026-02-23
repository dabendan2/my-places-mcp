export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jsdom|@exodus/bytes|html-encoding-sniffer|whatwg-url|data-urls|abab|decimal.js|saxes|parse5|xml-name-validator|domexception|webidl-conversions|tr46)/)',
  ],
};
