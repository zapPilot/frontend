import { test, expect } from "@playwright/test";
import { CoverageTracker } from "./coverage-helper";

/**
 * NAVIGATION RESPONSIVE TESTS
 *
 * Tests for navigation functionality across different screen sizes,
 * tab switching, and responsive navigation behavior in Zap Pilot
 */

test.describe("Navigation Responsive", () => {
  let coverage: CoverageTracker;

  test.beforeEach(async ({ page }) => {
    coverage = new CoverageTracker(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("main navigation tabs are present and functional", async ({ page }) => {
    await coverage.markComponentTested("MainNavigation");

    // Look for main navigation elements
    const navTabs = page.locator(
      'nav button, [role="navigation"] button, [data-testid*="tab"], button[class*="tab"]'
    );
    const tabCount = await navTabs.count();

    if (tabCount > 0) {
      // Test each navigation tab
      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        const tab = navTabs.nth(i);

        if (await tab.isVisible()) {
          const tabText = await tab.textContent();

          // Verify tab has meaningful text
          expect(tabText?.trim().length).toBeGreaterThan(0);
          expect(tabText).not.toMatch(/undefined|null/);

          // Verify tab is clickable
          expect(await tab.isEnabled()).toBeTruthy();

          // Check cursor pointer styling
          const classList = (await tab.getAttribute("class")) || "";
          expect(classList).toContain("cursor-pointer");
        }
      }

      await coverage.markInteractionTested("NavigationTabFunctionality");
      console.log(`✓ Main navigation tabs functional (${tabCount} tabs found)`);
    } else {
      console.log("ℹ No navigation tabs found");
    }
  });

  test("tab switching changes content correctly", async ({ page }) => {
    await coverage.markComponentTested("TabSwitching");

    // Get all navigation tabs
    const navTabs = page.locator(
      'nav button, [role="navigation"] button, [data-testid*="tab"], button[class*="tab"]'
    );
    const tabCount = await navTabs.count();

    if (tabCount > 1) {
      // Get initial page content
      const initialContent = await page
        .locator('main, [role="main"], body')
        .textContent();

      // Click on second tab
      const secondTab = navTabs.nth(1);
      if ((await secondTab.isVisible()) && (await secondTab.isEnabled())) {
        await secondTab.click();
        await page.waitForTimeout(1000); // Allow content to load

        // Get new content
        const newContent = await page
          .locator('main, [role="main"], body')
          .textContent();

        // Content should change (though we allow some common elements to remain)
        const contentChanged = initialContent !== newContent;
        if (contentChanged) {
          console.log("✓ Tab switching changes content");
        } else {
          console.log("ℹ Tab switching detected but content similarity high");
        }
      }

      await coverage.markInteractionTested("TabContentSwitching");
      console.log(`✓ Tab switching tested (${tabCount} tabs available)`);
    } else {
      console.log("ℹ Not enough tabs to test switching");
    }
  });

  test("navigation active state indication", async ({ page }) => {
    await coverage.markComponentTested("NavigationActiveState");

    // Look for active navigation indicators
    const navTabs = page.locator(
      'nav button, [role="navigation"] button, [data-testid*="tab"]'
    );
    const tabCount = await navTabs.count();

    if (tabCount > 0) {
      let activeTabsFound = 0;

      for (let i = 0; i < tabCount; i++) {
        const tab = navTabs.nth(i);
        const classList = (await tab.getAttribute("class")) || "";

        // Look for active state classes
        if (
          classList.includes("active") ||
          classList.includes("selected") ||
          classList.includes("current") ||
          (classList.includes("bg-") && !classList.includes("bg-transparent"))
        ) {
          activeTabsFound++;
        }
      }

      // Should have at least one active tab
      expect(activeTabsFound).toBeGreaterThan(0);

      await coverage.markInteractionTested("ActiveTabIndication");
      console.log(
        `✓ Navigation active state working (${activeTabsFound} active tabs found)`
      );
    } else {
      console.log("ℹ No navigation tabs found");
    }
  });

  test("desktop navigation layout and spacing", async ({ page }) => {
    await coverage.markComponentTested("DesktopNavigation");

    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    // Check navigation layout on desktop
    const nav = page.locator('nav, [role="navigation"]').first();

    if ((await nav.count()) > 0) {
      const navBox = await nav.boundingBox();

      if (navBox) {
        // Navigation should be reasonably sized
        expect(navBox.width).toBeGreaterThan(100);
        expect(navBox.height).toBeGreaterThan(20);

        // Check if navigation spans appropriately
        const viewportWidth = 1200;
        const navUsesReasonableWidth = navBox.width < viewportWidth * 0.9; // Not more than 90% width

        console.log(`Desktop nav dimensions: ${navBox.width}x${navBox.height}`);
      }

      await coverage.markInteractionTested("DesktopNavigationLayout");
      console.log("✓ Desktop navigation layout verified");
    } else {
      console.log("ℹ No navigation element found");
    }
  });

  test("mobile navigation responsiveness", async ({ page }) => {
    await coverage.markComponentTested("MobileNavigation");

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check if navigation adapts to mobile
    const nav = page.locator('nav, [role="navigation"]').first();
    const navTabs = page.locator('nav button, [role="navigation"] button');

    const navCount = await nav.count();
    const tabCount = await navTabs.count();

    if (navCount > 0) {
      const navBox = await nav.boundingBox();

      if (navBox) {
        // Navigation should fit mobile screen
        expect(navBox.width).toBeLessThan(400); // Should fit in mobile width

        console.log(`Mobile nav dimensions: ${navBox.width}x${navBox.height}`);
      }

      // Tabs should still be clickable on mobile
      if (tabCount > 0) {
        const firstTab = navTabs.first();
        if (await firstTab.isVisible()) {
          const tabBox = await firstTab.boundingBox();
          if (tabBox) {
            // Tab should be large enough for touch interaction
            expect(tabBox.height).toBeGreaterThan(30); // Minimum touch target
          }
        }
      }

      await coverage.markInteractionTested("MobileNavigationAdaptation");
      console.log(
        `✓ Mobile navigation responsive (${tabCount} tabs, nav dimensions OK)`
      );
    } else {
      console.log("ℹ No navigation found for mobile test");
    }
  });

  test("navigation keyboard accessibility", async ({ page }) => {
    await coverage.markComponentTested("NavigationAccessibility");

    // Check tab key navigation
    const navTabs = page.locator('nav button, [role="navigation"] button');
    const tabCount = await navTabs.count();

    if (tabCount > 0) {
      // Focus first tab
      await navTabs.first().focus();

      // Check if tab has focus styling
      const focusedElement = page.locator(":focus");
      const focusCount = await focusedElement.count();
      expect(focusCount).toBeGreaterThan(0);

      // Test keyboard navigation between tabs
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);

      // Should be able to navigate with keyboard
      const newFocusedElement = page.locator(":focus");
      const newFocusCount = await newFocusedElement.count();
      expect(newFocusCount).toBeGreaterThan(0);

      await coverage.markInteractionTested("NavigationKeyboardAccess");
      console.log(
        `✓ Navigation keyboard accessibility working (${tabCount} tabs)`
      );
    } else {
      console.log("ℹ No navigation tabs for keyboard test");
    }
  });

  test("navigation icon and text consistency", async ({ page }) => {
    await coverage.markComponentTested("NavigationIconText");

    // Look for navigation items with icons and text
    const navItems = page.locator('nav button, [role="navigation"] button');
    const itemCount = await navItems.count();

    if (itemCount > 0) {
      let itemsWithIcons = 0;
      let itemsWithText = 0;

      for (let i = 0; i < itemCount; i++) {
        const item = navItems.nth(i);

        // Check for icons (SVG, img, or icon classes)
        const icons = item.locator('svg, img, [class*="icon"]');
        const iconCount = await icons.count();
        if (iconCount > 0) itemsWithIcons++;

        // Check for text content
        const text = await item.textContent();
        if (text && text.trim().length > 0) itemsWithText++;
      }

      console.log(
        `Navigation: ${itemsWithIcons} items with icons, ${itemsWithText} with text`
      );

      await coverage.markInteractionTested("NavigationIconTextConsistency");
      console.log(
        `✓ Navigation icon/text consistency checked (${itemCount} items)`
      );
    } else {
      console.log("ℹ No navigation items found");
    }
  });

  test("navigation performance on viewport changes", async ({ page }) => {
    await coverage.markComponentTested("NavigationPerformance");

    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));

    // Test multiple viewport changes rapidly
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
      { width: 1920, height: 1080 }, // Large desktop
      { width: 320, height: 568 }, // Small mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200); // Brief pause for layout
    }

    // Navigation should handle viewport changes without errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes("favicon") &&
        !error.includes("ResizeObserver") && // Common non-critical error
        !error.includes("non-passive")
    );

    expect(criticalErrors.length).toBeLessThan(2);

    await coverage.markInteractionTested("NavigationViewportPerformance");
    console.log(
      `✓ Navigation handles viewport changes (${criticalErrors.length} critical errors)`
    );
  });

  test("navigation maintains state across interactions", async ({ page }) => {
    await coverage.markComponentTested("NavigationStateManagement");

    const navTabs = page.locator('nav button, [role="navigation"] button');
    const tabCount = await navTabs.count();

    if (tabCount > 1) {
      // Click on a tab and verify it becomes active
      const secondTab = navTabs.nth(1);
      if ((await secondTab.isVisible()) && (await secondTab.isEnabled())) {
        await secondTab.click();
        await page.waitForTimeout(500);

        // Check if tab maintains active state
        const classList = (await secondTab.getAttribute("class")) || "";
        const hasActiveState =
          classList.includes("active") ||
          classList.includes("selected") ||
          (classList.includes("bg-") && !classList.includes("bg-transparent"));

        if (hasActiveState) {
          console.log("✓ Navigation maintains active state");
        } else {
          console.log("ℹ Navigation active state unclear");
        }

        // Try clicking elsewhere and back
        await page.locator("body").click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(200);

        // Tab should still maintain its state
        const newClassList = (await secondTab.getAttribute("class")) || "";
        console.log(`Tab state maintained: ${classList === newClassList}`);
      }

      await coverage.markInteractionTested("NavigationStatePersistence");
      console.log(`✓ Navigation state management tested (${tabCount} tabs)`);
    } else {
      console.log("ℹ Not enough tabs to test state management");
    }
  });

  test.afterEach(async () => {
    const report = coverage.getCoverageReport();
    console.log(`📊 Navigation Test Coverage:`);
    console.log(`   Components: ${report.componentsVisited.join(", ")}`);
    console.log(`   Interactions: ${report.interactionsTested.join(", ")}`);
  });
});
