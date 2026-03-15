/**
 * API service for strategy suggestions from analytics-engine.
 *
 * Provides regime-aware allocation recommendations based on market sentiment
 * pattern matching.
 */

import { httpUtils } from "@/lib/http";
import type {
  BacktestDefaults,
  DailySuggestionParams,
  DailySuggestionResponse,
  StrategyConfigsResponse,
  StrategyPreset,
} from "@/types/strategy";

// Re-export types for external use
export type {
  BacktestDefaults,
  DailySuggestionParams,
  DailySuggestionResponse,
  StrategyConfigsResponse,
  StrategyPreset,
};

// =========================================================================
// CONFIG PRESETS ENDPOINT
// =========================================================================

/** Fallback defaults for backward compatibility (when backend returns old format). */
const FALLBACK_BACKTEST_DEFAULTS: BacktestDefaults = {
  days: 90,
  total_capital: 10000,
};

/**
 * Get strategy presets and backtest defaults.
 *
 * Returns the response envelope containing presets and backtest_defaults.
 * Handles backward compatibility with old API format (array of presets).
 */
export async function getStrategyConfigs(): Promise<StrategyConfigsResponse> {
  const endpoint = `/api/v3/strategy/configs`;
  const response = await httpUtils.analyticsEngine.get(endpoint);

  if (Array.isArray(response)) {
    return {
      presets: response as StrategyPreset[],
      backtest_defaults: FALLBACK_BACKTEST_DEFAULTS,
    };
  }

  return response as StrategyConfigsResponse;
}

// ============================================================================
// DAILY SUGGESTION ENDPOINT
// ============================================================================

/**
 * Get daily strategy suggestion for a user's portfolio.
 *
 * Returns regime-aware allocation recommendations based on:
 * - Current portfolio allocation mapped to strategy buckets (spot, stable)
 * - Market regime history pattern matching
 * - Drift calculation from current to target allocation
 *
 * **Bucket Mapping:**
 * - spot: Non-stable crypto exposure
 * - stable: Stablecoins (USDC, USDT, DAI, etc.)
 *
 * **Note:** This is a read-only suggestion. No transactions are executed.
 *
 * @param userId - User identifier (UUID)
 * @param params - Optional parameters for drift threshold and history days
 * @returns Daily suggestion response with allocation recommendations
 *
 * @example
 * ```typescript
 * // Get default suggestion (5% drift threshold, 30 days history)
 * const suggestion = await getDailySuggestion('user-123');
 *
 * // Get suggestion with custom parameters
 * const suggestion = await getDailySuggestion('user-123', {
 *   drift_threshold: 0.10,  // 10% drift threshold
 *   regime_history_days: 60  // 60 days of history
 * });
 *
 * // Inspect the recommended action
 * console.log(suggestion.decision.action, suggestion.decision.target_allocation);
 * ```
 */
export async function getDailySuggestion(
  userId: string,
  params: DailySuggestionParams = {}
): Promise<DailySuggestionResponse> {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const endpoint = `/api/v3/strategy/daily-suggestion/${userId}${query ? `?${query}` : ""}`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return response as DailySuggestionResponse;
}
