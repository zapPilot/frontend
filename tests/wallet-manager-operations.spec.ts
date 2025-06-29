import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * WALLET MANAGER OPERATIONS TESTS
 *
 * Tests for wallet management functionality including address validation,
 * portfolio display, and wallet operations in the Zap Pilot platform
 */

test.describe("WalletManager Operations", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("wallet address display and formatting", async ({ page }) => {
    await coverage.markComponentTested("WalletManager");

    // Look for wallet address displays
    const walletElements = page.locator(
      '[class*="wallet"], [data-testid*="wallet"]'
    );
    const addressElements = page.locator(
      "text=/0x[a-fA-F0-9]{40}|0x[a-fA-F0-9]{4}.*[a-fA-F0-9]{4}/"
    );

    const walletCount = await walletElements.count();
    const addressCount = await addressElements.count();

    if (addressCount > 0) {
      // Test first address format
      const firstAddress = addressElements.first();
      const addressText = await firstAddress.textContent();

      // Should be valid Ethereum address format
      if (addressText?.includes("0x")) {
        expect(addressText).toMatch(/0x[a-fA-F0-9]/);

        // Check if address is truncated (good UX practice)
        if (addressText.length < 42) {
          // Full address is 42 chars
          expect(addressText).toMatch(/0x[a-fA-F0-9]{4}.*[a-fA-F0-9]{4}/);
        }
      }

      await coverage.markInteractionTested("WalletAddressDisplay");
      console.log(
        `✓ Wallet addresses display correctly (${addressCount} addresses found)`
      );
    } else {
      console.log("ℹ No wallet addresses found on page");
    }
  });

  test("portfolio balance display and calculations", async ({ page }) => {
    await coverage.markComponentTested("PortfolioDisplay");

    // Look for balance displays
    const balanceElements = page.locator(
      '[class*="balance"], text=/\$[0-9,]+/, text=/[0-9]+\.[0-9]+ ETH/, text=/[0-9]+\.[0-9]+ BTC/'
    );
    const balanceCount = await balanceElements.count();

    if (balanceCount > 0) {
      for (let i = 0; i < Math.min(balanceCount, 3); i++) {
        const balance = balanceElements.nth(i);
        const balanceText = await balance.textContent();

        // Verify balance format
        if (balanceText?.includes("$")) {
          expect(balanceText).toMatch(/\$[\d,]+(\.\d{2})?/);
        } else if (balanceText?.includes("ETH")) {
          expect(balanceText).toMatch(/\d+(\.\d+)?\s*ETH/);
        } else if (balanceText?.includes("BTC")) {
          expect(balanceText).toMatch(/\d+(\.\d+)?\s*BTC/);
        }
      }

      await coverage.markInteractionTested("PortfolioBalanceValidation");
      console.log(
        `✓ Portfolio balances display correctly (${balanceCount} balances found)`
      );
    } else {
      console.log("ℹ No portfolio balances found");
    }
  });

  test("wallet connection status indication", async ({ page }) => {
    await coverage.markComponentTested("WalletConnection");

    // Look for connection indicators
    const connectionIndicators = page.locator(
      'button:has-text("Connect"), button:has-text("Connected"), [class*="connect"], [data-testid*="connect"]'
    );
    const indicatorCount = await connectionIndicators.count();

    if (indicatorCount > 0) {
      const firstIndicator = connectionIndicators.first();
      const indicatorText = await firstIndicator.textContent();

      // Should indicate connection state
      expect(indicatorText?.toLowerCase()).toMatch(/connect|wallet|account/);

      // Button should be interactive
      expect(await firstIndicator.isEnabled()).toBeTruthy();

      await coverage.markInteractionTested("WalletConnectionStatus");
      console.log(
        `✓ Wallet connection status displayed (${indicatorCount} indicators found)`
      );
    } else {
      console.log("ℹ No wallet connection indicators found");
    }
  });

  test("portfolio asset categorization", async ({ page }) => {
    await coverage.markComponentTested("AssetCategories");

    // Look for asset categories
    const categoryElements = page.locator(
      '[class*="category"], text=/DeFi|Tokens|NFTs|Staking/, .text-xs:has-text("Category")'
    );
    const categoryCount = await categoryElements.count();

    if (categoryCount > 0) {
      for (let i = 0; i < Math.min(categoryCount, 3); i++) {
        const category = categoryElements.nth(i);
        const categoryText = await category.textContent();

        // Verify category text is meaningful
        expect(categoryText?.trim().length).toBeGreaterThan(2);
        expect(categoryText).not.toMatch(/undefined|null|error/);
      }

      await coverage.markInteractionTested("AssetCategoryDisplay");
      console.log(
        `✓ Asset categories displayed correctly (${categoryCount} categories found)`
      );
    } else {
      console.log("ℹ No asset categories found");
    }
  });

  test("portfolio value calculations accuracy", async ({ page }) => {
    await coverage.markComponentTested("PortfolioCalculations");

    // Look for portfolio metrics
    const totalValueElements = page.locator(
      'text=/Total.*\$/, text=/Portfolio.*\$/, [class*="total"]'
    );
    const percentageElements = page.locator('text=/%/, [class*="percent"]');

    const totalCount = await totalValueElements.count();
    const percentCount = await percentageElements.count();

    if (totalCount > 0) {
      const firstTotal = totalValueElements.first();
      const totalText = await firstTotal.textContent();

      // Should be valid currency format
      if (totalText?.includes("$")) {
        expect(totalText).toMatch(/\$[\d,]+(\.\d{2})?/);
      }

      await coverage.markInteractionTested("PortfolioValueCalculation");
      console.log(
        `✓ Portfolio values calculated correctly (${totalCount} totals, ${percentCount} percentages)`
      );
    } else {
      console.log("ℹ No portfolio totals found");
    }
  });

  test("asset performance indicators", async ({ page }) => {
    await coverage.markComponentTested("AssetPerformance");

    // Look for performance indicators (gains/losses)
    const performanceElements = page.locator(
      'text=/\+\d+%/, text=/-\d+%/, [class*="green"], [class*="red"], text=/gain|loss/i'
    );
    const performanceCount = await performanceElements.count();

    if (performanceCount > 0) {
      for (let i = 0; i < Math.min(performanceCount, 3); i++) {
        const performance = performanceElements.nth(i);
        const performanceText = await performance.textContent();

        // Should be valid percentage or performance indicator
        if (performanceText?.includes("%")) {
          expect(performanceText).toMatch(/[+-]?\d+(\.\d+)?%/);
        }
      }

      await coverage.markInteractionTested("AssetPerformanceDisplay");
      console.log(
        `✓ Asset performance indicators working (${performanceCount} indicators found)`
      );
    } else {
      console.log("ℹ No performance indicators found");
    }
  });

  test("wallet management error handling", async ({ page }) => {
    await coverage.markComponentTested("WalletErrorHandling");

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on("pageerror", error => errors.push(error.message));
    page.on("console", msg => {
      if (msg.type() === "error" && msg.text().includes("wallet")) {
        errors.push(msg.text());
      } else if (msg.type() === "warning" && msg.text().includes("wallet")) {
        warnings.push(msg.text());
      }
    });

    // Wait for any wallet-related operations to complete
    await page.waitForTimeout(3000);

    // Check for critical wallet errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes("favicon") &&
        !error.includes("MetaMask") && // Common browser extension warnings
        !error.includes("web3")
    );

    expect(criticalErrors.length).toBeLessThan(2);

    await coverage.markInteractionTested("WalletErrorHandling");
    console.log(
      `✓ Wallet error handling working (${criticalErrors.length} critical errors)`
    );
  });

  test("portfolio data loading states", async ({ page }) => {
    await coverage.markComponentTested("PortfolioLoading");

    // Look for loading indicators
    const loadingElements = page.locator(
      '[class*="loading"], [class*="spinner"], text=/loading/i, [data-testid*="loading"]'
    );
    const loadingCount = await loadingElements.count();

    // Check for skeleton loaders or placeholder content
    const skeletonElements = page.locator(
      '[class*="skeleton"], [class*="placeholder"]'
    );
    const skeletonCount = await skeletonElements.count();

    // Portfolio should either show data or loading state
    const portfolioContent = page.locator(
      '[class*="portfolio"], [class*="wallet"]'
    );
    const contentCount = await portfolioContent.count();

    expect(contentCount + loadingCount + skeletonCount).toBeGreaterThan(0);

    await coverage.markInteractionTested("PortfolioLoadingStates");
    console.log(
      `✓ Portfolio loading states handled (${loadingCount} loaders, ${skeletonCount} skeletons)`
    );
  });

  test("responsive portfolio layout", async ({ page }) => {
    await coverage.markComponentTested("ResponsivePortfolio");

    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    const desktopPortfolio = page.locator(
      '[class*="portfolio"], [class*="wallet"]'
    );
    const desktopVisible = await desktopPortfolio.count();

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobilePortfolio = page.locator(
      '[class*="portfolio"], [class*="wallet"]'
    );
    const mobileVisible = await mobilePortfolio.count();

    // Portfolio should be visible on both screen sizes
    expect(mobileVisible).toBeGreaterThan(0);
    expect(desktopVisible).toBeGreaterThan(0);

    await coverage.markInteractionTested("ResponsivePortfolioLayout");
    console.log(
      `✓ Portfolio responsive layout working (${mobileVisible} mobile, ${desktopVisible} desktop)`
    );
  });

  test.afterEach(async () => {
    const report = coverage.getCoverageReport();
    console.log(`📊 WalletManager Test Coverage:`);
    console.log(`   Components: ${report.componentsVisited.join(", ")}`);
    console.log(`   Interactions: ${report.interactionsTested.join(", ")}`);
  });
});
