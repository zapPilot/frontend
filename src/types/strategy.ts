/**
 * Strategy types for the Strategy tab.
 *
 * These types mirror the backend Pydantic models in analytics-engine/src/models/strategy.py
 */

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
 * Direction of regime change
 */
export type RegimeDirection = "improving" | "worsening" | "stable";

/**
 * Action types for suggestions (percentage-based)
 */
export type ActionType = "increase" | "decrease" | "hold";

/**
 * Trade action types for USD-based suggestions
 */
export type TradeActionType = "buy" | "sell" | "hold";

/**
 * Bucket types for strategy allocations
 */
export type BucketType = "spot" | "lp" | "stable";

/**
 * Portfolio allocation buckets for strategy calculations.
 *
 * The three buckets sum to 1.0 (100%):
 * - spot: BTC + ETH + non-LP altcoins
 * - lp: Liquidity provider positions (ETH-USDC, BTC-USDC pairs only)
 * - stable: Stablecoins (USDC, USDT, DAI, etc.)
 */
export interface StrategyBuckets {
  /** Spot holdings percentage (0-1) */
  spot: number;
  /** LP position percentage (0-1) */
  lp: number;
  /** Stablecoin holdings percentage (0-1) */
  stable: number;
}

/**
 * Current market regime information.
 */
export interface RegimeInfo {
  /** Current market regime label */
  current: RegimeLabel;
  /** Direction of regime change from previous day */
  direction: RegimeDirection;
  /** Number of consecutive days in current regime */
  duration_days: number;
  /** Fear & Greed Index value (0-100), if available */
  sentiment_value: number | null;
}

/**
 * Drift information for a single bucket.
 */
export interface BucketDrift {
  /** Current allocation percentage (0-1) */
  current: number;
  /** Target allocation percentage (0-1) */
  target: number;
  /** Drift from target (current - target) */
  drift: number;
  /** Absolute drift value */
  drift_abs: number;
}

/**
 * Portfolio drift analysis from target allocation.
 */
export interface DriftInfo {
  /** Maximum drift across all buckets (absolute value) */
  max_drift: number;
  /** Per-bucket drift details */
  bucket_drifts: Record<BucketType, BucketDrift>;
  /** Whether drift exceeds threshold requiring rebalance */
  needs_rebalance: boolean;
  /** Drift threshold for triggering rebalance */
  threshold: number;
}

/**
 * A single suggested action (read-only for MVP).
 */
export interface SuggestionAction {
  /** Type of action for this bucket */
  action_type: ActionType;
  /** Which bucket this action applies to */
  bucket: BucketType;
  /** Current allocation percentage (0-100) */
  current_pct: number;
  /** Target allocation percentage (0-100) */
  target_pct: number;
  /** Suggested change in percentage points */
  change_pct: number;
  /** Human-readable description of the action */
  description: string;
}

/**
 * Today's specific trade suggestion with USD amounts.
 *
 * Represents a concrete action to execute as part of the pacing plan,
 * including the USD amount to move and the source/destination buckets.
 */
export interface TradeSuggestion {
  /** Which bucket this trade affects */
  bucket: BucketType;
  /** Type of action: buy (add to bucket), sell (remove from bucket), hold */
  action: TradeActionType;
  /** USD amount to move in this trade */
  amount_usd: number;
  /** Source bucket for the move (null if action is hold) */
  from_bucket: BucketType | null;
  /** Destination bucket for the move (null if action is hold) */
  to_bucket: BucketType | null;
  /** Fraction of total delta executed in this step (e.g., 0.15 = 15%) */
  step_fraction: number;
  /** Human-readable description (e.g., 'Buy $1,500 of spot from stable') */
  description: string;
}

/**
 * Pacing configuration for gradual rebalancing.
 *
 * Describes how the FGI-based pacing policy shapes the convergence
 * toward target allocation over multiple steps.
 */
export interface PacingInfo {
  /** Name of the pacing policy (e.g., 'fgi_exponential') */
  policy_name: string;
  /** Total steps to converge to target (5-15 based on FGI) */
  total_steps: number;
  /** Recommended days between steps (2-4 based on FGI) */
  interval_days: number;
  /** Weight for the current step (front-loaded: higher for early steps) */
  step_weight: number;
  /** Percentage of remaining delta to execute this step */
  convergence_pct: number;
}

/**
 * Daily strategy suggestion response.
 */
export interface DailySuggestionResponse {
  /** Current market regime information */
  regime: RegimeInfo;
  /** User's current portfolio allocation in strategy buckets */
  current_allocation: StrategyBuckets;
  /** Recommended target allocation based on regime */
  target_allocation: StrategyBuckets;
  /** Name of target allocation state (e.g., 'heavy_spot', 'balanced_lp') */
  target_name: string | null;
  /** Portfolio drift from target allocation */
  drift: DriftInfo;
  /** Regex pattern that matched the regime history */
  matched_pattern: string | null;
  /** Human-readable explanation for the pattern match */
  pattern_reason: string | null;
  /** List of suggested actions (percentage-based, for display) */
  suggested_actions: SuggestionAction[];
  /** Pacing configuration for gradual rebalancing */
  pacing: PacingInfo | null;
  /** Today's specific trade suggestions with USD amounts */
  trade_suggestions: TradeSuggestion[];
  /** Date/time of this suggestion */
  suggestion_date: string;
  /** True if pattern recommends holding current position */
  hold_recommendation: boolean;
  /** Total portfolio value in USD */
  total_value_usd: number;
  /** Number of days of regime history used for pattern matching */
  regime_history_days: number;
  /** Total days of portfolio history available for this user */
  total_portfolio_history_days: number;
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
  strategy_id: "dca_classic" | "simple_regime";
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
