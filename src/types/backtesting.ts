/**
 * Backtesting types aligned with analytics-engine v3 endpoints.
 *
 * - GET  /api/v3/backtesting/strategies
 * - POST /api/v3/backtesting/compare
 */

export type BacktestStrategyIdV3 = "dca_classic" | "simple_regime";

export interface BacktestCompareConfigV3 {
  /** Client-provided identifier; becomes the response `strategy_id` key. */
  config_id: string;
  strategy_id: BacktestStrategyIdV3;
  params?: Record<string, unknown>;
}

export interface BacktestRequest {
  /** @deprecated backend defaults to BTC if omitted */
  token_symbol?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  days?: number;
  total_capital: number;
  configs: BacktestCompareConfigV3[];
}

export interface BacktestStrategySummary {
  strategy_id: string;
  display_name: string;
  total_invested: number;
  final_value: number;
  roi_percent: number;
  trade_count: number;

  // Risk Metrics (optional on older payloads)
  max_drawdown_percent: number | null;
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  calmar_ratio?: number | null;
  volatility?: number | null;
  beta?: number | null;

  // Borrowing metrics (optional - only present when borrowing is enabled)
  total_borrow_events?: number | null;
  total_repay_events?: number | null;
  liquidation_events?: number | null;
  total_interest_paid?: number | null;
  total_yield_from_borrowed?: number | null;
  max_borrowed_amount?: number | null;
  time_in_leverage_pct?: number | null;

  parameters: Record<string, unknown>;
}

export interface BacktestPortfolioConstituant {
  spot: Record<string, number>;
  stable: number;
  lp: Record<string, number>;
}

export type BacktestEvent =
  | "buy"
  | "sell"
  | "rebalance"
  | "borrow"
  | "repay"
  | "liquidate"
  | string
  | null;

export interface BacktestStrategyPoint {
  portfolio_value: number;
  portfolio_constituant: BacktestPortfolioConstituant;
  event: BacktestEvent;
  metrics: Record<string, unknown>;
}

/**
 * Dynamic strategy set supporting any number of strategies.
 * Keys are config IDs (strategy_id in the response).
 */
export type BacktestStrategySet<T> = Record<string, T>;

export interface BacktestTimelinePoint {
  date: string;
  token_price: Record<string, number>;
  sentiment: number | null;
  sentiment_label: string | null;
  dma_200?: number | null;
  strategies: BacktestStrategySet<BacktestStrategyPoint>;
}

export interface BacktestResponse {
  strategies: BacktestStrategySet<BacktestStrategySummary>;
  timeline: BacktestTimelinePoint[];
}

export type BacktestBucket = "spot" | "stable" | "lp";

export interface BacktestTransferMetadata {
  from_bucket: BacktestBucket;
  to_bucket: BacktestBucket;
  amount_usd: number;
}

export interface BacktestStrategyCatalogEntryV3 {
  id: BacktestStrategyIdV3;
  display_name: string;
  description?: string | null;
  hyperparam_schema: Record<string, unknown>;
  recommended_params: Record<string, unknown>;
}

export interface BacktestStrategyCatalogResponseV3 {
  catalog_version: string;
  strategies: BacktestStrategyCatalogEntryV3[];
}
