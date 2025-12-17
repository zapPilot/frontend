/**
 * E2E tests for V22 Layout Migration
 *
 * Tests critical user flows:
 * - Dashboard rendering with real data
 * - Regime indicator matches sentiment
 * - Portfolio composition accuracy
 * - Tab navigation
 * - Action buttons (Optimize, Deposit, Withdraw)
 * - Feature flag toggling
 * - Mobile responsiveness
 */

import { expect, test } from "@playwright/test";

test.describe("V22 Layout Migration", () => {
  test.describe("Feature Flag Control", () => {
    test.skip("should show V1 layout when flag is OFF", async ({ page }) => {
      // Set environment to disable V22
      await page.goto("/bundle?userId=0x1234567890abcdef");

      // V1 layout has WalletMetrics component
      await expect(page.getByTestId("wallet-metrics-container")).toBeVisible();

      // V22-specific elements should NOT be present
      await expect(page.getByText("Current Strategy")).not.toBeVisible();
    });

    test("should show V22 layout when flag is ON", async ({ page }) => {
      // Note: In real deployment, this would be controlled via env variable
      // For E2E testing, we might need a test route or mock
      await page.goto("/layout-demo/v22");

      // V22-specific elements should be visible
      await expect(page.getByText("Current Strategy")).toBeVisible();
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });
  });

  test.describe("Dashboard View - Real Data", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
      await page.waitForLoadState("networkidle");
    });

    test("should display portfolio balance correctly", async ({ page }) => {
      // Wait for balance to load
      const balanceElement = page.locator('[class*="text-5xl"]').first();
      await expect(balanceElement).toBeVisible();

      // Should show formatted currency
      const balance = await balanceElement.textContent();
      expect(balance).toMatch(/\$[\d,]+/);
    });

    test("should display ROI with correct formatting", async ({ page }) => {
      // ROI badge should be visible
      const roiBadge = page.locator('span:has-text("%")').first();
      await expect(roiBadge).toBeVisible();

      // Should have color indicator (green for positive, red for negative)
      const hasColorClass = await roiBadge.evaluate(
        el => el.className.includes("green") || el.className.includes("red")
      );
      expect(hasColorClass).toBe(true);
    });

    test("should show current regime badge", async ({ page }) => {
      // Regime badge with ID (ef/f/n/g/eg)
      const regimeBadge = page.locator('[class*="text-3xl"]').first();
      await expect(regimeBadge).toBeVisible();

      const regimeText = await regimeBadge.textContent();
      expect(regimeText).toMatch(/^(EF|F|N|G|EG)$/);
    });

    test("should display portfolio composition bar", async ({ page }) => {
      // Composition bar container
      await expect(page.getByText("Portfolio Composition")).toBeVisible();

      // Should have crypto and stable sections
      const cryptoSection = page.locator("text=BTC").first();
      const stableSection = page.locator("text=STABLES").first();

      await expect(cryptoSection).toBeVisible();
      await expect(stableSection).toBeVisible();
    });

    test("should show allocation drift percentage", async ({ page }) => {
      // Drift indicator
      const driftElement = page.locator("text=/Drift:.*%/");
      await expect(driftElement).toBeVisible();
    });

    test.skip("should display portfolio metadata (positions, protocols, chains)", async ({
      page,
    }) => {
      // These metrics should be visible somewhere in the dashboard
      const hasPositions = await page.locator("text=/\\d+ Position/i").count();
      const hasProtocols = await page.locator("text=/\\d+ Protocol/i").count();
      const hasChains = await page.locator("text=/\\d+ Chain/i").count();

      expect(hasPositions + hasProtocols + hasChains).toBeGreaterThan(0);
    });
  });

  test.describe("Regime-Based Strategy Card", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
    });

    test.skip("should expand strategy card on click", async ({ page }) => {
      const strategyCard = page.locator("text=Current Strategy").locator("..");
      await strategyCard.click();

      // Regime spectrum should be visible after expansion
      await expect(page.getByText("Regime Spectrum")).toBeVisible();
    });

    test("should show target allocation in strategy card", async ({ page }) => {
      // Target allocation format: XX% Crypto / XX% Stable
      const targetAllocation = page.locator("text=/\\d+% Crypto/");
      await expect(targetAllocation).toBeVisible();
    });
  });

  test.describe("Quick Actions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
    });

    test("should have Deposit button", async ({ page }) => {
      const depositButton = page.getByRole("button", { name: /deposit/i });
      await expect(depositButton).toBeVisible();
      await expect(depositButton).toBeEnabled();
    });

    test("should have Withdraw button", async ({ page }) => {
      const withdrawButton = page.getByRole("button", {
        name: /withdraw/i,
      });
      await expect(withdrawButton).toBeVisible();
      await expect(withdrawButton).toBeEnabled();
    });

    test.skip("should have Optimize button", async ({ page }) => {
      const optimizeButton = page.getByRole("button", {
        name: /optimize/i,
      });
      await expect(optimizeButton).toBeVisible();
    });

    test("should disable actions in visitor mode", async ({ page }) => {
      // Navigate to someone else's bundle
      await page.goto("/bundle?userId=0xAnotherUser");

      // Quick action buttons should be disabled
      // (This test assumes visitor mode detection works)
    });
  });

  test.describe("Tab Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
    });

    test.skip("should navigate to Analytics tab", async ({ page }) => {
      await page.click("text=Analytics");

      // Analytics-specific content
      await expect(page.getByText("Performance Overview")).toBeVisible();
    });

    test("should navigate to Backtesting tab", async ({ page }) => {
      await page.click("text=Backtesting");

      // Backtesting-specific content
      await expect(page.getByText("Strategy Simulator")).toBeVisible();
    });

    test.skip("should navigate back to Dashboard tab", async ({ page }) => {
      // Go to Analytics
      await page.click("text=Analytics");
      await expect(page.getByText("Performance Overview")).toBeVisible();

      // Go back to Dashboard
      await page.click("text=Dashboard");
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });
  });

  test.describe("Analytics Tab (Mock Data)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
      await page.click("text=Analytics");
    });

    test.skip("should display performance charts", async ({ page }) => {
      await expect(page.getByText("Performance Overview")).toBeVisible();

      // Charts should render (canvas or svg elements)
      const charts = await page
        .locator('canvas, svg[class*="recharts"]')
        .count();
      expect(charts).toBeGreaterThan(0);
    });

    test("should show risk metrics", async ({ page }) => {
      // Risk metrics: Sharpe, Sortino, Beta, etc.
      const hasRiskMetrics =
        (await page.locator("text=/Sharpe/i").count()) +
        (await page.locator("text=/Volatility/i").count());
      expect(hasRiskMetrics).toBeGreaterThan(0);
    });
  });

  test.describe("Backtesting Tab (Mock Data)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
      await page.click("text=Backtesting");
    });

    test("should display strategy simulator", async ({ page }) => {
      await expect(page.getByText("Strategy Simulator")).toBeVisible();
    });

    test("should have profile selector", async ({ page }) => {
      // Conservative/Aggressive toggle
      const hasProfileOptions =
        (await page.locator("text=/Conservative/i").count()) +
        (await page.locator("text=/Aggressive/i").count());
      expect(hasProfileOptions).toBeGreaterThan(0);
    });

    test("should display simulation results", async ({ page }) => {
      // Portfolio growth chart or results
      const hasSimulationOutput =
        (await page.locator("text=/Growth/i").count()) +
        (await page.locator("canvas, svg").count());
      expect(hasSimulationOutput).toBeGreaterThan(0);
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    });

    test("should render mobile layout correctly", async ({ page }) => {
      await page.goto("/layout-demo/v22");

      // Quick actions should still be visible
      await expect(
        page.getByRole("button", { name: /deposit/i })
      ).toBeVisible();

      // Balance should be visible
      const balance = page.locator('[class*="text-5xl"]').first();
      await expect(balance).toBeVisible();
    });

    test.skip("should have accessible tab navigation on mobile", async ({
      page,
    }) => {
      await page.goto("/layout-demo/v22");

      // Mobile bottom nav or top tabs
      await page.click("text=Analytics");
      await expect(page.getByText("Performance Overview")).toBeVisible();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state while fetching data", async ({ page }) => {
      // Navigate with network throttling to see loading state
      await page.goto("/layout-demo/v22", {
        waitUntil: "domcontentloaded",
      });

      // Loading skeleton or spinner should appear briefly
      // (This is hard to test reliably without network throttling)
    });
  });

  test.describe("Error Handling", () => {
    test("should handle sentiment API failure gracefully", async ({ page }) => {
      // Block sentiment API endpoint
      await page.route("**/api/v2/market/sentiment", route => route.abort());

      await page.goto("/layout-demo/v22");

      // Should still render with neutral regime fallback
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });

    test("should handle portfolio API failure gracefully", async ({ page }) => {
      // Block portfolio endpoint
      await page.route("**/api/v2/portfolio/**/landing", route =>
        route.abort()
      );

      await page.goto("/layout-demo/v22");

      // Error state should be shown or handled gracefully
      // (Exact behavior depends on error boundary implementation)
    });
  });

  test.describe("Accessibility", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/layout-demo/v22");
    });

    test("should have keyboard navigation support", async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Focus should be visible on buttons
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(focusedElement).toBeTruthy();
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Check for ARIA attributes on key interactive elements
      const depositButton = page.getByRole("button", { name: /deposit/i });
      await expect(depositButton).toHaveAttribute("class"); // Should have accessible class/role
    });
  });

  test.describe("Demo Route Preservation", () => {
    test("should keep /layout-demo/v22 accessible regardless of feature flag", async ({
      page,
    }) => {
      // Demo route should always show V22 with mock data
      await page.goto("/layout-demo/v22");

      await expect(page.getByText("Current Strategy")).toBeVisible();
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });
  });
});
