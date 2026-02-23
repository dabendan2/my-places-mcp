export default {
  preset: 'ts-jest/presets/default-esm', // 預設使用 ts-jest 的 ESM 預設配置
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // 處理 .js 結尾的 import 對應到 .ts 檔案
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
};
