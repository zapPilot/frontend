import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have all navigation tabs visible", async ({ page }) => {
    await expect(page.getByTestId("tab-wallet")).toBeVisible();
    await expect(page.getByTestId("tab-invest")).toBeVisible();
    await expect(page.getByTestId("tab-more")).toBeVisible();
  });

  test("should start with wallet tab active", async ({ page }) => {
    await expect(page.getByTestId("tab-wallet")).toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should navigate between tabs", async ({ page }) => {
    // Navigate to invest tab
    await page.getByTestId("tab-invest").click();
    await expect(page.getByTestId("tab-invest")).toHaveClass(
      /bg-gradient-to-r/
    );
    await expect(page.getByTestId("tab-wallet")).not.toHaveClass(
      /bg-gradient-to-r/
    );

    // Navigate to more tab
    await page.getByTestId("tab-more").click();
    await expect(page.getByTestId("tab-more")).toHaveClass(/bg-gradient-to-r/);
    await expect(page.getByTestId("tab-invest")).not.toHaveClass(
      /bg-gradient-to-r/
    );

    // Navigate back to wallet tab
    await page.getByTestId("tab-wallet").click();
    await expect(page.getByTestId("tab-wallet")).toHaveClass(
      /bg-gradient-to-r/
    );
    await expect(page.getByTestId("tab-more")).not.toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should display correct content for each tab", async ({ page }) => {
    // Wallet tab content
    await page.getByTestId("tab-wallet").click();
    await expect(page.locator("text=My Wallet")).toBeVisible();
    await expect(page.locator("text=DeFi Portfolio Overview")).toBeVisible();

    // Invest tab content
    await page.getByTestId("tab-invest").click();
    await expect(page.locator("text=Investment Opportunities")).toBeVisible();

    // More tab content
    await page.getByTestId("tab-more").click();
    await expect(page.locator("text=Settings & More")).toBeVisible();
  });

  test("should have proper tab styling", async ({ page }) => {
    // Check inactive tab styling
    await expect(page.getByTestId("tab-invest")).toHaveClass(/text-gray-400/);

    // Click to make active
    await page.getByTestId("tab-invest").click();

    // Check active tab styling
    await expect(page.getByTestId("tab-invest")).toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Tab icons should be visible
    const tabIcons = page.locator('[data-testid^="tab-"] svg');
    await expect(tabIcons).toHaveCount(3);

    // Tab labels might be hidden on very small screens depending on implementation
    const tabLabels = page.locator('[data-testid^="tab-"] span');
    if ((await tabLabels.count()) > 0) {
      await expect(tabLabels.first()).toBeVisible();
    }
  });

  test("should maintain state when switching tabs", async ({ page }) => {
    // Go to invest tab and interact with content
    await page.getByTestId("tab-invest").click();

    // Switch to another tab and back
    await page.getByTestId("tab-more").click();
    await page.getByTestId("tab-invest").click();

    // Content should still be there
    await expect(page.locator("text=Investment Opportunities")).toBeVisible();
  });

  test("should have proper keyboard navigation", async ({ page }) => {
    // Focus on first tab
    await page.getByTestId("tab-wallet").focus();

    // Tab navigation with keyboard
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("tab-invest")).toBeFocused();

    // Enter key should activate tab
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("tab-invest")).toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should have smooth transitions", async ({ page }) => {
    // Check for transition classes or styles
    const navigation = page.locator('[data-testid^="tab-"]').first();
    await expect(navigation).toHaveClass(/transition/);
  });
});
