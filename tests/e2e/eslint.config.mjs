import js from "@eslint/js";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";

// Forbid raw page.locator / page.getBy* in spec files — POM only.
// Page Objects under `pages/**` and fixtures under `fixtures/**` may use them.
const pomOnlyRule = {
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "CallExpression[callee.type='MemberExpression'][callee.object.name='page'][callee.property.name='locator']",
      message:
        "Selectors live in tests/e2e/pages/*. Do not call page.locator() inside a spec file.",
    },
    {
      selector:
        "CallExpression[callee.type='MemberExpression'][callee.object.name='page'][callee.property.name=/^getBy/]",
      message:
        "Selectors live in tests/e2e/pages/*. Do not call page.getBy*() inside a spec file.",
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  {
    files: ["specs/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      ...pomOnlyRule,
    },
  },
);
