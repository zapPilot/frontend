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

export interface BacktestStrategySet<T> {
  dca_classic: T;
  smart_dca: T;
}

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
