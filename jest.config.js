// eslint-disable-next-line no-undef
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/__tests__/**', '!**/node_modules/**', '!**/vendor/**'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist'],
  // To be a test file, you need to be named foo.test.ts AND be in
  // a __tests__ directory.  This means you don't have to think about
  // where to put tests, and you can have non .test.ts helper files
  // live next to your tests.
  testMatch: ['**/__tests__/**/(*.)+(spec|test).[jt]s?(x)'],
};
