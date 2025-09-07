import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Resource controls: allow low-memory mode via environment variables
    // Use with: VITEST_SINGLE_THREAD=true VITEST_MAX_CONCURRENCY=1 npm run test:unit
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: process.env['VITEST_SINGLE_THREAD'] === 'true',
      },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{js,ts,tsx}', 'tests/integration/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['tests/e2e/**/*'],
    css: false,
    // Resource optimization settings (applied when using safe mode via CLI)
    testTimeout: 30000, // 30 second timeout to prevent hanging
    hookTimeout: 10000, // 10 second hook timeout
    // Better React 18+ support
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true',
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
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
      ],
      reportOnFailure: true,
      all: true
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
