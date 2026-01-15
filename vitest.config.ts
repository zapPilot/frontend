import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Resource controls: single worker to prevent memory exhaustion
    // Uses fork pool for better cleanup and isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
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
      thresholds: {
        global: {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        // Per-file thresholds for critical paths
        'src/components/wallet/portfolio/modals/ConnectWalletModal.tsx': {
          branches: 80,
        },
        'src/adapters/walletPortfolioDataAdapter.ts': {
          branches: 80,
        },
      },
    }
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
