/**
 * useRollingAnalytics Hook
 *
 * Extracts rolling analytics data transformation logic from the unified dashboard endpoint.
 * This hook processes Sharpe ratio, volatility, and daily yield data with interpretation
 * labels and risk categorization for advanced portfolio analytics visualization.
 *
 * Performance Optimizations:
 * - Memoized data transformations to prevent unnecessary recalculations
 * - Efficient filtering and mapping operations
 * - Minimal re-renders with useMemo dependencies
 *
 * Interpretation Logic:
 * - Sharpe Ratio: Standard finance thresholds (Excellent > 2.0, Good 1.0-2.0, Fair 0.0-1.0, Poor -1.0-0.0, Very Poor < -1.0)
 * - Volatility: DeFi-specific risk levels (Low < 10%, Moderate 10-25%, High 25-50%, Very High > 50%)
 * - Daily Yield: Aggregated daily earnings with cumulative tracking
 *
 * @module hooks/charts/useRollingAnalytics
 */

import { useMemo } from "react";

/**
 * Sharpe ratio interpretation thresholds (standard finance)
 */
const SHARPE_THRESHOLDS = {
  EXCELLENT: 2.0,
  GOOD: 1.0,
  FAIR: 0.0,
  POOR: -1.0,
} as const;

/**
 * Volatility risk level thresholds (DeFi-specific, in percentage)
 */
const VOLATILITY_THRESHOLDS = {
  LOW: 10,
  MODERATE: 25,
  HIGH: 50,
} as const;

/**
 * Sharpe ratio interpretation labels
 */
type SharpeInterpretation =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Poor"
  | "Very Poor";

/**
 * Volatility risk level labels
 */
type VolatilityRiskLevel = "Low" | "Moderate" | "High" | "Very High";

/**
 * Single data point in the Sharpe ratio timeseries
 */
interface SharpeDataPoint {
  /** Date of the data point */
  date: string;
  /** Sharpe ratio value (typically -3 to 5 range) */
  sharpe: number;
  /** Risk-adjusted return interpretation */
  interpretation: SharpeInterpretation;
}

/**
 * Single data point in the volatility timeseries
 */
interface VolatilityDataPoint {
  /** Date of the data point */
  date: string;
  /** Annualized volatility percentage (0-100+) */
  volatility: number;
  /** Risk level categorization */
  riskLevel: VolatilityRiskLevel;
}

/**
 * Single data point in the daily yield timeseries
 */
interface DailyYieldDataPoint {
  /** Date of the data point */
  date: string;
  /** Total daily yield in USD */
  totalYield: number;
  /** Cumulative yield in USD */
  cumulativeYield: number;
  /** Number of protocols contributing to yield */
  protocolCount?: number;
}

/**
 * Raw daily yield data from API
 */
export interface DailyYieldApiData {
  date: string;
  total_yield_usd: number;
  cumulative_yield_usd: number;
  protocol_count?: number;
  protocols?: {
    protocol_name: string;
    chain: string;
    yield_return_usd: number;
  }[];
}

/**
 * Input parameters for useRollingAnalytics hook
 */
interface UseRollingAnalyticsParams {
  /**
   * Raw Sharpe ratio history data from API
   * Array of data points with rolling Sharpe ratio values
   */
  sharpeHistory?: {
    date: string;
    rolling_sharpe_ratio: number | null;
  }[];

  /**
   * Raw volatility history data from API
   * Array of data points with annualized or daily volatility percentages
   */
  volatilityHistory?: {
    date: string;
    annualized_volatility_pct?: number | null;
    rolling_volatility_daily_pct?: number | null;
  }[];

  /**
   * Raw daily yield history data from API
   * Array of data points with daily yield returns
   */
  dailyYieldHistory?: DailyYieldApiData[];

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
 * Return value for useRollingAnalytics hook
 */
interface UseRollingAnalyticsResult {
  /**
   * Sharpe ratio data points with interpretation labels
   * Enhanced with risk-adjusted return categorization
   */
  sharpeData: SharpeDataPoint[];

  /**
   * Volatility data points with risk level labels
   * Enhanced with DeFi-specific risk categorization
   */
  volatilityData: VolatilityDataPoint[];

  /**
   * Daily yield data points with cumulative tracking
   * Aggregated by date with protocol breakdown
   */
  dailyYieldData: DailyYieldDataPoint[];

  /**
   * Loading state indicating data is being fetched or processed
   */
  isLoading: boolean;

  /**
   * Error message if data fetching or processing failed
   */
  error: string | null;

