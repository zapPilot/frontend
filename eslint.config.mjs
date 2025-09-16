import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      
      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/prop-types": "off", // Using TypeScript
      "react/display-name": "error",
      "react/jsx-key": "error",
      
      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      
      // General rules
      "no-console": "warn",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error"
    }
  },
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
      // Disable React hooks rules for test files since they use Playwright's 'use' parameter
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      // Relax unused vars rule for test files (mock functions often have unused parameters)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true 
      }],
      // Allow require() in tests
      "@typescript-eslint/no-require-imports": "off",
      // Allow console statements in tests (useful for debugging)
      "no-console": "off"
    }
  },
  {
    files: ["scripts/**/*.{js,ts}", "cloudflare/**/*.js"],
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
      // Scripts may use require() and console output
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off"
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
