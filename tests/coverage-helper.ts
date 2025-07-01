import { Page } from "@playwright/test";

/**
 * Coverage Helper for tracking what parts of the app we're testing
 * This gives us a simple way to understand test coverage without complex tooling
 */

export class CoverageTracker {
  private page: Page;
  private visitedComponents: Set<string> = new Set();
  private interactedElements: Set<string> = new Set();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Track that we've tested a specific component
   */
  async markComponentTested(componentName: string) {
    this.visitedComponents.add(componentName);
    console.log(`📊 Coverage: Tested component '${componentName}'`);
  }

  /**
   * Track user interactions (clicks, inputs, etc.)
   */
  async markInteractionTested(interaction: string) {
    this.interactedElements.add(interaction);
    console.log(`📊 Coverage: Tested interaction '${interaction}'`);
  }

  /**
   * Count how many different elements we find on the page
   */
  async countPageElements() {
    const buttons = await this.page.locator("button").count();
    const inputs = await this.page.locator("input").count();
    const links = await this.page.locator("a").count();
    const navItems = await this.page.locator('[data-testid*="tab"]').count();

    const summary = {
      buttons,
      inputs,
      links,
      navItems,
      total: buttons + inputs + links + navItems,
    };

    console.log(`📊 Coverage: Page has ${summary.total} interactive elements`);
    return summary;
  }

  /**
   * Attempt to find key business components
   */
  async scanForBusinessComponents() {
    const components = {
      investmentButtons: await this.page
        .locator("button")
        .filter({ hasText: /invest|buy|trade/i })
        .count(),
      portfolioElements: await this.page
        .locator('[class*="portfolio"], [data-testid*="portfolio"]')
        .count(),
      walletElements: await this.page
        .locator('[class*="wallet"], [data-testid*="wallet"]')
        .count(),
      swapElements: await this.page
        .locator('[class*="swap"], [data-testid*="swap"]')
        .count(),
      analyticsElements: await this.page
        .locator('[class*="chart"], [class*="analytics"]')
        .count(),
    };

    console.log("📊 Coverage: Business components found:", components);
    return components;
  }

  /**
   * Get a simple coverage report
   */
  getCoverageReport() {
    return {
      componentsVisited: Array.from(this.visitedComponents),
      interactionsTested: Array.from(this.interactedElements),
      coverageCount: this.visitedComponents.size + this.interactedElements.size,
    };
  }

  /**
   * Generate and display final coverage report
   */
  async generateReport() {
    const report = this.getCoverageReport();
    console.log(`📊 Test Coverage Summary:`);
    console.log(`   Components tested: ${report.componentsVisited.join(", ")}`);
    console.log(
      `   Interactions tested: ${report.interactionsTested.join(", ")}`
    );
    console.log(`   Total coverage points: ${report.coverageCount}`);
    return report;
  }
}
