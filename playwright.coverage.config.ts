import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable code coverage collection
        contextOptions: {
          // Enable coverage collection
          coverageOptions: {
            // Include source files
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            // Exclude test files and node_modules
            exclude: [
              'tests/**',
              'node_modules/**',
              '.next/**',
              'coverage/**'
            ]
          }
        }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});