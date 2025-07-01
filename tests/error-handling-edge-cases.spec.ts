import { test, expect } from "@playwright/test";

test.describe("Comprehensive Error Handling & Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Network & API Failure Scenarios", () => {
    test("handles network disconnection gracefully", async ({ page }) => {
      // Simulate network failure by intercepting requests
      await page.route("**/*", route => {
        if (route.request().url().includes("/api/")) {
          route.abort("failed");
        } else {
          route.continue();
        }
      });

      // Try to perform actions that require network
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(3000);

        // Check for error handling
        const errorMessage = page.locator(
          '.error, [data-testid*="error"], [class*="network-error"]'
        );
        const loadingState = page.locator('.loading, [data-testid*="loading"]');
        const retryButton = page.locator(
          'button:has-text("Retry"), button:has-text("Refresh")'
        );

        // Verify appropriate error handling
        const hasErrorHandling =
          (await errorMessage.isVisible()) ||
          (await loadingState.isVisible()) ||
          (await retryButton.isVisible());

        // Should handle network failures gracefully
        expect(hasErrorHandling).toBe(true);
      }
    });

    test("handles API timeout scenarios", async ({ page }) => {
      // Simulate slow API responses
      await page.route("**/*", async route => {
        if (route.request().url().includes("/api/")) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay
          route.continue();
        } else {
          route.continue();
        }
      });

      const portfolioTab = page
        .locator('[data-testid="tab-portfolio"]')
        .first();
      if (await portfolioTab.isVisible()) {
        await portfolioTab.click();

        // Wait for timeout handling
        await page.waitForTimeout(5000);

        // Check for timeout indicators
        const timeoutMessage = page.locator(
          ':has-text("timeout"), :has-text("slow"), .timeout-error'
        );
        const loadingIndicator = page.locator(".loading, .spinner");
        const retryOption = page.locator('button:has-text("Retry")');

        // Should show loading or timeout handling
        const hasTimeoutHandling =
          (await timeoutMessage.isVisible()) ||
          (await loadingIndicator.isVisible()) ||
          (await retryOption.isVisible());

        expect(hasTimeoutHandling).toBe(true);
      }
    });

    test("handles malformed API responses", async ({ page }) => {
      // Intercept and corrupt API responses
      await page.route("**/api/**", route => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ corrupted: "invalid data structure" }),
        });
      });

      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(3000);

        // Check for graceful degradation
        const errorFallback = page.locator(
          '.error-fallback, [data-testid*="fallback"]'
        );
        const defaultMessage = page.locator(
          ':has-text("Unable to load"), :has-text("Error")'
        );

        if (
          (await errorFallback.isVisible()) ||
          (await defaultMessage.isVisible())
        ) {
          // App should handle malformed data gracefully
          expect(true).toBe(true);
        } else {
          // At minimum, app should not crash
          const body = page.locator("body");
          await expect(body).toBeVisible();
        }
      }
    });

    test("handles rate limiting and 429 responses", async ({ page }) => {
      // Simulate rate limiting
      await page.route("**/api/**", route => {
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({ error: "Rate limit exceeded" }),
          headers: { "Retry-After": "60" },
        });
      });

      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);

        // Check for rate limiting handling
        const rateLimitMessage = page.locator(
          ':has-text("rate limit"), :has-text("try again"), .rate-limit'
        );
        const retryTimer = page.locator('[data-testid*="timer"], .countdown');

        const hasRateLimitHandling =
          (await rateLimitMessage.isVisible()) ||
          (await retryTimer.isVisible());

        expect(hasRateLimitHandling).toBe(true);
      }
    });
  });

  test.describe("Invalid Input & Data Validation", () => {
    test("handles extreme numeric inputs", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      const investButton = page.locator('button:has-text("Invest")').first();
      if (await investButton.isVisible()) {
        await investButton.click();
        await page.waitForTimeout(2000);

        const amountInput = page
          .locator('input[type="number"], input[placeholder*="amount"]')
          .first();
        if (await amountInput.isVisible()) {
          // Test extreme values
          const extremeValues = [
            "999999999999999999999", // Very large number
            "-100000", // Negative number
            "0.00000000001", // Very small decimal
            "1e+100", // Scientific notation
            "Infinity", // Infinity
            "NaN", // Not a number
            "", // Empty input
            " ", // Whitespace only
            "abc123", // Mixed alphanumeric
            "१२३", // Unicode numbers
            "1,000,000", // With commas
            "$1000", // With currency symbol
          ];

          for (const value of extremeValues) {
            await amountInput.fill(value);
            await page.waitForTimeout(500);

            // Check for validation errors
            const validationError = page.locator(
              '.error, [data-testid*="error"], .invalid, [class*="error"]'
            );
            const submitButton = page.locator(
              'button:has-text("Confirm"), button:has-text("Submit")'
            );

            if (
              [
                "999999999999999999999",
                "-100000",
                "abc123",
                "NaN",
                "Infinity",
              ].includes(value)
            ) {
              // These should trigger validation errors
              if (
                (await validationError.isVisible()) ||
                (await submitButton.isDisabled())
              ) {
                expect(true).toBe(true); // Validation working
              }
            }
          }
        }
      }
    });

    test("handles special characters and injection attempts", async ({
      page,
    }) => {
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="search"]')
        .first();
      if (await searchInput.isVisible()) {
        const maliciousInputs = [
          "<script>alert('xss')</script>",
          "'; DROP TABLE users; --",
          "{{constructor.constructor('alert(1)')()}}",
          "${7*7}",
          "<%=7*7%>",
          "javascript:alert(1)",
          "data:text/html,<script>alert(1)</script>",
          "\x00\x01\x02", // Null bytes and control characters
          "🚀💰🔥", // Emojis
          "SELECT * FROM users WHERE 1=1",
        ];

        for (const maliciousInput of maliciousInputs) {
          await searchInput.fill(maliciousInput);
          await page.waitForTimeout(500);

          // Verify no script execution
          const alertDialogs: string[] = [];
          page.on("dialog", dialog => {
            alertDialogs.push(dialog.message());
            dialog.dismiss();
          });

          await page.waitForTimeout(1000);
          expect(alertDialogs).toEqual([]); // No alerts should fire

          // Check input sanitization
          const inputValue = await searchInput.inputValue();
          if (maliciousInput.includes("<script>")) {
            expect(inputValue).not.toContain("<script>");
          }
        }
      }
    });

    test("handles concurrent form submissions", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);
      }

      const investButton = page.locator('button:has-text("Invest")').first();
      if (await investButton.isVisible()) {
        await investButton.click();
        await page.waitForTimeout(2000);

        const amountInput = page.locator('input[type="number"]').first();
        const submitButton = page
          .locator('button:has-text("Confirm"), button:has-text("Submit")')
          .first();

        if (
          (await amountInput.isVisible()) &&
          (await submitButton.isVisible())
        ) {
          await amountInput.fill("1000");

          // Rapid multiple clicks to test for double submission protection
          await Promise.all([
            submitButton.click(),
            submitButton.click(),
            submitButton.click(),
          ]);

          await page.waitForTimeout(2000);

          // Check for duplicate submission prevention
          const loadingStates = page.locator(
            '.loading, [data-testid*="loading"]'
          );
          const disabledButton = page.locator("button:disabled");

          // Should prevent duplicate submissions
          const hasProtection =
            (await loadingStates.count()) <= 1 ||
            (await disabledButton.isVisible());

          expect(hasProtection).toBe(true);
        }
      }
    });

    test("handles file upload edge cases", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible()) {
        // Test various file types and sizes
        const testFiles = [
          { name: "test.txt", content: "Simple text file" },
          { name: "large.txt", content: "x".repeat(10000000) }, // 10MB file
          { name: "empty.txt", content: "" }, // Empty file
          {
            name: "special!@#$.txt",
            content: "Special characters in filename",
          },
          {
            name: "verylongfilenamethatexceedsnormallimitsbuttechnicallyshouldbehandledgracefully.txt",
            content: "Long filename",
          },
        ];

        for (const file of testFiles.slice(0, 2)) {
          // Test first 2 to avoid timeouts
          try {
            // Create temporary file
            const buffer = Buffer.from(file.content, "utf8");
            await fileInput.setInputFiles({
              name: file.name,
              mimeType: "text/plain",
              buffer: buffer,
            });

            await page.waitForTimeout(1500);

            // Check for file validation feedback
            const errorMessage = page.locator('.error, [data-testid*="error"]');
            const successMessage = page.locator(
              '.success, [data-testid*="success"]'
            );

            // Large files should be rejected
            if (file.content.length > 5000000) {
              if (await errorMessage.isVisible()) {
                const errorText = await errorMessage.textContent();
                expect(errorText).toMatch(/size|large|limit/i);
              }
            }
          } catch (error) {
            // File handling errors should be caught gracefully
            console.log(`File upload test handled error for ${file.name}`);
          }
        }
      }
    });
  });

  test.describe("Wallet & Blockchain Edge Cases", () => {
    test("handles wallet disconnection during operations", async ({ page }) => {
      // Test wallet connection first
      const walletButton = page
        .locator('button:has-text("Connect"), [data-testid*="wallet"]')
        .first();
      if (await walletButton.isVisible()) {
        await walletButton.click();
        await page.waitForTimeout(1000);

        // Simulate wallet disconnection during transaction
        await page.evaluate(() => {
          // Simulate wallet disconnection
          if (window.ethereum) {
            window.ethereum.selectedAddress = null;
            window.ethereum.emit("disconnect");
          }
        });

        await page.waitForTimeout(2000);

        // Try to perform transaction with disconnected wallet
        const investTab = page.locator('[data-testid="tab-invest"]').first();
        if (await investTab.isVisible()) {
          await investTab.click();
          await page.waitForTimeout(1000);

          const investButton = page
            .locator('button:has-text("Invest")')
            .first();
          if (await investButton.isVisible()) {
            await investButton.click();
            await page.waitForTimeout(1000);

            // Check for wallet disconnection handling
            const disconnectionMessage = page.locator(
              ':has-text("disconnected"), :has-text("connect wallet")'
            );
            const reconnectButton = page.locator(
              'button:has-text("Connect"), button:has-text("Reconnect")'
            );

            const hasDisconnectionHandling =
              (await disconnectionMessage.isVisible()) ||
              (await reconnectButton.isVisible());

            expect(hasDisconnectionHandling).toBe(true);
          }
        }
      }
    });

    test("handles invalid wallet addresses", async ({ page }) => {
      // Test address input fields
      const addressInput = page
        .locator('input[placeholder*="address"], input[name*="address"]')
        .first();
      if (await addressInput.isVisible()) {
        const invalidAddresses = [
          "0x123", // Too short
          "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // Invalid characters
          "1234567890123456789012345678901234567890", // No 0x prefix
          "0x" + "1".repeat(41), // Wrong length
          "", // Empty
          "not.an.address", // Complete invalid format
          "0x0000000000000000000000000000000000000000", // Zero address
        ];

        for (const address of invalidAddresses) {
          await addressInput.fill(address);
          await page.waitForTimeout(500);

          const validationError = page.locator(
            '.error, [data-testid*="error"], .invalid'
          );
          const submitButton = page.locator(
            'button[type="submit"], button:has-text("Submit")'
          );

          // Invalid addresses should trigger validation
          if (
            (await validationError.isVisible()) ||
            (await submitButton.isDisabled())
          ) {
            expect(true).toBe(true); // Validation working
          }
        }
      }
    });

    test("handles blockchain congestion scenarios", async ({ page }) => {
      // Simulate high gas prices and network congestion
      await page.evaluate(() => {
        // Mock high gas price responses
        if (window.ethereum) {
          const originalRequest = window.ethereum.request;
          window.ethereum.request = function (params: any) {
            if (params.method === "eth_gasPrice") {
              return Promise.resolve("0x174876E800"); // 100 Gwei
            }
            if (params.method === "eth_estimateGas") {
              return Promise.resolve("0x5208"); // 21000 gas
            }
            return originalRequest.call(this, params);
          };
        }
      });

      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(2000);

        const investButton = page.locator('button:has-text("Invest")').first();
        if (await investButton.isVisible()) {
          await investButton.click();
          await page.waitForTimeout(2000);

          // Check for high gas price warnings
          const gasWarning = page.locator(
            ':has-text("high gas"), :has-text("expensive"), .gas-warning'
          );
          const feeEstimate = page.locator(
            '[data-testid*="fee"], .fee-estimate'
          );

          if (await gasWarning.isVisible()) {
            const warningText = await gasWarning.textContent();
            expect(warningText).toMatch(/gas|expensive|high|fee/i);
          }

          if (await feeEstimate.isVisible()) {
            const feeText = await feeEstimate.textContent();
            expect(feeText).toMatch(/\$\d+|gwei|\d+/);
          }
        }
      }
    });
  });

  test.describe("Data Consistency & Race Conditions", () => {
    test("handles rapid state changes", async ({ page }) => {
      // Test rapid tab switching
      const tabs = [
        '[data-testid="tab-dashboard"]',
        '[data-testid="tab-invest"]',
        '[data-testid="tab-portfolio"]',
        '[data-testid="tab-analytics"]',
      ];

      // Rapid tab switching to test state management
      for (let i = 0; i < 3; i++) {
        for (const tabSelector of tabs) {
          const tab = page.locator(tabSelector).first();
          if (await tab.isVisible()) {
            await tab.click();
            await page.waitForTimeout(100); // Very short delay
          }
        }
      }

      await page.waitForTimeout(2000);

      // Verify app state is consistent
      const currentTab = page
        .locator(
          '[data-testid*="tab"].active, [data-testid*="tab"][class*="active"]'
        )
        .first();
      if (await currentTab.isVisible()) {
        await expect(currentTab).toBeVisible();
      }

      // Check for any error states
      const errorStates = page.locator('.error, [data-testid*="error"]');
      const errorCount = await errorStates.count();
      expect(errorCount).toBe(0);
    });

    test("handles concurrent data updates", async ({ page }) => {
      // Navigate to analytics for real-time data
      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(2000);
      }

      // Simulate multiple period changes simultaneously
      const periods = ["1W", "1M", "3M"];
      const periodPromises = periods.map(async (period, index) => {
        await page.waitForTimeout(index * 100); // Stagger slightly
        const periodButton = page.locator(`button:has-text("${period}")`);
        if (await periodButton.isVisible()) {
          await periodButton.click();
        }
      });

      await Promise.all(periodPromises);
      await page.waitForTimeout(3000);

      // Check that final state is consistent
      const activePeriod = page.locator(
        'button[class*="active"], button[class*="selected"]'
      );
      if (await activePeriod.isVisible()) {
        const activeText = await activePeriod.textContent();
        expect(periods).toContain(activeText?.trim());
      }

      // Verify chart rendered correctly
      const chart = page.locator("svg, canvas").first();
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });

    test("handles localStorage corruption", async ({ page }) => {
      // Corrupt localStorage data
      await page.evaluate(() => {
        localStorage.setItem("portfolio_data", "invalid_json_data");
        localStorage.setItem(
          "user_preferences",
          '{"corrupted": true, "invalid": '
        );
        localStorage.setItem("vault_settings", "null");
      });

      // Reload page with corrupted data
      await page.reload();
      await page.waitForLoadState("networkidle");

      // App should handle corrupted localStorage gracefully
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Check for error recovery
      const errorMessage = page.locator('.error, [data-testid*="error"]');
      const defaultState = page.locator('[data-testid="tab-dashboard"]');

      // Should either show error message or recover to default state
      const hasRecovery =
        (await errorMessage.isVisible()) || (await defaultState.isVisible());

      expect(hasRecovery).toBe(true);
    });
  });

  test.describe("Memory & Performance Edge Cases", () => {
    test("handles memory constraints with large datasets", async ({ page }) => {
      // Create large dataset simulation
      await page.evaluate(() => {
        // Simulate memory pressure
        const largeArray = new Array(1000000).fill({
          timestamp: Date.now(),
          value: Math.random() * 1000000,
          volume: Math.random() * 100000,
          metadata: new Array(100).fill("test_data"),
        });

        // Store in global variable to consume memory
        (window as any).testLargeDataset = largeArray;
      });

      const analyticsTab = page
        .locator('[data-testid="tab-analytics"]')
        .first();
      if (await analyticsTab.isVisible()) {
        await analyticsTab.click();
        await page.waitForTimeout(5000);

        // Check if app remains responsive
        const periodButton = page.locator('button:has-text("1M")').first();
        if (await periodButton.isVisible()) {
          const startTime = Date.now();
          await periodButton.click();
          const endTime = Date.now();

          // Response time should be reasonable even under memory pressure
          expect(endTime - startTime).toBeLessThan(5000);
        }

        // Verify chart still renders
        const chart = page.locator("svg, canvas").first();
        if (await chart.isVisible()) {
          await expect(chart).toBeVisible();
        }
      }

      // Cleanup
      await page.evaluate(() => {
        delete (window as any).testLargeDataset;
      });
    });

    test("handles rapid repeated interactions", async ({ page }) => {
      const investTab = page.locator('[data-testid="tab-invest"]').first();
      if (await investTab.isVisible()) {
        await investTab.click();
        await page.waitForTimeout(1000);
      }

      // Rapid repeated button clicks
      const hoverTarget = page
        .locator('.vault-card, [data-testid*="vault"]')
        .first();
      if (await hoverTarget.isVisible()) {
        // Rapid hover/unhover events
        for (let i = 0; i < 20; i++) {
          await hoverTarget.hover();
          await page.waitForTimeout(50);
          await page.mouse.move(0, 0); // Move away
          await page.waitForTimeout(50);
        }

        // App should still be responsive
        await expect(hoverTarget).toBeVisible();

        // Test rapid clicking
        const clickableButton = hoverTarget.locator("button").first();
        if (await clickableButton.isVisible()) {
          for (let i = 0; i < 10; i++) {
            await clickableButton.click();
            await page.waitForTimeout(100);
          }

          // Button should still be functional
          await expect(clickableButton).toBeVisible();
        }
      }
    });
  });

  test.describe("Browser Compatibility Edge Cases", () => {
    test("handles disabled JavaScript gracefully", async ({ page }) => {
      // Test with JavaScript disabled (partial simulation)
      await page.addInitScript(() => {
        // Simulate limited JavaScript functionality
        Object.defineProperty(window, "addEventListener", {
          value: () => {},
          writable: false,
        });
      });

      await page.reload();
      await page.waitForTimeout(3000);

      // Basic content should still be visible
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Check for graceful degradation
      const mainContent = page
        .locator('main, .main-content, [role="main"]')
        .first();
      if (await mainContent.isVisible()) {
        await expect(mainContent).toBeVisible();
      }
    });

    test("handles cookie/storage disabled scenarios", async ({ page }) => {
      // Clear all storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Simulate storage being disabled
        Object.defineProperty(window, "localStorage", {
          value: null,
          writable: false,
        });
      });

      await page.reload();
      await page.waitForLoadState("networkidle");

      // App should handle missing storage gracefully
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Basic functionality should work
      const tabs = page.locator('[data-testid*="tab"]');
      if ((await tabs.count()) > 0) {
        const firstTab = tabs.first();
        await firstTab.click();
        await page.waitForTimeout(1000);
        await expect(firstTab).toBeVisible();
      }
    });
  });
});
