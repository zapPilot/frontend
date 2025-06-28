import { test, expect } from "@playwright/test";
import { TestUtils, VIEWPORTS } from "./test-utils";

test.describe("Hover Effects and Cursor Pointer", () => {
  test.beforeEach(async ({ page }) => {
    const testUtils = new TestUtils(page);
    await testUtils.setupTest(undefined, VIEWPORTS.DESKTOP);
  });

  test("should have cursor pointer on wallet action buttons", async ({
    page,
  }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToTab("wallet");

    // Check ZapIn, ZapOut, and Optimize buttons have cursor pointer
    const zapInButton = page.locator('button:has-text("ZapIn")');
    const zapOutButton = page.locator('button:has-text("ZapOut")');
    const optimizeButton = page.locator('button:has-text("Optimize")');

    await expect(zapInButton).toHaveClass(/cursor-pointer/);
    await expect(zapOutButton).toHaveClass(/cursor-pointer/);
    await expect(optimizeButton).toHaveClass(/cursor-pointer/);
  });

  test("should have cursor pointer on invest buttons", async ({ page }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToTab("invest");

    // Wait for investment opportunities to load
    await expect(
      page.getByRole("heading", { name: "Investment Opportunities" })
    ).toBeVisible();

    // Check Invest Now buttons have cursor pointer
    const investButtons = page.locator('button:has-text("Invest Now")');
    if ((await investButtons.count()) > 0) {
      await expect(investButtons.first()).toHaveClass(/cursor-pointer/);
    }
  });

  test("should have cursor pointer on swap page elements", async ({ page }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToInvestAndSelectStrategy();

    // Check token selector button has cursor pointer
    await expect(page.getByTestId("token-selector-button")).toHaveClass(
      /cursor-pointer/
    );

    // Check amount buttons have cursor pointer
    await expect(page.getByTestId("amount-25%-button")).toHaveClass(
      /cursor-pointer/
    );
    await expect(page.getByTestId("amount-50%-button")).toHaveClass(
      /cursor-pointer/
    );
    await expect(page.getByTestId("amount-75%-button")).toHaveClass(
      /cursor-pointer/
    );
    await expect(page.getByTestId("amount-max-button")).toHaveClass(
      /cursor-pointer/
    );

    // Check tab navigation has cursor pointer
    await expect(page.getByTestId("tab-swap")).toHaveClass(/cursor-pointer/);
    await expect(page.getByTestId("tab-allocation")).toHaveClass(
      /cursor-pointer/
    );
    await expect(page.getByTestId("tab-performance")).toHaveClass(
      /cursor-pointer/
    );
    await expect(page.getByTestId("tab-details")).toHaveClass(/cursor-pointer/);
  });

  test("should have cursor pointer on portfolio chart controls", async ({
    page,
  }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToTab("analytics");

    // Wait for analytics page to load
    await page.waitForTimeout(1000);

    // Check chart type selectors have cursor pointer
    const chartTypeButtons = page.locator(
      'button:has-text("Performance"), button:has-text("Allocation"), button:has-text("Drawdown")'
    );
    if ((await chartTypeButtons.count()) > 0) {
      for (let i = 0; i < (await chartTypeButtons.count()); i++) {
        await expect(chartTypeButtons.nth(i)).toHaveClass(/cursor-pointer/);
      }
    }

    // Check period selectors have cursor pointer
    const periodButtons = page.locator(
      'button:has-text("24h"), button:has-text("7d"), button:has-text("1M"), button:has-text("3M"), button:has-text("1Y")'
    );
    if ((await periodButtons.count()) > 0) {
      for (let i = 0; i < (await periodButtons.count()); i++) {
        await expect(periodButtons.nth(i)).toHaveClass(/cursor-pointer/);
      }
    }
  });

  test("should have hover effects on interactive elements", async ({
    page,
  }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToInvestAndSelectStrategy();

    // Check amount buttons have hover effects (transition classes)
    const amountButton = page.getByTestId("amount-25%-button");
    await expect(amountButton).toHaveClass(/transition/);
    await expect(amountButton).toHaveClass(/duration/);

    // Check token selector has hover effects
    const tokenSelector = page.getByTestId("token-selector-button");
    await expect(tokenSelector).toHaveClass(/transition/);
  });

  test("should have proper navigation hover states", async ({ page }) => {
    const testUtils = new TestUtils(page);
    await testUtils.setupTest(undefined, VIEWPORTS.DESKTOP);

    // Check desktop navigation tabs have hover classes
    const investTab = page.getByTestId("desktop-tab-invest");
    await expect(investTab).toHaveClass(/hover:/);
    await expect(investTab).toHaveClass(/transition/);

    const walletTab = page.getByTestId("desktop-tab-wallet");
    await expect(walletTab).toHaveClass(/hover:/);
    await expect(walletTab).toHaveClass(/transition/);
  });

  test("should verify token selector modal buttons have cursor pointer", async ({
    page,
  }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToInvestAndSelectStrategy();

    // Open token selector modal
    await page.getByTestId("token-selector-button").click();
    await expect(page.getByTestId("token-selector-modal")).toBeVisible();

    // Check token option buttons have cursor pointer
    const tokenOptions = page.locator('[data-testid^="token-option-"]');
    if ((await tokenOptions.count()) > 0) {
      await expect(tokenOptions.first()).toHaveClass(/cursor-pointer/);
    }

    // Close modal
    await page.keyboard.press("Escape");
  });

  test("should have cursor pointer on asset category buttons", async ({
    page,
  }) => {
    const testUtils = new TestUtils(page);
    await testUtils.navigateToTab("wallet");

    // Wait for portfolio data to load
    await page.waitForTimeout(1000);

    // Check asset category expansion buttons
    const categoryButtons = page
      .locator('[data-testid^="category-"], .glass-morphism')
      .filter({ hasText: /DeFi|Stablecoins|Ethereum/ });
    if ((await categoryButtons.count()) > 0) {
      const firstCategory = categoryButtons.first();

      // Check if it's a button element or has click functionality
      const isButton = await firstCategory.evaluate(
        el => el.tagName === "BUTTON" || el.getAttribute("role") === "button"
      );
      if (isButton) {
        await expect(firstCategory).toHaveClass(/cursor-pointer/);
      }
    }
  });

  test("should maintain hover effects on mobile", async ({ page }) => {
    const testUtils = new TestUtils(page);
    await testUtils.setupTest(undefined, VIEWPORTS.MOBILE);

    // Navigate to invest tab using mobile navigation
    await testUtils.navigateToTab("invest");

    // Check mobile navigation tabs
    const mobileInvestTab = page.getByTestId("tab-invest");
    await expect(mobileInvestTab).toHaveClass(/transition/);

    // Check that cursor pointer is still present
    const investButtons = page.locator('button:has-text("Invest Now")');
    if ((await investButtons.count()) > 0) {
      await expect(investButtons.first()).toHaveClass(/cursor-pointer/);
    }
  });
});
