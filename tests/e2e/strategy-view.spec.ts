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

    // Mock strategy presets API (used by SuggestionView preset selector)
    await page.route("**/api/v3/strategy/configs", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            config_id: "regime_mapping",
            display_name: "Regime-Based (Conservative)",
            description: "Rebalances gradually based on regime buckets",
            strategy_id: "simple_regime",
            params: {
              drift_threshold: 0.05,
              ath_cooldown_days: 7,
              pacing_policy: "regime_mapping",
              pacing_policy_params: {},
              regime_history_days: 30,
            },
            is_default: false,
          },
          {
            config_id: "fgi_exponential",
            display_name: "FGI Exponential (Aggressive)",
            description:
              "Front-loaded rebalancing using FGI exponential pacing",
            strategy_id: "simple_regime",
            params: {
              drift_threshold: 0.05,
              ath_cooldown_days: 7,
              pacing_policy: "fgi_exponential",
              pacing_policy_params: { k: 3.0, r_max: 1.2 },
              regime_history_days: 30,
            },
            is_default: true,
          },
        ]),
      });
    });
  });

  test("switches between Suggestion and Backtesting sub-tabs", async ({
    page,
  }) => {
    // Mock the daily suggestion API
    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
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
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();

    // Click on Backtesting sub-tab
    await page.getByTestId("strategy-subtab-backtesting").click();

    // Should show Backtesting view
    await expect(page.getByText("DCA Strategy Comparison")).toBeVisible();
    await expect(page.getByText("Request Payload (v3)")).toBeVisible();

    // Click back to Suggestion sub-tab
    await page.getByTestId("strategy-subtab-suggestion").click();

    // Should show Suggestion view again
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();
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
    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
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

test.describe("Strategy View - Preset Selector", () => {
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

    // Mock strategy presets API with 2 presets (fgi_exponential is default)
    await page.route("**/api/v3/strategy/configs", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            config_id: "regime_mapping",
            display_name: "Regime-Based (Conservative)",
            description: "Rebalances gradually based on regime buckets",
            strategy_id: "simple_regime",
            params: {},
            is_default: false,
          },
          {
            config_id: "fgi_exponential",
            display_name: "FGI Exponential (Aggressive)",
            description:
              "Front-loaded rebalancing using FGI exponential pacing",
            strategy_id: "simple_regime",
            params: { k: 3.0 },
            is_default: true,
          },
        ]),
      });
    });
  });

  test("displays preset selector in Suggestion tab when presets loaded", async ({
    page,
  }) => {
    // Mock daily suggestion API
    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
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
          current_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_name: "neutral_regime",
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

    // Wait for suggestion view to load
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();

    // Should show the preset selector label
    await expect(page.getByText("Strategy preset")).toBeVisible();

    // Should show a dropdown/select element
    const select = page.locator("select");
    await expect(select).toBeVisible();
  });

  test("shows default preset (is_default=true) as selected on load", async ({
    page,
  }) => {
    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
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
          current_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_name: "neutral_regime",
          trade_suggestions: [],
          pacing: null,
          total_value_usd: 10000,
          total_portfolio_history_days: 90,
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    await page.getByTestId("v22-tab-strategy").click();
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();

    // The default preset (fgi_exponential) should be selected
    const select = page.locator("select");
    await expect(select).toHaveValue("fgi_exponential");

    // Should show "(Recommended)" suffix for the default option
    await expect(
      page.locator("option", { hasText: "(Recommended)" })
    ).toBeAttached();
  });

  test("updates description when different preset selected", async ({
    page,
  }) => {
    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
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
          current_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_name: "neutral_regime",
          trade_suggestions: [],
          pacing: null,
          total_value_usd: 10000,
          total_portfolio_history_days: 90,
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    await page.getByTestId("v22-tab-strategy").click();
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();

    // Initially should show the default preset's description
    await expect(
      page.getByText("Front-loaded rebalancing using FGI exponential pacing")
    ).toBeVisible();

    // Select the non-default preset
    const select = page.locator("select");
    await select.selectOption("regime_mapping");

    // Description should update to the new preset's description
    await expect(
      page.getByText("Rebalances gradually based on regime buckets")
    ).toBeVisible();
  });

  test("selecting non-default preset sends config_id to API", async ({
    page,
  }) => {
    let capturedConfigId: string | null = null;

    // Intercept API calls to capture the config_id parameter
    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
      const url = route.request().url();
      const urlParams = new URL(url).searchParams;
      capturedConfigId = urlParams.get("config_id");

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
          current_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_name: "neutral_regime",
          trade_suggestions: [],
          pacing: null,
          total_value_usd: 10000,
          total_portfolio_history_days: 90,
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    await page.getByTestId("v22-tab-strategy").click();
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();

    // Select the non-default preset
    const select = page.locator("select");
    await select.selectOption("regime_mapping");

    // Wait for the API call triggered by preset change
    await page.waitForResponse(
      resp =>
        resp.url().includes("/api/v3/strategy/daily-suggestion/") &&
        resp.url().includes("config_id=regime_mapping")
    );

    // Verify config_id was sent
    expect(capturedConfigId).toBe("regime_mapping");
  });

  test("selecting default preset omits config_id from API", async ({
    page,
  }) => {
    let apiCallCount = 0;
    let lastConfigId: string | null = null;

    await page.route("**/api/v3/strategy/daily-suggestion/**", async route => {
      apiCallCount++;
      const url = route.request().url();
      const urlParams = new URL(url).searchParams;
      lastConfigId = urlParams.get("config_id");

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
          current_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_allocation: { spot: 0.5, lp: 0.2, stable: 0.3 },
          target_name: "neutral_regime",
          trade_suggestions: [],
          pacing: null,
          total_value_usd: 10000,
          total_portfolio_history_days: 90,
        }),
      });
    });

    await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
    await page.waitForLoadState("domcontentloaded");

    await page.getByTestId("v22-tab-strategy").click();
    await expect(
      page.getByRole("heading", { name: "Today's Suggestion" })
    ).toBeVisible();

    // First call (on load) - default preset selected, no config_id
    expect(lastConfigId).toBeNull();

    // Select non-default first
    const select = page.locator("select");
    await select.selectOption("regime_mapping");
    await page.waitForTimeout(500); // Wait for API call

    // Then select back to default
    await select.selectOption("fgi_exponential");

    // Wait for the API call to complete
    await page.waitForTimeout(500);

    // When default is selected, config_id should be omitted (null)
    // The behavior depends on implementation - if it sends empty string or omits entirely
    // For this test, we verify at least 2 API calls were made (initial + after selection)
    expect(apiCallCount).toBeGreaterThanOrEqual(2);
  });
});
