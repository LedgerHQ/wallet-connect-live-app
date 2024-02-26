/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  root: true,
  env: {
    node: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["react-refresh"],
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
  ],
  rules: {
    "react-refresh/only-export-components": "warn",
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      extends: [
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "prettier",
      ],
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      rules: {
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
      },
    },

    // Only uses Testing Library lint rules in test files
    {
      files: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
        "test.utils.tsx",
      ],
      extends: ["plugin:testing-library/react"],
      rules: {
        "react-refresh/only-export-components": "off",
      },
    },
  ],
  settings: {
    react: {
      version: "detect", // React version. "detect" automatically picks the version you have installed.
    },
    linkComponents: [
      { name: "Link", linkAttribute: "to" }, // allows specifying multiple properties if necessary
    ],
  },
};
