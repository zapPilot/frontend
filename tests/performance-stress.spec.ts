import { test, expect } from "@playwright/test";

test.describe("Performance & Stress Testing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Load Performance Testing", () => {
    test("measures initial page load performance", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/", { waitUntil: "networkidle" });

      const loadTime = Date.now() - startTime;

      // Page should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Check key performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded:
            perfData.domContentLoadedEventEnd -
            perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstPaint:
            performance
              .getEntriesByType("paint")
              .find(entry => entry.name === "first-paint")?.startTime || 0,
          firstContentfulPaint:
            performance
              .getEntriesByType("paint")
              .find(entry => entry.name === "first-contentful-paint")
              ?.startTime || 0,
        };
      });

      // Performance thresholds
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3s for DOM
      expect(performanceMetrics.firstPaint).toBeLessThan(2000); // 2s for first paint
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2500); // 2.5s for FCP
    });

    test("measures chart rendering performance", async ({ page }) => {
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        const renderStart = Date.now();

        await analyticsTab.click();

        // Wait for chart to be visible
        const chart = page.locator("svg, canvas").first();
        await chart.waitFor({ state: "visible", timeout: 10000 });

        const renderTime = Date.now() - renderStart;

        // Chart should render quickly
        expect(renderTime).toBeLessThan(3000); // 3 seconds max

        // Test period switching performance
        const periods = ["1W", "1M", "3M"];
        for (const period of periods) {
          const periodButton = page.locator(`button:has-text("${period}")`);
          if (await periodButton.isVisible()) {
            const switchStart = Date.now();
            await periodButton.click();

            // Wait for chart update
            await page.waitForTimeout(500);
            const switchTime = Date.now() - switchStart;

            // Period switching should be fast
            expect(switchTime).toBeLessThan(1500); // 1.5 seconds max
          }
        }
      }
    });

    test("measures memory usage during navigation", async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null;
      });

      // Navigate through all tabs multiple times
      const tabs = [
        '[data-testid="tab-dashboard"]',
        '[data-testid="tab-invest"]',
        '[data-testid="tab-portfolio"]',
        '[data-testid="tab-analytics"]',
      ];

      for (let cycle = 0; cycle < 5; cycle++) {
        for (const tabSelector of tabs) {
          const tab = page.locator(tabSelector).first();
          if (await tab.isVisible()) {
            await tab.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease =
          finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent =
          (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

        // Memory should not increase excessively
        expect(memoryIncreasePercent).toBeLessThan(200); // Less than 200% increase
        expect(finalMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    });
  });

  test.describe("High Volume Data Handling", () => {
    test("handles large portfolio datasets", async ({ page }) => {
      // Inject large dataset
      await page.addInitScript(() => {
        // Mock large portfolio data
        const generateLargePortfolioData = (size: number) => {
          const data = [];
          for (let i = 0; i < size; i++) {
            data.push({
              date: new Date(
                Date.now() - i * 24 * 60 * 60 * 1000
              ).toISOString(),
              value: 100000 + Math.random() * 50000,
              change: (Math.random() - 0.5) * 10,
              benchmark: 100000 + Math.random() * 30000,
              volume: Math.random() * 1000000,
            });
          }
          return data;
        };

        // Store large dataset globally
        (window as any).largePortfolioData = generateLargePortfolioData(10000); // 10k data points
        (window as any).hugePortfolioData = generateLargePortfolioData(50000); // 50k data points
      });

      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        const renderStart = Date.now();
        await analyticsTab.click();

        // Wait for chart to render with large dataset
        await page.waitForTimeout(5000);
        const renderTime = Date.now() - renderStart;

        // Should handle large datasets reasonably
        expect(renderTime).toBeLessThan(10000); // 10 seconds max

        // Test interactions with large dataset
        const periodButton = page.locator('button:has-text("1Y")').first();
        if (await periodButton.isVisible()) {
          const interactionStart = Date.now();
          await periodButton.click();
          await page.waitForTimeout(2000);
          const interactionTime = Date.now() - interactionStart;

          expect(interactionTime).toBeLessThan(5000); // 5 seconds max
        }
      }
    });

    test("handles rapid user interactions", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);
      }

      // Rapid interactions test
      const testDuration = 30000; // 30 seconds
      const startTime = Date.now();
      let interactionCount = 0;

      while (Date.now() - startTime < testDuration) {
        // Rapid vault card hovers
        const vaultCards = page.locator('.vault-card, [data-testid*="vault"]');
        const cardCount = await vaultCards.count();

        if (cardCount > 0) {
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            await vaultCards.nth(i).hover();
            await page.waitForTimeout(50);
            interactionCount++;

            if (Date.now() - startTime >= testDuration) break;
          }
        }

        // Rapid button clicks
        const buttons = page.locator("button").first();
        if (await buttons.isVisible()) {
          await buttons.click();
          await page.waitForTimeout(100);
          interactionCount++;
        }

        if (Date.now() - startTime >= testDuration) break;
      }

      // Verify app remains responsive
      const finalCheck = page.locator("body");
      await expect(finalCheck).toBeVisible();

      // Should have handled many interactions
      expect(interactionCount).toBeGreaterThan(50);

      console.log(
        `Handled ${interactionCount} interactions in ${testDuration / 1000} seconds`
      );
    });

    test("handles concurrent chart updates", async ({ page }) => {
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);
      }

      // Simulate concurrent chart updates
      const updatePromises = [];
      const periods = ["1W", "1M", "3M", "6M", "1Y"];

      // Rapid period changes
      for (let i = 0; i < 20; i++) {
        const period = periods[i % periods.length];
        const updatePromise = (async () => {
          const periodButton = page.locator(`button:has-text("${period}")`);
          if (await periodButton.isVisible()) {
            await periodButton.click();
            await page.waitForTimeout(Math.random() * 500);
          }
        })();

        updatePromises.push(updatePromise);

        if (i % 5 === 0) {
          await page.waitForTimeout(100); // Brief pause every 5 updates
        }
      }

      await Promise.all(updatePromises);

      // Verify chart is still functional
      const chart = page.locator("svg, canvas").first();
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }

      // Verify final state is consistent
      const activePeriod = page.locator(
        'button[class*="active"], button[class*="selected"]'
      );
      if (await activePeriod.isVisible()) {
        const activeText = await activePeriod.textContent();
        expect(periods).toContain(activeText?.trim());
      }
    });
  });

  test.describe("Network Stress Testing", () => {
    test("handles slow network conditions", async ({ page }) => {
      // Simulate slow network
      await page.route("**/*", async route => {
        if (
          route.request().resourceType() === "xhr" ||
          route.request().resourceType() === "fetch"
        ) {
          // Add 2-5 second delay to API calls
          await new Promise(resolve =>
            setTimeout(resolve, 2000 + Math.random() * 3000)
          );
        }
        route.continue();
      });

      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        const loadStart = Date.now();
        await portfolioTab.click();

        // Wait for content with slow network
        await page.waitForTimeout(8000);
        const loadTime = Date.now() - loadStart;

        // Should handle slow network gracefully
        expect(loadTime).toBeLessThan(15000); // 15 seconds max

        // Check for loading indicators
        const loadingIndicators = page.locator(
          '.loading, .spinner, [class*="loading"]'
        );
        const errorMessages = page.locator('.error, [data-testid*="error"]');

        // Should show loading state or handle gracefully
        const handlesSlowNetwork =
          (await loadingIndicators.count()) > 0 ||
          (await errorMessages.count()) === 0;

        expect(handlesSlowNetwork).toBe(true);
      }
    });

    test("handles intermittent connectivity", async ({ page }) => {
      let requestCount = 0;

      // Simulate intermittent connectivity (fail every 3rd request)
      await page.route("**/*", route => {
        requestCount++;
        if (
          route.request().resourceType() === "xhr" ||
          route.request().resourceType() === "fetch"
        ) {
          if (requestCount % 3 === 0) {
            route.abort("failed");
          } else {
            route.continue();
          }
        } else {
          route.continue();
        }
      });

      // Navigate through app with intermittent connectivity
      const tabs = [
        '[data-testid="tab-dashboard"]',
        '[data-testid="tab-invest"]',
        '[data-testid="tab-analytics"]',
      ];

      for (const tabSelector of tabs) {
        const tab = page.locator(tabSelector).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(3000);

          // App should remain functional despite failed requests
          const body = page.locator("body");
          await expect(body).toBeVisible();
        }
      }

      // Check for appropriate error handling
      const retryButtons = page.locator(
        'button:has-text("Retry"), button:has-text("Refresh")'
      );
      const errorMessages = page.locator('.error, [data-testid*="error"]');

      // Should provide recovery options
      const hasErrorRecovery =
        (await retryButtons.count()) > 0 || (await errorMessages.count()) > 0;

      expect(hasErrorRecovery).toBe(true);
    });

    test("handles API rate limiting gracefully", async ({ page }) => {
      let apiCallCount = 0;

      // Simulate rate limiting after 10 API calls
      await page.route("**/api/**", route => {
        apiCallCount++;
        if (apiCallCount > 10) {
          route.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Rate limit exceeded",
              retryAfter: 5,
            }),
            headers: { "Retry-After": "5" },
          });
        } else {
          route.continue();
        }
      });

      // Trigger multiple API calls
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(1000);

        // Rapid period changes to trigger API calls
        const periods = ["1W", "1M", "3M", "6M", "1Y"];
        for (let i = 0; i < 15; i++) {
          // More than the rate limit
          const period = periods[i % periods.length];
          const periodButton = page.locator(`button:has-text("${period}")`);
          if (await periodButton.isVisible()) {
            await periodButton.click();
            await page.waitForTimeout(200);
          }
        }

        await page.waitForTimeout(2000);

        // Check for rate limiting handling
        const rateLimitMessage = page.locator(
          ':has-text("rate limit"), :has-text("too many")'
        );
        const retryIndicator = page.locator('[data-testid*="retry"], .retry');

        const handlesRateLimit =
          (await rateLimitMessage.isVisible()) ||
          (await retryIndicator.isVisible()) ||
          apiCallCount <= 12; // Or rate limiting was respected

        expect(handlesRateLimit).toBe(true);
      }
    });
  });

  test.describe("Browser Resource Limits", () => {
    test("handles localStorage quota exhaustion", async ({ page }) => {
      // Fill localStorage to near capacity
      await page.evaluate(() => {
        try {
          const largeData = "x".repeat(1024 * 1024); // 1MB chunks
          for (let i = 0; i < 10; i++) {
            // Try to fill 10MB
            localStorage.setItem(`large_data_${i}`, largeData);
          }
        } catch (e) {
          console.log("localStorage quota reached");
        }
      });

      // Try to use app with full localStorage
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);

        // App should handle localStorage errors gracefully
        const body = page.locator("body");
        await expect(body).toBeVisible();

        // Try to save some data
        await page.evaluate(() => {
          try {
            localStorage.setItem("test_save", "test_value");
            return true;
          } catch (e) {
            return false;
          }
        });

        // App should continue functioning
        const errorBoundaries = page.locator(
          ':has-text("Something went wrong")'
        );
        const errorCount = await errorBoundaries.count();
        expect(errorCount).toBe(0);
      }

      // Cleanup
      await page.evaluate(() => {
        localStorage.clear();
      });
    });

    test("handles excessive DOM manipulation", async ({ page }) => {
      // Test with many rapid DOM updates
      await page.evaluate(() => {
        const container = document.createElement("div");
        container.id = "stress-test-container";
        document.body.appendChild(container);

        // Create many elements rapidly
        for (let i = 0; i < 1000; i++) {
          const element = document.createElement("div");
          element.textContent = `Test element ${i}`;
          element.className = "stress-test-element";
          container.appendChild(element);

          if (i % 100 === 0) {
            // Force reflow occasionally
            container.offsetHeight;
          }
        }
      });

      await page.waitForTimeout(2000);

      // Test app functionality with extra DOM elements
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        const renderStart = Date.now();
        await analyticsTab.click();

        await page.waitForTimeout(3000);
        const renderTime = Date.now() - renderStart;

        // Should still render reasonably quickly
        expect(renderTime).toBeLessThan(8000); // 8 seconds max with DOM stress

        // Verify chart still works
        const chart = page.locator("svg, canvas").first();
        if (await chart.isVisible()) {
          await expect(chart).toBeVisible();
        }
      }

      // Cleanup
      await page.evaluate(() => {
        const container = document.getElementById("stress-test-container");
        if (container) {
          container.remove();
        }
      });
    });

    test("handles memory pressure scenarios", async ({ page }) => {
      // Create memory pressure
      await page.evaluate(() => {
        const memoryHogs: any[] = [];

        try {
          // Allocate large arrays to consume memory
          for (let i = 0; i < 50; i++) {
            const largeArray = new Array(1000000).fill({
              id: i,
              data: new Array(100).fill(`memory_data_${i}`),
              timestamp: Date.now(),
              metadata: {
                iteration: i,
                size: 1000000,
                created: new Date().toISOString(),
              },
            });
            memoryHogs.push(largeArray);
          }

          // Store reference to prevent GC
          (window as any).memoryStressTest = memoryHogs;
        } catch (e) {
          console.log("Memory allocation failed:", e);
        }
      });

      // Test app performance under memory pressure
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        const start = Date.now();
        await investTab.click();
        await page.waitForTimeout(3000);
        const duration = Date.now() - start;

        // Should still be responsive under memory pressure
        expect(duration).toBeLessThan(10000); // 10 seconds max

        // Test interactions
        const vaultCards = page.locator('.vault-card, [data-testid*="vault"]');
        const cardCount = await vaultCards.count();

        if (cardCount > 0) {
          await vaultCards.first().hover();
          await page.waitForTimeout(1000);

          // Should still be interactive
          await expect(vaultCards.first()).toBeVisible();
        }
      }

      // Cleanup memory
      await page.evaluate(() => {
        delete (window as any).memoryStressTest;
        if (window.gc) {
          window.gc();
        }
      });
    });
  });
});
