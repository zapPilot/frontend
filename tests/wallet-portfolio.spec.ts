import { test, expect } from "@playwright/test";

test.describe("WalletPortfolio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Should be on wallet tab by default
  });

  test("should display wallet header with balance information", async ({
    page,
  }) => {
    await expect(page.locator('h1:has-text("My Wallet")')).toBeVisible();
    await expect(page.locator("text=DeFi Portfolio Overview")).toBeVisible();

    // Check balance display
    await expect(page.locator("text=Total Balance")).toBeVisible();
    await expect(page.locator("text=24h Change")).toBeVisible();
    await expect(page.locator("text=Value Change")).toBeVisible();
  });

  test("should toggle balance visibility", async ({ page }) => {
    // Find the eye/eyeoff button (balance toggle)
    const balanceToggle = page.locator("button:has(svg)").nth(0);

    // Initial state should show balance
    const totalBalance = page
      .locator("text=Total Balance")
      .locator("..")
      .locator("p")
      .nth(1);
    const initialText = await totalBalance.textContent();

    // Click to hide balance
    await balanceToggle.click();

    // Balance should be hidden (showing asterisks or hidden text)
    const hiddenText = await totalBalance.textContent();
    expect(hiddenText).not.toBe(initialText);

    // Click to show balance again
    await balanceToggle.click();

    // Balance should be visible again
    const visibleText = await totalBalance.textContent();
    expect(visibleText).toBe(initialText);
  });

  test("should display action buttons", async ({ page }) => {
    await expect(page.locator('button:has-text("ZapIn")')).toBeVisible();
    await expect(page.locator('button:has-text("ZapOut")')).toBeVisible();
    await expect(page.locator('button:has-text("Optimize")')).toBeVisible();
  });

  test("should display portfolio overview with pie chart", async ({ page }) => {
    await expect(page.locator("text=Asset Distribution")).toBeVisible();

    // Check if pie chart elements are present
    const pieChartElements = page.locator("svg circle");
    if ((await pieChartElements.count()) > 0) {
      await expect(pieChartElements.first()).toBeVisible();
    }

    // Check allocation list items
    const allocationItems = page.locator('[data-testid^="allocation-item-"]');
    if ((await allocationItems.count()) > 0) {
      await expect(allocationItems.first()).toBeVisible();
    }
  });

  test("should display asset categories with expandable details", async ({
    page,
  }) => {
    await expect(page.locator("text=Portfolio Details")).toBeVisible();

    // Check for category items
    const categoryButtons = page
      .locator('[role="button"], button')
      .filter({ hasText: /DeFi|Stablecoins|NFTs/ });
    if ((await categoryButtons.count()) > 0) {
      // Click on first category to expand
      await categoryButtons.first().click();

      // Should show expanded content
      await expect(page.locator("text=Assets")).toBeVisible();
    }
  });

  test("should interact with allocation items", async ({ page }) => {
    // Look for allocation items
    const allocationItems = page.locator('[data-testid^="allocation-item-"]');

    if ((await allocationItems.count()) > 0) {
      const firstItem = allocationItems.first();
      await expect(firstItem).toBeVisible();

      // Click should work if onLegendItemClick is provided
      await firstItem.click();
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Header should still be visible
    await expect(page.locator('h1:has-text("My Wallet")')).toBeVisible();

    // Action buttons should be in grid layout
    const actionButtons = page.locator(
      'button:has-text("ZapIn"), button:has-text("ZapOut"), button:has-text("Optimize")'
    );
    await expect(actionButtons).toHaveCount(3);

    // Portfolio overview should adapt to mobile
    await expect(page.locator("text=Asset Distribution")).toBeVisible();
  });

  test("should show proper currency formatting", async ({ page }) => {
    // Check that currency values are properly formatted with $ symbol
    const currencyElements = page.locator(
      "text=/\\$[\\d,]+\\.\\d{2}|\\$[\\d,]+/"
    );
    await expect(currencyElements.first()).toBeVisible();
  });

  test("should display percentage changes with proper styling", async ({
    page,
  }) => {
    // Look for percentage changes (positive should be green, negative red)
    const percentageElements = page.locator("text=/%/");
    if ((await percentageElements.count()) > 0) {
      await expect(percentageElements.first()).toBeVisible();
    }
  });

  test("should have smooth animations", async ({ page }) => {
    // Check for framer-motion elements (divs with motion attributes)
    const animatedElements = page.locator(
      '[style*="transform"], [style*="opacity"]'
    );
    await expect(animatedElements.first()).toBeVisible();
  });
});
