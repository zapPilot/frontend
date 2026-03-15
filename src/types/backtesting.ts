/**
 * Backtesting types aligned with analytics-engine v3 endpoints.
 *
 * - GET  /api/v3/backtesting/strategies
 * - POST /api/v3/backtesting/compare
 */

export type BacktestStrategyIdV3 = "dca_classic" | "dma_gated_fgi";

export interface BacktestCompareParamsV3 {
  cross_cooldown_days?: number;
  cross_on_touch?: boolean;
  pacing_k?: number;
  pacing_r_max?: number;
  buy_sideways_window_days?: number;
  buy_sideways_max_range?: number;
  buy_leg_caps?: number[];
}

export interface BacktestCompareConfigV3 {
  /** Client-provided identifier; becomes the response `strategy_id` key. */
  config_id: string;
  strategy_id: BacktestStrategyIdV3;
  params?: BacktestCompareParamsV3;
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
  signal_id?: string | null;
  total_invested: number;
  final_value: number;
  roi_percent: number;
  trade_count: number;
  final_allocation: BacktestPortfolioAllocation;

  // Optional on some payloads.
  max_drawdown_percent?: number | null;
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  calmar_ratio?: number | null;
  volatility?: number | null;
  beta?: number | null;

  parameters: Record<string, unknown>;
}

export interface BacktestPortfolioAllocation {
  spot: number;
  stable: number;
}

export interface BacktestStrategyPortfolio {
  spot_usd: number;
  stable_usd: number;
  total_value: number;
  allocation: BacktestPortfolioAllocation;
}

export interface BacktestDmaSignalDetails {
  dma_200: number | null;
  distance: number | null;
  zone: "above" | "below" | "at" | null;
  cross_event: "cross_up" | "cross_down" | null;
  cooldown_active: boolean | null;
  cooldown_remaining_days: number | null;
  cooldown_blocked_zone: "above" | "below" | null;
  fgi_slope: number | null;
}

export interface BacktestSignalDetails {
  ath_event?: "token_ath" | "portfolio_ath" | "both_ath" | null;
  dma?: BacktestDmaSignalDetails | null;
  [key: string]: unknown;
}

export interface BacktestSignal {
  id?: string;
  regime?: string;
  raw_value?: number | null;
  confidence?: number;
  details?: BacktestSignalDetails;
  /** @deprecated legacy compatibility for client-side mocks/tests */
  signal_id?: string;
  /** @deprecated legacy compatibility for client-side mocks/tests */
  ath_event?: "token_ath" | "portfolio_ath" | "both_ath" | null;
  /** @deprecated legacy compatibility for client-side mocks/tests */
  dma?: BacktestDmaSignalDetails | null;
}

export interface BacktestDecisionDetails {
  allocation_name?: string | null;
  risk_notes?: string[];
  decision_score?: number;
  [key: string]: unknown;
}

export interface BacktestDecision {
  action: "buy" | "sell" | "hold";
  reason: string;
  rule_group: "cross" | "cooldown" | "dma_fgi" | "ath" | "fgi" | "none";
  target_allocation: BacktestPortfolioAllocation;
  immediate: boolean;
  details?: BacktestDecisionDetails;
}

export type BacktestBucket = "spot" | "stable";

export interface BacktestTransferMetadata {
  from_bucket: BacktestBucket;
  to_bucket: BacktestBucket;
  amount_usd: number;
}

export interface BacktestBuyGateDiagnostics {
  buy_strength: number | null;
  sideways_confirmed: boolean | null;
  window_days: number | null;
  range_value: number | null;
  leg_index: number | null;
  leg_cap_pct: number | null;
  leg_cap_usd: number | null;
  leg_spent_usd: number | null;
  episode_state: string | null;
  block_reason: string | null;
}

export interface BacktestExecutionDiagnostics {
  plugins: Record<string, Record<string, unknown> | null>;
}

export interface BacktestExecution {
  event: string | null;
  transfers: BacktestTransferMetadata[];
  blocked_reason: string | null;
  step_count: number;
  steps_remaining: number;
  interval_days: number;
  diagnostics?: BacktestExecutionDiagnostics;
  /** @deprecated legacy compatibility for client-side mocks/tests */
  buy_gate?: BacktestBuyGateDiagnostics | null;
}

export interface BacktestStrategyPoint {
  portfolio: BacktestStrategyPortfolio;
  signal: BacktestSignal | null;
  decision: BacktestDecision;
  execution: BacktestExecution;
}

/**
 * Dynamic strategy set supporting any number of strategies.
 * Keys are config IDs (strategy_id in the response).
 */
export type BacktestStrategySet<T> = Record<string, T>;

export interface BacktestMarketPoint {
  date: string;
  token_price: Record<string, number>;
  sentiment: number | null;
  sentiment_label: string | null;
}

export interface BacktestTimelinePoint {
  market: BacktestMarketPoint;
  strategies: BacktestStrategySet<BacktestStrategyPoint>;
}

export interface BacktestPeriodInfo {
  start_date: string;
  end_date: string;
  days: number;
}

export interface BacktestWindowInfo {
  requested: BacktestPeriodInfo;
  effective: BacktestPeriodInfo;
  truncated: boolean;
}

export interface BacktestResponse {
  strategies: BacktestStrategySet<BacktestStrategySummary>;
  timeline: BacktestTimelinePoint[];
  window?: BacktestWindowInfo | null;
}

export interface BacktestStrategyCatalogEntryV3 {
  strategy_id: BacktestStrategyIdV3;
  display_name: string;
  description?: string | null;
  param_schema: Record<string, unknown>;
  default_params: Record<string, unknown>;
  supports_daily_suggestion: boolean;
}

export interface BacktestStrategyCatalogResponseV3 {
  catalog_version: string;
  strategies: BacktestStrategyCatalogEntryV3[];
}
