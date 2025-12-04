/**
 * API service for analytics-engine integration
 * Uses service-specific HTTP utilities for consistent error handling
 */

import { ActualRiskSummaryResponse } from "@/types/domain/risk";
import {
  validateLandingPageResponse,
  validateYieldReturnsSummaryResponse,
  validateUnifiedDashboardResponse,
  validateDailyYieldReturnsResponse,
  validatePoolPerformanceResponse,
  type LandingPageResponse,
  type YieldReturnsSummaryResponse,
  type YieldWindowSummary,
  type UnifiedDashboardResponse,
  type DailyYieldReturnsResponse,
  type PoolPerformanceResponse,
} from "@/schemas/api/analyticsSchemas";

import { httpUtils } from "../lib/http-utils";

// Note: Types are imported and re-exported above at line 36

// Re-export types for external use
export type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
  YieldWindowSummary,
  UnifiedDashboardResponse,
  /** @public */ DailyYieldReturnsResponse,
  /** @public */ PoolPerformanceResponse,
  ProtocolYieldWindow,
  /** @public */ ProtocolYieldToday,
  ProtocolYieldBreakdown,
} from "@/schemas/api/analyticsSchemas";

// Direct re-export to avoid unused imports while keeping public API stable
export type { PoolDetail } from "@/schemas/api/analyticsSchemas";

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

/**
 * Get pool performance data for a user's portfolio
 *
 * Retrieves pool-level performance metrics with APR data from DeFiLlama and Hyperliquid sources.
 * Returns detailed information about each pool including:
 * - Asset values and portfolio contribution percentages
 * - APR data with source matching (DeFiLlama or Hyperliquid)
 * - Protocol and chain information
 * - Pool token composition
 *
 * @param userId - User wallet address or user ID
 * @returns Array of pool performance data
 *
 * @example
 * const pools = await getPoolPerformance('0x123...');
 */
export const getPoolPerformance = async (
  userId: string
): Promise<PoolPerformanceResponse> => {
  const endpoint = `/api/v2/pools/${userId}/performance`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return validatePoolPerformanceResponse(response);
};

/**
 * Get yield returns summary with IQR outlier detection
 *
 * Uses Interquartile Range (IQR) method to remove outliers from daily yield data,
 * providing more accurate average daily yield calculations for DeFi portfolios.
 *
 * @param userId - User wallet address
 * @returns Yield summary with outlier-filtered averages and detection statistics
 *
 * @example
 * const summary = await getYieldReturnsSummary('0x123...');
 * console.log(`Avg: $${summary.average_daily_yield_usd}`);
 * console.log(`Outliers removed: ${summary.statistics.outliers_removed}`);
 */
export const getYieldReturnsSummary = async (
  userId: string
): Promise<YieldReturnsSummaryResponse> => {
  const endpoint = `/api/v2/analytics/${userId}/yield/summary`;

  // API returns single YieldWindowSummary, not wrapped in windows
  const singleWindow = await httpUtils.analyticsEngine.get<YieldWindowSummary>(
    endpoint
  );

  // Transform to match expected format
  const transformedResponse = {
    user_id: singleWindow.user_id,
    windows: {
      "30d": singleWindow, // Wrap single window response
    },
    recommended_period: "30d", // Since API returns 30-day window
  };

  return validateYieldReturnsSummaryResponse(transformedResponse);
};

/**
 * Get risk summary for a user
 *
 * Retrieves comprehensive risk assessment including volatility analysis,
 * drawdown metrics, and computed risk scores with component breakdown.
 */
export const getRiskSummary = async (
  userId: string
): Promise<ActualRiskSummaryResponse> => {
  const endpoint = `/api/v2/analytics/${userId}/risk/summary`;
  return await httpUtils.analyticsEngine.get<ActualRiskSummaryResponse>(
    endpoint
  );
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
  userId: string
): Promise<UnifiedDashboardResponse> => {
  const endpoint = `/api/v2/analytics/${userId}/dashboard`;
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
 * @returns Daily yield returns with per-protocol breakdown
 *
 * @example
 * ```typescript
 * const dailyYield = await getDailyYieldReturns('user-123', 30);
 *
 * // Access daily returns
 * dailyYield.daily_returns.forEach(entry => {
 *   console.log(`${entry.date}: ${entry.protocol_name} = $${entry.yield_return_usd}`);
 * });
 * ```
 */
export const getDailyYieldReturns = async (
  userId: string,
  days = 30
): Promise<DailyYieldReturnsResponse> => {
  const endpoint = `/api/v2/analytics/${userId}/yield/daily?days=${days}`;
  const response = await httpUtils.analyticsEngine.get(endpoint);
  return validateDailyYieldReturnsResponse(response);
};
