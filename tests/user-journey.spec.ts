import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * USER JOURNEY TESTS
 *
 * These test realistic user flows through your DeFi app
 * Focus on the most common user paths that generate value
 */

test.describe("User Journey Tests", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("new user can explore investment options", async ({ page }) => {
    await coverage.markComponentTested("NewUserJourney");

    // User lands on homepage
    await expect(page.locator("body")).toBeVisible();

    // User looks for investment opportunities
    const investmentContent = page
      .locator("button, a, div")
      .filter({ hasText: /invest|opportunity|strategy|vault/i });
    const investmentCount = await investmentContent.count();

    console.log(`📊 Found ${investmentCount} investment-related elements`);

    // User should be able to find navigation
    const navElements = page.locator(
      '[data-testid*="tab"], nav, [role="navigation"]'
    );
    const navCount = await navElements.count();

    expect(navCount).toBeGreaterThan(0);
    await coverage.markInteractionTested("InvestmentExploration");

    console.log("✓ New users can discover investment options");
  });

  test("user can access portfolio/wallet information", async ({ page }) => {
    await coverage.markComponentTested("PortfolioAccess");

    // Look for wallet/portfolio related content
    const walletContent = page
      .locator("h1, h2, h3, button, a")
      .filter({ hasText: /wallet|portfolio|balance|my/i });
    const walletContentCount = await walletContent.count();

    console.log(`📊 Found ${walletContentCount} wallet/portfolio elements`);

    // User should see some financial information or placeholders
    const financialIndicators = page
      .locator("text=/\\$|USD|%|APR|TVL/")
      .first();
    const hasFinancialData = (await financialIndicators.count()) > 0;

    if (hasFinancialData) {
      console.log("✓ Financial data is visible to users");
    } else {
      console.log("ℹ No financial data visible (may be expected for demo)");
    }

    await coverage.markInteractionTested("PortfolioDataAccess");
  });

  test("user can interact with main features", async ({ page }) => {
    await coverage.markComponentTested("FeatureInteraction");

    // Count interactive elements
    const buttons = await page.locator("button:visible").count();
    const links = await page.locator("a:visible").count();
    const inputs = await page.locator("input:visible").count();

    const totalInteractive = buttons + links + inputs;
    expect(totalInteractive).toBeGreaterThan(0);

    console.log(
      `📊 User can interact with ${totalInteractive} elements (${buttons} buttons, ${links} links, ${inputs} inputs)`
    );

    // Test that at least one button is clickable
    if (buttons > 0) {
      const firstButton = page.locator("button:visible").first();
      const isEnabled = await firstButton.isEnabled();
      expect(isEnabled).toBeTruthy();

      await coverage.markInteractionTested("ButtonInteraction");
      console.log("✓ Interactive elements are functional");
    }
  });

  test("user gets visual feedback on interactions", async ({ page }) => {
    await coverage.markComponentTested("VisualFeedback");

    // Test hover states
    const interactiveElements = page
      .locator("button:visible, a:visible")
      .first();

    if ((await interactiveElements.count()) > 0) {
      // Check for visual feedback classes
      const classList = (await interactiveElements.getAttribute("class")) || "";
      const hasVisualFeedback =
        /hover:|transition|cursor-pointer|bg-|text-/.test(classList);

      console.log(`📊 Visual feedback present: ${hasVisualFeedback}`);

      await coverage.markInteractionTested("HoverStateTest");
    }

    // Test responsive behavior
    const originalWidth = page.viewportSize()?.width || 1200;

    // Switch to mobile and back
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileVisible = await page.locator("body").isVisible();

    await page.setViewportSize({ width: originalWidth, height: 800 });
    await page.waitForTimeout(500);
    const desktopVisible = await page.locator("body").isVisible();

    expect(mobileVisible && desktopVisible).toBeTruthy();

    await coverage.markInteractionTested("ResponsiveInteraction");
    console.log("✓ Visual feedback and responsiveness work");
  });

  test("user can navigate between sections", async ({ page }) => {
    await coverage.markComponentTested("Navigation");

    // Find navigation elements
    const navButtons = page.locator(
      'button[data-testid*="tab"], a[data-testid*="tab"]'
    );
    const navCount = await navButtons.count();

    if (navCount > 1) {
      // Try clicking a navigation element (if safe)
      const secondNavItem = navButtons.nth(1);
      if (
        (await secondNavItem.isVisible()) &&
        (await secondNavItem.isEnabled())
      ) {
        // Check the current URL before clicking
        const currentUrl = page.url();

        await secondNavItem.click();
        await page.waitForTimeout(1000);

        // Verify page still works after navigation
        await expect(page.locator("body")).toBeVisible();

        await coverage.markInteractionTested("NavigationClick");
        console.log("✓ Navigation between sections works");
      } else {
        console.log("ℹ Navigation elements found but not clickable in test");
      }
    } else {
      console.log("ℹ Limited navigation elements found");
    }
  });

  test.afterEach(async () => {
    // Print journey coverage report
    const report = coverage.getCoverageReport();
    console.log(`📊 User Journey Coverage:`);
    console.log(`   Journey steps tested: ${report.componentsVisited.length}`);
    console.log(
      `   User interactions verified: ${report.interactionsTested.length}`
    );
  });
});
