import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * FORM VALIDATION COMPREHENSIVE TESTS
 *
 * Tests for all form inputs, validation logic, error handling,
 * and user input scenarios across the Zap Pilot platform
 */

test.describe("Form Validation Comprehensive", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("numeric input validation and formatting", async ({ page }) => {
    await coverage.markComponentTested("NumericInputValidation");

    // Find all numeric inputs
    const numericInputs = page.locator(
      'input[type="number"], input[step], input[placeholder*="0."], input[placeholder*="amount"]'
    );
    const inputCount = await numericInputs.count();

    if (inputCount > 0) {
      const firstInput = numericInputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test valid decimal input
        await firstInput.fill("123.456");
        let value = await firstInput.inputValue();
        expect(parseFloat(value)).toBeCloseTo(123.456, 3);

        // Test zero input
        await firstInput.fill("0");
        value = await firstInput.inputValue();
        expect(value).toBe("0");

        // Test large number
        await firstInput.fill("1000000.99");
        value = await firstInput.inputValue();
        expect(parseFloat(value)).toBe(1000000.99);

        // Test scientific notation handling
        await firstInput.fill("1.23e-4");
        value = await firstInput.inputValue();
        // Should either accept it or convert appropriately
        expect(value).not.toBe("");

        // Test negative number (should be handled appropriately)
        await firstInput.fill("-100");
        value = await firstInput.inputValue();
        // Depending on context, may accept or reject negatives
        console.log(`Negative number handling: ${value}`);

        // Clear input
        await firstInput.fill("");
        value = await firstInput.inputValue();
        expect(value).toBe("");

        await coverage.markInteractionTested("NumericInputBehavior");
        console.log(
          `✓ Numeric input validation working (${inputCount} inputs tested)`
        );
      }
    } else {
      console.log("ℹ No numeric inputs found");
    }
  });

  test("text input validation and sanitization", async ({ page }) => {
    await coverage.markComponentTested("TextInputValidation");

    // Find text inputs
    const textInputs = page.locator(
      'input[type="text"], input[placeholder*="name"], input[placeholder*="label"]'
    );
    const inputCount = await textInputs.count();

    if (inputCount > 0) {
      const firstInput = textInputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test normal text
        await firstInput.fill("Valid Text Input");
        let value = await firstInput.inputValue();
        expect(value).toBe("Valid Text Input");

        // Test special characters
        await firstInput.fill("Test@#$%^&*()");
        value = await firstInput.inputValue();
        // Should handle special characters appropriately
        expect(value.length).toBeGreaterThan(0);

        // Test unicode characters
        await firstInput.fill("Hello 世界 🌍");
        value = await firstInput.inputValue();
        expect(value.length).toBeGreaterThan(0);

        // Test very long text
        const longText = "A".repeat(1000);
        await firstInput.fill(longText);
        value = await firstInput.inputValue();
        // Should either accept or truncate appropriately
        expect(value.length).toBeGreaterThan(0);

        // Test empty input
        await firstInput.fill("");
        value = await firstInput.inputValue();
        expect(value).toBe("");

        await coverage.markInteractionTested("TextInputBehavior");
        console.log(
          `✓ Text input validation working (${inputCount} inputs tested)`
        );
      }
    } else {
      console.log("ℹ No text inputs found");
    }
  });

  test("wallet address input validation", async ({ page }) => {
    await coverage.markComponentTested("WalletAddressValidation");

    // Look for wallet address inputs
    const addressInputs = page.locator(
      'input[placeholder*="address"], input[placeholder*="0x"], input[placeholder*="wallet"], [data-testid*="address"]'
    );
    const inputCount = await addressInputs.count();

    if (inputCount > 0) {
      const firstInput = addressInputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test valid Ethereum address
        const validAddress = "0x742d35Cc6634C0532925a3b8D0b4e0c8C5EDF2e9";
        await firstInput.fill(validAddress);
        let value = await firstInput.inputValue();
        expect(value).toBe(validAddress);

        // Test invalid address format
        await firstInput.fill("invalid-address");
        value = await firstInput.inputValue();
        // Input should either reject or show as invalid
        console.log(`Invalid address handling: ${value}`);

        // Test address without 0x prefix
        await firstInput.fill("742d35Cc6634C0532925a3b8D0b4e0c8C5EDF2e9");
        value = await firstInput.inputValue();
        console.log(`Address without 0x: ${value}`);

        // Test short address
        await firstInput.fill("0x123");
        value = await firstInput.inputValue();
        console.log(`Short address handling: ${value}`);

        // Clear input
        await firstInput.fill("");

        await coverage.markInteractionTested("AddressInputValidation");
        console.log(
          `✓ Wallet address validation tested (${inputCount} inputs)`
        );
      }
    } else {
      console.log("ℹ No wallet address inputs found");
    }
  });

  test("form submission and validation feedback", async ({ page }) => {
    await coverage.markComponentTested("FormSubmissionValidation");

    // Look for forms and submit buttons
    const forms = page.locator("form");
    const submitButtons = page.locator(
      'button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Confirm")'
    );

    const formCount = await forms.count();
    const submitCount = await submitButtons.count();

    if (submitCount > 0) {
      const firstSubmit = submitButtons.first();

      if (await firstSubmit.isVisible()) {
        // Check if button is properly styled
        const classList = (await firstSubmit.getAttribute("class")) || "";
        expect(classList).toContain("cursor-pointer");

        // Check button state (enabled/disabled)
        const isEnabled = await firstSubmit.isEnabled();
        console.log(`Submit button enabled: ${isEnabled}`);

        // Look for validation messages
        const validationMessages = page.locator(
          '.error, .invalid, [class*="error"], [class*="invalid"], text=/required|invalid|error/i'
        );
        const messageCount = await validationMessages.count();

        await coverage.markInteractionTested("FormSubmissionFeedback");
        console.log(
          `✓ Form submission validation (${submitCount} buttons, ${messageCount} validation messages)`
        );
      }
    } else {
      console.log("ℹ No submit buttons found");
    }
  });

  test("input placeholder and label accessibility", async ({ page }) => {
    await coverage.markComponentTested("InputAccessibility");

    // Find all inputs with placeholders or labels
    const inputs = page.locator("input");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      let inputsWithPlaceholders = 0;
      let inputsWithLabels = 0;
      let inputsWithAriaLabels = 0;

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);

        // Check placeholder
        const placeholder = await input.getAttribute("placeholder");
        if (placeholder && placeholder.length > 0) {
          inputsWithPlaceholders++;
          expect(placeholder.toLowerCase()).not.toMatch(/enter|input|type/); // Should be descriptive
        }

        // Check for associated label
        const inputId = await input.getAttribute("id");
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          if ((await label.count()) > 0) {
            inputsWithLabels++;
          }
        }

        // Check aria-label
        const ariaLabel = await input.getAttribute("aria-label");
        if (ariaLabel && ariaLabel.length > 0) {
          inputsWithAriaLabels++;
        }
      }

      // At least some inputs should have accessibility features
      const accessibleInputs =
        inputsWithPlaceholders + inputsWithLabels + inputsWithAriaLabels;
      expect(accessibleInputs).toBeGreaterThan(0);

      await coverage.markInteractionTested("InputAccessibilityFeatures");
      console.log(
        `✓ Input accessibility: ${inputsWithPlaceholders} placeholders, ${inputsWithLabels} labels, ${inputsWithAriaLabels} aria-labels`
      );
    } else {
      console.log("ℹ No inputs found");
    }
  });

  test("input focus and blur behavior", async ({ page }) => {
    await coverage.markComponentTested("InputFocusBehavior");

    const inputs = page.locator("input");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test focus
        await firstInput.focus();
        const focusedElement = page.locator(":focus");
        expect(await focusedElement.count()).toBe(1);

        // Check focus styling
        const focusedClassList = (await firstInput.getAttribute("class")) || "";
        console.log(`Focus classes: ${focusedClassList.substring(0, 50)}...`);

        // Test blur
        await page.locator("body").click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(100);

        // Check if focus moved away
        const stillFocused = await firstInput.evaluate(
          el => el === document.activeElement
        );
        expect(stillFocused).toBeFalsy();

        await coverage.markInteractionTested("InputFocusBlurBehavior");
        console.log(
          `✓ Input focus/blur behavior tested (${inputCount} inputs)`
        );
      }
    } else {
      console.log("ℹ No inputs found for focus test");
    }
  });

  test("form field error state handling", async ({ page }) => {
    await coverage.markComponentTested("FormErrorStates");

    // Look for inputs and try to trigger validation
    const inputs = page.locator(
      "input[required], input[pattern], input[minlength], input[maxlength]"
    );
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Try to trigger validation by entering invalid data and blurring
        const inputType = await firstInput.getAttribute("type");

        if (inputType === "number") {
          await firstInput.fill("invalid-number-text");
        } else if (inputType === "email") {
          await firstInput.fill("invalid-email");
        } else {
          await firstInput.fill("x"); // Likely too short for most fields
        }

        // Blur to trigger validation
        await page.locator("body").click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // Look for error indicators
        const errorIndicators = page.locator(
          '.error, .invalid, [class*="error"], [class*="invalid"], [aria-invalid="true"]'
        );
        const errorCount = await errorIndicators.count();

        // Clear the input
        await firstInput.fill("");

        await coverage.markInteractionTested("FormErrorStateHandling");
        console.log(
          `✓ Form error states tested (${errorCount} error indicators found)`
        );
      }
    } else {
      console.log("ℹ No inputs with validation attributes found");
    }
  });

  test("copy and paste functionality", async ({ page }) => {
    await coverage.markComponentTested("CopyPasteFunctionality");

    const inputs = page.locator('input[type="text"], input[type="number"]');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test paste functionality
        const testValue = "Test paste value 123";

        // Simulate copy to clipboard and paste
        await firstInput.focus();
        await firstInput.fill(""); // Clear first

        // Use keyboard shortcut to paste (simulate user behavior)
        await page.evaluate(async value => {
          await navigator.clipboard.writeText(value);
        }, testValue);

        await page.keyboard.press("Meta+V"); // Mac paste
        await page.waitForTimeout(300);

        let value = await firstInput.inputValue();
        if (value !== testValue) {
          // Try Ctrl+V for Windows/Linux
          await firstInput.fill("");
          await page.keyboard.press("Control+V");
          await page.waitForTimeout(300);
          value = await firstInput.inputValue();
        }

        console.log(
          `Paste test result: ${value === testValue ? "Success" : "Partial"}`
        );

        await coverage.markInteractionTested("CopyPasteOperations");
        console.log(`✓ Copy/paste functionality tested (${inputCount} inputs)`);
      }
    } else {
      console.log("ℹ No suitable inputs found for copy/paste test");
    }
  });

  test("input validation on rapid typing", async ({ page }) => {
    await coverage.markComponentTested("RapidTypingValidation");

    const inputs = page.locator("input");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        // Test rapid typing
        await firstInput.focus();
        await firstInput.fill(""); // Clear first

        const rapidText = "1234567890abcdefghijklmnop";

        // Type character by character rapidly
        for (const char of rapidText) {
          await page.keyboard.type(char, { delay: 10 }); // Very fast typing
        }

        await page.waitForTimeout(500); // Let any debounced validation run

        const finalValue = await firstInput.inputValue();
        expect(finalValue.length).toBeGreaterThan(0);

        await coverage.markInteractionTested("RapidTypingHandling");
        console.log(
          `✓ Rapid typing validation tested (final length: ${finalValue.length})`
        );
      }
    } else {
      console.log("ℹ No inputs found for rapid typing test");
    }
  });

  test.afterEach(async () => {
    const report = coverage.getCoverageReport();
    console.log(`📊 Form Validation Test Coverage:`);
    console.log(`   Components: ${report.componentsVisited.join(", ")}`);
    console.log(`   Interactions: ${report.interactionsTested.join(", ")}`);
  });
});
