/**
 * Strategy types for the Strategy tab.
 *
 * These types mirror the backend Pydantic models in analytics-engine/src/models/strategy.py
 */

import type {
  BacktestDecision,
  BacktestExecution,
  BacktestMarketPoint,
  BacktestSignal,
  BacktestStrategyPortfolio,
} from "./backtesting";

/**
 * Market regime labels
 */
export type RegimeLabel =
  | "extreme_fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme_greed";

/**
 * Daily strategy suggestion response.
 */
export interface DailySuggestionResponse {
  as_of: string;
  config_id: string;
  strategy_id: string;
  market: BacktestMarketPoint;
  portfolio: BacktestStrategyPortfolio;
  signal: BacktestSignal | null;
  decision: BacktestDecision;
  execution: BacktestExecution;
}

/**
 * Request parameters for daily suggestion endpoint.
 */
export interface DailySuggestionParams {
  /** Strategy preset id (defaults to backend-recommended preset if omitted) */
  config_id?: string;
  /** Minimum drift to recommend rebalancing (default 0.05 = 5%) */
  drift_threshold?: number;
  /** Days of regime history for pattern matching (default 30) */
  regime_history_days?: number;
}

/**
 * Strategy configuration preset served by analytics-engine.
 */
export interface StrategyPreset {
  config_id: string;
  display_name: string;
  description: string | null;
  strategy_id: string;
  params: Record<string, unknown>;
  is_default: boolean;
  /** Whether this preset is the baseline for comparisons (e.g., DCA Classic) */
  is_benchmark: boolean;
}

/**
 * Default parameters for backtesting simulations.
 *
 * These are global simulation parameters (not per-strategy) because:
 * - days and total_capital are simulation parameters, not strategy parameters
 * - Users test the same strategy with different time periods
 */
export interface BacktestDefaults {
  /** Default simulation period in days */
  days: number;
  /** Default capital for simulation */
  total_capital: number;
}

/**
 * Response from the /configs endpoint.
 *
 * Wraps presets and backtest defaults in a structured response envelope
 * for extensibility and backward compatibility.
 */
export interface StrategyConfigsResponse {
  presets: StrategyPreset[];
  backtest_defaults: BacktestDefaults;
}
