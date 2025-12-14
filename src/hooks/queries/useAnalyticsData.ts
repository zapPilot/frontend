/**
 * useAnalyticsData Hook
 *
 * Custom hook for fetching and transforming analytics data for the V22 Analytics tab.
 * Orchestrates multiple API calls and applies pure transformation functions.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  aggregateMonthlyPnL,
  calculateKeyMetrics,
  transformToDrawdownChart,
  transformToPerformanceChart,
} from "@/lib/analyticsTransformers";
import { getDailyYieldReturns } from "@/services/analyticsService";
import type { AnalyticsData, AnalyticsTimePeriod } from "@/types/analytics";

import { usePortfolioDashboard } from "../usePortfolioDashboard";

/**
 * Hook return type
 */
export interface UseAnalyticsDataReturn {
  /** Transformed analytics data ready for rendering */
  data: AnalyticsData | null;
  /** Loading state (true while primary dashboard query is loading) */
  isLoading: boolean;
  /** Error from any query */
  error: Error | null;
  /** Refetch function to manually refresh data */
  refetch: () => void;
}

/**
 * Fetch and transform analytics data for V22 Analytics tab
 *
 * Uses the unified dashboard endpoint as primary data source (96% faster),
 * with a secondary call for monthly PnL data. All transformations are memoized.
 *
 * @param userId - User wallet address or ID
 * @param timePeriod - Selected time window for analytics
 * @returns Analytics data with loading/error states and refetch function
 *
 * @example
 * const { data, isLoading, error, refetch } = useAnalyticsData(userId, {
 *   key: '1Y',
 *   days: 365,
 *   label: '1Y'
 * });
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 * if (!data) return null;
 *
 * return <AnalyticsCharts data={data} />;
 */
export function useAnalyticsData(
  userId: string | undefined,
  timePeriod: AnalyticsTimePeriod
): UseAnalyticsDataReturn {
  // ============================================================================
  // PRIMARY QUERY: Unified Dashboard (96% faster than 6 separate calls)
  // ============================================================================

  const dashboardQuery = usePortfolioDashboard(userId, {
    trend_days: timePeriod.days,
    drawdown_days: timePeriod.days,
    rolling_days: timePeriod.days,
  });

  // ============================================================================
  // SECONDARY QUERY: Monthly PnL (conditional on dashboard success)
  // ============================================================================

  const monthlyPnLQuery = useQuery({
    queryKey: ["dailyYield", userId, timePeriod.days],
    queryFn: () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return getDailyYieldReturns(userId, timePeriod.days);
    },
    enabled: !!userId && !!dashboardQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches yield summary cache)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // ============================================================================
  // DATA TRANSFORMATION (Memoized)
  // ============================================================================

  const data = useMemo<AnalyticsData | null>(() => {
    if (!dashboardQuery.data) return null;

    // Get daily values for monthly PnL calculation
    const dailyValues = dashboardQuery.data.trends?.daily_values ?? [];

    return {
      performanceChart: transformToPerformanceChart(dashboardQuery.data),
      drawdownChart: transformToDrawdownChart(dashboardQuery.data),
      keyMetrics: calculateKeyMetrics(dashboardQuery.data),
      monthlyPnL: monthlyPnLQuery.data
        ? aggregateMonthlyPnL(monthlyPnLQuery.data, dailyValues)
        : [], // Graceful degradation if PnL query fails
    };
  }, [dashboardQuery.data, monthlyPnLQuery.data]);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // Prioritize dashboard error (critical), fallback to monthly PnL error
  const error = dashboardQuery.error ?? monthlyPnLQuery.error ?? null;

  // ============================================================================
  // REFETCH HANDLER
  // ============================================================================

  const refetch = () => {
    dashboardQuery.refetch();
    if (dashboardQuery.data) {
      monthlyPnLQuery.refetch();
    }
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    data,
    isLoading: dashboardQuery.isLoading,
    error,
    refetch,
  };
}
