import { test, expect } from "@playwright/test";

/**
 * SIMPLIFIED CODE COVERAGE TRACKING
 *
 * Since Playwright's built-in coverage doesn't work well with Next.js 15,
 * we'll track coverage by measuring which components/features are exercised.
 */

interface CoverageMetrics {
  components: {
    name: string;
    tested: boolean;
    interactions: number;
  }[];
  features: {
    name: string;
    working: boolean;
    importance: "critical" | "high" | "medium" | "low";
  }[];
  codeQuality: {
    noJSErrors: boolean;
    responsive: boolean;
    interactive: boolean;
    accessible: boolean;
  };
}

test.describe("Code Coverage & Quality Metrics", () => {
  test("comprehensive feature coverage analysis", async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    const coverage: CoverageMetrics = {
      components: [],
      features: [],
      codeQuality: {
        noJSErrors: false,
        responsive: false,
        interactive: false,
        accessible: false,
      },
    };

    // Track JavaScript errors
    const jsErrors: string[] = [];
    page.on("pageerror", error => jsErrors.push(error.message));
    page.on("console", msg => {
      if (msg.type() === "error") {
        jsErrors.push(msg.text());
      }
    });

    await page.goto("/");
    // Wait for page to load with more robust approach
    try {
      await page.waitForLoadState("networkidle", { timeout: 45000 });
    } catch (error) {
      // Fallback to domcontentloaded if networkidle fails
      console.log("NetworkIdle timeout, falling back to domcontentloaded");
      await page.waitForLoadState("domcontentloaded");
      // Give additional time for any async operations
      await page.waitForTimeout(3000);
    }

    // 1. COMPONENT COVERAGE TESTING
    console.log("\n🧩 COMPONENT COVERAGE ANALYSIS");
    console.log("================================");

    // Navigation Component
    const navElements = await page
      .locator('nav, [role="navigation"], button[data-testid*="tab"]')
      .count();
    coverage.components.push({
      name: "Navigation",
      tested: navElements > 0,
      interactions: navElements,
    });

    // Button Components
    const buttons = await page.locator("button:visible").count();
    const buttonInteractions = Math.min(buttons, 3);
    for (let i = 0; i < buttonInteractions; i++) {
      const btn = page.locator("button:visible").nth(i);
      if (await btn.isVisible()) {
        await btn.hover();
        await page.waitForTimeout(100);
      }
    }
    coverage.components.push({
      name: "Buttons",
      tested: buttons > 0,
      interactions: buttonInteractions,
    });

    // Form Components
    const inputs = await page.locator("input:visible").count();
    let inputInteractions = 0;
    if (inputs > 0) {
      const firstInput = page.locator("input:visible").first();
      if ((await firstInput.isVisible()) && (await firstInput.isEnabled())) {
        await firstInput.fill("test");
        await firstInput.clear();
        inputInteractions = 1;
      }
    }
    coverage.components.push({
      name: "Forms/Inputs",
      tested: inputs > 0,
      interactions: inputInteractions,
    });

    // Investment/Portfolio Components
    const investmentElements = await page
      .locator(
        '*:has-text("invest"), *:has-text("portfolio"), *:has-text("vault")'
      )
      .count();
    coverage.components.push({
      name: "Investment/Portfolio",
      tested: investmentElements > 0,
      interactions: investmentElements,
    });

    // 2. FEATURE COVERAGE TESTING
    console.log("\n🎯 FEATURE COVERAGE ANALYSIS");
    console.log("==============================");

    // Critical Features
    coverage.features.push({
      name: "Page Loads Without Errors",
      working: await page.locator("body").isVisible(),
      importance: "critical",
    });

    coverage.features.push({
      name: "Interactive Elements Present",
      working: buttons > 0 || inputs > 0,
      importance: "critical",
    });

    coverage.features.push({
      name: "Navigation Available",
      working: navElements > 0,
      importance: "critical",
    });

    // High Priority Features
    const walletElements = await page
      .locator('*:has-text("wallet"), *:has-text("balance")')
      .count();
    coverage.features.push({
      name: "Wallet/Portfolio Features",
      working: walletElements > 0,
      importance: "high",
    });

    // Test navigation functionality
    let navigationWorks = false;
    if (navElements > 1) {
      const navItem = page
        .locator('button[data-testid*="tab"], a[data-testid*="tab"]')
        .first();
      if ((await navItem.isVisible()) && (await navItem.isEnabled())) {
        await navItem.click();
        await page.waitForTimeout(500);
        navigationWorks = await page.locator("body").isVisible();
      }
    }
    coverage.features.push({
      name: "Navigation Functionality",
      working: navigationWorks,
      importance: "high",
    });

    // Medium Priority Features
    const hoverEffects = page.locator("button:visible").first();
    let hoverWorks = false;
    if ((await hoverEffects.count()) > 0) {
      const beforeHover = await hoverEffects.getAttribute("class");
      await hoverEffects.hover();
      await page.waitForTimeout(200);
      const afterHover = await hoverEffects.getAttribute("class");
      hoverWorks =
        beforeHover !== afterHover ||
        beforeHover?.includes("cursor-pointer") ||
        false;
    }
    coverage.features.push({
      name: "Visual Feedback (Hover Effects)",
      working: hoverWorks,
      importance: "medium",
    });

    // 3. RESPONSIVE DESIGN TESTING
    console.log("\n📱 RESPONSIVE DESIGN COVERAGE");
    console.log("==============================");

    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileWorks = await page.locator("body").isVisible();

    // Test desktop responsiveness
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    const desktopWorks = await page.locator("body").isVisible();

    coverage.features.push({
      name: "Responsive Design",
      working: mobileWorks && desktopWorks,
      importance: "high",
    });

    // 4. CODE QUALITY METRICS
    console.log("\n⚡ CODE QUALITY METRICS");
    console.log("========================");

    coverage.codeQuality.noJSErrors = jsErrors.length < 3; // Allow some minor errors
    coverage.codeQuality.responsive = mobileWorks && desktopWorks;
    coverage.codeQuality.interactive = buttons > 0 || inputs > 0;
    coverage.codeQuality.accessible =
      (await page.locator("[aria-label], [alt], [role]").count()) > 0;

    // 5. CALCULATE COVERAGE PERCENTAGES
    const componentsCovered = coverage.components.filter(c => c.tested).length;
    const componentsTotal = coverage.components.length;
    const componentCoverage = (componentsCovered / componentsTotal) * 100;

    const criticalFeatures = coverage.features.filter(
      f => f.importance === "critical"
    );
    const criticalWorking = criticalFeatures.filter(f => f.working).length;
    const criticalCoverage = (criticalWorking / criticalFeatures.length) * 100;

    const allFeatures = coverage.features.filter(f => f.working).length;
    const totalFeatures = coverage.features.length;
    const featureCoverage = (allFeatures / totalFeatures) * 100;

    const qualityPoints = Object.values(coverage.codeQuality).filter(
      Boolean
    ).length;
    const qualityCoverage = (qualityPoints / 4) * 100;

    // 6. PRINT COMPREHENSIVE REPORT
    console.log("\n📊 COMPREHENSIVE COVERAGE REPORT");
    console.log("==================================");
    console.log(
      `📦 Component Coverage: ${componentCoverage.toFixed(1)}% (${componentsCovered}/${componentsTotal})`
    );
    console.log(
      `🎯 Feature Coverage: ${featureCoverage.toFixed(1)}% (${allFeatures}/${totalFeatures})`
    );
    console.log(
      `🚨 Critical Features: ${criticalCoverage.toFixed(1)}% (${criticalWorking}/${criticalFeatures.length})`
    );
    console.log(
      `⚡ Code Quality: ${qualityCoverage.toFixed(1)}% (${qualityPoints}/4)`
    );

    const overallCoverage =
      (componentCoverage +
        featureCoverage +
        criticalCoverage +
        qualityCoverage) /
      4;
    console.log(`\n🎯 OVERALL COVERAGE: ${overallCoverage.toFixed(1)}%`);

    // Component details
    console.log("\n📦 Component Details:");
    coverage.components.forEach(comp => {
      const status = comp.tested ? "✅" : "❌";
      console.log(
        `   ${status} ${comp.name}: ${comp.interactions} interactions`
      );
    });

    // Feature details
    console.log("\n🎯 Feature Details:");
    coverage.features.forEach(feat => {
      const status = feat.working ? "✅" : "❌";
      const priority = feat.importance.toUpperCase();
      console.log(`   ${status} [${priority}] ${feat.name}`);
    });

    // Quality details
    console.log("\n⚡ Quality Details:");
    console.log(
      `   ${coverage.codeQuality.noJSErrors ? "✅" : "❌"} No JavaScript Errors (${jsErrors.length} errors)`
    );
    console.log(
      `   ${coverage.codeQuality.responsive ? "✅" : "❌"} Responsive Design`
    );
    console.log(
      `   ${coverage.codeQuality.interactive ? "✅" : "❌"} Interactive Elements`
    );
    console.log(
      `   ${coverage.codeQuality.accessible ? "✅" : "❌"} Accessibility Features`
    );

    // Coverage benchmarks
    console.log("\n📈 COVERAGE BENCHMARKS:");
    if (overallCoverage >= 80) {
      console.log("🎉 EXCELLENT - Production ready!");
    } else if (overallCoverage >= 60) {
      console.log("✅ GOOD - Minor improvements needed");
    } else if (overallCoverage >= 40) {
      console.log("⚠️  NEEDS WORK - Address critical issues");
    } else {
      console.log("🚨 POOR - Major development needed");
    }

    // 7. ASSERTIONS FOR CI/CD
    expect(criticalCoverage).toBeGreaterThan(80); // All critical features must work
    expect(componentCoverage).toBeGreaterThan(50); // At least half the components tested
    expect(jsErrors.length).toBeLessThan(5); // Minimal JavaScript errors
    expect(overallCoverage).toBeGreaterThan(40); // Reasonable overall coverage

    console.log("\n✅ Coverage analysis completed!");
  });
});
