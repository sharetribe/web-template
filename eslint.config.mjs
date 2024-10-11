import { readFileSync } from 'fs';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';
import babelParser from '@babel/eslint-parser'; // Import the Babel parser

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prettierOptions = JSON.parse(readFileSync(path.resolve(__dirname, './.prettierrc'), 'utf8'));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,
  ...compat.extends('airbnb', 'plugin:jest/recommended', 'prettier'),
  ...compat.plugins('prettier', 'import', 'jsx-a11y', 'react'),
  {
    files: ['**/*.js', '**/*.jsx'], // Apply these settings to JavaScript and JSX files
    languageOptions: {
      parser: babelParser, // Use the imported parser module directly
      ecmaVersion: 8,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': ['error', prettierOptions],
      'no-console': 'off',
      // Add other custom rules here
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['api', './packages/shared/src/api/'],
            ['config', './packages/shared/src/config/'],
            // More aliases
          ],
          extensions: ['.ts', '.js', '.jsx', '.json'],
        },
      },
    },
  },
];
