/**
 * API service for analytics-engine integration
 * Uses service-specific HTTP utilities for consistent error handling
 */

import { buildAnalyticsQueryString } from "@/lib/analytics/queryStringUtils";
import { httpUtils } from "@/lib/http";
import {
  type DailyYieldReturnsResponse,
  type LandingPageResponse,
  type UnifiedDashboardResponse,
  validateDailyYieldReturnsResponse,
  validateLandingPageResponse,
  validateUnifiedDashboardResponse,
} from "@/schemas/api/analyticsSchemas";

// Re-export types for external use
export type {
  /** @public */ DailyYieldReturnsResponse,
  LandingPageResponse,
  PoolDetail,
  UnifiedDashboardResponse,
} from "@/schemas/api/analyticsSchemas";

/**
 * Query parameters for the unified dashboard endpoint.
 *
 * All fields are optional and map directly to analytics-engine query params.
 * Values are coerced to strings when building the request URL.
 */
export interface DashboardWindowParams {
  trend_days?: number;
  drawdown_days?: number;
  rolling_days?: number;
  metrics?: string[];
  risk_days?: number;
  allocation_days?: number;
  /** Optional wallet address filter - when provided, returns wallet-specific analytics instead of bundle aggregation */
  wallet_address?: string;
}

/**
 * Get unified landing page portfolio data
 *
 * Combines portfolio summary, APR calculations, and pre-formatted data
 * in a single API call for optimal performance. Implements BFF pattern.
 */
export const getLandingPagePortfolioData = async (
  userId: string
): Promise<LandingPageResponse> => {
  const endpoint = `/api/v2/portfolio/${userId}/landing`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return validateLandingPageResponse(response);
};

// ============================================================================
// UNIFIED DASHBOARD ENDPOINT (Performance Optimized - 96% faster)
// ============================================================================

/**
 * Unified Dashboard Response - Single endpoint for all portfolio analytics
 *
 * Replaces 6 separate API calls with 1 unified call:
 * - 96% faster (1500ms → 55ms avg with cache)
 * - 95% database load reduction
 * - 12-hour server-side cache
 * - Graceful degradation with partial failure support
 */
/**
 * Get unified portfolio dashboard analytics (Performance Optimized)
 *
 * **NEW UNIFIED ENDPOINT** - Replaces 6 separate API calls with 1 optimized call:
 * - 96% faster loading (1500ms → 55ms with cache)
 * - 95% database load reduction (6 queries/view → 6 queries/12h)
 * - 83% network overhead reduction (6 requests → 1 request)
 * - 12-hour server-side cache with 2-minute HTTP cache
 * - Graceful degradation: partial failures don't break entire dashboard
 *
 * @param userId - User identifier
 * @param params - Query parameters for customizing time windows
 * @returns Unified dashboard response with all analytics sections
 *
 * @example
 * ```typescript
 * const dashboard = await getPortfolioDashboard('user-123', {
 *   trend_days: 30,
 *   risk_days: 30,
 *   drawdown_days: 90,
 *   allocation_days: 40,
 *   rolling_days: 40
 * });
 *
 * // Access individual sections
 * const trends = dashboard.trends;
 * const sharpe = dashboard.rolling_analytics.sharpe;
 * const volatility = dashboard.rolling_analytics.volatility;
 *
 * // Check for partial failures
 * if (dashboard._metadata.error_count > 0) {
 *   console.warn('Some metrics failed:', dashboard._metadata.errors);
 * }
 * ```
 */
export const getPortfolioDashboard = async (
  userId: string,
  params: DashboardWindowParams = {}
): Promise<UnifiedDashboardResponse> => {
  const endpoint = `/api/v2/analytics/${userId}/dashboard${buildAnalyticsQueryString(params)}`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return validateUnifiedDashboardResponse(response);
};

// ============================================================================
// DAILY YIELD RETURNS ENDPOINT
// ============================================================================

/**
 * Token details for daily yield returns
 */
/**
 * Response structure for daily yield returns endpoint
 * (Type is imported from schemas - see line 17)
 */
/**
 * Get daily yield returns for a user
 *
 * Retrieves granular daily yield data broken down by protocol and position.
 * Each date may have multiple entries (one per protocol/position).
 *
 * @param userId - User identifier
 * @param days - Number of days to retrieve (default: 30)
 * @param walletAddress - Optional wallet address filter for per-wallet analytics
 * @returns Daily yield returns with per-protocol breakdown
 *
 * @example
 * ```typescript
 * // Bundle-level data (all wallets)
 * const bundleYield = await getDailyYieldReturns('user-123', 30);
 *
 * // Wallet-specific data
 * const walletYield = await getDailyYieldReturns('user-123', 30, '0x1234...5678');
 *
 * // Access daily returns
 * bundleYield.daily_returns.forEach(entry => {
 *   console.log(`${entry.date}: ${entry.protocol_name} = $${entry.yield_return_usd}`);
 * });
 * ```
 */
export const getDailyYieldReturns = async (
  userId: string,
  days = 30,
  walletAddress?: string
): Promise<DailyYieldReturnsResponse> => {
  const params = new URLSearchParams({ days: String(days) });
  if (walletAddress) {
    params.append("walletAddress", walletAddress);
  }
  const endpoint = `/api/v2/analytics/${userId}/yield/daily?${params}`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return validateDailyYieldReturnsResponse(response);
};
