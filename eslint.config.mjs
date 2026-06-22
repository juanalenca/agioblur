import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["resize_icons.js", "crop_resize.ps1"]
  },
  js.configs.recommended,
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["update_locales.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["infra/worker/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.webworker,
        Response: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        crypto: "readonly",
        fetch: "readonly",
        TextEncoder: "readonly",
        btoa: "readonly",
        console: "readonly"
      }
    }
  },
  {
    files: ["**/*.js"],
    ignores: ["eslint.config.mjs", "update_locales.js", "infra/worker/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        chrome: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  }
];
