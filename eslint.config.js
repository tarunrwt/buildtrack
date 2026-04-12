import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // Ignore built output, deps, and TypeScript files (no TS parser installed)
  { ignores: ["dist/", "node_modules/", "**/*.ts", "**/*.tsx"] },

  // Base JS rules
  js.configs.recommended,

  // Node environment for config files at the root
  {
    files: ["vite.config.js", "postcss.config.js", "tailwind.config.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // React + hooks for source files
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2020 },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: "18.3" } },
    rules: {
      // React recommended (JSX transform — no need to import React)
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,

      // Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Project-specific overrides
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",      // apostrophes in text content
      "react/no-unstable-nested-components": "off", // inline component defs in MVP file — roadmap item
      "react-hooks/static-components": "off",    // new rule tracking inline component defs
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn", // known pattern in App.jsx — roadmap refactor
    },
  },
];
