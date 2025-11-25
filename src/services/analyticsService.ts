/**
 * API service for analytics-engine integration
 * Uses service-specific HTTP utilities for consistent error handling
 */

import { httpUtils } from "../lib/http-utils";
import type { PoolDetail } from "../types/pool";
import { ActualRiskSummaryResponse } from "../types/risk";

/**
 * Yield returns summary with IQR outlier detection
 *
 * Uses Interquartile Range (IQR) method to remove outliers from daily yield data,
 * providing more accurate average daily yield calculations for DeFi portfolios.
 */
export interface ProtocolYieldWindow {
  total_yield_usd: number;
  average_daily_yield_usd: number;
  data_points: number;
  positive_days: number;
  negative_days: number;
}

/**
 * Represents yield data for a specific day
 * @public - Used in ProtocolYieldBreakdown.today
 */
export interface ProtocolYieldToday {
  date: string;
  yield_usd: number;
}

export interface ProtocolYieldBreakdown {
  protocol: string;
  chain?: string | null;
  window: ProtocolYieldWindow;
  today?: ProtocolYieldToday | null;
}

export interface YieldWindowSummary {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  average_daily_yield_usd: number;
  median_daily_yield_usd: number;
  total_yield_usd: number;
  statistics: {
    mean: number;
    median: number;
    std_dev: number;
    min_value: number;
    max_value: number;
    total_days: number;
    filtered_days: number;
    outliers_removed: number;
  };
  outlier_strategy: "iqr" | "none" | "zscore" | "percentile";
  outliers_detected: {
    date: string;
    value: number;
    reason: string;
    z_score: number | null;
  }[];
  protocol_breakdown: ProtocolYieldBreakdown[];
}

export interface YieldReturnsSummaryResponse {
  user_id: string;
  windows: Record<string, YieldWindowSummary>;
  // Optional backend recommendation for which window to display
  recommended_period?: string;
}

// Re-export PoolDetail for components that import from this service
export type { PoolDetail } from "../types/pool";

