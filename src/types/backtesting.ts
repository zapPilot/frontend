/**
 * Target allocation percentages for a specific market regime.
 * Percentages should sum to 100.
 */
export interface RegimeAllocation {
  spot: number; // 0-100%
  lp: number; // 0-100%
  stable: number; // 0-100%
}

/**
 * Complete allocation configuration set with a unique identifier.
 * Defines target allocations for each market regime.
 */
export interface AllocationConfig {
  id: string; // Unique identifier for this config (e.g., "aggressive", "conservative")
  name: string; // Display name (e.g., "Aggressive Growth")
  description?: string; // Optional description
  extreme_fear: RegimeAllocation;
  fear: RegimeAllocation;
  neutral: RegimeAllocation;
  greed: RegimeAllocation;
  extreme_greed: RegimeAllocation;
}

export interface BacktestRequest {
  token_symbol: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  total_capital: number; // Total starting capital (split 50% BTC, 50% stables)
  days?: number;
  drift_threshold?: number; // Optional drift threshold parameter used by backend to control rebalancing sensitivity (see analytics-engine backtesting docs for units and defaults)
  strategies?: ("smart_dca" | "simple_regime")[]; // Array of strategies to compare: smart_dca (multi-step) or simple_regime (pattern-based)
  /**
   * NEW: Array of allocation configurations to test.
   * Backend will create a separate strategy variant for each configuration.
   * Strategy IDs will be: `smart_dca_${config.id}`
   */
  allocation_configs?: AllocationConfig[];
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
