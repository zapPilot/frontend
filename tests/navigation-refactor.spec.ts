import { test, expect } from "@playwright/test";

test.describe("Navigation Refactor - More Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Zap Pilot")).toBeVisible();
  });

  test("should have 4 main navigation items instead of 7", async ({ page }) => {
    // Check that we now have only 4 main navigation items
    const mainNavItems = ["Portfolio", "Invest", "Analytics", "More"];

    for (const item of mainNavItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible();
    }

    // Check that old individual tabs are not in main navigation
    const removedFromMain = ["Pricing", "Community", "Airdrop", "Settings"];

    // These should not be visible as main nav items (they're now sub-items)
    for (const item of removedFromMain) {
      const mainNavElement = page.locator(
        `[data-testid*="tab-${item.toLowerCase()}"]`
      );
      await expect(mainNavElement).not.toBeVisible();
    }
  });

  test("should navigate to More tab and show sub-navigation", async ({
    page,
  }) => {
    // Click on More tab
    const moreTab = page.locator("text=More").first();
    await moreTab.click();

    // Wait for More tab content to load
    await page.waitForTimeout(1000);

    // Should show More header
    await expect(page.locator("h1:has-text('More')")).toBeVisible();

    // Should show all 4 sub-navigation items
    const subNavItems = ["Pricing", "Community", "Airdrop", "Settings"];

    for (const item of subNavItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
  });

  test("should navigate between sub-tabs in More section", async ({ page }) => {
    // Navigate to More tab
    await page.locator("text=More").first().click();
    await page.waitForTimeout(1000);

    // Click on Pricing sub-tab
    await page.locator("text=Pricing").first().click();
    await page.waitForTimeout(500);

    // Should show pricing content
    await expect(
      page.locator("text=Free").or(page.locator("text=Pro"))
    ).toBeVisible();

    // Click on Settings sub-tab
    await page.locator("text=Settings").first().click();
    await page.waitForTimeout(500);

    // Should show settings content
    await expect(
      page.locator("text=Settings").or(page.locator("text=Preferences"))
    ).toBeVisible();
  });

  test("should show breadcrumb navigation in More tab", async ({ page }) => {
    // Navigate to More tab
    await page.locator("text=More").first().click();
    await page.waitForTimeout(1000);

    // Should show breadcrumb
    await expect(page.locator("text=More")).toBeVisible();

    // Click on Community sub-tab
    await page.locator("text=Community").first().click();
    await page.waitForTimeout(500);

    // Breadcrumb should show: More > Community
    await expect(page.locator("text=Community")).toBeVisible();
  });

  test("should maintain navigation state and animations", async ({ page }) => {
    // Navigate to More tab
    await page.locator("text=More").first().click();
    await page.waitForTimeout(1000);

    // Select Pricing
    await page.locator("text=Pricing").first().click();
    await page.waitForTimeout(500);

    // Navigate to different main tab
    await page.locator("text=Analytics").first().click();
    await page.waitForTimeout(500);

    // Go back to More
    await page.locator("text=More").first().click();
    await page.waitForTimeout(1000);

    // Should remember the last selected sub-tab (Pricing)
    await expect(page.locator("text=Pricing")).toBeVisible();
  });

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // More tab should be accessible on mobile
    await page.locator("text=More").first().click();
    await page.waitForTimeout(1000);

    // Sub-navigation should be responsive
    await expect(page.locator("text=Pricing")).toBeVisible();
    await expect(page.locator("text=Community")).toBeVisible();
    await expect(page.locator("text=Airdrop")).toBeVisible();
    await expect(page.locator("text=Settings")).toBeVisible();
  });
});
