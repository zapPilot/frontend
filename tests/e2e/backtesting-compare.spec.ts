import { expect, test } from "@playwright/test";

test.describe("Backtesting (v3) - JSON editor + multi-series chart", () => {
  const BUNDLE_USER_ID = "0x1234567890123456789012345678901234567890";

  test("renders legend for N series and markers from transfers", async ({
    page,
  }) => {
    // Ensure the bundle dashboard can render without a live analytics backend.
    await page.route("**/api/v2/portfolio/*/landing", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total_net_usd: 0,
          net_portfolio_value: 0,
          positions: 0,
          protocols: 0,
          chains: 0,
          portfolio_allocation: {
            btc: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
            eth: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
            stablecoins: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
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
            {
              id: "simple_regime",
              display_name: "Simple Regime",
              description: "Regime rebalance",
              hyperparam_schema: { type: "object" },
              recommended_params: { pacing_policy: "fgi_linear" },
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
            regime_linear: {
              strategy_id: "regime_linear",
              display_name: "regime_linear",
              total_invested: 10000,
              final_value: 11200,
              roi_percent: 12,
              trade_count: 3,
              max_drawdown_percent: null,
              parameters: {},
            },
            regime_exponential: {
              strategy_id: "regime_exponential",
              display_name: "regime_exponential",
              total_invested: 10000,
              final_value: 10800,
              roi_percent: 8,
              trade_count: 1,
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
                regime_linear: {
                  portfolio_value: 10000,
                  portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
                  event: null,
                  metrics: { signal: "fear", metadata: {} },
                },
                regime_exponential: {
                  portfolio_value: 10000,
                  portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
                  event: null,
                  metrics: { signal: "fear", metadata: {} },
                },
              },
            },
            {
              date: "2024-01-02",
              token_price: { btc: 50500 },
              sentiment: 45,
              sentiment_label: "fear",
              strategies: {
                dca_classic: {
                  portfolio_value: 10100,
                  portfolio_constituant: { spot: 5100, stable: 5000, lp: 0 },
                  event: "buy",
                  metrics: { signal: "dca", metadata: {} },
                },
                regime_linear: {
                  portfolio_value: 10200,
                  portfolio_constituant: { spot: 4800, stable: 5200, lp: 0 },
                  event: "rebalance",
                  metrics: {
                    signal: "fear",
                    metadata: {
                      transfers: [
                        {
                          from_bucket: "spot",
                          to_bucket: "stable",
                          amount_usd: 200,
                        },
                        {
                          from_bucket: "stable",
                          to_bucket: "lp",
                          amount_usd: 200,
                        },
                      ],
                    },
                  },
                },
                regime_exponential: {
                  portfolio_value: 9900,
                  portfolio_constituant: { spot: 4950, stable: 4950, lp: 0 },
                  event: null,
                  metrics: { signal: "fear", metadata: {} },
                },
              },
            },
            {
              date: "2024-01-03",
              token_price: { btc: 51000 },
              sentiment: 60,
              sentiment_label: "greed",
              strategies: {
                dca_classic: {
                  portfolio_value: 10200,
                  portfolio_constituant: { spot: 5200, stable: 5000, lp: 0 },
                  event: "buy",
                  metrics: { signal: "dca", metadata: {} },
                },
                regime_linear: {
                  portfolio_value: 10400,
                  portfolio_constituant: { spot: 5000, stable: 4900, lp: 500 },
                  event: null,
                  metrics: { signal: "greed", metadata: {} },
                },
                regime_exponential: {
                  portfolio_value: 10000,
                  portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
                  event: null,
                  metrics: { signal: "greed", metadata: {} },
                },
              },
            },
          ],
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Strategy tab first
    await page.getByTestId("v22-tab-strategy").click();

    // Then click on Backtesting sub-tab
    await page.getByTestId("strategy-subtab-backtesting").click();

    // Editor renders
    await expect(page.getByText("Request Payload (v3)")).toBeVisible();

    // Results render (from mocked /compare)
    await expect(page.getByText("ROI")).toBeVisible();
    await expect(page.getByText("DCA Classic").first()).toBeVisible();
    await expect(page.getByText("regime linear").first()).toBeVisible();
    await expect(page.getByText("regime exponential").first()).toBeVisible();

    // Marker points appear (sell spot = red, buy lp = blue)
    const sellSpotMarker = page.locator(
      'path[fill=\"#ef4444\"], circle[fill=\"#ef4444\"]'
    );
    await expect(sellSpotMarker.first()).toBeVisible();

    const buyLpMarker = page.locator(
      'path[fill=\"#3b82f6\"], circle[fill=\"#3b82f6\"]'
    );
    await expect(buyLpMarker.first()).toBeVisible();
  });
});
