import { test, expect } from "@playwright/test";

test.describe("Basic Hover Effects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1200, height: 800 });
    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test("should have cursor pointer on GradientButton components", async ({
    page,
  }) => {
    // Look for any button with gradient classes (our GradientButton component)
    const gradientButtons = page
      .locator("button")
      .filter({ hasText: /ZapIn|ZapOut|Optimize/ });

    if ((await gradientButtons.count()) > 0) {
      // Test that gradient buttons have cursor pointer
      await expect(gradientButtons.first()).toHaveClass(/cursor-pointer/);
    } else {
      console.log("No gradient buttons found - test skipped");
    }
  });

  test("should have basic transitions on interactive elements", async ({
    page,
  }) => {
    // Look for any button elements
    const buttons = page.locator("button").first();

    if (await buttons.isVisible()) {
      // Check that buttons have some form of transition
      const classList = (await buttons.getAttribute("class")) || "";
      const hasTransition = /transition|duration/.test(classList);

      expect(hasTransition).toBeTruthy();
    } else {
      console.log("No buttons found - test skipped");
    }
  });

  test("should load the page successfully", async ({ page }) => {
    // Just verify the page loads and has some content
    await expect(page.locator("body")).toBeVisible();

    // Look for any heading to confirm content is loaded
    const headings = page.locator("h1, h2, h3");
    if ((await headings.count()) > 0) {
      await expect(headings.first()).toBeVisible();
    }
  });
});
