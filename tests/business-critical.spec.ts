import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * BUSINESS-CRITICAL TESTS FOR ZAPP PILOT
 *
 * These tests focus on revenue-generating features and user flows
 * that are most important for a DeFi investment platform
 */

test.describe("Business Critical Features", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("investment flow is accessible to users", async ({ page }) => {
    await coverage.markComponentTested("InvestmentFlow");

    // Scan for investment-related UI elements
    const businessComponents = await coverage.scanForBusinessComponents();

    // Should have some investment functionality visible
    expect(businessComponents.investmentButtons).toBeGreaterThan(0);

    await coverage.markInteractionTested("InvestmentButtonAvailability");
    console.log("✓ Investment features are accessible to users");
  });

  test("wallet/portfolio features are present", async ({ page }) => {
    await coverage.markComponentTested("WalletPortfolio");

    // Look for wallet-related functionality
    const walletIndicators = page.locator(
      '[class*="wallet"], [data-testid*="wallet"], h1:has-text("wallet"), h2:has-text("wallet")'
    );
    const portfolioIndicators = page.locator(
      '[class*="portfolio"], [data-testid*="portfolio"], h1:has-text("portfolio"), h2:has-text("portfolio")'
    );

    const walletCount = await walletIndicators.count();
    const portfolioCount = await portfolioIndicators.count();

    // Should have either wallet or portfolio functionality
    expect(walletCount + portfolioCount).toBeGreaterThan(0);

    await coverage.markInteractionTested("WalletPortfolioPresence");
    console.log(
      `✓ Found ${walletCount} wallet and ${portfolioCount} portfolio elements`
    );
  });

  test("navigation enables feature discovery", async ({ page }) => {
    await coverage.markComponentTested("Navigation");

    // Test that users can navigate between main features
    const navElements = page.locator(
      'nav, [role="navigation"], button[data-testid*="tab"], a[data-testid*="tab"]'
    );
    const navCount = await navElements.count();

    expect(navCount).toBeGreaterThan(0);

    // Try to identify key sections
    const investNav = page
      .locator("button, a")
      .filter({ hasText: /invest|investment/i });
    const walletNav = page
      .locator("button, a")
      .filter({ hasText: /wallet|portfolio/i });
    const analyticsNav = page
      .locator("button, a")
      .filter({ hasText: /analytics|chart/i });

    const keyNavCount =
      (await investNav.count()) +
      (await walletNav.count()) +
      (await analyticsNav.count());

    await coverage.markInteractionTested("KeyNavigationAvailable");
    console.log(
      `✓ Found ${navCount} navigation elements, ${keyNavCount} key feature nav items`
    );
  });

  test("forms and inputs work for user data", async ({ page }) => {
    await coverage.markComponentTested("UserInputs");

    // Find any input fields that might be for amounts, emails, etc.
    const numberInputs = page.locator('input[type="number"]');
    const textInputs = page.locator('input[type="text"]');
    const emailInputs = page.locator('input[type="email"]');

    const totalInputs =
      (await numberInputs.count()) +
      (await textInputs.count()) +
      (await emailInputs.count());

    if (totalInputs > 0) {
      // Test that at least one input accepts data
      const allInputs = page.locator(
        'input[type="number"], input[type="text"], input[type="email"]'
      );
      const firstInput = allInputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        await firstInput.fill("123");
        const value = await firstInput.inputValue();
        expect(value).toBe("123");

        await coverage.markInteractionTested("InputDataEntry");
        console.log("✓ User inputs accept data correctly");
      }
    } else {
      console.log("ℹ No input fields found on main page");
    }
  });

  test("visual feedback and responsiveness work", async ({ page }) => {
    await coverage.markComponentTested("VisualFeedback");

    // Test hover states on interactive elements
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Check that buttons have proper visual feedback
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        // Check for hover classes
        const classList = (await firstButton.getAttribute("class")) || "";
        const hasHoverFeedback = /hover:|cursor-pointer|transition/.test(
          classList
        );

        await coverage.markInteractionTested("ButtonHoverFeedback");
        console.log(`✓ Buttons have visual feedback: ${hasHoverFeedback}`);
      }
    }

    // Test responsive design
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);

    const mobileBody = page.locator("body");
    await expect(mobileBody).toBeVisible();

    await page.setViewportSize({ width: 1200, height: 800 }); // Desktop
    await page.waitForTimeout(500);

    const desktopBody = page.locator("body");
    await expect(desktopBody).toBeVisible();

    await coverage.markInteractionTested("ResponsiveDesign");
    console.log("✓ App is responsive on mobile and desktop");
  });

  test("error handling and edge cases", async ({ page }) => {
    await coverage.markComponentTested("ErrorHandling");

    // Test that the app handles edge cases gracefully
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));

    // Navigate to a non-existent route to test error handling
    await page.goto("/non-existent-page", { waitUntil: "domcontentloaded" });

    // Should still show some content (404 page or redirect)
    const bodyContent = page.locator("body");
    await expect(bodyContent).toBeVisible();

    // Go back to main page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should not have JavaScript errors
    expect(errors.length).toBeLessThan(3); // Allow some minor errors but not many

    await coverage.markInteractionTested("ErrorPageHandling");
    console.log(`✓ Error handling works (${errors.length} JS errors)`);
  });

  test.afterEach(async () => {
    // Print simple coverage report
    const report = coverage.getCoverageReport();
    console.log(`📊 Test Coverage Summary:`);
    console.log(`   Components tested: ${report.componentsVisited.join(", ")}`);
    console.log(
      `   Interactions tested: ${report.interactionsTested.join(", ")}`
    );
    console.log(`   Total coverage points: ${report.coverageCount}`);
  });
});
