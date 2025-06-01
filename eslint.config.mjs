import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: ["**/*.test.js", "**/*.example.js"],
  },
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"] },
  {
    files: ["server/**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { globals: globals.node }
  },
  {
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: "readonly",
        require: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    ...pluginReact.configs.flat.recommended,
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    settings: {
      react: {
        version: "detect",
      },
    }
  },
  {
    files: ["src/**/*.{js,mjs,cjs,jsx}", "server/**/*.{js,mjs,cjs,jsx}"],
    rules: {
      "react/display-name": "off",
      "react/prop-types": "off",
      "react/no-deprecated": "off",
      "react/no-unescaped-entities": "off",
      "no-unused-vars": "off",
      "no-extra-boolean-cast": "off",
      "no-useless-escape": "off",
      "eslint-comments/no-unused-disable": "off",
      "no-irregular-whitespace": "off",
      "no-prototype-builtins": "off",
      "no-control-regex": "off",
      "no-dupe-keys": "off",
      "no-case-declarations": "off",
      "no-constant-condition": "off",
      "no-empty": "off",
      "no-empty-object": "off",
      "no-empty-pattern": "off",
      "no-unsafe-optional-chaining": "off",
      "no-constant-binary-expression": "off",
      "valid-typeof": "off",
      "react/no-unknown-property": "off",
      "no-useless-catch": "off",
      "no-fallthrough": "off",
      "no-dupe-else-if": "off"
    },
  }
]);
