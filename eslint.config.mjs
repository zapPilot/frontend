import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import noSecrets from 'eslint-plugin-no-secrets';
import promisePlugin from 'eslint-plugin-promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base Next.js configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // TypeScript strict and stylistic configs
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  // Code smell detection
  sonarjs.configs.recommended,

  // Promise/async best practices
  promisePlugin.configs['flat/recommended'],

  // Modern JavaScript patterns (with selected rules to avoid being too opinionated)
  {
    plugins: {
      unicorn,
    },
    rules: {
      // Enable only practical unicorn rules
      'unicorn/error-message': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/consistent-function-scoping': 'warn',
    }
  },

  // Custom rules and plugins
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'no-secrets': noSecrets,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // ========================================
      // Import Organization
      // ========================================
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-duplicate-imports': 'error',

      // ========================================
      // Security
      // ========================================
      'no-secrets/no-secrets': ['error', {
        tolerance: 4.5,
        ignoreContent: ['^NEXT_PUBLIC_', '^PUBLIC_'],  // Allow public env vars
        additionalDelimiters: ['"', "'", '`'],
      }],

      // ========================================
      // TypeScript Strict Rules
      // ========================================
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',       // Catch unhandled promises
      '@typescript-eslint/no-misused-promises': 'error',        // Catch promise mistakes
      '@typescript-eslint/await-thenable': 'error',             // Only await promises
      '@typescript-eslint/no-unnecessary-condition': 'warn',    // Catch always-true/false
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',   // Use ?? instead of ||
      '@typescript-eslint/prefer-optional-chain': 'error',      // Use ?. for optional access
      '@typescript-eslint/unified-signatures': 'off',           // Disabled due to compatibility issue

      // ========================================
      // Code Smell Detection (SonarJS)
      // ========================================
      'sonarjs/cognitive-complexity': ['error', 15],            // Max complexity per function
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],  // Catch magic strings
      'sonarjs/no-identical-functions': 'error',                // Detect duplicate functions
      'sonarjs/no-collapsible-if': 'warn',                      // Simplify nested ifs

      // ========================================
      // Promise/Async Patterns
      // ========================================
      'promise/prefer-await-to-then': 'error',                  // Use async/await over .then()
      'promise/no-return-wrap': 'error',                        // No unnecessary Promise wrapping
      'promise/catch-or-return': 'error',                       // Handle promise errors
      'promise/no-nesting': 'warn',                             // Avoid nested promises
      'promise/no-callback-in-promise': 'warn',                 // No callbacks in promises

      // ========================================
      // React Specific Rules
      // ========================================
      "react/react-in-jsx-scope": "off",                        // Not needed in Next.js
      "react/prop-types": "off",                                // Using TypeScript
      "react/display-name": "error",
      "react/jsx-key": "error",

      // ========================================
      // React Hooks Rules
      // ========================================
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // ========================================
      // General Code Quality Rules
      // ========================================
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    }
  },

  // ========================================
  // File-Specific Overrides
  // ========================================
  {
    files: ["src/utils/logger.ts"],
    rules: {
      // Centralized logger is allowed to use console
      "no-console": "off"
    }
  },
  {
    files: ["tests/**/*", "**/*.test.*", "**/*.spec.*"],
    rules: {
      // Disable React hooks rules for test files
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",

      // Relax TypeScript rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",

      // Relax code complexity for tests
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-duplicate-string": "off",

      // Relax promise rules for tests
      "promise/prefer-await-to-then": "off",

      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],

      // Allow require() in tests
      "@typescript-eslint/no-require-imports": "off",

      // Allow console in tests
      "no-console": "off"
    }
  },
  {
    files: ["scripts/**/*.{js,ts}", "cloudflare/**/*.js", "*.config.{js,mjs,ts}"],
    languageOptions: {
      globals: {
        console: true,
        process: true,
        require: true,
        module: true,
        __dirname: true,
        __filename: true
      }
    },
    rules: {
      // Scripts may use require() and console
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",

      // Relax complexity for config/script files
      "sonarjs/cognitive-complexity": "off",

      // Allow any in scripts
      "@typescript-eslint/no-explicit-any": "off",
    }
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "public/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "next-env.d.ts"
    ]
  }
];

export default eslintConfig;
