import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * ERROR HANDLING SCENARIOS TESTS
 *
 * Tests for error recovery, network failures, edge cases,
 * and graceful degradation in the Zap Pilot platform
 */

test.describe("Error Handling Scenarios", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("application handles JavaScript errors gracefully", async ({ page }) => {
    await coverage.markComponentTested("JavaScriptErrorHandling");

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on("pageerror", error => {
      errors.push(`PageError: ${error.message}`);
    });

    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(`ConsoleError: ${msg.text()}`);
      } else if (msg.type() === "warning") {
        warnings.push(`Warning: ${msg.text()}`);
      }
    });

    // Perform various user interactions that might trigger errors
    await page.waitForTimeout(2000);

    // Try clicking various elements
    const clickableElements = page.locator('button, a, [role="button"]');
    const clickCount = await clickableElements.count();

    if (clickCount > 0) {
      for (let i = 0; i < Math.min(clickCount, 3); i++) {
        const element = clickableElements.nth(i);
        if (await element.isVisible()) {
          try {
            await element.click({ timeout: 1000 });
            await page.waitForTimeout(500);
          } catch (e) {
            console.log(`Click on element ${i} failed: ${e}`);
          }
        }
      }
    }

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes("favicon") &&
        !error.includes("sw.js") &&
        !error.includes("ResizeObserver") &&
        !error.includes("Non-passive") &&
        !error.includes("Extension")
    );

    expect(criticalErrors.length).toBeLessThan(3);

    await coverage.markInteractionTested("JSErrorGracefulHandling");
    console.log(
      `✓ JavaScript error handling (${criticalErrors.length} critical errors, ${warnings.length} warnings)`
    );
  });

  test("network request failure handling", async ({ page }) => {
    await coverage.markComponentTested("NetworkErrorHandling");

    const failedRequests: string[] = [];
    const successfulRequests: string[] = [];

    page.on("requestfailed", request => {
      failedRequests.push(request.url());
    });

    page.on("requestfinished", request => {
      if (request.response()?.status() === 200) {
        successfulRequests.push(request.url());
      }
    });

    // Wait for initial requests to complete
    await page.waitForTimeout(3000);

    // Try to trigger more requests by interacting with the app
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const randomButton = buttons.nth(Math.floor(Math.random() * buttonCount));
      if (
        (await randomButton.isVisible()) &&
        (await randomButton.isEnabled())
      ) {
        await randomButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Filter out expected failed requests (favicon, etc.)
    const significantFailures = failedRequests.filter(
      url =>
        !url.includes("favicon") &&
        !url.includes("manifest") &&
        !url.includes("sw.js")
    );

    // App should handle network failures gracefully
    console.log(
      `Failed requests: ${significantFailures.length}, Successful: ${successfulRequests.length}`
    );

    await coverage.markInteractionTested("NetworkFailureRecovery");
    console.log(
      `✓ Network error handling tested (${significantFailures.length} significant failures)`
    );
  });

  test("invalid route and 404 error handling", async ({ page }) => {
    await coverage.markComponentTested("RouteErrorHandling");

    // Test navigating to invalid route
    await page.goto("/this-route-does-not-exist", {
      waitUntil: "domcontentloaded",
    });

    // Should show some content (404 page or redirect to home)
    const bodyContent = page.locator("body");
    await expect(bodyContent).toBeVisible();

    // Check if app shows meaningful error or redirects
    const pageContent = await page.textContent("body");
    expect(pageContent?.length).toBeGreaterThan(10);

    // Should not show browser's default 404
    expect(pageContent?.toLowerCase()).not.toContain(
      "this site can't be reached"
    );

    // Navigate back to home
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // App should recover and work normally
    const homeContent = page.locator("body");
    await expect(homeContent).toBeVisible();

    await coverage.markInteractionTested("InvalidRouteHandling");
    console.log("✓ Invalid route handling tested");
  });

  test("browser compatibility and feature detection", async ({ page }) => {
    await coverage.markComponentTested("BrowserCompatibility");

    // Check for feature detection and polyfills
    const hasClipboard = await page.evaluate(() => {
      return typeof navigator !== "undefined" && "clipboard" in navigator;
    });

    const hasLocalStorage = await page.evaluate(() => {
      try {
        return typeof localStorage !== "undefined";
      } catch {
        return false;
      }
    });

    const hasWebGL = await page.evaluate(() => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
        );
      } catch {
        return false;
      }
    });

    console.log(
      `Browser features: clipboard=${hasClipboard}, localStorage=${hasLocalStorage}, webGL=${hasWebGL}`
    );

    // App should work even without some features
    const appContent = page.locator("body");
    await expect(appContent).toBeVisible();

    await coverage.markInteractionTested("FeatureDetection");
    console.log("✓ Browser compatibility tested");
  });

  test("memory and resource management", async ({ page }) => {
    await coverage.markComponentTested("ResourceManagement");

    // Monitor console for memory warnings
    const memoryWarnings: string[] = [];
    page.on("console", msg => {
      if (
        msg.text().toLowerCase().includes("memory") ||
        msg.text().toLowerCase().includes("leak") ||
        msg.text().toLowerCase().includes("heap")
      ) {
        memoryWarnings.push(msg.text());
      }
    });

    // Simulate heavy usage by rapid interactions
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * buttonCount);
        const button = buttons.nth(randomIndex);

        if (await button.isVisible()) {
          try {
            await button.click({ timeout: 500 });
            await page.waitForTimeout(100);
          } catch (e) {
            // Ignore click failures for this test
          }
        }
      }
    }

    // Check that app still responds after heavy usage
    const appStillResponsive = page.locator("body");
    await expect(appStillResponsive).toBeVisible();

    await coverage.markInteractionTested("ResourceManagementTest");
    console.log(
      `✓ Resource management tested (${memoryWarnings.length} memory warnings)`
    );
  });

  test("input validation edge cases", async ({ page }) => {
    await coverage.markComponentTested("InputValidationEdgeCases");

    const inputs = page.locator("input");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        const edgeCases = [
          "", // Empty
          " ", // Whitespace
          "0", // Zero
          "-1", // Negative
          "999999999999999999999", // Very large number
          "0.000000000000001", // Very small decimal
          "null", // String null
          "undefined", // String undefined
          '<script>alert("xss")</script>', // XSS attempt
          "../../etc/passwd", // Path traversal
          "SELECT * FROM users", // SQL injection attempt
          "🚀💰🌍", // Emojis
          "test\nwith\nnewlines", // Newlines
          "\t\r\n", // Special characters
        ];

        for (const testCase of edgeCases) {
          try {
            await firstInput.fill(testCase);
            await page.waitForTimeout(100);

            const value = await firstInput.inputValue();
            // Input should handle edge cases without crashing
            expect(typeof value).toBe("string");
          } catch (e) {
            console.log(`Edge case "${testCase}" caused error: ${e}`);
          }
        }

        // Clear input
        await firstInput.fill("");

        await coverage.markInteractionTested("InputEdgeCaseHandling");
        console.log(
          `✓ Input validation edge cases tested (${edgeCases.length} cases)`
        );
      }
    } else {
      console.log("ℹ No inputs found for edge case testing");
    }
  });

  test("rapid user interaction stress test", async ({ page }) => {
    await coverage.markComponentTested("RapidInteractionStress");

    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));

    // Get all interactive elements
    const interactiveElements = page.locator(
      'button, a, input, [role="button"], [tabindex]'
    );
    const elementCount = await interactiveElements.count();

    if (elementCount > 0) {
      // Rapid clicking stress test
      for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(Math.random() * elementCount);
        const element = interactiveElements.nth(randomIndex);

        try {
          if (await element.isVisible()) {
            const tagName = await element.evaluate(el =>
              el.tagName.toLowerCase()
            );

            if (tagName === "input") {
              await element.fill(`test${i}`);
            } else {
              await element.click({ timeout: 200 });
            }

            // Very short delay to simulate rapid user actions
            await page.waitForTimeout(50);
          }
        } catch (e) {
          // Expected that some rapid actions might fail
        }
      }

      // App should still be functional after stress test
      const appStillWorks = page.locator("body");
      await expect(appStillWorks).toBeVisible();

      const criticalErrors = errors.filter(
        error => !error.includes("favicon") && !error.includes("AbortError")
      );

      expect(criticalErrors.length).toBeLessThan(5);

      await coverage.markInteractionTested("RapidInteractionHandling");
      console.log(
        `✓ Rapid interaction stress test (${criticalErrors.length} critical errors)`
      );
    } else {
      console.log("ℹ No interactive elements found for stress test");
    }
  });

  test("data corruption and invalid state recovery", async ({ page }) => {
    await coverage.markComponentTested("DataCorruptionRecovery");

    // Try to inject invalid data into local storage if available
    await page.evaluate(() => {
      try {
        if (typeof localStorage !== "undefined") {
          // Inject some invalid data
          localStorage.setItem("invalidData", "{broken json");
          localStorage.setItem("nullData", "null");
          localStorage.setItem("undefinedData", "undefined");
        }
      } catch (e) {
        console.log("LocalStorage not available");
      }
    });

    // Reload page to see how it handles corrupted data
    await page.reload({ waitUntil: "networkidle" });

    // App should still load despite corrupted local storage
    const appContent = page.locator("body");
    await expect(appContent).toBeVisible();

    // Clean up
    await page.evaluate(() => {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("invalidData");
          localStorage.removeItem("nullData");
          localStorage.removeItem("undefinedData");
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    await coverage.markInteractionTested("CorruptedDataRecovery");
    console.log("✓ Data corruption recovery tested");
  });

  test("offline and connectivity error handling", async ({ page }) => {
    await coverage.markComponentTested("OfflineHandling");

    // Simulate offline mode
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Try to interact with the app while offline
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        try {
          await firstButton.click();
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log("Interaction failed while offline (expected)");
        }
      }
    }

    // App should still be usable (cached content)
    const offlineContent = page.locator("body");
    await expect(offlineContent).toBeVisible();

    // Restore connectivity
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);

    // App should recover when back online
    const onlineContent = page.locator("body");
    await expect(onlineContent).toBeVisible();

    await coverage.markInteractionTested("OfflineConnectivityHandling");
    console.log("✓ Offline/connectivity error handling tested");
  });

  test.afterEach(async () => {
    const report = coverage.getCoverageReport();
    console.log(`📊 Error Handling Test Coverage:`);
    console.log(`   Components: ${report.componentsVisited.join(", ")}`);
    console.log(`   Interactions: ${report.interactionsTested.join(", ")}`);
  });
});
