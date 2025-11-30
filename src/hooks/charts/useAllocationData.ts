/**
 * useAllocationData Hook
 *
 * Extracts asset allocation chart data transformation logic from the unified
 * dashboard endpoint. This hook processes allocation percentages over time for
 * BTC, ETH, Stablecoin, and Altcoin categories.
 *
 * Performance Optimizations:
 * - Memoized data transformations to prevent unnecessary recalculations
 * - Efficient category aggregation and percentage normalization
 * - Minimal re-renders with useMemo dependencies
 *
 * @module hooks/charts/useAllocationData
 */

import { useMemo } from "react";

import type { AllocationTimeseriesInputPoint } from "@/components/PortfolioChart/types";
import { buildAllocationHistory } from "@/components/PortfolioChart/utils";
import type { AssetAllocationPoint } from "@/types/domain/portfolio";

/**
 * Pie chart data point for allocation visualization
 */
export interface AllocationPieChartDataPoint {
  /** Category identifier (btc, eth, stablecoin, altcoin) */
  id: string;
  /** Absolute percentage value */
  value: number;
  /** Formatted percentage value (same as value, for compatibility) */
  percentage: number;
}

/**
 * Current allocation state for the latest data point
 */
export interface CurrentAllocation {
  /** Bitcoin allocation percentage */
  btc: number;
  /** Ethereum allocation percentage */
  eth: number;
  /** Stablecoin allocation percentage */
  stablecoin: number;
  /** Altcoin allocation percentage */
  altcoin: number;
}

/**
 * Input parameters for useAllocationData hook
 */
export interface UseAllocationDataParams {
  /**
   * Raw allocation history data from API
   * Can be pre-aggregated AssetAllocationPoint[] or raw AllocationTimeseriesInputPoint[]
   */
  allocationHistory?:
    | AllocationTimeseriesInputPoint[]
    | AssetAllocationPoint[]
    | undefined;

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
 * Return value for useAllocationData hook
 */
export interface UseAllocationDataResult {
  /**
   * Asset allocation data points for multi-line/area chart rendering
   * Each point contains date and allocation percentages for BTC/ETH/Stablecoin/Altcoin
   */
  allocationData: AssetAllocationPoint[];

  /**
   * Current allocation breakdown (most recent data point)
   * Returns null if no data available
   */
  currentAllocation: CurrentAllocation | null;

  /**
   * Pie chart data for current allocation visualization
   * Sorted by value (largest first) and filtered to non-zero allocations
   */
  pieChartData: AllocationPieChartDataPoint[];

  /**
   * Loading state indicating data is being fetched or processed
   */
  isLoading: boolean;

  /**
   * Error message if data fetching or processing failed
   */
  error: string | null;

