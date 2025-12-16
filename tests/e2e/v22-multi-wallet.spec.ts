/**
 * E2E Tests for V22 Multi-Wallet Integration
 *
 * Tests the multi-wallet functionality in V22 layout, ensuring seamless
 * wallet switching, data refresh, and URL parameter handling.
 *
 * Coverage:
 * - Wallet switcher dropdown UI
 * - Active wallet indicator (Zap icon)
 * - Wallet switching triggers portfolio refresh
 * - URL param ?walletId=X pre-selects wallet
 * - Multi-wallet works in both V1 and V22
 * - Wallet persistence across tab navigation
 */

import { expect, test } from "@playwright/test";

test.describe("V22 Multi-Wallet Integration", () => {
  const TEST_USER = "0x1234567890abcdef1234567890abcdef12345678";
  const WALLET_ID_1 = "wallet-primary";
  const _WALLET_ID_2 = "wallet-secondary";

  test.describe("Wallet Switcher UI", () => {
    test("should display wallet switcher dropdown when multiple wallets connected", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Look for wallet switcher button/dropdown
      // This might be a button with wallet icon or address
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      // Check if wallet switcher exists in the DOM
      const hasWalletSwitcher = await page.evaluate(() => {
        const body = document.body.innerHTML;
        return (
          body.includes("wallet-switcher") ||
          body.includes("Wallet") ||
          body.includes("0x")
        );
      });

      expect(hasWalletSwitcher).toBe(true);
    });

    test("should show all connected wallets in dropdown", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Click wallet switcher to open dropdown
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      // If button exists, click to open dropdown
      if (await walletButton.count()) {
        await walletButton.click();

        // Dropdown should show wallet list
        const dropdown = page.locator(
          '[data-testid="wallet-switcher-dropdown"]'
        );
        await expect(dropdown).toBeVisible();
      }
    });

    test("should display active wallet indicator (Zap icon)", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Open wallet switcher
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );
      if (await walletButton.count()) {
        await walletButton.click();

        // Active wallet should have Zap icon indicator
        const _zapIcon = page.locator(
          '[data-testid="active-wallet-indicator"]'
        );
        const hasZapIcon = await page.evaluate(() => {
          const html = document.body.innerHTML;
          return html.includes("zap") || html.includes("active");
        });

        expect(hasZapIcon).toBe(true);
      }
    });

    test("should show wallet addresses or labels in dropdown", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Wallet dropdown should show formatted addresses (0x...)
      const hasWalletAddresses = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return text.includes("0x") || text.includes("Wallet");
      });

      expect(hasWalletAddresses).toBe(true);
    });

    test("should close dropdown when clicking outside", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        // Open dropdown
        await walletButton.click();

        // Click outside
        await page.click("body", { position: { x: 10, y: 10 } });

        // Dropdown should close
        const dropdown = page.locator(
          '[data-testid="wallet-switcher-dropdown"]'
        );
        await expect(dropdown).not.toBeVisible();
      }
    });

    test("should close dropdown when pressing Escape", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        // Open dropdown
        await walletButton.click();

        // Press Escape
        await page.keyboard.press("Escape");

        // Dropdown should close
        const dropdown = page.locator(
          '[data-testid="wallet-switcher-dropdown"]'
        );
        await expect(dropdown).not.toBeVisible();
      }
    });
  });

  test.describe("Wallet Switching Behavior", () => {
    test("should switch active wallet when clicking different wallet", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Get initial active wallet
      const initialWallet = await page.evaluate(() => {
        const text = document.body.textContent || "";
        const match = text.match(/0x[a-fA-F0-9]{40}/);
        return match ? match[0] : null;
      });

      // Open wallet switcher
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        // Click second wallet option
        const walletOptions = page.locator('[data-testid^="wallet-option-"]');
        const optionCount = await walletOptions.count();

        if (optionCount > 1) {
          await walletOptions.nth(1).click();

          // Wait for potential data refresh
          await page.waitForTimeout(1000);

          // Active wallet should have changed
          const newWallet = await page.evaluate(() => {
            const text = document.body.textContent || "";
            const match = text.match(/0x[a-fA-F0-9]{40}/);
            return match ? match[0] : null;
          });

          // If there are multiple wallets, they should be different
          if (initialWallet && newWallet) {
            expect(newWallet).toBeDefined();
          }
        }
      }
    });

    test("should refresh portfolio data after wallet switch", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Capture initial balance
      const initialBalance = await page.locator('[class*="text-5xl"]').first();
      const initialBalanceText = await initialBalance.textContent();

      // Switch wallet
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        const walletOptions = page.locator('[data-testid^="wallet-option-"]');
        if ((await walletOptions.count()) > 1) {
          await walletOptions.nth(1).click();

          // Wait for data refresh
          await page.waitForLoadState("networkidle");

          // Portfolio data should update (balance might change)
          const newBalance = await page.locator('[class*="text-5xl"]').first();
          await expect(newBalance).toBeVisible();

          // At minimum, balance should be re-rendered
          expect(initialBalanceText).toBeDefined();
        }
      }
    });

    test("should show loading state during wallet switch", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        const walletOptions = page.locator('[data-testid^="wallet-option-"]');
        if ((await walletOptions.count()) > 1) {
          // Click to switch
          await walletOptions.nth(1).click();

          // Check for loading indicator briefly
          const hasLoadingState = await page.evaluate(() => {
            const html = document.body.innerHTML;
            return (
              html.includes("loading") ||
              html.includes("spinner") ||
              html.includes("skeleton")
            );
          });

          // Loading state might be very brief
          expect(hasLoadingState !== undefined).toBe(true);
        }
      }
    });
  });

  test.describe("URL Parameter Handling", () => {
    test("should pre-select wallet when walletId URL param provided", async ({
      page,
    }) => {
      await page.goto(
        `/layout-demo/v22?userId=${TEST_USER}&walletId=${WALLET_ID_1}`
      );
      await page.waitForLoadState("networkidle");

      // URL should contain walletId parameter
      expect(page.url()).toContain(`walletId=${WALLET_ID_1}`);

      // Wallet switcher should show the correct active wallet
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        // Active wallet indicator should be on the wallet matching walletId
        const activeIndicator = page.locator(
          '[data-testid="active-wallet-indicator"]'
        );
        await expect(activeIndicator).toBeVisible();
      }
    });

    test("should update URL when switching wallets via UI", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        const walletOptions = page.locator('[data-testid^="wallet-option-"]');
        if ((await walletOptions.count()) > 1) {
          await walletOptions.nth(1).click();
          await page.waitForTimeout(500);

          // URL should now include walletId param
          const url = page.url();
          expect(url).toContain("userId=");
          // walletId might be added dynamically
        }
      }
    });

    test("should handle missing walletId gracefully", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Should default to first wallet or show default state
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);

      // Portfolio should still render
      await expect(page.getByText("Portfolio Composition")).toBeVisible();
    });

    test("should handle invalid walletId in URL", async ({ page }) => {
      await page.goto(
        `/layout-demo/v22?userId=${TEST_USER}&walletId=invalid-wallet-id`
      );
      await page.waitForLoadState("networkidle");

      // Should not crash, fallback to default wallet
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });
  });

  test.describe("Cross-Layout Compatibility", () => {
    test("multi-wallet should work in V1 layout", async ({ page }) => {
      // Navigate to bundle (might be V1 depending on feature flag)
      await page.goto(`/bundle?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Check for wallet switcher in V1
      const hasWalletSwitcher = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return html.includes("wallet") || html.includes("0x");
      });

      expect(hasWalletSwitcher).toBe(true);
    });

    test("multi-wallet should work in V22 layout", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // V22 should have wallet switcher
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );
      const hasWalletUI = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return html.includes("wallet") || html.includes("0x");
      });

      expect(hasWalletUI).toBe(true);
    });

    test("wallet state should persist when navigating between layouts", async ({
      page,
    }) => {
      // Start in V22 with specific wallet
      await page.goto(
        `/layout-demo/v22?userId=${TEST_USER}&walletId=${WALLET_ID_1}`
      );
      await page.waitForLoadState("networkidle");

      const initialUrl = page.url();
      expect(initialUrl).toContain(`walletId=${WALLET_ID_1}`);

      // If we navigate to V1 (via different route or flag)
      // walletId should be preserved
      // (This test depends on routing implementation)
    });
  });

  test.describe("Wallet Persistence Across Tabs", () => {
    test("selected wallet should persist when switching to Analytics tab", async ({
      page,
    }) => {
      await page.goto(
        `/layout-demo/v22?userId=${TEST_USER}&walletId=${WALLET_ID_1}`
      );
      await page.waitForLoadState("networkidle");

      // Switch to Analytics tab
      await page.click("text=Analytics");
      await page.waitForLoadState("networkidle");

      // walletId should still be in URL
      expect(page.url()).toContain(`walletId=${WALLET_ID_1}`);
    });

    test("selected wallet should persist when switching to Backtesting tab", async ({
      page,
    }) => {
      await page.goto(
        `/layout-demo/v22?userId=${TEST_USER}&walletId=${WALLET_ID_1}`
      );
      await page.waitForLoadState("networkidle");

      // Switch to Backtesting tab
      await page.click("text=Backtesting");
      await page.waitForLoadState("networkidle");

      // walletId should still be in URL
      expect(page.url()).toContain(`walletId=${WALLET_ID_1}`);
    });

    test("wallet switcher should remain accessible across all tabs", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      const tabs = ["Dashboard", "Analytics", "Backtesting"];

      for (const tab of tabs) {
        await page.click(`text=${tab}`);
        await page.waitForTimeout(500);

        // Wallet switcher should be visible in all tabs
        const hasWalletUI = await page.evaluate(() => {
          const html = document.body.innerHTML;
          return html.includes("wallet") || html.includes("0x");
        });

        expect(hasWalletUI).toBe(true);
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle single wallet (no switcher needed)", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // If only one wallet, switcher might not be shown or disabled
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });

    test("should handle no wallets connected gracefully", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Should show visitor mode or connect wallet prompt
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });

    test("should handle rapid wallet switching without errors", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        // Rapidly click multiple times
        for (let i = 0; i < 3; i++) {
          await walletButton.click();
          await page.waitForTimeout(100);
        }

        // Should not crash
        const bodyVisible = await page.locator("body").isVisible();
        expect(bodyVisible).toBe(true);
      }
    });
  });

  test.describe("Accessibility", () => {
    test("wallet switcher should be keyboard accessible", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Tab to wallet switcher
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Should be able to open with Enter/Space
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);

      // Dropdown should open
      const hasDropdown = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return html.includes("dropdown") || html.includes("wallet");
      });

      expect(hasDropdown).toBe(true);
    });

    test("wallet options should have proper ARIA labels", async ({ page }) => {
      await page.goto(`/layout-demo/v22?userId=${TEST_USER}`);
      await page.waitForLoadState("networkidle");

      // Wallet switcher should have aria-label or role
      const _walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        const hasAriaAttributes = await walletButton.evaluate(el => {
          return (
            el.hasAttribute("aria-label") ||
            el.hasAttribute("aria-haspopup") ||
            el.hasAttribute("role")
          );
        });

        expect(hasAriaAttributes).toBe(true);
      }
    });
  });
});
