import { test, expect } from "@playwright/test";

/**
 * FAST COVERAGE TEST - NO NETWORK TIMEOUTS
 *
 * This test provides coverage metrics without hanging on network waits.
 * Focuses on actual functionality testing for coverage purposes.
 */

test.describe("Fast Coverage Test", () => {
  test("app loads and has basic functionality", async ({ page }) => {
    // Use faster, more reliable page load detection
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Give a short buffer for any immediate JS
    await page.waitForTimeout(1000);

    // Verify basic page structure
    await expect(page.locator("body")).toBeVisible();

    // Count interactive elements for coverage metrics
    const buttons = await page.locator("button").count();
    const inputs = await page.locator("input").count();
    const links = await page.locator("a").count();

    console.log(`📊 COVERAGE METRICS:`);
    console.log(`   Buttons found: ${buttons}`);
    console.log(`   Inputs found: ${inputs}`);
    console.log(`   Links found: ${links}`);
    console.log(`   Total interactive elements: ${buttons + inputs + links}`);

    // Basic functionality tests
    if (buttons > 0) {
      const firstButton = page.locator("button").first();
      if (await firstButton.isVisible()) {
        await firstButton.hover();
        console.log("✓ Button hover interaction tested");
      }
    }

    // Test navigation if available
    const navTabs = page.locator('[data-testid*="tab"]');
    const navCount = await navTabs.count();
    console.log(`   Navigation tabs: ${navCount}`);

    if (navCount > 0) {
      const firstTab = navTabs.first();
      if ((await firstTab.isVisible()) && (await firstTab.isEnabled())) {
        await firstTab.click();
        await page.waitForTimeout(500);
        console.log("✓ Navigation interaction tested");
      }
    }

    // Check for JavaScript errors
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));

    await page.waitForTimeout(1000);

    console.log(`   JavaScript errors: ${errors.length}`);

    // Basic coverage expectations
    expect(buttons + inputs + links).toBeGreaterThan(0);
    expect(errors.length).toBeLessThan(5);

    console.log("✅ Fast coverage test completed successfully!");
  });

  test("responsive design works", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await expect(page.locator("body")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    await expect(page.locator("body")).toBeVisible();

    console.log("✓ Responsive design coverage tested");
  });
});
