import type { BacktestRequest } from "@/types/backtesting";

export const DEFAULT_REQUEST: BacktestRequest = {
  token_symbol: "BTC",
  total_capital: 10000,
  days: 500,
  rebalance_step_count: 20,
  rebalance_interval_days: 2,
  drift_threshold: 0.25,
};

/**
 * Display names for strategy IDs.
 * Used for human-readable labels in the UI.
 */
export const STRATEGY_DISPLAY_NAMES: Record<string, string> = {
  dca_classic: "Normal DCA",
  smart_dca: "Regime Strategy",
  momentum: "Momentum",
  mean_reversion: "Mean Reversion",
  trend_following: "Trend Following",
  sentiment_dca: "Sentiment DCA",
};

/**
 * Strategy colors for consistent visual identification.
 */
export const STRATEGY_COLORS: Record<string, string> = {
  dca_classic: "#4b5563",
  smart_dca: "#3b82f6",
  momentum: "#10b981",
  mean_reversion: "#f59e0b",
  trend_following: "#8b5cf6",
  sentiment_dca: "#ec4899",
};

export {
    ALLOCATION_STRATEGY_COLORS,
    getAllocationStrategyDisplayName
} from "./presetAllocations";