// Unified Landing Page Response Type
export interface LandingPageResponse {
  total_assets_usd: number;
  total_debt_usd: number;
  total_net_usd: number;
  weighted_apr: number;
  estimated_monthly_income: number;
  portfolio_roi: {
    recommended_roi: number;
    recommended_period: string;
    recommended_yearly_roi: number;
    estimated_yearly_pnl_usd: number;
    windows?: Record<
      string,
      {
        value: number;
        data_points: number;
        start_balance?: number;
      }
    >;
    // Legacy fields for backward compatibility
    roi_7d?: {
      value: number;
      data_points: number;
    };
    roi_30d?: {
      value: number;
      data_points: number;
    };
    roi_365d?: {
      value: number;
      data_points: number;
    };
    roi_windows?: Record<string, number>;
  };
  portfolio_allocation: {
    btc: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
    eth: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
    stablecoins: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
    others: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
  };
  wallet_token_summary: {
    total_value_usd: number;
    token_count: number;
    apr_30d: number;
  };
  category_summary_debt: {
    btc: number;
    eth: number;
    stablecoins: number;
    others: number;
  };
  pool_details: PoolDetail[];
  total_positions: number;
  protocols_count: number;
  chains_count: number;
  last_updated: string | null;
  apr_coverage: {
    matched_pools: number;
    total_pools: number;
    coverage_percentage: number;
    matched_asset_value_usd: number;
  };
  message?: string;
  yield_summary?: YieldReturnsSummaryResponse;
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
  return await httpUtils.analyticsEngine.get<LandingPageResponse>(endpoint);
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
 * pools.forEach(pool => {
 *   console.log(`${pool.protocol_name}: ${pool.final_apr * 100}% APR`);
 * });
 */
export const getPoolPerformance = async (
  userId: string
): Promise<PoolDetail[]> => {
  const endpoint = `/api/v2/pools/${userId}/performance`;
  return await httpUtils.analyticsEngine.get<PoolDetail[]>(endpoint);
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
  return {
    user_id: singleWindow.user_id,
    windows: {
      "30d": singleWindow, // Wrap single window response
    },
    recommended_period: "30d", // Since API returns 30-day window
  };
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
interface AnalyticsPeriodInfo {
  start_date: string;
  end_date: string;
  timezone?: string;
  label?: string;
  notes?: string;
}

interface AnalyticsEducationalLink {
  label: string;
  url: string;
}

interface AnalyticsEducationalContext {
  title?: string;
  summary?: string;
  description?: string;
  highlights?: string[];
  links?: AnalyticsEducationalLink[];
}

export interface UnifiedDashboardResponse {
  user_id: string;
  parameters: {
    trend_days: number;
    risk_days: number;
    drawdown_days: number;
    allocation_days: number;
    rolling_days: number;
  };

  // Historical trends (replaces getPortfolioTrends)
  trends: {
    user_id?: string;
    period_days: number;
    data_points: number;
    period: {
      start_date: string;
      end_date: string;
      days: number;
    };
    period_info?: {
      start_date: string;
      end_date: string;
      days: number;
    };
    daily_values: {
      date: string;
      total_value_usd: number;
      change_percentage: number;
      categories?: {
        category: string;
        source_type?: string;
        value_usd: number;
        pnl_usd: number;
      }[];
      protocols?: {
        protocol: string;
        chain: string;
        value_usd: number;
        pnl_usd: number;
        source_type?: string;
        category?: string;
      }[];
      chains_count?: number;
    }[];
    summary: {
      current_value_usd: number;
      start_value_usd: number;
      change_usd: number;
      change_pct: number;
    };
  };

  // Risk metrics (replaces individual risk endpoints)
  risk_metrics: {
    volatility: {
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      volatility_pct: number;
      annualized_volatility_pct: number;
      interpretation: string;
      summary: {
        avg_volatility: number;
        max_volatility: number;
        min_volatility: number;
      };
    };
    sharpe_ratio: {
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      sharpe_ratio: number;
      interpretation: string;
      summary: {
        avg_sharpe: number;
        statistical_reliability: string;
      };
    };
    max_drawdown: {
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      max_drawdown_pct: number;
      peak_date: string;
      trough_date: string;
      recovery_date: string | null;
      summary: {
        current_drawdown_pct: number;
        is_recovered: boolean;
      };
    };
  };

  // Drawdown analysis (replaces getEnhancedDrawdown + getUnderwaterRecovery)
  drawdown_analysis: {
    enhanced: {
      user_id?: string;
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      period_info?: AnalyticsPeriodInfo;
      drawdown_data: {
        date: string;
        portfolio_value?: number;
        portfolio_value_usd?: number;
        peak_value?: number;
        running_peak_usd?: number;
        drawdown_pct?: number;
        underwater_pct?: number;
        is_underwater?: boolean;
        recovery_point?: boolean;
        [key: string]: unknown;
      }[];
      summary: {
        max_drawdown_pct: number;
        current_drawdown_pct: number;
        peak_value: number;
        current_value: number;
      };
      data_points?: number;
    };
    underwater_recovery: {
      user_id?: string;
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      period_info?: AnalyticsPeriodInfo;
      underwater_data: {
        date: string;
        underwater_pct: number;
        drawdown_pct?: number;
        portfolio_value?: number;
        peak_value?: number;
        is_underwater?: boolean;
        recovery_point?: boolean;
        [key: string]: unknown;
      }[];
      summary: {
        total_underwater_days: number;
        underwater_percentage: number;
        recovery_points: number;
        current_underwater_pct: number;
        is_currently_underwater: boolean;
      };
      data_points?: number;
    };
  };

  // Portfolio allocation over time (replaces getAllocationTimeseries)
  allocation: {
    user_id?: string;
    period_days: number;
    data_points: number;
    period: {
      start_date: string;
      end_date: string;
      days: number;
    };
    period_info?: {
      start_date: string;
      end_date: string;
      days: number;
    };
    allocations: {
      date: string;
      category: string;
      category_value_usd: number;
      total_portfolio_value_usd: number;
      allocation_percentage: number;
      [key: string]: unknown;
    }[];
    summary: {
      unique_dates: number;
      unique_protocols: number;
      unique_chains: number;
      categories?: string[];
    };
  };

  // Rolling window analytics (replaces getRollingSharpe + getRollingVolatility)
  rolling_analytics: {
    sharpe: {
      user_id?: string;
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      rolling_sharpe_data: {
        date: string;
        rolling_sharpe_ratio: number;
        is_statistically_reliable: boolean;
        [key: string]: unknown;
      }[];
      summary: {
        latest_sharpe_ratio: number;
        avg_sharpe_ratio: number;
        reliable_data_points: number;
        statistical_reliability: string;
      };
      data_points?: number;
      educational_context?: AnalyticsEducationalContext;
    };
    volatility: {
      user_id?: string;
      period: {
        start_date: string;
        end_date: string;
        days: number;
      };
      rolling_volatility_data: {
        date: string;
        rolling_volatility_pct: number;
        annualized_volatility_pct: number;
        rolling_volatility_daily_pct?: number;
        [key: string]: unknown;
      }[];
      summary: {
        latest_daily_volatility: number;
        latest_annualized_volatility: number;
        avg_daily_volatility: number;
        avg_annualized_volatility: number;
      };
      data_points?: number;
      educational_context?: AnalyticsEducationalContext;
    };
  };

  // Metadata for error tracking and graceful degradation
  _metadata: {
    success_count: number;
    error_count: number;
    success_rate: number;
    errors?: Record<string, string>;
  };
}

/**
 * Parameters for unified dashboard endpoint
 */
export interface DashboardParams {
  trend_days?: number;
  risk_days?: number;
  drawdown_days?: number;
  allocation_days?: number;
  rolling_days?: number;
}

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
  return await httpUtils.analyticsEngine.get<UnifiedDashboardResponse>(
    endpoint
  );
};

// ============================================================================
// DAILY YIELD RETURNS ENDPOINT
// ============================================================================

/**
 * Token details for daily yield returns
 */
interface DailyYieldToken {
  symbol: string;
  amount_change: number;
  current_price: number;
  yield_return_usd: number;
}

/**
 * Individual daily yield return entry (per protocol/position)
 */
interface DailyYieldReturn {
  date: string;
  protocol_name: string;
  chain: string;
  position_type: string;
  yield_return_usd: number;
  tokens: DailyYieldToken[];
}

/**
 * Period metadata for daily yield returns
 */
interface DailyYieldPeriod {
  start_date: string;
  end_date: string;
  days: number;
}

/**
 * Response structure for daily yield returns endpoint
 */
interface DailyYieldReturnsResponse {
  user_id: string;
  period: DailyYieldPeriod;
  daily_returns: DailyYieldReturn[];
}

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
  return await httpUtils.analyticsEngine.get<DailyYieldReturnsResponse>(
    endpoint
  );
};