  /**
   * Whether there is valid allocation data available
   * Useful for conditional rendering of charts vs empty states
   */
  hasData: boolean;
}

/**
 * Type guard to detect pre-aggregated allocation data vs raw timeseries data
 */
function isAggregatedAllocationData(
  data: AllocationTimeseriesInputPoint[] | AssetAllocationPoint[]
): data is AssetAllocationPoint[] {
  if (data.length === 0) return false;

  const firstPoint = data[0];

  // Check if it has aggregated properties (btc, eth, etc.)
  const hasAggregatedProps =
    typeof (firstPoint as AssetAllocationPoint).btc === "number" ||
    typeof (firstPoint as AssetAllocationPoint).eth === "number" ||
    typeof (firstPoint as AssetAllocationPoint).stablecoin === "number" ||
    typeof (firstPoint as AssetAllocationPoint).altcoin === "number";

  // Check if it has timeseries properties (category, protocol, etc.)
  const hasTimeseriesProps =
    "category" in (firstPoint as AllocationTimeseriesInputPoint) ||
    "protocol" in (firstPoint as AllocationTimeseriesInputPoint) ||
    "percentage" in (firstPoint as AllocationTimeseriesInputPoint) ||
    "percentage_of_portfolio" in
      (firstPoint as AllocationTimeseriesInputPoint) ||
    "allocation_percentage" in (firstPoint as AllocationTimeseriesInputPoint) ||
    "category_value" in (firstPoint as AllocationTimeseriesInputPoint) ||
    "category_value_usd" in (firstPoint as AllocationTimeseriesInputPoint);

  // It's aggregated if it has aggregated props and NOT timeseries props
  return hasAggregatedProps && !hasTimeseriesProps;
}

/**
 * Hook for processing asset allocation chart data
 *
 * Transforms raw allocation timeseries or pre-aggregated data into chart-ready structures.
 * Handles data validation, category aggregation, percentage normalization, and pie chart
 * data generation for current allocation visualization.
 *
 * @param params - Configuration object containing allocation history and state flags
 * @returns Processed allocation data with pie chart and loading/error states
 *
 * @example
 * ```tsx
 * const { allocationData, currentAllocation, pieChartData, isLoading } = useAllocationData({
 *   allocationHistory: dashboardData?.allocation.allocations,
 *   isLoading: isDashboardLoading,
 *   error: dashboardError?.message,
 * });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!hasData) return <EmptyState />;
 *
 * return (
 *   <AreaChart data={allocationData}>
 *     <Area dataKey="btc" stackId="1" fill="#f7931a" />
 *     <Area dataKey="eth" stackId="1" fill="#627eea" />
 *     <Area dataKey="stablecoin" stackId="1" fill="#26a17b" />
 *     <Area dataKey="altcoin" stackId="1" fill="#8247e5" />
 *   </AreaChart>
 * );
 * ```
 *
 * @example With pie chart for current allocation
 * ```tsx
 * const { pieChartData, currentAllocation } = useAllocationData({
 *   allocationHistory: apiData,
 * });
 *
 * return (
 *   <PieChart data={pieChartData}>
 *     <Pie dataKey="value" nameKey="id" />
 *   </PieChart>
 * );
 * ```
 */
export function useAllocationData(
  params: UseAllocationDataParams
): UseAllocationDataResult {
  const {
    allocationHistory = [],
    isLoading: externalLoading = false,
    error: externalError = null,
  } = params;

  // Process and normalize allocation data
  const allocationData = useMemo(() => {
    // Return empty array if no data available
    if (!allocationHistory || allocationHistory.length === 0) {
      return [];
    }

    // Check if data is already aggregated
    if (isAggregatedAllocationData(allocationHistory)) {
      // Data is already in the correct format, just ensure structure
      return allocationHistory.map(point => ({
        date: point.date,
        btc: point.btc,
        eth: point.eth,
        stablecoin: point.stablecoin,
        altcoin: point.altcoin,
      }));
    }

    // Data needs to be transformed from timeseries to aggregated format
    return buildAllocationHistory(
      allocationHistory as AllocationTimeseriesInputPoint[]
    );
  }, [allocationHistory]);

  // Extract current allocation (most recent data point)
  const currentAllocation = useMemo((): CurrentAllocation | null => {
    if (allocationData.length === 0) {
      return null;
    }

    const latestPoint = allocationData[allocationData.length - 1];

    if (!latestPoint) {
      return null;
    }

    return {
      btc: latestPoint.btc,
      eth: latestPoint.eth,
      stablecoin: latestPoint.stablecoin,
      altcoin: latestPoint.altcoin,
    };
  }, [allocationData]);

  // Generate pie chart data from current allocation
  const pieChartData = useMemo((): AllocationPieChartDataPoint[] => {
    if (!currentAllocation) {
      return [];
    }

    // Create array of category data points
    const categories: AllocationPieChartDataPoint[] = [
      {
        id: "btc",
        value: currentAllocation.btc,
        percentage: currentAllocation.btc,
      },
      {
        id: "eth",
        value: currentAllocation.eth,
        percentage: currentAllocation.eth,
      },
      {
        id: "stablecoin",
        value: currentAllocation.stablecoin,
        percentage: currentAllocation.stablecoin,
      },
      {
        id: "altcoin",
        value: currentAllocation.altcoin,
        percentage: currentAllocation.altcoin,
      },
    ];

    // Filter out zero/negative allocations and sort by value (largest first)
    return categories
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currentAllocation]);

  return {
    allocationData,
    currentAllocation,
    pieChartData,
    isLoading: externalLoading,
    error: externalError,
    hasData: allocationData.length > 0,
  };
}
