export default {
  preset: 'ts-jest/presets/default-esm', // 預設使用 ts-jest 的 ESM 預設配置
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^\\.{1,2}/src/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^\\.{1,2}/utils/(.*)\\.js$': '<rootDir>/src/utils/$1.ts',
    '^\\.{1,2}/core/(.*)\\.js$': '<rootDir>/src/core/$1.ts',
    // 通用規則，處理相對路徑
    '^(\\.{1,2}/.*)\\.js$': '$1', 
  },
  transform: {
    // 支援 .ts, .tsx 檔案
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    // 支援 .js, .jsx 檔案（如果有的話，透過 babel-jest 或 ts-jest 處理）
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // 允許轉換特定的 node_modules 包（如果它們是用 ESM 發布的）
    'node_modules/(?!(jsdom|@exodus/bytes|html-encoding-sniffer|whatwg-url|data-urls|abab|decimal.js|saxes|parse5|xml-name-validator|domexception|webidl-conversions|tr46)/)',
  ],
  // 僅掃描 tests/jest 目錄
  roots: ['<rootDir>/tests/jest'],
  testRegex: '.*\\.test\\.ts$',
};
