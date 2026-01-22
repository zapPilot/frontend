export interface BacktestRequest {
  token_symbol: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  total_capital: number; // Total starting capital (split 50% BTC, 50% stables)
  days?: number;
  rebalance_step_count?: number; // Number of steps to reach target allocation (default: 10)
  rebalance_interval_days?: number; // Minimum days between rebalancing trades (default: 3)
  action_regimes?: string[]; // Regimes that trigger capital deployment
  use_equal_capital_pool?: boolean; // Whether to use Equal Capital Pool model (default: true)
  drift_threshold?: number; // Optional drift threshold parameter used by backend to control rebalancing sensitivity (see analytics-engine backtesting docs for units and defaults)
  additional_strategies?: string[]; // Additional strategies to run (e.g., ["momentum", "mean_reversion", "sentiment_dca"])
}


export interface BacktestStrategySummary {
  strategy_id: string;
  display_name: string;
  total_invested: number;
  final_value: number;
  roi_percent: number;
  trade_count: number;
  max_drawdown_percent: number | null;
  parameters: Record<string, unknown>;
  // Risk-adjusted return metrics
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  calmar_ratio?: number | null;
  volatility?: number | null;
  beta?: number | null;
}

export interface BacktestStrategyMetrics {
  regime?: string | null;
  spot_balance?: number;
  lp_balance?: number;
  stable_balance?: number;
  allocation?: {
    spot: number;
    lp: number;
    stable: number;
  };
  effective_exposure?: number;
  target_reached?: boolean;
}

export type BacktestEvent =
  | "buy"
  | "sell"
  | "buy_spot"
  | "sell_spot"
  | "buy_lp"
  | "sell_lp"
  | null;

export interface BacktestStrategyTimeline {
  portfolio_value: number;
  capital_invested: number;
  holdings_value: number;
  available_capital: number;
  roi_percent: number;
  event: BacktestEvent;
  metrics: BacktestStrategyMetrics | Record<string, never>;
}

/**
 * Dynamic strategy set supporting any number of strategies.
 * Keys are strategy IDs (e.g., "dca_classic", "smart_dca", "momentum", "sentiment_dca").
 * Always includes at least "dca_classic" and "smart_dca" (the core comparison strategies).
 */
export type BacktestStrategySet<T> = Record<string, T>;

export interface BacktestTimelinePoint {
  date: string;
  price: number;
  sentiment: number | null;
  sentiment_label: string | null;
  strategies: BacktestStrategySet<BacktestStrategyTimeline>;
}

export interface BacktestResponse {
  strategies: BacktestStrategySet<BacktestStrategySummary>;
  timeline: BacktestTimelinePoint[];
}
