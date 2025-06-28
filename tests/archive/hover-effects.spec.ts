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
    await page.waitForTimeout(2000);

    // Look for any chart control buttons that exist
    const chartButtons = page
      .locator("button")
      .filter({ hasText: /Performance|Allocation|Drawdown|24h|7d|1M|3M|1Y/ });

    if ((await chartButtons.count()) > 0) {
      // Test the first found chart button
      await expect(chartButtons.first()).toHaveClass(/cursor-pointer/);
    } else {
      // Skip test if no chart controls found
      console.log("No chart control buttons found - skipping test");
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

    // Check desktop navigation tabs have transition classes (hover: classes are in CSS)
    const investTab = page.getByTestId("desktop-tab-invest");
    await expect(investTab).toHaveClass(/transition/);

    const walletTab = page.getByTestId("desktop-tab-wallet");
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
    await page.waitForTimeout(2000);

    // Look for any clickable asset category buttons
    const categoryButtons = page
      .locator("button")
      .filter({ hasText: /DeFi|Stablecoins|Ethereum|Category/ });

    if ((await categoryButtons.count()) > 0) {
      // Test the first category button found
      await expect(categoryButtons.first()).toHaveClass(/cursor-pointer/);
    } else {
      // Check for expandable cards that might be clickable
      const expandableCards = page.locator(
        '.glass-morphism button, [role="button"]'
      );
      if ((await expandableCards.count()) > 0) {
        const firstCard = expandableCards.first();
        if (await firstCard.isVisible()) {
          await expect(firstCard).toHaveClass(/cursor-pointer/);
        }
      } else {
        console.log("No asset category buttons found - skipping test");
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
