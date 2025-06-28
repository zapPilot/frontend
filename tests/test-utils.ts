import { Page, expect } from "@playwright/test";

/**
 * Test utilities for consistent navigation and selector handling
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Navigate to a specific tab, handling both desktop and mobile layouts
   * @param tabId - The tab identifier (e.g., 'invest', 'wallet', 'analytics')
   * @param viewport - Optional viewport size configuration
   */
  async navigateToTab(
    tabId: string,
    viewport?: { width: number; height: number }
  ) {
    if (viewport) {
      await this.page.setViewportSize(viewport);
    }

    // Wait for page to load
    await this.page.waitForLoadState("networkidle");

    // Check viewport width to determine which selector to use
    const viewportSize = this.page.viewportSize();
    const isDesktop = viewportSize && viewportSize.width >= 1024;

    if (isDesktop) {
      // Use desktop navigation
      const selector = `desktop-tab-${tabId}`;
      await this.page.getByTestId(selector).click();
    } else {
      // Use mobile navigation
      const selector = `tab-${tabId}`;
      await this.page.getByTestId(selector).click();
    }

    // Wait for navigation to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Setup common test environment with consistent viewport and navigation
   * @param tabId - Optional tab to navigate to after setup
   * @param viewport - Viewport configuration (defaults to desktop)
   */
  async setupTest(
    tabId?: string,
    viewport: { width: number; height: number } = { width: 1200, height: 800 }
  ) {
    await this.page.goto("/");
    await this.page.setViewportSize(viewport);

    if (tabId) {
      await this.navigateToTab(tabId, viewport);
    }
  }

  /**
   * Wait for an element to be visible with timeout
   * @param selector - The test selector
   * @param timeout - Timeout in milliseconds (default 10s)
   */
  async waitForElement(selector: string, timeout: number = 10000) {
    try {
      await expect(this.page.getByTestId(selector)).toBeVisible({ timeout });
    } catch (error) {
      console.warn(`Element ${selector} not found within ${timeout}ms`);
      throw error;
    }
  }

  /**
   * Check for hover effects on interactive elements
   * @param selector - The element selector
   */
  async verifyHoverEffects(selector: string) {
    const element = this.page.getByTestId(selector);
    await expect(element).toBeVisible();

    // Check for cursor pointer
    await expect(element).toHaveClass(/cursor-pointer/);

    // Check for hover/transition classes
    const classList = (await element.getAttribute("class")) || "";
    const hasHoverEffects = /hover:|transition|duration/.test(classList);

    if (!hasHoverEffects) {
      console.warn(`Element ${selector} may be missing hover effects`);
    }
  }

  /**
   * Navigate to invest tab and select first strategy (common test flow)
   */
  async navigateToInvestAndSelectStrategy() {
    await this.navigateToTab("invest");

    // Wait for investment opportunities to load
    await this.page.waitForTimeout(2000);

    // Check if strategy cards exist
    const strategyCard = this.page.getByTestId("strategy-card-0");
    if (await strategyCard.isVisible()) {
      await this.waitForElement("strategy-card-0");
    }

    // Click first invest button
    const investButton = this.page.getByTestId("invest-now-button").first();
    await expect(investButton).toBeVisible();
    await investButton.click();

    // Wait for swap page to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check for duplicate headings and provide unique selectors
   * @param headingText - The heading text to check
   */
  async getUniqueHeading(headingText: string) {
    const headings = this.page.getByRole("heading", { name: headingText });
    const count = await headings.count();

    if (count > 1) {
      // Return the first visible heading
      return headings.first();
    }

    return headings;
  }
}

/**
 * Common viewport configurations
 */
export const VIEWPORTS = {
  DESKTOP: { width: 1200, height: 800 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
} as const;

/**
 * Common test selectors
 */
export const SELECTORS = {
  NAVIGATION: {
    DESKTOP_TAB: (id: string) => `desktop-tab-${id}`,
    MOBILE_TAB: (id: string) => `tab-${id}`,
  },
  INVEST: {
    STRATEGY_CARD: (index: number) => `strategy-card-${index}`,
    INVEST_BUTTON: "invest-now-button",
    OPPORTUNITIES_HEADING: "Investment Opportunities",
  },
  SWAP: {
    TOKEN_SELECTOR: "token-selector-button",
    AMOUNT_INPUT: "from-amount-input",
    SWAP_BUTTON: "swap-button",
    TAB_NAVIGATION: "tab-navigation",
  },
} as const;
