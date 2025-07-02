import { defineConfig, devices } from '@playwright/test';

const config = {
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry' as const,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable code coverage collection
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
  },
  workers: process.env['CI'] ? 1 : undefined,
} as any;

if (!process.env['CI']) {
  delete config.workers;
}

export default defineConfig(config);