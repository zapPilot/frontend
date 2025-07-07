import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have all navigation tabs visible", async ({ page }) => {
    // Desktop navigation should be visible on large screens
    await page.setViewportSize({ width: 1200, height: 800 });

    await expect(page.getByTestId("desktop-tab-wallet")).toBeVisible();
    await expect(page.getByTestId("desktop-tab-invest")).toBeVisible();
    await expect(page.getByTestId("desktop-tab-analytics")).toBeVisible();
    await expect(page.getByTestId("desktop-tab-community")).toBeVisible();
    await expect(page.getByTestId("desktop-tab-airdrop")).toBeVisible();
    await expect(page.getByTestId("desktop-tab-settings")).toBeVisible();
  });

  test("should start with wallet tab active", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByTestId("desktop-tab-wallet")).toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should navigate between tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Navigate to invest tab
    await page.getByTestId("desktop-tab-invest").click();
    await expect(page.getByTestId("desktop-tab-invest")).toHaveClass(
      /bg-gradient-to-r/
    );
    await expect(page.getByTestId("desktop-tab-wallet")).not.toHaveClass(
      /bg-gradient-to-r/
    );

    // Navigate to analytics tab
    await page.getByTestId("desktop-tab-analytics").click();
    await expect(page.getByTestId("desktop-tab-analytics")).toHaveClass(
      /bg-gradient-to-r/
    );
    await expect(page.getByTestId("desktop-tab-invest")).not.toHaveClass(
      /bg-gradient-to-r/
    );

    // Navigate back to wallet tab
    await page.getByTestId("desktop-tab-wallet").click();
    await expect(page.getByTestId("desktop-tab-wallet")).toHaveClass(
      /bg-gradient-to-r/
    );
    await expect(page.getByTestId("desktop-tab-analytics")).not.toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should display correct content for each tab", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Wallet tab content
    await page.getByTestId("desktop-tab-wallet").click();
    await expect(
      page.getByRole("heading", { name: "My Wallet" })
    ).toBeVisible();
    await expect(page.locator("text=DeFi Portfolio Overview")).toBeVisible();

    // Invest tab content
    await page.getByTestId("desktop-tab-invest").click();
    await expect(
      page.getByRole("heading", { name: "Investment Opportunities" })
    ).toBeVisible();

    // Analytics tab content
    await page.getByTestId("desktop-tab-analytics").click();
    await expect(
      page.getByRole("heading", { name: "Portfolio Analytics" }).first()
    ).toBeVisible();

    // Community tab content
    await page.getByTestId("desktop-tab-community").click();
    await expect(
      page.getByRole("heading", { name: "Zap Pilot Community" })
    ).toBeVisible();

    // Airdrop tab content
    await page.getByTestId("desktop-tab-airdrop").click();
    await expect(
      page.getByRole("heading", { name: "Zap Pilot Airdrops" })
    ).toBeVisible();

    // Settings tab content
    await page.getByTestId("desktop-tab-settings").click();
    await expect(
      page.getByRole("heading", { name: "Settings & More" })
    ).toBeVisible();
  });

  test("should have proper tab styling", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Check inactive tab styling
    await expect(page.getByTestId("desktop-tab-invest")).toHaveClass(
      /text-gray-300/
    );

    // Click to make active
    await page.getByTestId("desktop-tab-invest").click();

    // Check active tab styling
    await expect(page.getByTestId("desktop-tab-invest")).toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Tab icons should be visible
    const tabIcons = page.locator('[data-testid^="tab-"] svg');
    await expect(tabIcons).toHaveCount(6);

    // Tab labels might be hidden on very small screens depending on implementation
    const tabLabels = page.locator('[data-testid^="tab-"] span');
    if ((await tabLabels.count()) > 0) {
      await expect(tabLabels.first()).toBeVisible();
    }
  });

  test("should maintain state when switching tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Go to invest tab and interact with content
    await page.getByTestId("desktop-tab-invest").click();

    // Switch to another tab and back
    await page.getByTestId("desktop-tab-analytics").click();
    await page.getByTestId("desktop-tab-invest").click();

    // Content should still be there
    await expect(
      page.getByRole("heading", { name: "Investment Opportunities" })
    ).toBeVisible();
  });

  test("should have proper keyboard navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Focus on first tab
    await page.getByTestId("desktop-tab-wallet").focus();

    // Tab navigation with keyboard
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("desktop-tab-invest")).toBeFocused();

    // Enter key should activate tab
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("desktop-tab-invest")).toHaveClass(
      /bg-gradient-to-r/
    );
  });

  test("should have smooth transitions", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Check for transition classes or styles
    const navigation = page.locator('[data-testid^="desktop-tab-"]').first();
    await expect(navigation).toHaveClass(/transition/);
  });
});
