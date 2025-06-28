import { test, expect } from "@playwright/test";
import { TestUtils, VIEWPORTS } from "./test-utils";

test.describe("SwapPage", () => {
  test.beforeEach(async ({ page }) => {
    const testUtils = new TestUtils(page);
    await testUtils.setupTest();
    await testUtils.navigateToInvestAndSelectStrategy();
  });

  test("should display strategy information correctly", async ({ page }) => {
    // Check header displays strategy name and info
    await expect(page.getByTestId("strategy-name")).toBeVisible();
    await expect(page.getByTestId("strategy-info")).toContainText("APR");
    await expect(page.getByTestId("strategy-info")).toContainText("Risk");
    await expect(page.getByTestId("strategy-tvl")).toContainText("TVL:");
  });

  test("should navigate between tabs", async ({ page }) => {
    // Test tab navigation
    await expect(page.getByTestId("tab-swap")).toHaveClass(/bg-gradient-to-r/);

    await page.getByTestId("tab-allocation").click();
    await expect(page.getByTestId("allocation-tab")).toBeVisible();
    await expect(page.getByTestId("pie-chart-container")).toBeVisible();

    await page.getByTestId("tab-performance").click();
    await expect(page.getByTestId("performance-tab")).toBeVisible();
    await expect(page.getByTestId("performance-grid")).toBeVisible();

    await page.getByTestId("tab-details").click();
    await expect(page.getByTestId("details-tab")).toBeVisible();
    await expect(page.getByTestId("strategy-overview")).toBeVisible();
  });

  test("should handle swap functionality", async ({ page }) => {
    // Ensure we're on swap tab
    await page.getByTestId("tab-swap").click();

    // Check initial state
    await expect(page.getByTestId("from-amount-input")).toHaveValue("");
    await expect(page.getByTestId("swap-invest-button")).toHaveText(
      "Enter Amount"
    );
    await expect(page.getByTestId("swap-invest-button")).toBeDisabled();

    // Enter amount
    await page.getByTestId("from-amount-input").fill("100");

    // Check calculated values update
    await expect(page.getByTestId("estimated-shares")).toContainText("1.0000");
    await expect(page.getByTestId("estimated-value")).toContainText("97.00");
    await expect(page.getByTestId("swap-details")).toBeVisible();
    await expect(page.getByTestId("minimum-received")).toContainText("99.50");

    // Button should be enabled
    await expect(page.getByTestId("swap-invest-button")).toHaveText(
      "Swap & Invest"
    );
    await expect(page.getByTestId("swap-invest-button")).toBeEnabled();
  });

  test("should handle token selection", async ({ page }) => {
    // Open token selector
    await page.getByTestId("token-selector-button").click();
    await expect(page.getByTestId("token-selector-modal")).toBeVisible();

    // Check available tokens
    await expect(page.getByTestId("token-option-usdc")).toBeVisible();
    await expect(page.getByTestId("token-option-eth")).toBeVisible();
    await expect(page.getByTestId("token-option-btc")).toBeVisible();

    // Select ETH token
    await page.getByTestId("token-option-eth").click();
    await expect(page.getByTestId("token-selector-modal")).not.toBeVisible();
    await expect(page.getByTestId("selected-token")).toHaveText("ETH");
  });

  test("should use amount percentage buttons", async ({ page }) => {
    // Test 25% button
    await page.getByTestId("amount-25%-button").click();
    await expect(page.getByTestId("from-amount-input")).toHaveValue("375");
    await expect(page.getByTestId("swap-invest-button")).toBeEnabled();

    // Test 50% button
    await page.getByTestId("amount-50%-button").click();
    await expect(page.getByTestId("from-amount-input")).toHaveValue("750");

    // Test 75% button
    await page.getByTestId("amount-75%-button").click();
    await expect(page.getByTestId("from-amount-input")).toHaveValue("1125");

    // Test MAX button
    await page.getByTestId("amount-max-button").click();
    await expect(page.getByTestId("from-amount-input")).toHaveValue("1500");
  });

  test("should display all amount buttons", async ({ page }) => {
    // Check all amount buttons are visible
    await expect(page.getByTestId("amount-25%-button")).toBeVisible();
    await expect(page.getByTestId("amount-50%-button")).toBeVisible();
    await expect(page.getByTestId("amount-75%-button")).toBeVisible();
    await expect(page.getByTestId("amount-max-button")).toBeVisible();

    // Check button text
    await expect(page.getByTestId("amount-25%-button")).toHaveText("25%");
    await expect(page.getByTestId("amount-50%-button")).toHaveText("50%");
    await expect(page.getByTestId("amount-75%-button")).toHaveText("75%");
    await expect(page.getByTestId("amount-max-button")).toHaveText("MAX");
  });

  test("should display allocation data in allocation tab", async ({ page }) => {
    await page.getByTestId("tab-allocation").click();

    // Check pie chart is visible
    await expect(page.getByTestId("pie-chart-container")).toBeVisible();

    // Check allocation list items
    await expect(page.getByTestId("allocation-list")).toBeVisible();

    // Verify at least one allocation item exists
    const allocationItems = page.locator('[data-testid^="allocation-item-"]');
    await expect(allocationItems.first()).toBeVisible();
  });

  test("should display performance metrics", async ({ page }) => {
    await page.getByTestId("tab-performance").click();

    // Check performance metrics are displayed
    await expect(page.getByTestId("performance-24-hours")).toBeVisible();
    await expect(page.getByTestId("performance-7-days")).toBeVisible();
    await expect(page.getByTestId("performance-30-days")).toBeVisible();
    await expect(page.getByTestId("performance-1-year")).toBeVisible();

    // Verify performance changes are displayed
    await expect(page.getByTestId("change-24-hours")).toContainText("+2.4%");
    await expect(page.getByTestId("change-7-days")).toContainText("+8.1%");
  });

  test("should display strategy details and assets", async ({ page }) => {
    await page.getByTestId("tab-details").click();

    // Check strategy overview
    await expect(page.getByTestId("strategy-description")).toBeVisible();
    await expect(page.getByTestId("strategy-metrics")).toBeVisible();

    // Check metrics
    await expect(page.getByTestId("apr-metric")).toContainText("%");
    await expect(page.getByTestId("risk-metric")).toBeVisible();
    await expect(page.getByTestId("tvl-metric")).toBeVisible();

    // Check asset categories if available
    const assetCategories = page.getByTestId("asset-categories");
    if (await assetCategories.isVisible()) {
      await expect(assetCategories).toBeVisible();
    }
  });

  test("should navigate back to previous page", async ({ page }) => {
    await page.getByTestId("back-button").click();

    // Should return to investment tab - check for both mobile and desktop
    const testUtils = new TestUtils(page);
    await testUtils.navigateToTab("invest");
    await expect(
      page.getByRole("heading", { name: "Investment Opportunities" })
    ).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.MOBILE);

    // Tab labels should be hidden on mobile
    const tabLabels = page.locator(".hidden.sm\\:inline");
    await expect(tabLabels.first()).not.toBeVisible();

    // Swap interface should still be functional
    await page.getByTestId("from-amount-input").fill("50");
    await expect(page.getByTestId("swap-invest-button")).toBeEnabled();
  });

  test("should validate input amounts", async ({ page }) => {
    // Test negative amount
    await page.getByTestId("from-amount-input").fill("-10");
    await expect(page.getByTestId("swap-invest-button")).toBeDisabled();

    // Test zero amount
    await page.getByTestId("from-amount-input").fill("0");
    await expect(page.getByTestId("swap-invest-button")).toBeDisabled();

    // Test valid amount
    await page.getByTestId("from-amount-input").fill("100");
    await expect(page.getByTestId("swap-invest-button")).toBeEnabled();
  });
});
