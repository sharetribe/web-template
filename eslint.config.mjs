import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"], languageOptions: { globals: globals.browser } },
  pluginReact.configs.flat.recommended,
  {
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
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

    },
  },
  {
    ignores: ["**/*.test.js"],
  }
]);
