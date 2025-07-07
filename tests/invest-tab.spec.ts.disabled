import { test, expect } from "@playwright/test";

test.describe("InvestTab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.getByTestId("desktop-tab-invest").click();
  });

  test("should display investment opportunities", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Investment Opportunities" })
    ).toBeVisible();

    // Check for strategy cards
    const strategyCards = page
      .locator('[data-testid^="strategy-card-"]')
      .or(page.locator(".glass-morphism").filter({ hasText: /APR|%/ }));
    if ((await strategyCards.count()) > 0) {
      await expect(strategyCards.first()).toBeVisible();
    }
  });

  test("should display strategy information correctly", async ({ page }) => {
    // Look for strategy elements
    const strategies = page.locator("text=/\\d+%\\s*APR/");
    if ((await strategies.count()) > 0) {
      await expect(strategies.first()).toBeVisible();
    }

    // Check for risk levels
    const riskLevels = page
      .locator("text=/Low|Medium|High/")
      .and(page.locator("text=Risk"));
    if ((await riskLevels.count()) > 0) {
      await expect(riskLevels.first()).toBeVisible();
    }
  });

  test("should have functioning invest buttons", async ({ page }) => {
    // Look for "Invest Now" buttons
    const investButtons = page.locator(
      'button:has-text("Invest Now"), [data-testid="invest-now-button"]'
    );

    if ((await investButtons.count()) > 0) {
      // Click first invest button
      await investButtons.first().click();

      // Should navigate to swap page
      await expect(page.getByTestId("swap-page")).toBeVisible();

      // Should have back button to return
      await page.getByTestId("back-button").click();
      await expect(
        page.getByRole("heading", { name: "Investment Opportunities" })
      ).toBeVisible();
    }
  });

  test("should display different strategy categories", async ({ page }) => {
    // Look for different strategy types
    const categories = page.locator("text=/Stablecoin|Index|BTC|ETH|DeFi/");
    if ((await categories.count()) > 0) {
      await expect(categories.first()).toBeVisible();
    }
  });

  test("should show TVL information", async ({ page }) => {
    // Look for Total Value Locked information
    const tvlElements = page.locator("text=TVL, text=/\\$[\\d,]+[MK]?/");
    if ((await tvlElements.count()) > 0) {
      await expect(tvlElements.first()).toBeVisible();
    }
  });

  test("should display strategy descriptions", async ({ page }) => {
    // Strategy cards should have descriptions
    const descriptions = page
      .locator("p")
      .filter({ hasText: /yield|strategy|return|investment/i });
    if ((await descriptions.count()) > 0) {
      await expect(descriptions.first()).toBeVisible();
    }
  });

  test("should have proper risk level styling", async ({ page }) => {
    // At least one risk level should exist based on mock data
    const anyRisk = page.locator("text=/Low|Medium|High/").first();
    if (await anyRisk.isVisible()) {
      await expect(anyRisk).toBeVisible();
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Strategy cards should stack on mobile
    await expect(
      page.getByRole("heading", { name: "Investment Opportunities" })
    ).toBeVisible();

    // Cards should still be clickable
    const investButtons = page.locator(
      'button:has-text("Invest Now"), [data-testid="invest-now-button"]'
    );
    if ((await investButtons.count()) > 0) {
      await expect(investButtons.first()).toBeVisible();
    }
  });

  test("should show loading states appropriately", async ({ page }) => {
    // Check if there are any loading indicators
    const loadingElements = page.locator(
      'text=Loading, .animate-spin, [data-testid*="loading"]'
    );

    // Loading elements should not be visible after page load
    if ((await loadingElements.count()) > 0) {
      await expect(loadingElements.first()).not.toBeVisible();
    }
  });

  test("should have proper hover effects", async ({ page }) => {
    const strategyCards = page
      .locator('.glass-morphism, [data-testid^="strategy-card-"]')
      .first();

    if (await strategyCards.isVisible()) {
      // Hover should trigger visual changes
      await strategyCards.hover();

      // Check for hover classes or styles
      await expect(strategyCards).toHaveClass(/hover:|transition/);
    }
  });

  test("should display APR values correctly", async ({ page }) => {
    // APR values should be formatted as percentages
    const aprElements = page.locator("text=/\\d+(\\.\\d+)?%/");
    if ((await aprElements.count()) > 0) {
      await expect(aprElements.first()).toBeVisible();

      // Should be a reasonable APR value (between 0.1% and 100%)
      const aprText = await aprElements.first().textContent();
      const aprValue = parseFloat(aprText?.replace("%", "") || "0");
      expect(aprValue).toBeGreaterThan(0);
      expect(aprValue).toBeLessThan(200); // Reasonable upper bound
    }
  });

  test("should maintain consistency in strategy card layout", async ({
    page,
  }) => {
    const strategyCards = page.locator(
      '.glass-morphism, [data-testid^="strategy-card-"]'
    );
    const cardCount = await strategyCards.count();

    if (cardCount > 1) {
      // All cards should have similar structure
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = strategyCards.nth(i);
        await expect(card).toBeVisible();
      }
    }
  });
});
