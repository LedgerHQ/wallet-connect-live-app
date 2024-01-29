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
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["testing-library", "jest"],
  extends: ["eslint:recommended", "prettier", "plugin:react-hooks/recommended"],
  rules: {
    "prefer-const": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",
  },
  ignorePatterns: ["src/pages/*", "src/data/*"],
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
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
      extends: ["plugin:testing-library/react"],
    },
  ],
};
