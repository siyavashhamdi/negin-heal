// @ts-check
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@typescript-eslint": typescriptEslint,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React Refresh
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // React
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      // General JavaScript
      "no-unused-vars": "off", // Turn off base rule as it conflicts with TypeScript
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      // Code Quality
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-wrappers": "error",
      "no-throw-literal": "error",
      "no-with": "error",
      // Best Practices
      "array-callback-return": "error",
      "consistent-return": "warn",
      "default-case": "warn",
      "dot-notation": "warn",
      "no-else-return": "warn",
      "no-empty-function": "warn",
      "no-implicit-coercion": "warn",
      "no-lone-blocks": "error",
      "no-return-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-unmodified-loop-condition": "warn",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-return": "warn",
      "require-await": "warn",
      // Style
      "comma-dangle": [
        "warn",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
        },
      ],
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
      indent: ["warn", 2, { SwitchCase: 1 }],
      "max-len": ["warn", { code: 100, ignoreUrls: true, ignoreStrings: true }],
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      ".eslintrc.*",
      "src/sw.ts",
    ],
  },
];
