import { execFileSync } from "node:child_process";

import { defineConfig, devices } from "@playwright/test";

/**
 * Check whether a TCP port is already listening on 127.0.0.1.
 * Uses execFileSync (no shell) to avoid command-injection risks.
 */
function isPortListening(port: number): boolean {
  try {
    execFileSync(
      "node",
      [
        "-e",
        `const s=require("net").createConnection(${port},"127.0.0.1");` +
          `s.on("connect",()=>{s.destroy();process.exit(0)});` +
          `s.on("error",()=>process.exit(1))`,
      ],
      { timeout: 2000, stdio: "ignore" },
    );
    return true;
  } catch {
    return false;
  }
}

const DEV_PORT = 3000;
const FALLBACK_PORT = Number(process.env["PLAYWRIGHT_PORT"] ?? "3099");
const isCI = !!process.env["CI"];
const devServerRunning = !isCI && isPortListening(DEV_PORT);

const activePort = devServerRunning ? DEV_PORT : FALLBACK_PORT;
const PLAYWRIGHT_BASE_URL =
  process.env["PLAYWRIGHT_BASE_URL"] ??
  `http://127.0.0.1:${activePort}`;

if (devServerRunning) {
  console.log(`♻️  Reusing existing dev server on port ${DEV_PORT}`);
} else {
  console.log(`🚀 Starting fresh dev server on port ${FALLBACK_PORT}`);
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: /\.spec\.ts$/,
  /* Run tests in files in parallel - disabled for memory optimization */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env["CI"],
  /* Retry on CI only */
  retries: process.env["CI"] ? 2 : 0,
  /* Single worker for memory optimization - both CI and local */
  workers: 1,
  /* Use lightweight reporter for memory optimization */
  reporter: process.env["CI"] ? "html" : "list",
  /* Global timeout to prevent hanging tests */
  globalTimeout: 10 * 60 * 1000, // 10 minutes
  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds per test
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: PLAYWRIGHT_BASE_URL,

    /* Memory optimization: disable trace collection unless needed */
    trace: "off",
    /* Memory optimization: disable video recording unless needed */
    video: "off",
    /* Memory optimization: disable screenshot on failure to save memory */
    screenshot: "off",
    /* Reduce viewport size for memory efficiency */
    viewport: { width: 1024, height: 768 },
    /* Close browser contexts quickly */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for primary DeFi browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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

  /* Run your local dev server before starting the tests.
   * When a dev server is already running on port 3000 (local dev), we skip
   * starting a new one to avoid .next/dev/lock conflicts. On CI, we always
   * start a fresh server on the fallback port. */
  ...(devServerRunning
    ? {}
    : {
        webServer: {
          command: `npm run dev -- --hostname 127.0.0.1 --port ${FALLBACK_PORT}`,
          url: PLAYWRIGHT_BASE_URL,
          reuseExistingServer: false,
        },
      }),
});
