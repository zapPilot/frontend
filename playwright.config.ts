import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /^[^/]+\.spec\.ts$/,
  /* Run tests in files in parallel - disabled for memory optimization */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Single worker for memory optimization - both CI and local */
  workers: 1,
  /* Use lightweight reporter for memory optimization */
  reporter: process.env['CI'] ? 'html' : 'list',
  /* Global timeout to prevent hanging tests */
  globalTimeout: 10 * 60 * 1000, // 10 minutes
  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds per test
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Memory optimization: disable trace collection unless needed */
    trace: 'off',
    /* Memory optimization: disable video recording unless needed */
    video: 'off',
    /* Memory optimization: disable screenshot on failure to save memory */
    screenshot: 'off',
    /* Reduce viewport size for memory efficiency */
    viewport: { width: 1024, height: 768 },
    /* Close browser contexts quickly */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for primary DeFi browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment for cross-browser validation when needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
  },
});
