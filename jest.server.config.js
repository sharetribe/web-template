'use strict';

module.exports = {
  testEnvironment: 'node',
  roots: ['./server'],
  testMatch: ['**/server/**/*.test.js'],
  moduleNameMapper: {
    '^csv-parse/sync$': '<rootDir>/node_modules/csv-parse/dist/cjs/sync.cjs',
  },
};
