import { test, expect } from "@playwright/test";

test.describe("Subscription and Quant-Engine Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main dashboard
    await page.goto("/");

    // Wait for page to load completely
    await expect(page.locator("text=Zap Pilot")).toBeVisible();
  });

  test("should load the main dashboard with navigation", async ({ page }) => {
    // Check that main navigation is present
    await expect(
      page.locator('[data-testid="navigation"]').or(page.locator("nav"))
    ).toBeVisible();

    // Check that pricing tab is available
    await expect(
      page.locator("text=Pricing").or(page.locator('[data-tab="pricing"]'))
    ).toBeVisible();

    // Check that wallet portfolio is displayed
    await expect(
      page
        .locator("text=Portfolio")
        .or(page.locator('[data-testid="wallet-portfolio"]'))
    ).toBeVisible();
  });

  test("should navigate to pricing page", async ({ page }) => {
    // Click on pricing navigation item
    const pricingButton = page
      .locator("text=Pricing")
      .or(page.locator('[data-tab="pricing"]'));
    await pricingButton.click();

    // Wait for pricing page to load
    await page.waitForTimeout(1000);

    // Check for subscription tiers
    await expect(
      page
        .locator("text=Free")
        .or(page.locator("text=Pro").or(page.locator("text=Enterprise")))
    ).toBeVisible();

    // Check for pricing information
    await expect(
      page.locator("text=$50").or(page.locator("text=$200"))
    ).toBeVisible();
  });

  test("should display subscription gates", async ({ page }) => {
    // Check for subscription gate components in the main dashboard
    const subscriptionGate = page
      .locator('[data-testid="subscription-gate"]')
      .or(page.locator("text=Upgrade to Pro"))
      .or(page.locator("text=Premium Feature"));

    // At least one subscription gate should be present
    await expect(subscriptionGate.first()).toBeVisible({ timeout: 10000 });
  });

  test("should connect wallet button work", async ({ page }) => {
    // Look for wallet connect button
    const walletButton = page
      .locator('button:has-text("Connect")')
      .or(page.locator('[data-testid="wallet-connect"]'))
      .or(page.locator("text=Connect Wallet"));

    if (await walletButton.isVisible()) {
      await walletButton.click();

      // Should show wallet connection options or modal
      await expect(
        page.locator("text=ZeroDev").or(page.locator("text=Connect Wallet"))
      ).toBeVisible();
    }
  });

  test("should test quant-engine API integration", async ({ page }) => {
    // Navigate to analytics or portfolio section that uses API
    const analyticsTab = page
      .locator("text=Analytics")
      .or(page.locator('[data-tab="analytics"]'));

    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(2000);

      // Check if API data is loaded (should show loading or data)
      await expect(
        page
          .locator("text=Loading")
          .or(page.locator('[data-testid="portfolio-data"]'))
      ).toBeVisible();
    }
  });

  test("should handle subscription upgrade flow", async ({ page }) => {
    // Navigate to pricing page
    const pricingButton = page
      .locator("text=Pricing")
      .or(page.locator('[data-tab="pricing"]'));
    await pricingButton.click();
    await page.waitForTimeout(1000);

    // Find and click upgrade button for Pro tier
    const upgradeButton = page
      .locator('button:has-text("Upgrade")')
      .or(
        page
          .locator('button:has-text("Get Started")')
          .or(page.locator('[data-tier="pro"] button'))
      );

    if (await upgradeButton.first().isVisible()) {
      await upgradeButton.first().click();

      // Should show payment modal or wallet connection
      await expect(
        page
          .locator("text=Payment")
          .or(page.locator("text=Select Payment Method"))
          .or(page.locator("text=Connect Wallet"))
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display portfolio data correctly", async ({ page }) => {
    // Wait for wallet portfolio to load
    await page.waitForTimeout(3000);

    // Check if portfolio components are visible
    const portfolioElements = [
      page.locator("text=Total Value"),
      page.locator("text=Portfolio"),
      page.locator('[data-testid="portfolio-value"]'),
      page.locator("text=$").first(),
    ];

    // At least one portfolio element should be visible
    let foundElement = false;
    for (const element of portfolioElements) {
      if (await element.isVisible()) {
        foundElement = true;
        break;
      }
    }

    expect(foundElement).toBe(true);
  });

  test("should test responsive design", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Navigation should still be accessible
    await expect(
      page.locator("nav").or(page.locator('[data-testid="navigation"]'))
    ).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();

    // Full navigation should be visible
    await expect(page.locator("text=Pricing")).toBeVisible();
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Check if the app handles network errors gracefully
    await page.route("**/api/v1/**", route => route.abort());

    await page.reload();
    await page.waitForTimeout(2000);

    // App should still load and not crash
    await expect(page.locator("body")).toBeVisible();

    // Should show error state or fallback content
    const errorElements = [
      page.locator("text=Error"),
      page.locator("text=Failed to load"),
      page.locator("text=Try again"),
      page.locator('[data-testid="error-fallback"]'),
    ];

    let hasErrorHandling = false;
    for (const element of errorElements) {
      if (await element.isVisible()) {
        hasErrorHandling = true;
        break;
      }
    }

    // Either error handling or app continues working with cached/mock data
    expect(
      hasErrorHandling || (await page.locator("text=Portfolio").isVisible())
    ).toBe(true);
  });
});

test.describe("Quant-Engine API Health Check", () => {
  test("quant-engine should be running and healthy", async ({ request }) => {
    // Test if quant-engine is accessible
    const response = await request.get("http://localhost:8003/health");
    expect(response.status()).toBe(200);

    const healthData = await response.json();
    expect(healthData.status).toBe("healthy");
    expect(healthData.service).toBe("Quant Engine");
  });

  test("quant-engine APR endpoints should work", async ({ request }) => {
    // Test APR pools endpoint
    const response = await request.get(
      "http://localhost:8003/api/v1/apr/pools"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.pools).toBeDefined();
    expect(Array.isArray(data.pools)).toBe(true);
    expect(data.pools.length).toBeGreaterThan(0);
  });

  test("quant-engine protocols endpoint should work", async ({ request }) => {
    // Test protocols endpoint
    const response = await request.get(
      "http://localhost:8003/api/v1/apr/protocols"
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.protocols).toBeDefined();
    expect(Array.isArray(data.protocols)).toBe(true);
    expect(data.protocols.length).toBeGreaterThan(0);
  });
});
