// @ts-check
import globals from "globals";
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";
// import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import testingLibrary from "eslint-plugin-testing-library";

export default tsEslint.config(
  {
    ignores: ["dist/*", "eslint.config.js"],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  ...tsEslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettierConfig,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    settings: {
      react: {
        version: "detect", // React version. "detect" automatically picks the version you have installed.
      },
      linkComponents: [
        { name: "Link", linkAttribute: "to" }, // allows specifying multiple properties if necessary
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      // ["react-hooks"]: reactHooks,
      ["react-refresh"]: reactRefresh,
    },
    rules: {
      // "react-hooks/rules-of-hooks": "error",
      // "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "react-refresh/only-export-components": "warn",
    },
  },
  {
    files: [
      "**/__tests__/**/*.[jt]s?(x)",
      "**/?(*.)+(spec|test).[jt]s?(x)",
      "**/test.utils.tsx",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    ...testingLibrary.configs["flat/react"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
