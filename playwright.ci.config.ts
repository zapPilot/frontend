import { defineConfig, devices } from '@playwright/test';

/**
 * CI-friendly Playwright configuration
 * This config is optimized for GitHub Actions and automated environments
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: '**/archive/**',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : 4,
  /* Timeout for each test */
  timeout: 60 * 1000, // 60 seconds
  /* Global timeout for the entire test run */
  globalTimeout: 15 * 60 * 1000, // 15 minutes
  
  /* Reporter to use - avoid HTML reporter in CI to prevent hanging */
  reporter: process.env['CI'] 
    ? [
        ['github'],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }]
      ]
    : [
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }]
      ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Screenshots only on failure */
    screenshot: 'only-on-failure',
    /* Videos only on failure */
    video: 'retain-on-failure',
    /* Action timeout */
    actionTimeout: 15000,
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disable other browsers in CI for speed
    ...(process.env['CI'] ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000, // 2 minutes to start
    /* Don't wait for console.log in CI */
    stdout: process.env['CI'] ? 'pipe' : 'inherit',
    stderr: process.env['CI'] ? 'pipe' : 'inherit',
  },
});