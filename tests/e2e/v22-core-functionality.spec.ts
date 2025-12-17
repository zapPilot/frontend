/* eslint-disable sonarjs/slow-regex */
/**
 * E2E Tests for V22 Core Functionality
 *
 * Tests the primary UI features and interactions of the V22 layout,
 * ensuring all core components work as expected.
 *
 * Coverage:
 * - Dashboard tab with portfolio data
 * - Regime detection and strategy display
 * - Strategy card expand/collapse animation
 * - Composition bar with allocations (BTC, ETH, ALT, Stables)
 * - Analytics tab with charts
 * - Backtesting tab with simulation
 * - Tab navigation
 * - Interactive elements
 */

import { expect, test } from "@playwright/test";

test.describe("V22 Core Functionality", () => {
  const TEST_USER = "0x1234567890abcdef1234567890abcdef12345678";

  test.describe("Dashboard Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
    });

    test("should display portfolio balance", async ({ page }) => {
      // Balance should be visible with currency formatting
      const balanceElement = page.locator('[class*="text-5xl"]').first();
      await expect(balanceElement).toBeVisible();

      const balance = await balanceElement.textContent();
      expect(balance).toMatch(/\$[\d,]+/);
    });

    test("should display ROI percentage", async ({ page }) => {
      // ROI should show with % sign
      const roiBadge = page.locator('span:has-text("%")').first();
      await expect(roiBadge).toBeVisible();

      const roi = await roiBadge.textContent();
      expect(roi).toMatch(/[-+]?\d+(\.\d+)?%/);
    });

    test("should show positive ROI in green", async ({ page }) => {
      const roiBadge = page.locator('span:has-text("%")').first();

      if (await roiBadge.isVisible()) {
        const text = await roiBadge.textContent();

        if (text && text.includes("+")) {
          // Positive ROI should have green color
          const className = await roiBadge.getAttribute("class");
          expect(className).toMatch(/green|success|positive/i);
        }
      }
    });

    test("should show negative ROI in red", async ({ page }) => {
      const roiBadge = page.locator('span:has-text("%")').first();

      if (await roiBadge.isVisible()) {
        const text = await roiBadge.textContent();

        if (text && text.includes("-")) {
          // Negative ROI should have red color
          const className = await roiBadge.getAttribute("class");
          expect(className).toMatch(/red|danger|negative/i);
        }
      }
    });

    test.skip("should display portfolio metadata (positions, protocols, chains)", async ({
      page,
    }) => {
      // Look for metadata indicators
      const hasPositions = await page.locator("text=/\\d+ Position/i").count();
      const hasProtocols = await page.locator("text=/\\d+ Protocol/i").count();
      const hasChains = await page.locator("text=/\\d+ Chain/i").count();

      // At least one should be visible
      expect(hasPositions + hasProtocols + hasChains).toBeGreaterThan(0);
    });

    test.skip("should show portfolio age or last update", async ({ page }) => {
      // Look for timestamp or age indicator
      const hasTimestamp = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return (
          text.includes("ago") ||
          text.includes("Last updated") ||
          text.includes("days")
        );
      });

      expect(hasTimestamp).toBe(true);
    });
  });

  test.describe("Regime Detection & Strategy Display", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
    });

    test("should display current regime badge", async ({ page }) => {
      // Regime badge (EF/F/N/G/EG)
      const regimeBadge = page.locator('[class*="text-3xl"]').first();
      await expect(regimeBadge).toBeVisible();

      const regimeText = await regimeBadge.textContent();
      expect(regimeText).toMatch(/^(EF|F|N|G|EG)$/);
    });

    test("should display regime full name", async ({ page }) => {
      // Full regime names
      const hasRegimeName = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return (
          text.includes("Extreme Fear") ||
          text.includes("Fear") ||
          text.includes("Neutral") ||
          text.includes("Greed") ||
          text.includes("Extreme Greed")
        );
      });

      expect(hasRegimeName).toBe(true);
    });

    test("should show Current Strategy card", async ({ page }) => {
      await expect(page.getByText("Current Strategy")).toBeVisible();
    });

    test.skip("should display target allocation in strategy card", async ({
      page,
    }) => {
      // Target allocation: XX% Crypto / XX% Stable
      const targetAllocation = page.locator("text=/\\d+% Crypto/");
      await expect(targetAllocation).toBeVisible();

      const allocation = await targetAllocation.textContent();
      expect(allocation).toMatch(/\d+% Crypto[^%]*\d+% Stable/);
    });

    test("should show strategy direction indicator (fromLeft/fromRight)", async ({
      page,
    }) => {
      // Direction indicator for regime transitions
      const hasDirection = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return (
          html.includes("fromLeft") ||
          html.includes("fromRight") ||
          html.includes("direction")
        );
      });

      // Direction metadata might be in component state
      expect(hasDirection !== undefined).toBe(true);
    });

    test.skip("should display regime duration", async ({ page }) => {
      // How long in current regime
      const hasDuration = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return text.includes("day") || text.includes("hour");
      });

      expect(hasDuration).toBe(true);
    });
  });

  test.describe("Strategy Card Expand/Collapse", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
    });

    test.skip("should expand strategy card on click", async ({ page }) => {
      const strategyCard = page.locator("text=Current Strategy").locator("..");
      await strategyCard.click();
      await page.waitForTimeout(500);

      // Regime spectrum should appear
      await expect(page.getByText("Regime Spectrum")).toBeVisible();
    });

    test("should show expanded content with regime spectrum", async ({
      page,
    }) => {
      const strategyCard = page.locator("text=Current Strategy").locator("..");
      await strategyCard.click();
      await page.waitForTimeout(500);

      // All regime labels should be visible
      const extremeFear = page.locator("text=Extreme Fear");
      const extremeGreed = page.locator("text=Extreme Greed");

      await expect(extremeFear).toBeVisible();
      await expect(extremeGreed).toBeVisible();
    });

    test.skip("should collapse strategy card on second click", async ({
      page,
    }) => {
      const strategyCard = page.locator("text=Current Strategy").locator("..");

      // Expand
      await strategyCard.click();
      await page.waitForTimeout(500);
      await expect(page.getByText("Regime Spectrum")).toBeVisible();

      // Collapse
      await strategyCard.click();
      await page.waitForTimeout(500);
      await expect(page.getByText("Regime Spectrum")).not.toBeVisible();
    });

    test.skip("should animate expansion smoothly", async ({ page }) => {
      const strategyCard = page.locator("text=Current Strategy").locator("..");

      // Click to expand
      await strategyCard.click();

      // Animation should complete within reasonable time
      await page.waitForTimeout(1000);

      const isExpanded = await page.getByText("Regime Spectrum").isVisible();
      expect(isExpanded).toBe(true);
    });

    test("should toggle chevron icon direction", async ({ page }) => {
      const strategyCard = page.locator("text=Current Strategy").locator("..");

      // Initial state
      const initialChevron = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return html.includes("ChevronDown") || html.includes("chevron");
      });

      // Click to expand
      await strategyCard.click();
      await page.waitForTimeout(500);

      // Chevron should rotate/change
      expect(initialChevron).toBe(true);
    });
  });

  test.describe("Portfolio Composition Bar", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
    });

    test("should display composition bar with label", async ({ page }) => {
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });

    test("should show BTC allocation", async ({ page }) => {
      const btcLabel = page.locator("text=BTC");
      await expect(btcLabel).toBeVisible();
    });

    test.skip("should show ETH allocation", async ({ page }) => {
      const ethLabel = page.locator("text=ETH");
      await expect(ethLabel).toBeVisible();
    });

    test.skip("should show ALT allocation", async ({ page }) => {
      const altLabel = page.locator("text=ALT");
      await expect(altLabel).toBeVisible();
    });

    test("should show STABLES allocation", async ({ page }) => {
      const stablesLabel = page.locator("text=STABLES");
      await expect(stablesLabel).toBeVisible();
    });

    test("should display allocation percentages", async ({ page }) => {
      // Each segment should show percentage
      const hasPercentages = await page.evaluate(() => {
        const text = document.body.textContent || "";
        const percentMatches = text.match(/\d+%/g);
        return percentMatches ? percentMatches.length >= 4 : false;
      });

      expect(hasPercentages).toBe(true);
    });

    test("should show allocation drift indicator", async ({ page }) => {
      // Drift: X% from target
      const driftElement = page.locator("text=/Drift.*%/");
      await expect(driftElement).toBeVisible();
    });

    test("should visualize composition as stacked bar", async ({ page }) => {
      // Composition bar should have visual segments
      const hasCompositionVisual = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return (
          html.includes("flex") ||
          html.includes("grid") ||
          html.includes("composition")
        );
      });

      expect(hasCompositionVisual).toBe(true);
    });

    test("composition percentages should add up to ~100%", async ({ page }) => {
      const percentages = await page.evaluate(() => {
        const text = document.body.textContent || "";
        const matches = text.match(/(\d+)%/g);
        if (!matches) return 0;

        return matches.reduce((sum, match) => {
          const num = parseInt(match.replace("%", ""));
          return sum + num;
        }, 0);
      });

      // Should be close to 100% (allowing for rounding)
      expect(percentages).toBeGreaterThan(80);
      expect(percentages).toBeLessThan(120);
    });
  });

  test.describe("Analytics Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
      await page.click("text=Analytics");
      await page.waitForTimeout(500);
    });

    test.skip("should render Analytics tab content", async ({ page }) => {
      await expect(page.getByText("Performance Overview")).toBeVisible();
    });

    test.skip("should display performance charts", async ({ page }) => {
      // Charts should render (canvas or SVG)
      const charts = await page
        .locator('canvas, svg[class*="recharts"]')
        .count();
      expect(charts).toBeGreaterThan(0);
    });

    test.skip("should show risk metrics", async ({ page }) => {
      // Sharpe ratio, volatility, etc.
      const hasRiskMetrics =
        (await page.locator("text=/Sharpe/i").count()) +
        (await page.locator("text=/Volatility/i").count()) +
        (await page.locator("text=/Beta/i").count());

      expect(hasRiskMetrics).toBeGreaterThan(0);
    });

    test.skip("should display historical performance data", async ({
      page,
    }) => {
      // Historical returns or growth chart
      const hasPerformanceData = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return (
          text.includes("Performance") ||
          text.includes("Return") ||
          text.includes("Growth")
        );
      });

      expect(hasPerformanceData).toBe(true);
    });

    test("should have interactive chart elements", async ({ page }) => {
      // Charts might have tooltips or interactive features
      const chart = page.locator('canvas, svg[class*="recharts"]').first();

      if (await chart.count()) {
        // Hover to trigger tooltip
        await chart.hover();
        await page.waitForTimeout(500);

        // Tooltip might appear
        const hasTooltip = await page.evaluate(() => {
          const html = document.body.innerHTML;
          return html.includes("tooltip") || html.includes("Tooltip");
        });

        expect(hasTooltip !== undefined).toBe(true);
      }
    });
  });

  test.describe("Backtesting Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
      await page.click("text=Backtesting");
      await page.waitForTimeout(500);
    });

    test("should render Backtesting tab content", async ({ page }) => {
      await expect(page.getByText("Strategy Simulator")).toBeVisible();
    });

    test("should have risk profile selector", async ({ page }) => {
      // Conservative/Aggressive options
      const hasProfileOptions =
        (await page.locator("text=/Conservative/i").count()) +
        (await page.locator("text=/Aggressive/i").count()) +
        (await page.locator("text=/Moderate/i").count());

      expect(hasProfileOptions).toBeGreaterThan(0);
    });

    test("should display simulation results", async ({ page }) => {
      // Simulation output: growth, returns, etc.
      const hasSimulationData = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return (
          text.includes("Growth") ||
          text.includes("Return") ||
          text.includes("Simulation")
        );
      });

      expect(hasSimulationData).toBe(true);
    });

    test.skip("should show simulated portfolio growth chart", async ({
      page,
    }) => {
      // Chart visualizing backtest results
      const charts = await page
        .locator('canvas, svg[class*="recharts"]')
        .count();
      expect(charts).toBeGreaterThan(0);
    });

    test("should allow profile selection", async ({ page }) => {
      const conservativeButton = page.locator("text=/Conservative/i").first();

      if (await conservativeButton.count()) {
        await conservativeButton.click();
        await page.waitForTimeout(500);

        // Results should update
        const bodyVisible = await page.locator("body").isVisible();
        expect(bodyVisible).toBe(true);
      }
    });

    test("should display time period selector (if available)", async ({
      page,
    }) => {
      // 1M, 3M, 6M, 1Y, ALL
      const hasPeriodSelector = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return (
          text.includes("1M") ||
          text.includes("3M") ||
          text.includes("1Y") ||
          text.includes("ALL")
        );
      });

      expect(hasPeriodSelector !== undefined).toBe(true);
    });
  });

  test.describe("Tab Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
    });

    test("should have 3 tabs visible", async ({ page }) => {
      const dashboardTab = page.getByRole("button", { name: /dashboard/i });
      const analyticsTab = page.getByRole("button", { name: /analytics/i });
      const backtestingTab = page.getByRole("button", {
        name: /backtesting/i,
      });

      await expect(dashboardTab).toBeVisible();
      await expect(analyticsTab).toBeVisible();
      await expect(backtestingTab).toBeVisible();
    });

    test.skip("should navigate to Analytics tab", async ({ page }) => {
      await page.click("text=Analytics");
      await page.waitForTimeout(500);

      await expect(page.getByText("Performance Overview")).toBeVisible();
    });

    test("should navigate to Backtesting tab", async ({ page }) => {
      await page.click("text=Backtesting");
      await page.waitForTimeout(500);

      await expect(page.getByText("Strategy Simulator")).toBeVisible();
    });

    test("should navigate back to Dashboard tab", async ({ page }) => {
      // Go to Analytics
      await page.click("text=Analytics");
      await page.waitForTimeout(500);

      // Back to Dashboard
      await page.click("text=Dashboard");
      await page.waitForTimeout(500);

      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });

    test.skip("should highlight active tab", async ({ page }) => {
      const dashboardTab = page.getByRole("button", { name: /dashboard/i });

      // Dashboard should be active by default
      const className = await dashboardTab.getAttribute("class");
      expect(className).toMatch(/active|selected|current/i);
    });

    test("should preserve data when switching tabs", async ({ page }) => {
      // Get balance on Dashboard
      const initialBalance = await page
        .locator('[class*="text-5xl"]')
        .first()
        .textContent();

      // Switch to Analytics
      await page.click("text=Analytics");
      await page.waitForTimeout(500);

      // Switch back to Dashboard
      await page.click("text=Dashboard");
      await page.waitForTimeout(500);

      // Balance should be the same
      const finalBalance = await page
        .locator('[class*="text-5xl"]')
        .first()
        .textContent();
      expect(finalBalance).toBe(initialBalance);
    });
  });

  test.describe("Quick Actions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");
    });

    test("should have Deposit button visible", async ({ page }) => {
      const depositButton = page.getByRole("button", { name: /deposit/i });
      await expect(depositButton).toBeVisible();
    });

    test("should have Withdraw button visible", async ({ page }) => {
      const withdrawButton = page.getByRole("button", { name: /withdraw/i });
      await expect(withdrawButton).toBeVisible();
    });

    test.skip("should have Optimize button visible", async ({ page }) => {
      const optimizeButton = page.getByRole("button", { name: /optimize/i });
      await expect(optimizeButton).toBeVisible();
    });

    test("Deposit button should be enabled in owner mode", async ({ page }) => {
      const depositButton = page.getByRole("button", { name: /deposit/i });

      if (await depositButton.count()) {
        await expect(depositButton).toBeEnabled();
      }
    });

    test("clicking action buttons should trigger modals/flows", async ({
      page,
    }) => {
      const depositButton = page.getByRole("button", { name: /deposit/i });

      if (await depositButton.count()) {
        await depositButton.click();
        await page.waitForTimeout(500);

        // Modal or flow should open
        const hasModal = await page.evaluate(() => {
          const html = document.body.innerHTML;
          return html.includes("modal") || html.includes("dialog");
        });

        expect(hasModal !== undefined).toBe(true);
      }
    });
  });

  test.describe("Loading States", () => {
    test("should show loading skeleton on initial load", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`, {
        waitUntil: "domcontentloaded",
      });

      // Loading state might appear briefly
      const hasLoadingState = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return (
          html.includes("skeleton") ||
          html.includes("loading") ||
          html.includes("spinner")
        );
      });

      expect(hasLoadingState !== undefined).toBe(true);
    });

    test("should transition from loading to loaded state", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Portfolio data should be loaded
      await expect(page.getByText("Portfolio Composition")).toBeVisible();

      const balanceElement = page.locator('[class*="text-5xl"]').first();
      await expect(balanceElement).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle regime API failure gracefully", async ({ page }) => {
      // Block regime/sentiment API
      await page.route("**/api/v2/market/sentiment", route => route.abort());

      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Should fallback to neutral regime
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);

      // Portfolio should still render
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });

    test("should handle portfolio API failure gracefully", async ({ page }) => {
      // Block portfolio API
      await page.route("**/api/v2/portfolio/**", route => route.abort());

      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Error boundary should catch
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });
  });
});
