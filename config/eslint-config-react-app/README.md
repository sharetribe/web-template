This could be taken into use for example by creating .eslint.config.js file in the root of the project and extending the base.js file.

```js
/**
 * ESLint flat config (v9+).
 * Run with: yarn lint (uses NODE_ENV=development for Babel parser).
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */
'use strict';

const path = require('path');

module.exports = [
  {
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [require.resolve('./config/babel-preset-react-app')],
        },
      },
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    plugins: {
      react: require('eslint-plugin-react'),
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'no-eval': 'warn',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'react/jsx-uses-vars': 'warn',
      'react/jsx-uses-react': 'warn',
      ...(process.env.DISABLE_NEW_JSX_TRANSFORM === 'true' && {
        'react/react-in-jsx-scope': 'error',
      }),
    },
  },
  {
    ignores: ['build/**', 'node_modules/**', '.cache/**'],
  },
  {
    files: ['**/*.example.js'],
    rules: { 'no-console': 'off' },
    linterOptions: { reportUnusedDisableDirectives: false },
  },
];
```

Then you could add the following to the package.json file (scripts section):
```json
    "lint": "cross-env NODE_ENV=development eslint \"src/**/*.{js,jsx}\" \"server/**/*.js\"",
```
