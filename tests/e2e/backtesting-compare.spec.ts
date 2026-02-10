import { expect, type Page, type Route, test } from "@playwright/test";

const BUNDLE_USER_ID = "0x1234567890123456789012345678901234567890";

const ROUTE_PATTERNS = {
  landing: "**/api/v2/portfolio/*/landing",
  strategies: "**/api/v3/backtesting/strategies",
  compare: "**/api/v3/backtesting/compare",
  strategyConfigs: "**/api/v3/strategy/configs",
} as const;

const SELECTORS = {
  investTabTestId: "v22-tab-invest",
  backtestingSubTabName: /^backtesting$/i,
  roiLabel: "ROI",
  calmarLabel: "CALMAR",
  maxDrawdownLabel: "MAX DRAWDOWN",
} as const;

const LANDING_RESPONSE = {
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
} as const;

const STRATEGIES_RESPONSE = {
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
} as const;

const STRATEGY_CONFIGS_RESPONSE = {
  presets: [
    {
      config_id: "dca_classic",
      display_name: "Classic DCA",
      description: "Simple dollar-cost averaging baseline",
      strategy_id: "dca_classic",
      params: {},
      is_default: false,
      is_benchmark: true,
    },
    {
      config_id: "fgi_exponential",
      display_name: "FGI Exponential (Aggressive)",
      description: "Front-loaded rebalancing using FGI exponential pacing",
      strategy_id: "simple_regime",
      params: { k: 3.0, r_max: 1.2 },
      is_default: true,
      is_benchmark: false,
    },
  ],
  backtest_defaults: {
    days: 500,
    total_capital: 10000,
  },
} as const;

const COMPARE_RESPONSE = {
  strategies: {
    dca_classic: {
      strategy_id: "dca_classic",
      display_name: "DCA Classic",
      total_invested: 10000,
      final_value: 11000,
      roi_percent: 10,
      trade_count: 2,
      max_drawdown_percent: -5,
      calmar_ratio: 2.0,
      sharpe_ratio: 0.8,
      sortino_ratio: 1.1,
      volatility: 0.12,
      beta: 0.95,
      parameters: {},
    },
    regime_linear: {
      strategy_id: "regime_linear",
      display_name: "regime_linear",
      total_invested: 10000,
      final_value: 11200,
      roi_percent: 12,
      trade_count: 3,
      max_drawdown_percent: -4,
      calmar_ratio: 3.0,
      sharpe_ratio: 1.2,
      sortino_ratio: 1.6,
      volatility: 0.18,
      beta: 1.1,
      parameters: {},
    },
    regime_exponential: {
      strategy_id: "regime_exponential",
      display_name: "regime_exponential",
      total_invested: 10000,
      final_value: 10800,
      roi_percent: 8,
      trade_count: 1,
      max_drawdown_percent: -3,
      calmar_ratio: 2.67,
      sharpe_ratio: 0.9,
      sortino_ratio: 1.3,
      volatility: 0.15,
      beta: 1.0,
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
} as const;

function getJsonResponseOptions(body: unknown): {
  status: number;
  contentType: string;
  body: string;
} {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill(getJsonResponseOptions(body));
}

async function registerBacktestingRoutes(page: Page): Promise<void> {
  await page.route(
    ROUTE_PATTERNS.landing,
    async function handleLandingRoute(route: Route): Promise<void> {
      await fulfillJson(route, LANDING_RESPONSE);
    }
  );

  await page.route(
    ROUTE_PATTERNS.strategies,
    async function handleStrategiesRoute(route: Route): Promise<void> {
      await fulfillJson(route, STRATEGIES_RESPONSE);
    }
  );

  await page.route(
    ROUTE_PATTERNS.strategyConfigs,
    async function handleStrategyConfigsRoute(route: Route): Promise<void> {
      await fulfillJson(route, STRATEGY_CONFIGS_RESPONSE);
    }
  );

  await page.route(
    ROUTE_PATTERNS.compare,
    async function handleCompareRoute(route: Route): Promise<void> {
      await fulfillJson(route, COMPARE_RESPONSE);
    }
  );
}

async function openBacktestingView(page: Page): Promise<void> {
  await page.goto(`/bundle?userId=${BUNDLE_USER_ID}`);
  await page.waitForLoadState("domcontentloaded");
  await page.getByTestId(SELECTORS.investTabTestId).click();
  await page
    .getByRole("button", { name: SELECTORS.backtestingSubTabName })
    .first()
    .click();
}

test.describe("Backtesting (v3) - Terminal display + multi-series chart", () => {
  test("renders terminal display with hero metrics and chart legend", async ({
    page,
  }) => {
    await registerBacktestingRoutes(page);
    await openBacktestingView(page);

    // Terminal display hero metrics should be visible
    await expect(page.getByText(SELECTORS.roiLabel)).toBeVisible();
    await expect(page.getByText(SELECTORS.calmarLabel)).toBeVisible();
    await expect(page.getByText(SELECTORS.maxDrawdownLabel)).toBeVisible();

    // Chart legend shows strategy display names
    await expect(page.getByText("DCA Classic").first()).toBeVisible();
    await expect(page.getByText("regime linear").first()).toBeVisible();
    await expect(page.getByText("regime exponential").first()).toBeVisible();

    // Chart signal legend entries
    await expect(page.getByText("Sell Spot").first()).toBeVisible();
    await expect(page.getByText("Buy LP").first()).toBeVisible();
  });
});