  /**
   * Whether there is any valid analytics data available
   * Useful for conditional rendering of charts vs empty states
   */
  hasData: boolean;
}

/**
 * Determine Sharpe ratio interpretation based on value
 *
 * Standard finance thresholds:
 * - Excellent: > 2.0 (exceptional risk-adjusted returns)
 * - Good: 1.0 to 2.0 (strong risk-adjusted returns)
 * - Fair: 0.0 to 1.0 (acceptable risk-adjusted returns)
 * - Poor: -1.0 to 0.0 (below market risk-adjusted returns)
 * - Very Poor: < -1.0 (very poor risk-adjusted returns)
 *
 * @param sharpe - Sharpe ratio value
 * @returns Interpretation label
 */
function getSharpeInterpretation(sharpe: number): SharpeInterpretation {
  if (sharpe > SHARPE_THRESHOLDS.EXCELLENT) {
    return "Excellent";
  }
  if (sharpe > SHARPE_THRESHOLDS.GOOD) {
    return "Good";
  }
  if (sharpe > SHARPE_THRESHOLDS.FAIR) {
    return "Fair";
  }
  if (sharpe > SHARPE_THRESHOLDS.POOR) {
    return "Poor";
  }
  return "Very Poor";
}

/**
 * Determine volatility risk level based on percentage
 *
 * DeFi-specific thresholds:
 * - Low: < 10% (stable, low-risk positions)
 * - Moderate: 10% to 25% (typical DeFi volatility)
 * - High: 25% to 50% (elevated risk positions)
 * - Very High: > 50% (extreme volatility, high-risk)
 *
 * @param volatility - Volatility percentage (0-100+)
 * @returns Risk level label
 */
function getVolatilityRiskLevel(volatility: number): VolatilityRiskLevel {
  if (volatility < VOLATILITY_THRESHOLDS.LOW) {
    return "Low";
  }
  if (volatility < VOLATILITY_THRESHOLDS.MODERATE) {
    return "Moderate";
  }
  if (volatility < VOLATILITY_THRESHOLDS.HIGH) {
    return "High";
  }
  return "Very High";
}

/**
 * Hook for processing rolling analytics chart data
 *
 * Transforms raw Sharpe ratio, volatility, and daily yield data into chart-ready
 * structures with interpretation labels and risk categorization. Handles data
 * validation, filtering, and transformation for advanced portfolio analytics visualization.
 *
 * @param params - Configuration object containing analytics history and state flags
 * @returns Processed analytics data with interpretations and loading/error states
 *
 * @example
 * ```tsx
 * const { sharpeData, volatilityData, dailyYieldData, isLoading } = useRollingAnalytics({
 *   sharpeHistory: dashboardData?.rolling_analytics.sharpe.rolling_sharpe_data,
 *   volatilityHistory: dashboardData?.rolling_analytics.volatility.rolling_volatility_data,
 *   dailyYieldHistory: dailyYieldApiData?.daily_returns,
 *   isLoading: isDashboardLoading,
 *   error: dashboardError?.message,
 * });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!hasData) return <EmptyState />;
 *
 * return (
 *   <>
 *     <SharpeChart data={sharpeData} />
 *     <VolatilityChart data={volatilityData} />
 *     <DailyYieldChart data={dailyYieldData} />
 *   </>
 * );
 * ```
 *
 * @example With interpretation-based styling
 * ```tsx
 * const { sharpeData } = useRollingAnalytics({ sharpeHistory: apiData });
 *
 * return (
 *   <LineChart data={sharpeData}>
 *     <Line
 *       dataKey="sharpe"
 *       stroke={point =>
 *         point.interpretation === "Excellent"
 *           ? "#10b981"
 *           : point.interpretation === "Good"
 *             ? "#84cc16"
 *             : "#f97316"
 *       }
 *     />
 *   </LineChart>
 * );
 * ```
 */
export function useRollingAnalytics(
  params: UseRollingAnalyticsParams
): UseRollingAnalyticsResult {
  const {
    sharpeHistory = [],
    volatilityHistory = [],
    dailyYieldHistory = [],
    isLoading: externalLoading = false,
    error: externalError = null,
  } = params;

  // Process Sharpe ratio data with interpretations
  const sharpeData = useMemo((): SharpeDataPoint[] => {
    // Return empty array if no data available
    if (!sharpeHistory || sharpeHistory.length === 0) {
      return [];
    }

    // Filter out null/undefined values and transform to chart format
    return sharpeHistory
      .filter(point => point.rolling_sharpe_ratio != null)
      .map(point => {
        const sharpeValue = Number(point.rolling_sharpe_ratio ?? 0);

        return {
          date: point.date,
          sharpe: sharpeValue,
          interpretation: getSharpeInterpretation(sharpeValue),
        };
      });
  }, [sharpeHistory]);

  // Process volatility data with risk levels
  const volatilityData = useMemo((): VolatilityDataPoint[] => {
    // Return empty array if no data available
    if (!volatilityHistory || volatilityHistory.length === 0) {
      return [];
    }

    // Filter out null/undefined values and transform to chart format
    // Prefer annualized volatility, fallback to daily volatility
    return volatilityHistory
      .filter(
        point =>
          point.annualized_volatility_pct != null ||
          point.rolling_volatility_daily_pct != null
      )
      .map(point => {
        const volatilityValue = Number(
          point.annualized_volatility_pct ??
            point.rolling_volatility_daily_pct ??
            0
        );

        return {
          date: point.date,
          volatility: volatilityValue,
          riskLevel: getVolatilityRiskLevel(volatilityValue),
        };
      });
  }, [volatilityHistory]);

  // Process daily yield data with cumulative tracking
  const dailyYieldData = useMemo((): DailyYieldDataPoint[] => {
    // Return empty array if no data available
    if (!dailyYieldHistory || dailyYieldHistory.length === 0) {
      return [];
    }

    // Transform to simplified chart format
    return dailyYieldHistory.map(point => ({
      date: point.date,
      totalYield: point.total_yield_usd,
      cumulativeYield: point.cumulative_yield_usd,
      ...(point.protocol_count !== undefined && {
        protocolCount: point.protocol_count,
      }),
    }));
  }, [dailyYieldHistory]);

  // Determine if any data is available
  const hasData =
    sharpeData.length > 0 ||
    volatilityData.length > 0 ||
    dailyYieldData.length > 0;

  return {
    sharpeData,
    volatilityData,
    dailyYieldData,
    isLoading: externalLoading,
    error: externalError,
    hasData,
  };
}
