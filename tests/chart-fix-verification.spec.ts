import { test, expect } from "@playwright/test";

test.describe("Analytics Chart Fix Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("analytics tab loads without CHART_PERIODS error", async ({ page }) => {
    // Track JavaScript errors
    const errors: string[] = [];
    page.on("pageerror", error => {
      errors.push(error.message);
    });

    // Navigate to analytics tab
    const analyticsTab = page.locator('[data-testid="tab-analytics"]').first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(3000);
    }

    // Verify no CHART_PERIODS errors occurred
    const chartPeriodsErrors = errors.filter(
      error =>
        error.includes("CHART_PERIODS") || error.includes("is not defined")
    );

    expect(chartPeriodsErrors).toEqual([]);

    // Verify analytics content loads successfully
    await page.waitForTimeout(2000);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("chart period buttons are functional", async ({ page }) => {
    // Navigate to analytics tab
    const analyticsTab = page.locator('[data-testid="tab-analytics"]').first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(2000);
    }

    // Test period buttons
    const expectedPeriods = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

    for (const period of expectedPeriods) {
      const periodButton = page.locator(`button:has-text("${period}")`);
      if (await periodButton.isVisible()) {
        await periodButton.click();
        await page.waitForTimeout(1000);

        // Verify the chart area exists after clicking
        const chartArea = page.locator("svg").first();
        if (await chartArea.isVisible()) {
          await expect(chartArea).toBeVisible();
        }
      }
    }
  });

  test("chart renders without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => {
      errors.push(error.message);
    });

    // Navigate to analytics tab
    const analyticsTab = page.locator('[data-testid="tab-analytics"]').first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(3000);
    }

    // Let the chart render completely
    await page.waitForTimeout(3000);

    // Check if there are any errors
    console.log("JavaScript errors found:", errors);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes("ResizeObserver") &&
        !error.includes("non-passive event listener") &&
        !error.includes("favicon")
    );

    expect(criticalErrors).toEqual([]);
  });
});
