import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

const enforceCoverageThresholds = process.env['VITEST_ENFORCE_THRESHOLDS'] !== 'false';
const coverageThresholds = {
  global: {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95,
  },
} as const;

export default defineConfig({
  plugins: [react()],
  test: {
    // Resource controls: run one file at a time and recycle the fork between files
    // This reduces retained heap from long-lived JSDOM/module state across the suite
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    maxWorkers: 1,
    minWorkers: 1,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{js,ts,tsx}', 'tests/integration/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['tests/e2e/**/*'],
    css: false,
    // Resource optimization settings
    isolate: true, // Better memory cleanup between test files
    testTimeout: 30000, // 30 second timeout to prevent hanging
    hookTimeout: 10000, // 10 second hook timeout
    teardownTimeout: 10000, // 10 second teardown timeout for graceful cleanup
    // Better React 18+ support
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true',
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'node_modules/',
        'tests/setup.ts',
        'tests/e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '.next/**',
        'src/types/**',
        'src/**/*.stories.*',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        // UI interaction hooks covered by E2E tests
        'src/hooks/ui/useChartHover.ts',
        'src/hooks/ui/useClickOutside.ts',
        'src/hooks/ui/useAsyncRetryButton.ts',
      ],
      reportOnFailure: true,
      all: true,
      ...(enforceCoverageThresholds ? { thresholds: coverageThresholds } : {}),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: []
    }
  }
});
