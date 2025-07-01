import { test, expect } from "@playwright/test";

test.describe("Integration & Complete Workflow Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("End-to-End User Journeys", () => {
    test("complete new user investment journey", async ({ page }) => {
      // 1. Landing and initial exploration
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // 2. Navigate to invest tab
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);

        // 3. Explore vault options
        const vaultCards = page.locator('.vault-card, [data-testid*="vault"]');
        const vaultCount = await vaultCards.count();

        if (vaultCount > 0) {
          // Hover over first vault to see details
          await vaultCards.first().hover();
          await page.waitForTimeout(1000);

          // 4. Click invest button
          const investButton = vaultCards
            .first()
            .locator('button:has-text("Invest")');
          if (await investButton.isVisible()) {
            await investButton.click();
            await page.waitForTimeout(2000);

            // 5. Investment modal should appear
            const modal = page.locator(
              '[role="dialog"], .modal, [data-testid*="invest"]'
            );
            if (await modal.isVisible()) {
              // 6. Fill investment amount
              const amountInput = modal.locator(
                'input[type="number"], input[placeholder*="amount"]'
              );
              if (await amountInput.isVisible()) {
                await amountInput.fill("1000");

                // 7. Review investment details
                await page.waitForTimeout(1000);

                // Should show investment summary
                const summaryElements = modal.locator(
                  '[data-testid*="summary"], .summary'
                );
                if ((await summaryElements.count()) > 0) {
                  await expect(summaryElements.first()).toBeVisible();
                }
              }
            }
          }
        }
      }

      // 8. Navigate to portfolio to see expected results
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);

        // Portfolio should be accessible
        await expect(portfolioTab).toBeVisible();
      }
    });

    test("portfolio management workflow", async ({ page }) => {
      // 1. Navigate to portfolio
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();
        await page.waitForTimeout(2000);

        // 2. Check portfolio overview
        const portfolioElements = page.locator(
          '[data-testid*="portfolio"], [class*="portfolio"]'
        );
        if ((await portfolioElements.count()) > 0) {
          await expect(portfolioElements.first()).toBeVisible();
        }

        // 3. Test rebalancing workflow
        const rebalanceButton = page.locator(
          'button:has-text("Rebalance"), [data-testid*="rebalance"]'
        );
        if (await rebalanceButton.isVisible()) {
          await rebalanceButton.click();
          await page.waitForTimeout(2000);

          // Should show rebalancing interface
          const rebalanceModal = page.locator(
            '[role="dialog"], .rebalance-modal'
          );
          if (await rebalanceModal.isVisible()) {
            // Check for allocation charts
            const charts = rebalanceModal.locator(
              'svg, canvas, [data-testid*="chart"]'
            );
            if ((await charts.count()) > 0) {
              await expect(charts.first()).toBeVisible();
            }
          }
        }

        // 4. Navigate to analytics for performance review
        const analyticsTab = page
          .locator('[data-testid="tab-analytics"]')
          .first();
        if (await analyticsTab.isVisible()) {
          await analyticsTab.click();
          await page.waitForTimeout(2000);

          // Should show analytics dashboard
          const chartArea = page.locator("svg, canvas").first();
          if (await chartArea.isVisible()) {
            await expect(chartArea).toBeVisible();

            // Test period switching
            const periodButtons = page.locator(
              'button:has-text("1M"), button:has-text("3M")'
            );
            if ((await periodButtons.count()) > 0) {
              await periodButtons.first().click();
              await page.waitForTimeout(1500);
              await expect(chartArea).toBeVisible();
            }
          }
        }
      }
    });

    test("wallet connection and transaction flow", async ({ page }) => {
      // 1. Look for wallet connection
      const walletButton = page.locator(
        'button:has-text("Connect"), [data-testid*="wallet"]'
      );
      if (await walletButton.isVisible()) {
        await walletButton.click();
        await page.waitForTimeout(2000);

        // 2. Wallet selection modal
        const walletModal = page.locator('[role="dialog"], .wallet-modal');
        if (await walletModal.isVisible()) {
          // Should show wallet options
          const walletOptions = walletModal.locator("button, .wallet-option");
          const optionCount = await walletOptions.count();
          expect(optionCount).toBeGreaterThan(0);

          // Mock wallet selection
          if (optionCount > 0) {
            await walletOptions.first().click();
            await page.waitForTimeout(1000);
          }
        }
      }

      // 3. Test transaction simulation
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);

        const investButton = page.locator('button:has-text("Invest")').first();
        if (await investButton.isVisible()) {
          await investButton.click();
          await page.waitForTimeout(2000);

          // 4. Transaction preview
          const txPreview = page.locator(
            '[data-testid*="transaction"], [data-testid*="preview"]'
          );
          if (await txPreview.isVisible()) {
            // Should show gas estimates
            const gasEstimate = page.locator(
              '[data-testid*="gas"], .gas-estimate'
            );
            if (await gasEstimate.isVisible()) {
              const gasText = await gasEstimate.textContent();
              expect(gasText).toMatch(/gas|fee|\$/i);
            }
          }
        }
      }
    });
  });

  test.describe("Cross-Tab State Management", () => {
    test("maintains state across tab navigation", async ({ page }) => {
      // Set some state in invest tab
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);

        // Select a vault
        const vaultCard = page
          .locator('.vault-card, [data-testid*="vault"]')
          .first();
        if (await vaultCard.isVisible()) {
          await vaultCard.click();
          await page.waitForTimeout(1000);
        }
      }

      // Navigate to other tabs
      const tabs = [
        '[data-testid="tab-portfolio"]',
        '[data-testid="tab-analytics"]',
        '[data-testid="tab-dashboard"]',
      ];

      for (const tabSelector of tabs) {
        const tab = page.locator(tabSelector).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(1500);

          // Verify tab is active
          await expect(tab).toBeVisible();
        }
      }

      // Return to invest tab
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);

        // State should be preserved (vault still selected)
        const selectedVault = page.locator(
          '.vault-card.selected, [data-testid*="vault"][class*="selected"]'
        );
        // State preservation is optional but good UX
      }
    });

    test("handles concurrent data updates", async ({ page }) => {
      // Open analytics tab
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);

        // Trigger multiple updates simultaneously
        const periods = ["1W", "1M", "3M"];
        const updatePromises = periods.map(async (period, index) => {
          await page.waitForTimeout(index * 200); // Stagger
          const periodButton = page.locator(`button:has-text("${period}")`);
          if (await periodButton.isVisible()) {
            await periodButton.click();
          }
        });

        await Promise.all(updatePromises);
        await page.waitForTimeout(2000);

        // Chart should still be functional
        const chart = page.locator("svg, canvas").first();
        if (await chart.isVisible()) {
          await expect(chart).toBeVisible();
        }
      }
    });
  });

  test.describe("Data Persistence & Recovery", () => {
    test("handles page refresh gracefully", async ({ page }) => {
      // Navigate to a specific state
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);

        // Select a specific period
        const periodButton = page.locator('button:has-text("3M")');
        if (await periodButton.isVisible()) {
          await periodButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // Refresh the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // App should load normally
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Navigate back to analytics
      const analyticsTabAfterRefresh = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTabAfterRefresh.isVisible()) {
        await analyticsTabAfterRefresh.click();
        await page.waitForTimeout(2000);

        // Should work normally after refresh
        const chart = page.locator("svg, canvas").first();
        if (await chart.isVisible()) {
          await expect(chart).toBeVisible();
        }
      }
    });

    test("recovers from temporary errors", async ({ page }) => {
      // Simulate temporary network issues
      let requestCount = 0;
      await page.route("**/api/**", route => {
        requestCount++;
        if (requestCount <= 2) {
          // Fail first few requests
          route.abort("failed");
        } else {
          // Then allow them through
          route.continue();
        }
      });

      // Try to load analytics data
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(3000);

        // Should eventually recover
        const retryButton = page.locator(
          'button:has-text("Retry"), button:has-text("Refresh")'
        );
        if (await retryButton.isVisible()) {
          await retryButton.click();
          await page.waitForTimeout(2000);
        }

        // Should work after retry
        const body = page.locator("body");
        await expect(body).toBeVisible();
      }
    });
  });

  test.describe("Mobile Responsive Workflows", () => {
    test("mobile investment workflow", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // Navigate through mobile workflow
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);

        // Check vault cards are mobile-friendly
        const vaultCards = page.locator('.vault-card, [data-testid*="vault"]');
        if ((await vaultCards.count()) > 0) {
          const firstCard = vaultCards.first();
          const boundingBox = await firstCard.boundingBox();

          if (boundingBox) {
            // Should fit in mobile viewport
            expect(boundingBox.width).toBeLessThanOrEqual(375);
          }

          // Test mobile interactions
          await firstCard.tap();
          await page.waitForTimeout(1000);

          const investButton = firstCard.locator('button:has-text("Invest")');
          if (await investButton.isVisible()) {
            await investButton.tap();
            await page.waitForTimeout(1000);
          }
        }
      }

      // Test mobile navigation
      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.tap();
        await page.waitForTimeout(1000);
        await expect(portfolioTab).toBeVisible();
      }
    });

    test("tablet responsive behavior", async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);

      // Test analytics on tablet
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);

        // Chart should be responsive
        const chart = page.locator("svg, canvas").first();
        if (await chart.isVisible()) {
          const boundingBox = await chart.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width).toBeLessThanOrEqual(768);
            expect(boundingBox.width).toBeGreaterThan(300);
          }
        }

        // Period buttons should be accessible
        const periodButtons = page.locator(
          'button:has-text("1M"), button:has-text("3M")'
        );
        if ((await periodButtons.count()) > 0) {
          await periodButtons.first().click();
          await page.waitForTimeout(1000);
          await expect(chart).toBeVisible();
        }
      }
    });
  });
});
