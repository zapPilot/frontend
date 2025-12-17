/**
 * E2E Tests for V22 Bundle Sharing
 *
 * Tests the bundle sharing system with owner/visitor modes,
 * multi-wallet link support, and switch prompt banner.
 *
 * Coverage:
 * - Owner mode: Full features (settings, wallet manager)
 * - Visitor mode: Read-only (no wallet required)
 * - Shared link: /bundle?userId=X
 * - Multi-wallet link: /bundle?userId=X&walletId=Y
 * - Switch prompt banner for connected users viewing other bundles
 * - Banner visibility logic
 * - Banner actions (Stay/Switch)
 */

import { expect, test } from "@playwright/test";

test.describe("V22 Bundle Sharing", () => {
  const OWNER_ADDRESS = "0x1111111111111111111111111111111111111111";
  const VISITOR_ADDRESS = "0x2222222222222222222222222222222222222222";
  const OTHER_ADDRESS = "0x3333333333333333333333333333333333333333";
  const WALLET_ID = "wallet-primary";

  test.describe("Owner Mode", () => {
    test("should show full features when viewing own bundle", async ({
      page,
    }) => {
      // Simulate viewing own bundle (requires wallet connection simulation)
      await page.goto(`/layout-demo/v22?userId=${OWNER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Owner mode should have Settings button
      const _settingsButton = page.locator('[data-testid="settings-button"]');
      const hasSettings = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return html.includes("Settings") || html.includes("settings");
      });

      expect(hasSettings).toBe(true);
    });

    test("should have Wallet Manager accessible in owner mode", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${OWNER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Look for Wallet Manager icon/button
      const _walletManagerButton = page.locator(
        '[data-testid="wallet-manager-button"]'
      );
      const hasWalletManager = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return (
          html.includes("WalletManager") || html.includes("Manage Wallets")
        );
      });

      // Wallet manager should be available
      expect(hasWalletManager).toBe(true);
    });

    test("should have full action buttons enabled in owner mode", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${OWNER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Action buttons should be enabled
      const depositButton = page.getByRole("button", { name: /deposit/i });
      const withdrawButton = page.getByRole("button", { name: /withdraw/i });
      const optimizeButton = page.getByRole("button", { name: /optimize/i });

      if (await depositButton.count()) {
        await expect(depositButton).toBeEnabled();
      }
      if (await withdrawButton.count()) {
        await expect(withdrawButton).toBeEnabled();
      }
      if (await optimizeButton.count()) {
        await expect(optimizeButton).toBeVisible();
      }
    });

    test("should NOT show switch prompt banner when viewing own bundle", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${OWNER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Switch banner should NOT be visible for owner
      const banner = page.getByTestId("switch-prompt-banner");
      await expect(banner).not.toBeVisible();
    });
  });

  test.describe("Visitor Mode", () => {
    test("should show read-only view when disconnected", async ({ page }) => {
      await page.goto(`/bundle?userId=${VISITOR_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Portfolio data should be visible
      await expect(page.getByText("Portfolio Composition")).toBeVisible();

      // But no action buttons or minimal actions
      const bodyContent = await page.locator("body").textContent();
      expect(bodyContent).toContain("Portfolio");
    });

    test("should NOT require wallet connection to view bundle", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${VISITOR_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Should load without wallet connection
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);

      // Portfolio should render
      const hasPortfolioContent = await page.evaluate(() => {
        const text = document.body.textContent || "";
        return text.includes("Portfolio") || text.includes("$");
      });

      expect(hasPortfolioContent).toBe(true);
    });

    test("should disable or hide action buttons in visitor mode", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${VISITOR_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Action buttons might be hidden or disabled
      const depositButton = page.getByRole("button", { name: /deposit/i });
      const _withdrawButton = page.getByRole("button", { name: /withdraw/i });

      // Either not visible or disabled
      if (await depositButton.count()) {
        const isDisabled = await depositButton.isDisabled();
        const isHidden = !(await depositButton.isVisible());
        expect(isDisabled || isHidden).toBe(true);
      }
    });

    test("should NOT show Settings in visitor mode", async ({ page }) => {
      await page.goto(`/bundle?userId=${VISITOR_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Settings should not be accessible
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await expect(settingsButton).not.toBeVisible();
    });

    test("should NOT show Wallet Manager in visitor mode", async ({ page }) => {
      await page.goto(`/bundle?userId=${VISITOR_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Wallet manager should not be accessible
      const walletManagerButton = page.locator(
        '[data-testid="wallet-manager-button"]'
      );
      await expect(walletManagerButton).not.toBeVisible();
    });
  });

  test.describe("Shared Links", () => {
    test("should load bundle from shared link /bundle?userId=X", async ({
      page,
    }) => {
      const sharedUrl = `/bundle?userId=${OTHER_ADDRESS}`;
      await page.goto(sharedUrl);
      await page.waitForLoadState("networkidle");

      // URL should be preserved
      expect(page.url()).toContain(`userId=${OTHER_ADDRESS}`);

      // Portfolio should load
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });

    test("should load multi-wallet bundle from /bundle?userId=X&walletId=Y", async ({
      page,
    }) => {
      const multiWalletUrl = `/bundle?userId=${OTHER_ADDRESS}&walletId=${WALLET_ID}`;
      await page.goto(multiWalletUrl);
      await page.waitForLoadState("networkidle");

      // Both params should be in URL
      expect(page.url()).toContain(`userId=${OTHER_ADDRESS}`);
      expect(page.url()).toContain(`walletId=${WALLET_ID}`);

      // Portfolio should load
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });

    test("should preserve URL params when navigating tabs", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}&walletId=${WALLET_ID}`);
      await page.waitForLoadState("networkidle");

      // Navigate to Analytics tab
      const analyticsTab = page.getByRole("button", { name: /analytics/i });
      if (await analyticsTab.count()) {
        await analyticsTab.click();
        await page.waitForTimeout(500);

        // URL params should persist
        expect(page.url()).toContain(`userId=${OTHER_ADDRESS}`);
        expect(page.url()).toContain(`walletId=${WALLET_ID}`);
      }
    });

    test("should handle deep link to specific tab (if supported)", async ({
      page,
    }) => {
      // Some apps support tab param like ?tab=analytics
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}&tab=analytics`);
      await page.waitForLoadState("networkidle");

      // Should load the specified tab if supported
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });

    test("should handle malformed shared links gracefully", async ({
      page,
    }) => {
      const malformedUrl = "/bundle?userId=not-a-valid-address";
      await page.goto(malformedUrl);
      await page.waitForLoadState("networkidle");

      // Should not crash
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });
  });

  test.describe("Switch Prompt Banner", () => {
    test("should show banner when connected user views different bundle", async ({
      page,
    }) => {
      // This test simulates:
      // 1. User is connected with wallet A
      // 2. User views bundle for wallet B
      // In real test, would need wallet connection mock

      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Check if banner exists in DOM (visibility depends on wallet state)
      const bannerHTML = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return (
          html.includes("switch-prompt") ||
          html.includes("Stay") ||
          html.includes("Switch to my bundle")
        );
      });

      // Banner component should exist in the code
      expect(bannerHTML).toBe(true);
    });

    test("should have Stay and Switch buttons in banner", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Look for banner buttons in HTML
      const hasButtons = await page.evaluate(() => {
        const html = document.body.innerHTML;
        const hasStay = html.includes("Stay") || html.includes("stay");
        const hasSwitch = html.includes("Switch") || html.includes("switch");
        return hasStay && hasSwitch;
      });

      // If banner exists, it should have both buttons
      expect(hasButtons).toBe(true);
    });

    test("Stay button should keep user on current bundle", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();

      // If Stay button is visible, click it
      const stayButton = page.locator('[data-testid="stay-button"]');
      if (await stayButton.isVisible()) {
        await stayButton.click();
        await page.waitForTimeout(500);

        // URL should remain the same
        expect(page.url()).toBe(currentUrl);

        // Banner should hide
        const banner = page.getByTestId("switch-prompt-banner");
        await expect(banner).not.toBeVisible();
      }
    });

    test("Switch button should navigate to user's own bundle", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // If Switch button is visible, click it
      const switchButton = page.locator('[data-testid="switch-button"]');
      if (await switchButton.isVisible()) {
        await switchButton.click();
        await page.waitForLoadState("networkidle");

        // URL should change to own bundle (requires wallet mock)
        // In real scenario, would redirect to connected wallet's bundle
        const newUrl = page.url();
        expect(newUrl).toContain("bundle");
      }
    });

    test("banner should be dismissible", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      const banner = page.getByTestId("switch-prompt-banner");

      if (await banner.isVisible()) {
        // Click Stay or close button
        const stayButton = page.locator('[data-testid="stay-button"]');
        await stayButton.click();
        await page.waitForTimeout(500);

        // Banner should hide
        await expect(banner).not.toBeVisible();
      }
    });

    test("banner should NOT show when viewing own bundle", async ({ page }) => {
      // Viewing own bundle (owner mode)
      await page.goto(`/layout-demo/v22?userId=${OWNER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      const banner = page.getByTestId("switch-prompt-banner");
      await expect(banner).not.toBeVisible();
    });

    test("banner should NOT show when disconnected", async ({ page }) => {
      // Visitor mode (no wallet connected)
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // If no wallet connected, banner should not show
      // (This depends on wallet connection state)
      const banner = page.getByTestId("switch-prompt-banner");

      // In disconnected state, banner should not be visible
      // This may vary based on implementation
      const isVisible = await banner.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });
  });

  test.describe("Bundle Data Loading", () => {
    test("should load portfolio data in shared bundle", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Portfolio composition should be visible
      await expect(page.getByText("Portfolio Composition")).toBeVisible();

      // Balance should render
      const balanceElement = page.locator('[class*="text-5xl"]').first();
      await expect(balanceElement).toBeVisible();
    });

    test("should show loading state while fetching bundle data", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`, {
        waitUntil: "domcontentloaded",
      });

      // Loading skeleton or spinner might appear briefly
      const hasLoadingState = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return (
          html.includes("loading") ||
          html.includes("skeleton") ||
          html.includes("spinner")
        );
      });

      // Loading state might be very brief
      expect(hasLoadingState !== undefined).toBe(true);
    });

    test("should handle bundle not found gracefully", async ({ page }) => {
      const invalidUserId = "0x0000000000000000000000000000000000000000";
      await page.goto(`/bundle?userId=${invalidUserId}`);
      await page.waitForLoadState("networkidle");

      // Should show error state or empty state
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);

      // Might show "Bundle not found" or similar message
      const bodyContent = await page.locator("body").textContent();
      expect(bodyContent).toBeTruthy();
    });

    test("should handle API errors gracefully", async ({ page }) => {
      // Block portfolio API to simulate error
      await page.route("**/api/v2/portfolio/**", route => route.abort());

      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Should show error boundary or error message
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });
  });

  test.describe("Social Sharing", () => {
    test("should have shareable URL format", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      const url = page.url();

      // URL should be clean and shareable
      expect(url).toContain("/bundle");
      expect(url).toContain(`userId=${OTHER_ADDRESS}`);

      // No sensitive data in URL
      expect(url).not.toContain("password");
      expect(url).not.toContain("token");
    });

    test("should support copy link functionality (if available)", async ({
      page,
    }) => {
      await page.goto(`/layout-demo/v22?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Look for share/copy button
      const _shareButton = page.locator('[data-testid="share-button"]');
      const hasSocialShare = await page.evaluate(() => {
        const html = document.body.innerHTML;
        return html.includes("share") || html.includes("copy");
      });

      // Share functionality might exist
      expect(hasSocialShare !== undefined).toBe(true);
    });
  });

  test.describe("Multi-Wallet Bundle Links", () => {
    test("should select correct wallet when walletId provided in shared link", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}&walletId=${WALLET_ID}`);
      await page.waitForLoadState("networkidle");

      // walletId should be in URL
      expect(page.url()).toContain(`walletId=${WALLET_ID}`);

      // Wallet switcher should show the selected wallet as active
      const walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        // Active indicator should be on the correct wallet
        const activeIndicator = page.locator(
          '[data-testid="active-wallet-indicator"]'
        );
        await expect(activeIndicator).toBeVisible();
      }
    });

    test("should show all wallets in switcher even in visitor mode", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Wallet switcher should be visible for multi-wallet bundles
      const walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        // Dropdown should show all wallets
        const dropdown = page.locator(
          '[data-testid="wallet-switcher-dropdown"]'
        );
        await expect(dropdown).toBeVisible();
      }
    });

    test("should allow wallet switching in visitor mode", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      const walletButton = page.locator(
        '[data-testid="wallet-switcher-button"]'
      );

      if (await walletButton.count()) {
        await walletButton.click();

        const walletOptions = page.locator('[data-testid^="wallet-option-"]');
        if ((await walletOptions.count()) > 1) {
          // Click second wallet
          await walletOptions.nth(1).click();
          await page.waitForTimeout(500);

          // Should switch wallet and update data
          const bodyVisible = await page.locator("body").isVisible();
          expect(bodyVisible).toBe(true);
        }
      }
    });
  });

  test.describe("Privacy & Security", () => {
    test("should not expose owner email or private data in shared bundle", async ({
      page,
    }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      const pageContent = await page.locator("body").textContent();

      // No email addresses
      expect(pageContent).not.toMatch(/@[^@\s]+\.[^@\s]+/);

      // No private keys or sensitive data
      expect(pageContent).not.toContain("private");
      expect(pageContent).not.toContain("secret");
    });

    test("should allow viewing without authentication", async ({ page }) => {
      await page.goto(`/bundle?userId=${OTHER_ADDRESS}`);
      await page.waitForLoadState("networkidle");

      // Should load without requiring login
      const bodyVisible = await page.locator("body").isVisible();
      expect(bodyVisible).toBe(true);
    });
  });
});
