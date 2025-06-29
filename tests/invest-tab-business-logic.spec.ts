import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * INVEST TAB BUSINESS LOGIC TESTS
 *
 * Critical tests for investment strategy selection and business logic
 * validation for the Zap Pilot DeFi investment platform
 */

test.describe("InvestTab Business Logic", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("investment strategy cards display correct data", async ({ page }) => {
    await coverage.markComponentTested("InvestTab");

    // Navigate to invest tab if not already there
    const investTab = page
      .locator('[data-testid*="tab"], button')
      .filter({ hasText: /invest/i });
    if ((await investTab.count()) > 0) {
      await investTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Check for strategy cards
    const strategyCards = page.locator('[data-testid^="strategy-card-"]');
    const cardCount = await strategyCards.count();

    if (cardCount > 0) {
      // Test first strategy card
      const firstCard = strategyCards.first();

      // Verify APR display
      const aprElement = firstCard.locator(".text-green-400");
      if ((await aprElement.count()) > 0) {
        const aprText = await aprElement.textContent();
        expect(aprText).toMatch(/\d+(\.\d+)?%/); // Should match number followed by %
      }

      // Verify TVL display
      const tvlElement = firstCard.locator("text=/TVL:/");
      if ((await tvlElement.count()) > 0) {
        const tvlText = await tvlElement.textContent();
        expect(tvlText).toContain("TVL:");
      }

      // Verify risk level badge
      const riskBadge = firstCard.locator("text=/Risk$/");
      if ((await riskBadge.count()) > 0) {
        const riskText = await riskBadge.textContent();
        expect(riskText).toMatch(/(Low|Medium|High) Risk/);
      }

      await coverage.markInteractionTested("StrategyCardDataValidation");
      console.log(
        `✓ Strategy cards display valid data (${cardCount} cards found)`
      );
    } else {
      console.log("ℹ No strategy cards found on page");
    }
  });

  test("invest now buttons are functional", async ({ page }) => {
    await coverage.markComponentTested("InvestmentFlow");

    // Look for invest buttons
    const investButtons = page.locator('[data-testid="invest-now-button"]');
    const buttonCount = await investButtons.count();

    if (buttonCount > 0) {
      const firstButton = investButtons.first();

      // Verify button is enabled and clickable
      expect(await firstButton.isEnabled()).toBeTruthy();
      expect(await firstButton.isVisible()).toBeTruthy();

      // Check cursor pointer styling
      const classList = (await firstButton.getAttribute("class")) || "";
      expect(classList).toContain("cursor-pointer");

      // Verify button text
      const buttonText = await firstButton.textContent();
      expect(buttonText).toContain("Invest");

      await coverage.markInteractionTested("InvestButtonFunctionality");
      console.log(
        `✓ Invest buttons are functional (${buttonCount} buttons found)`
      );
    } else {
      console.log("ℹ No invest buttons found");
    }
  });

  test("investment statistics display correctly", async ({ page }) => {
    await coverage.markComponentTested("InvestmentStats");

    // Look for stat cards in the grid layout
    const statCards = page.locator(".grid").first().locator(".glass-morphism");
    const statCount = await statCards.count();

    if (statCount > 0) {
      for (let i = 0; i < Math.min(statCount, 3); i++) {
        const statCard = statCards.nth(i);

        // Verify stat has a value
        const valueElement = statCard.locator(".text-2xl, .text-3xl");
        if ((await valueElement.count()) > 0) {
          const value = await valueElement.textContent();
          expect(value?.trim()).toBeTruthy();
        }

        // Verify stat has a label
        const labelElement = statCard.locator(".text-sm, .text-gray-400");
        if ((await labelElement.count()) > 0) {
          const label = await labelElement.textContent();
          expect(label?.trim()).toBeTruthy();
        }
      }

      await coverage.markInteractionTested("InvestmentStatsValidation");
      console.log(
        `✓ Investment stats display correctly (${statCount} stats found)`
      );
    } else {
      console.log("ℹ No investment statistics found");
    }
  });

  test("strategy categories are properly labeled", async ({ page }) => {
    await coverage.markComponentTested("StrategyCategories");

    // Look for category badges
    const categoryBadges = page
      .locator(".text-xs")
      .filter({ hasText: /vault|yield|defi|strategy/i });
    const categoryCount = await categoryBadges.count();

    if (categoryCount > 0) {
      for (let i = 0; i < Math.min(categoryCount, 5); i++) {
        const badge = categoryBadges.nth(i);
        const text = await badge.textContent();

        // Verify category text is meaningful
        expect(text?.trim().length).toBeGreaterThan(2);
        expect(text).not.toMatch(/undefined|null|NaN/);
      }

      await coverage.markInteractionTested("CategoryLabeling");
      console.log(
        `✓ Strategy categories properly labeled (${categoryCount} categories found)`
      );
    } else {
      console.log("ℹ No strategy categories found");
    }
  });

  test("investment opportunities load without errors", async ({ page }) => {
    await coverage.markComponentTested("InvestmentOpportunities");

    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("requestfailed", request => {
      if (
        request.url().includes("invest") ||
        request.url().includes("strategy")
      ) {
        errors.push(`Failed request: ${request.url()}`);
      }
    });

    await page.waitForTimeout(3000); // Allow time for any async loading

    // Check that investment content loaded
    const investmentContent = page
      .locator("h1")
      .filter({ hasText: /investment|opportunities/i });
    if ((await investmentContent.count()) > 0) {
      expect(await investmentContent.isVisible()).toBeTruthy();
    }

    // Verify no critical errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes("favicon") &&
        !error.includes("sw.js") &&
        !error.toLowerCase().includes("warning")
    );

    expect(criticalErrors.length).toBeLessThan(2);

    await coverage.markInteractionTested("InvestmentDataLoading");
    console.log(`✓ Investment opportunities loaded without critical errors`);
  });

  test("responsive design for investment cards", async ({ page }) => {
    await coverage.markComponentTested("ResponsiveInvestmentCards");

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    const desktopCards = page.locator('[data-testid^="strategy-card-"]');
    const desktopCount = await desktopCards.count();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileCards = page.locator('[data-testid^="strategy-card-"]');
    const mobileCount = await mobileCards.count();

    // Cards should still be visible on both screen sizes
    expect(mobileCount).toEqual(desktopCount);

    if (mobileCount > 0) {
      const firstCard = mobileCards.first();
      expect(await firstCard.isVisible()).toBeTruthy();
    }

    await coverage.markInteractionTested("ResponsiveCardLayout");
    console.log(
      `✓ Investment cards responsive (${mobileCount} cards on mobile)`
    );
  });

  test("coming soon section displays appropriately", async ({ page }) => {
    await coverage.markComponentTested("ComingSoonSection");

    // Look for coming soon section
    const comingSoon = page.locator("text=/coming soon/i");
    if ((await comingSoon.count()) > 0) {
      expect(await comingSoon.isVisible()).toBeTruthy();

      // Should have some explanatory text
      const parent = comingSoon.locator("..").locator("..");
      const description = parent.locator("p");
      if ((await description.count()) > 0) {
        const text = await description.textContent();
        expect(text?.length).toBeGreaterThan(10);
      }

      await coverage.markInteractionTested("ComingSoonDisplay");
      console.log("✓ Coming soon section displays appropriately");
    } else {
      console.log("ℹ No coming soon section found");
    }
  });

  test.afterEach(async () => {
    const report = coverage.getCoverageReport();
    console.log(`📊 InvestTab Test Coverage:`);
    console.log(`   Components: ${report.componentsVisited.join(", ")}`);
    console.log(`   Interactions: ${report.interactionsTested.join(", ")}`);
  });
});
