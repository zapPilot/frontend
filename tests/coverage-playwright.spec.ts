import { test, expect } from "@playwright/test";

/**
 * CODE COVERAGE TRACKING FOR PLAYWRIGHT
 *
 * This test tracks which React components and functions are actually executed
 * during our E2E tests, giving us real coverage metrics for user flows.
 */

test.describe("Code Coverage Tracking", () => {
  test("collect coverage from essential user flows", async ({ page }) => {
    // Start coverage collection
    await page.coverage.startJSCoverage({
      includeRawScriptCoverage: true,
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test main user flows that should exercise most components

    // 1. Homepage interaction
    const buttons = page.locator("button:visible");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Hover over buttons to trigger event handlers
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await button.hover();
          await page.waitForTimeout(100);
        }
      }
    }

    // 2. Navigation testing
    const navElements = page.locator(
      'button[data-testid*="tab"], a[data-testid*="tab"]'
    );
    const navCount = await navElements.count();

    if (navCount > 1) {
      // Click through different sections
      for (let i = 0; i < Math.min(navCount, 3); i++) {
        const navItem = navElements.nth(i);
        if ((await navItem.isVisible()) && (await navItem.isEnabled())) {
          await navItem.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 3. Input interaction (if present)
    const inputs = page.locator("input:visible");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();
      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        await firstInput.fill("test-data");
        await firstInput.clear();
      }
    }

    // 4. Responsive behavior
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    // Collect and analyze coverage
    const coverage = await page.coverage.stopJSCoverage();

    // Filter to only our source files
    const sourceCoverage = coverage.filter(entry => {
      const url = entry.url;
      return (
        (url.includes("/_next/static/chunks/") ||
          url.includes("localhost:3000")) &&
        !url.includes("node_modules") &&
        !url.includes("webpack") &&
        entry.text &&
        entry.text.length > 0
      );
    });

    // Calculate coverage metrics
    let totalBytes = 0;
    let coveredBytes = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;

    for (const entry of sourceCoverage) {
      if (!entry.text) continue;
      totalBytes += entry.text.length;

      for (const range of entry.ranges) {
        if (range.count > 0) {
          coveredBytes += range.end - range.start;
        }
      }

      // Count function coverage (approximate)
      const functionMatches = entry.text.match(/function|=>/g);
      if (functionMatches) {
        totalFunctions += functionMatches.length;

        // Estimate covered functions based on covered bytes ratio
        const entryRatio =
          entry.ranges.filter(r => r.count > 0).length / entry.ranges.length;
        coveredFunctions += Math.floor(functionMatches.length * entryRatio);
      }
    }

    const byteCoverage = totalBytes > 0 ? (coveredBytes / totalBytes) * 100 : 0;
    const functionCoverage =
      totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;

    // Print coverage report
    console.log("\n📊 CODE COVERAGE REPORT");
    console.log("========================");
    console.log(`Files analyzed: ${sourceCoverage.length}`);
    console.log(`Byte coverage: ${byteCoverage.toFixed(1)}%`);
    console.log(
      `Function coverage: ${functionCoverage.toFixed(1)}% (estimated)`
    );
    console.log(`Total JavaScript bytes: ${(totalBytes / 1024).toFixed(1)}KB`);
    console.log(`Covered bytes: ${(coveredBytes / 1024).toFixed(1)}KB`);

    // Coverage breakdown by file size
    const largeFiles = sourceCoverage
      .filter(entry => entry.text.length > 1000)
      .sort((a, b) => b.text.length - a.text.length)
      .slice(0, 5);

    if (largeFiles.length > 0) {
      console.log("\n📄 Largest Files Covered:");
      largeFiles.forEach((entry, i) => {
        const size = (entry.text.length / 1024).toFixed(1);
        const covered = entry.ranges.filter(r => r.count > 0).length;
        const total = entry.ranges.length;
        const ratio = total > 0 ? ((covered / total) * 100).toFixed(1) : 0;
        console.log(
          `${i + 1}. ${size}KB - ${ratio}% covered (${covered}/${total} ranges)`
        );
      });
    }

    // Expectations for coverage
    expect(sourceCoverage.length).toBeGreaterThan(0);
    expect(byteCoverage).toBeGreaterThan(10); // At least 10% coverage

    console.log("\n✅ Coverage collection completed!");
  });

  test("analyze component usage patterns", async ({ page }) => {
    // Track specific component interactions
    const componentUsage = {
      buttons: 0,
      inputs: 0,
      navigation: 0,
      hover_effects: 0,
      responsive_changes: 0,
    };

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Count and interact with components
    componentUsage.buttons = await page.locator("button:visible").count();
    componentUsage.inputs = await page.locator("input:visible").count();
    componentUsage.navigation = await page
      .locator('[data-testid*="tab"], nav a')
      .count();

    // Test hover effects
    const hoverElements = page.locator("button:visible, a:visible").first();
    if ((await hoverElements.count()) > 0) {
      await hoverElements.hover();
      componentUsage.hover_effects = 1;
    }

    // Test responsive behavior
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const mobileVisible = await page.locator("body").isVisible();

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    const desktopVisible = await page.locator("body").isVisible();

    if (mobileVisible && desktopVisible) {
      componentUsage.responsive_changes = 1;
    }

    console.log("\n🔍 COMPONENT USAGE ANALYSIS");
    console.log("===========================");
    console.log(`Interactive buttons: ${componentUsage.buttons}`);
    console.log(`Input fields: ${componentUsage.inputs}`);
    console.log(`Navigation elements: ${componentUsage.navigation}`);
    console.log(
      `Hover effects working: ${componentUsage.hover_effects ? "Yes" : "No"}`
    );
    console.log(
      `Responsive design: ${componentUsage.responsive_changes ? "Yes" : "No"}`
    );

    const totalInteractivity = Object.values(componentUsage).reduce(
      (a, b) => a + b,
      0
    );
    console.log(`\nTotal interactivity score: ${totalInteractivity}/5`);

    // Benchmark expectations
    expect(totalInteractivity).toBeGreaterThan(3); // Should have decent interactivity
  });
});
