/**
 * usePortfolioHistoryData Hook
 *
 * Extracts portfolio performance chart data transformation logic from the unified
 * dashboard endpoint. This hook processes portfolio value over time, calculates
 * performance metrics, and provides stacked data for DeFi/Wallet breakdown visualization.
 *
 * Performance Optimizations:
 * - Memoized data transformations to prevent unnecessary recalculations
 * - Efficient sorting and mapping operations
 * - Minimal re-renders with useMemo dependencies
 *
 * @module hooks/charts/usePortfolioHistoryData
 */

import { useMemo } from "react";

import { buildStackedPortfolioData } from "@/lib/analytics/portfolio-utils";
import type { PortfolioStackedDataPoint } from "@/types/analytics";
import type { PortfolioDataPoint } from "@/types/domain/portfolio";

/**
 * Input parameters for usePortfolioHistoryData hook
 */
interface UsePortfolioHistoryDataParams {
  /**
   * Raw portfolio history data from API
   * Array of portfolio snapshots with value, date, and protocol/category breakdowns
   */
  portfolioHistory?: PortfolioDataPoint[];

  /**
   * External loading state to indicate data is being fetched
   */
  isLoading?: boolean;

  /**
   * External error state for upstream error handling
   */
  error?: string | null;
}

/**
 * Return value for usePortfolioHistoryData hook
 */
interface UsePortfolioHistoryDataResult {
  /**
   * Portfolio performance data points for line/area chart rendering
   * Contains date/value pairs suitable for Recharts or similar libraries
   */
  performanceData: PortfolioDataPoint[];

  /**
   * Stacked portfolio data with DeFi and Wallet breakdown
   * Extends performance data with defiValue, walletValue, and stackedTotalValue
   */
  stackedPortfolioData: PortfolioStackedDataPoint[];

  /**
   * Reference data for drawdown peak calculations
   * Simplified structure containing only date and portfolio_value
   */
  drawdownReferenceData: { date: string; portfolio_value: number }[];

  /**
   * Current (most recent) portfolio value in USD
   */
  currentValue: number;

  /**
   * First (earliest) portfolio value in USD
   * Used as baseline for total return calculations
   */
  firstValue: number;

  /**
   * Total return percentage over the entire period
   * Calculated as ((currentValue - firstValue) / firstValue) * 100
   */
  totalReturn: number;

  /**
   * Whether the total return is positive (>= 0)
   * Used for conditional styling (green vs red)
   */
  isPositive: boolean;

  /**
   * Loading state indicating data is being fetched or processed
   */
  isLoading: boolean;

  /**
   * Error message if data fetching or processing failed
   */
  error: string | null;

  /**
   * Whether there is valid portfolio data available
   * Useful for conditional rendering of charts vs empty states
   */
  hasData: boolean;
}

/**
 * Hook for processing portfolio performance chart data
 *
 * Transforms raw portfolio history into performance metrics and chart-ready data structures.
 * Handles data validation, metric calculations, and stacked data generation for
 * DeFi/Wallet breakdown visualization.
 *
 * @param params - Configuration object containing portfolio history and state flags
 * @returns Processed portfolio performance data with metrics and loading/error states
 *
 * @example
 * ```tsx
 * const { performanceData, currentValue, totalReturn, isLoading } = usePortfolioHistoryData({
 *   portfolioHistory: dashboardData?.trends.daily_values,
 *   isLoading: isDashboardLoading,
 *   error: dashboardError?.message,
 * });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <LineChart data={performanceData}>
 *     <Line dataKey="value" stroke="#8b5cf6" />
 *   </LineChart>
 * );
 * ```
 *
 * @example With stacked data for DeFi/Wallet breakdown
 * ```tsx
 * const { stackedPortfolioData } = usePortfolioHistoryData({
 *   portfolioHistory: apiData,
 * });
 *
 * return (
 *   <AreaChart data={stackedPortfolioData}>
 *     <Area dataKey="defiValue" stackId="1" fill="#8b5cf6" />
 *     <Area dataKey="walletValue" stackId="1" fill="#6366f1" />
 *   </AreaChart>
 * );
 * ```
 */
export function usePortfolioHistoryData(
  params: UsePortfolioHistoryDataParams
): UsePortfolioHistoryDataResult {
  const {
    portfolioHistory = [],
    isLoading: externalLoading = false,
    error: externalError = null,
  } = params;

  // Validate and memoize portfolio history data
  const performanceData = useMemo(() => {
    // Return empty array if no data available
    if (!portfolioHistory || portfolioHistory.length === 0) {
      return [];
    }

    // Portfolio history is already validated and sorted from the parent hook
    // No additional transformation needed for performance chart
    return portfolioHistory;
  }, [portfolioHistory]);

  // Calculate portfolio metrics
  const metrics = useMemo(() => {
    const hasData = performanceData.length > 0;

    if (!hasData) {
      return {
        currentValue: 0,
        firstValue: 0,
        totalReturn: 0,
        isPositive: false,
      };
    }

    const currentValue =
      performanceData[performanceData.length - 1]?.value ?? 0;
    const firstValue = performanceData[0]?.value ?? 0;
    const totalReturn =
      firstValue > 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0;
    const isPositive = totalReturn >= 0;

    return {
      currentValue,
      firstValue,
      totalReturn,
      isPositive,
    };
  }, [performanceData]);

  // Generate stacked portfolio data with DeFi/Wallet breakdown
  const stackedPortfolioData = useMemo(
    () => buildStackedPortfolioData(performanceData),
    [performanceData]
  );

  // Generate reference data for drawdown calculations
  const drawdownReferenceData = useMemo(
    () =>
      performanceData.map(point => ({
        date: point.date,
        portfolio_value: point.value,
      })),
    [performanceData]
  );

  return {
    performanceData,
    stackedPortfolioData,
    drawdownReferenceData,
    currentValue: metrics.currentValue,
    firstValue: metrics.firstValue,
    totalReturn: metrics.totalReturn,
    isPositive: metrics.isPositive,
    isLoading: externalLoading,
    error: externalError,
    hasData: performanceData.length > 0,
  };
}
