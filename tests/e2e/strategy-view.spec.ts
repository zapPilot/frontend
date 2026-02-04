import { expect, test } from "@playwright/test";

test.describe("Strategy View - Sub-tab Navigation", () => {
  const BUNDLE_USER_ID = "0x1234567890123456789012345678901234567890";

  test.beforeEach(async ({ page }) => {
    // Mock the portfolio landing API
    await page.route("**/api/v2/portfolio/*/landing", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total_net_usd: 10000,
          net_portfolio_value: 10000,
          positions: 5,
          protocols: 2,
          chains: 1,
          portfolio_allocation: {
            btc: {
              total_value: 5000,
              percentage_of_portfolio: 50,
              wallet_tokens_value: 5000,
              other_sources_value: 0,
            },
            eth: {
              total_value: 3000,
              percentage_of_portfolio: 30,
              wallet_tokens_value: 3000,
              other_sources_value: 0,
            },
            stablecoins: {
              total_value: 2000,
              percentage_of_portfolio: 20,
              wallet_tokens_value: 2000,
              other_sources_value: 0,
            },
            others: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
          },
        }),
      });
    });
  });

  test("switches between Suggestion and Backtesting sub-tabs", async ({
    page,
  }) => {
    // Mock the daily suggestion API
    await page.route("**/api/v3/strategy/suggestion/*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          regime: {
            current: "neutral",
            sentiment_value: 50,
            direction: "stable",
            duration_days: 1,
          },
          current_allocation: {
            spot: 0.5,
            lp: 0.2,
            stable: 0.3,
          },
          target_allocation: {
            spot: 0.5,
            lp: 0.2,
            stable: 0.3,
          },
          target_name: "neutral_regime",
          trade_suggestions: [],
          pacing: null,
          total_value_usd: 10000,
          total_portfolio_history_days: 90,
        }),
      });
    });

    // Mock backtesting APIs
    await page.route("**/api/v3/backtesting/strategies", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          catalog_version: "1.0.0",
          strategies: [
            {
              id: "dca_classic",
              display_name: "DCA Classic",
              description: "Baseline",
              hyperparam_schema: { type: "object" },
              recommended_params: {},
            },
          ],
        }),
      });
    });

    await page.route("**/api/v3/backtesting/compare", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          strategies: {
            dca_classic: {
              strategy_id: "dca_classic",
              display_name: "DCA Classic",
              total_invested: 10000,
              final_value: 11000,
              roi_percent: 10,
              trade_count: 2,
              max_drawdown_percent: null,
              parameters: {},
            },
          },
          timeline: [
            {
              date: "2024-01-01",
              token_price: { btc: 50000 },
              sentiment: 50,
              sentiment_label: "neutral",
              strategies: {
                dca_classic: {
                  portfolio_value: 10000,
                  portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
                  event: "buy",
                  metrics: { signal: "dca", metadata: {} },
                },
              },
            },
          ],
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Strategy tab
    await page.getByTestId("v22-tab-strategy").click();

    // Should show Suggestion view by default
    await expect(page.getByText("Today's Suggestion")).toBeVisible();

    // Click on Backtesting sub-tab
    await page.getByTestId("strategy-subtab-backtesting").click();

    // Should show Backtesting view
    await expect(page.getByText("DCA Strategy Comparison")).toBeVisible();
    await expect(page.getByText("Request Payload (v3)")).toBeVisible();

    // Click back to Suggestion sub-tab
    await page.getByTestId("strategy-subtab-suggestion").click();

    // Should show Suggestion view again
    await expect(page.getByText("Today's Suggestion")).toBeVisible();
  });

  test("shows empty state when wallet is not connected", async ({ page }) => {
    await page.goto("/bundle");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Strategy tab
    await page.getByTestId("v22-tab-strategy").click();

    // Should show empty state
    await expect(
      page.getByText("Connect wallet to view suggestions")
    ).toBeVisible();
  });

  test("shows loading state while fetching suggestion data", async ({
    page,
  }) => {
    // Mock with delayed response
    await page.route("**/api/v3/strategy/suggestion/*", async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          regime: {
            current: "greed",
            sentiment_value: 70,
            direction: "improving",
            duration_days: 2,
          },
          current_allocation: {
            spot: 0.7,
            lp: 0.1,
            stable: 0.2,
          },
          target_allocation: {
            spot: 0.8,
            lp: 0.1,
            stable: 0.1,
          },
          target_name: "greed_regime",
          trade_suggestions: [],
          pacing: null,
          total_value_usd: 10000,
          total_portfolio_history_days: 90,
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Strategy tab
    await page.getByTestId("v22-tab-strategy").click();

    // Should show loading state
    await expect(
      page.getByText("Loading strategy suggestion...")
    ).toBeVisible();

    // Wait for data to load
    await expect(page.getByText("Today's Suggestion")).toBeVisible({
      timeout: 5000,
    });
  });
});
