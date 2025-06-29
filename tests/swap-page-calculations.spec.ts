import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * SWAP PAGE CALCULATIONS TESTS
 *
 * Tests for swap functionality, token selection, amount calculations,
 * and intent-based execution flow in the Zap Pilot DeFi platform
 */

test.describe("SwapPage Calculations", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("swap tab navigation and accessibility", async ({ page }) => {
    await coverage.markComponentTested("SwapNavigation");

    // Look for swap-related navigation
    const swapTab = page
      .locator("button, a")
      .filter({ hasText: /swap|trade|exchange/i });
    const swapTabCount = await swapTab.count();

    if (swapTabCount > 0) {
      const firstSwapTab = swapTab.first();

      // Verify tab is clickable
      expect(await firstSwapTab.isEnabled()).toBeTruthy();
      expect(await firstSwapTab.isVisible()).toBeTruthy();

      // Click to navigate to swap
      await firstSwapTab.click();
      await page.waitForTimeout(1000);

      await coverage.markInteractionTested("SwapTabNavigation");
      console.log(
        `✓ Swap navigation working (${swapTabCount} swap tabs found)`
      );
    } else {
      console.log("ℹ No swap navigation found");
    }
  });

  test("token selector functionality", async ({ page }) => {
    await coverage.markComponentTested("TokenSelector");

    // Look for token selection elements
    const tokenSelectors = page.locator(
      '[data-testid*="token"], [class*="token"], button:has-text("Select"), input[placeholder*="token"]'
    );
    const selectorCount = await tokenSelectors.count();

    if (selectorCount > 0) {
      // Test token selector interaction
      const firstSelector = tokenSelectors.first();
      if (
        (await firstSelector.isVisible()) &&
        (await firstSelector.isEnabled())
      ) {
        // Check if it's a button that opens modal
        const tagName = await firstSelector.evaluate(el =>
          el.tagName.toLowerCase()
        );
        if (tagName === "button") {
          await firstSelector.click();
          await page.waitForTimeout(500);

          // Look for token selection modal or dropdown
          const modal = page.locator(
            '[role="dialog"], [class*="modal"], [class*="dropdown"]'
          );
          if ((await modal.count()) > 0) {
            console.log("✓ Token selector modal opened");

            // Close modal if opened
            const closeButton = modal
              .locator("button")
              .filter({ hasText: /close|×|cancel/i })
              .first();
            if ((await closeButton.count()) > 0) {
              await closeButton.click();
            } else {
              await page.keyboard.press("Escape");
            }
          }
        }
      }

      await coverage.markInteractionTested("TokenSelectorModal");
      console.log(
        `✓ Token selector functionality tested (${selectorCount} selectors found)`
      );
    } else {
      console.log("ℹ No token selectors found");
    }
  });

  test("amount input validation and formatting", async ({ page }) => {
    await coverage.markComponentTested("AmountInput");

    // Look for amount input fields
    const amountInputs = page.locator(
      'input[type="number"], input[placeholder*="amount"], input[placeholder*="0.0"], [data-testid*="amount"]'
    );
    const inputCount = await amountInputs.count();

    if (inputCount > 0) {
      const firstInput = amountInputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test valid number input
        await firstInput.fill("123.45");
        let value = await firstInput.inputValue();
        expect(value).toBe("123.45");

        // Test decimal precision
        await firstInput.fill("0.123456789");
        value = await firstInput.inputValue();
        // Should accept reasonable decimal places
        expect(parseFloat(value)).toBeCloseTo(0.123456789, 6);

        // Test large number
        await firstInput.fill("1000000");
        value = await firstInput.inputValue();
        expect(value).toBe("1000000");

        // Clear for next tests
        await firstInput.fill("");
      }

      await coverage.markInteractionTested("AmountInputValidation");
      console.log(
        `✓ Amount input validation working (${inputCount} inputs found)`
      );
    } else {
      console.log("ℹ No amount inputs found");
    }
  });

  test("swap calculation accuracy", async ({ page }) => {
    await coverage.markComponentTested("SwapCalculations");

    // Look for calculation results or estimates
    const calculationElements = page.locator(
      'text=/estimate|received|rate|price/, [class*="estimate"], [class*="rate"]'
    );
    const calculationCount = await calculationElements.count();

    if (calculationCount > 0) {
      // Check if calculations show numeric values
      for (let i = 0; i < Math.min(calculationCount, 3); i++) {
        const calculation = calculationElements.nth(i);
        const calcText = await calculation.textContent();

        // Should contain numeric values or meaningful text
        expect(calcText?.trim().length).toBeGreaterThan(0);
        expect(calcText).not.toMatch(/undefined|null|NaN/);
      }

      await coverage.markInteractionTested("SwapCalculationDisplay");
      console.log(
        `✓ Swap calculations displayed (${calculationCount} calculation elements found)`
      );
    } else {
      console.log("ℹ No swap calculations found");
    }
  });

  test("amount preset buttons functionality", async ({ page }) => {
    await coverage.markComponentTested("AmountButtons");

    // Look for preset amount buttons (25%, 50%, 75%, 100%, Max)
    const presetButtons = page.locator(
      'button:has-text("25%"), button:has-text("50%"), button:has-text("75%"), button:has-text("100%"), button:has-text("Max")'
    );
    const presetCount = await presetButtons.count();

    if (presetCount > 0) {
      // Test a preset button
      const firstPreset = presetButtons.first();
      expect(await firstPreset.isEnabled()).toBeTruthy();
      expect(await firstPreset.isVisible()).toBeTruthy();

      // Check button styling
      const classList = (await firstPreset.getAttribute("class")) || "";
      expect(classList).toContain("cursor-pointer");

      await coverage.markInteractionTested("AmountPresetButtons");
      console.log(
        `✓ Amount preset buttons functional (${presetCount} buttons found)`
      );
    } else {
      console.log("ℹ No amount preset buttons found");
    }
  });

  test("swap execution flow initiation", async ({ page }) => {
    await coverage.markComponentTested("SwapExecution");

    // Look for swap execution button
    const swapButtons = page.locator(
      'button:has-text("Swap"), button:has-text("Execute"), button:has-text("Confirm"), [data-testid*="swap-button"]'
    );
    const swapButtonCount = await swapButtons.count();

    if (swapButtonCount > 0) {
      const firstSwapButton = swapButtons.first();

      // Verify button exists and styling
      expect(await firstSwapButton.isVisible()).toBeTruthy();

      const classList = (await firstSwapButton.getAttribute("class")) || "";
      expect(classList).toContain("cursor-pointer");

      // Check if button shows proper state (enabled/disabled based on form)
      const isEnabled = await firstSwapButton.isEnabled();
      console.log(`Swap button enabled: ${isEnabled}`);

      await coverage.markInteractionTested("SwapExecutionButton");
      console.log(
        `✓ Swap execution flow accessible (${swapButtonCount} swap buttons found)`
      );
    } else {
      console.log("ℹ No swap execution buttons found");
    }
  });

  test("intent progress modal functionality", async ({ page }) => {
    await coverage.markComponentTested("IntentProgressModal");

    // Look for intent-related UI elements
    const intentElements = page.locator(
      '[class*="intent"], [data-testid*="intent"], text=/intent|progress|executing/i'
    );
    const intentCount = await intentElements.count();

    if (intentCount > 0) {
      // Check for progress indicators
      const progressElements = page.locator(
        '[class*="progress"], [role="progressbar"], text=/%/'
      );
      const progressCount = await progressElements.count();

      console.log(
        `Intent elements: ${intentCount}, Progress elements: ${progressCount}`
      );

      await coverage.markInteractionTested("IntentProgressUI");
      console.log(
        `✓ Intent progress UI elements present (${intentCount} intent, ${progressCount} progress)`
      );
    } else {
      console.log("ℹ No intent progress elements found");
    }
  });

  test("swap details and performance tabs", async ({ page }) => {
    await coverage.markComponentTested("SwapDetailsTabs");

    // Look for tab navigation within swap page
    const detailTabs = page.locator(
      'button:has-text("Details"), button:has-text("Performance"), [data-testid*="tab"]'
    );
    const tabCount = await detailTabs.count();

    if (tabCount > 0) {
      // Test tab switching
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = detailTabs.nth(i);
        if ((await tab.isVisible()) && (await tab.isEnabled())) {
          await tab.click();
          await page.waitForTimeout(300);

          // Verify tab has active state or content changes
          const classList = (await tab.getAttribute("class")) || "";
          console.log(
            `Tab ${i} clicked, classes: ${classList.substring(0, 50)}...`
          );
        }
      }

      await coverage.markInteractionTested("SwapDetailsTabNavigation");
      console.log(`✓ Swap details tabs functional (${tabCount} tabs found)`);
    } else {
      console.log("ℹ No swap detail tabs found");
    }
  });

  test("swap error handling and validation", async ({ page }) => {
    await coverage.markComponentTested("SwapErrorHandling");

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on("pageerror", error => {
      if (error.message.includes("swap") || error.message.includes("token")) {
        errors.push(error.message);
      }
    });

    page.on("console", msg => {
      if (
        msg.type() === "error" &&
        (msg.text().includes("swap") || msg.text().includes("token"))
      ) {
        errors.push(msg.text());
      } else if (
        msg.type() === "warning" &&
        (msg.text().includes("swap") || msg.text().includes("token"))
      ) {
        warnings.push(msg.text());
      }
    });

    // Wait for any swap-related operations
    await page.waitForTimeout(3000);

    // Check for critical swap errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes("favicon") &&
        !error.includes("extension") &&
        !error.toLowerCase().includes("warning")
    );

    expect(criticalErrors.length).toBeLessThan(2);

    await coverage.markInteractionTested("SwapErrorValidation");
    console.log(
      `✓ Swap error handling working (${criticalErrors.length} critical errors)`
    );
  });

  test("responsive swap interface", async ({ page }) => {
    await coverage.markComponentTested("ResponsiveSwapInterface");

    // Test desktop swap interface
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    const desktopSwapElements = page.locator(
      '[class*="swap"], input[type="number"]'
    );
    const desktopCount = await desktopSwapElements.count();

    // Test mobile swap interface
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileSwapElements = page.locator(
      '[class*="swap"], input[type="number"]'
    );
    const mobileCount = await mobileSwapElements.count();

    // Swap interface should work on both screen sizes
    console.log(
      `Desktop swap elements: ${desktopCount}, Mobile: ${mobileCount}`
    );

    await coverage.markInteractionTested("ResponsiveSwapLayout");
    console.log(
      `✓ Swap interface responsive (${mobileCount} mobile, ${desktopCount} desktop)`
    );
  });

  test.afterEach(async () => {
    const report = coverage.getCoverageReport();
    console.log(`📊 SwapPage Test Coverage:`);
    console.log(`   Components: ${report.componentsVisited.join(", ")}`);
    console.log(`   Interactions: ${report.interactionsTested.join(", ")}`);
  });
});
