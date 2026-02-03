/**
 * API service for strategy suggestions from analytics-engine.
 *
 * Provides regime-aware allocation recommendations based on market sentiment
 * pattern matching.
 */

import { httpUtils } from "@/lib/http";
import type {
  DailySuggestionParams,
  DailySuggestionResponse,
} from "@/types/strategy";

// Re-export types for external use
export type { DailySuggestionParams, DailySuggestionResponse };

/**
 * Build query string from params, filtering out undefined values
 */
const buildQueryString = (params: DailySuggestionParams): string => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([key, value]) => `${key}=${value}`).join("&");
};

// ============================================================================
// DAILY SUGGESTION ENDPOINT
// ============================================================================

/**
 * Get daily strategy suggestion for a user's portfolio.
 *
 * Returns regime-aware allocation recommendations based on:
 * - Current portfolio allocation mapped to strategy buckets (spot, lp, stable)
 * - Market regime history pattern matching
 * - Drift calculation from current to target allocation
 *
 * **Bucket Mapping:**
 * - spot: BTC + ETH + altcoins (excluding LP positions)
 * - lp: Liquidity provider positions (ETH-USDC and BTC-USDC pairs only)
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
 * // Check if rebalancing is recommended
 * if (suggestion.drift.needs_rebalance) {
 *   console.log('Recommended actions:', suggestion.suggested_actions);
 * }
 * ```
 */
export const getDailySuggestion = async (
  userId: string,
  params: DailySuggestionParams = {}
): Promise<DailySuggestionResponse> => {
  const queryString = buildQueryString(params);
  const endpoint = `/api/v3/strategy/daily-suggestion/${userId}${queryString}`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return response as DailySuggestionResponse;
};
