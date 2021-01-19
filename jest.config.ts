import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/__tests__/**', '!**/node_modules/**', '!**/vendor/**'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist'],
  // To be a test file, you need to be named foo.test.ts AND be in
  // a __tests__ directory.  This means you don't have to think about
  // where to put tests, and you can have non .test.ts helper files
  // live next to your tests.
  testMatch: ['**/__tests__/**/(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    // https://github.com/panva/jose/discussions/105#discussioncomment-210269
    '^jose/(.*)$': '<rootDir>/node_modules/jose/dist/node/cjs/$1',
  },
};

export default config;
