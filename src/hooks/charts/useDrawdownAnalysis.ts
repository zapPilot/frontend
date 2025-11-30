/**
 * useDrawdownAnalysis Hook
 *
 * Extracts drawdown and recovery analysis logic from the unified dashboard endpoint.
 * This hook processes drawdown percentages, detects recovery points (new peaks), tracks
 * peak values, and provides comprehensive drawdown metrics for visualization.
 *
 * Performance Optimizations:
 * - Memoized drawdown calculations to prevent unnecessary recalculations
 * - Efficient peak tracking with running maximum algorithm
 * - Minimal re-renders with useMemo dependencies
 *
 * Algorithm Details:
 * - Drawdown = ((current - peak) / peak) * 100
 * - Recovery Point = when current value equals or exceeds previous peak
 * - Handles edge cases: empty data, single point, negative values
 *
 * @module hooks/charts/useDrawdownAnalysis
 */

import { useMemo } from "react";

import { DRAWDOWN_CONSTANTS } from "@/components/PortfolioChart/chartConstants";
import type {
  DrawdownRecoveryData,
  DrawdownRecoverySummary,
} from "@/components/PortfolioChart/types";
import type { PortfolioDataPoint } from "@/types/domain/portfolio";

// Epsilon for floating point comparison (0.05%)
const DRAWDOWN_EPSILON = 0.0005;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Default summary for empty or invalid data
 */
const DEFAULT_DRAWDOWN_SUMMARY: DrawdownRecoverySummary = {
  maxDrawdown: 0,
  totalRecoveries: 0,
  averageRecoveryDays: null,
  currentDrawdown: 0,
  currentStatus: "At Peak",
};

/**
 * Input parameters for useDrawdownAnalysis hook
 */
interface UseDrawdownAnalysisParams {
  /**
   * Raw portfolio history data from API
   * Used to calculate drawdown from peak values
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
 * Single data point in the drawdown timeseries
 */
interface DrawdownDataPoint {
  /** Date of the data point */
  date: string;
  /** Drawdown percentage (0 to -100) */
  drawdown: number;
  /** True when portfolio reaches new peak */
  isRecoveryPoint: boolean;
  /** Current peak value */
  peak: number;
}

/**
 * Comprehensive drawdown metrics calculated from the timeseries
 */
interface DrawdownMetrics {
  /** Most severe drawdown percentage (most negative value) */
  maxDrawdown: number;
  /** Current drawdown percentage */
  currentDrawdown: number;
  /** Number of recovery points (new peaks) */
  recoveryCount: number;
  /** Mean drawdown percentage across all points */
  averageDrawdown: number;
  /** Current portfolio status */
  currentStatus: "Underwater" | "At Peak";
  /** Latest peak date */
  latestPeakDate?: string;
  /** Average recovery duration in days */
  averageRecoveryDays: number | null;
  /** Latest recovery duration in days */
  latestRecoveryDurationDays?: number;
}

/**
 * Return value for useDrawdownAnalysis hook
 */
interface UseDrawdownAnalysisResult {
  /**
   * Drawdown data points with recovery annotations
   * Enhanced with recovery point markers and peak tracking
   */
  drawdownData: DrawdownRecoveryData[];

  /**
   * Comprehensive drawdown metrics summary
   * Includes max drawdown, recovery stats, current status
   */
  metrics: DrawdownMetrics | null;

  /**
   * Loading state indicating data is being fetched or processed
   */
  isLoading: boolean;

  /**
   * Error message if data fetching or processing failed
   */
  error: string | null;

  /**
   * Whether there is valid drawdown data available
   * Useful for conditional rendering of charts vs empty states
   */
  hasData: boolean;
}

/**
 * Internal state for tracking recovery cycles
 */
interface RecoveryAccumulator {
  annotations: DrawdownRecoveryData[];
  recoveryDurations: number[];
  lastPeakTimestamp: number | null;
  lastPeakDate?: string;
  underwaterStartTimestamp: number | null;
  underwaterStartDate?: string;
  currentCycleMin: number;
  isUnderwater: boolean;
  previousDrawdown: number;
}

/**
 * Parameters for state transition functions
 */
interface TransitionParams {
  annotation: DrawdownRecoveryData;
  state: RecoveryAccumulator;
  timestamp: number | null;
  normalizedDrawdown: number;
  pointDate: string;
}

/**
 * Result from state transition functions
 */
interface TransitionResult {
  annotation: DrawdownRecoveryData;
  stateUpdates: Partial<RecoveryAccumulator>;
  recoveryDuration?: number;
}

/**
 * Convert date string to timestamp
 */
function toTimestamp(date: string): number | null {
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Initialize recovery accumulator with first data point
 */
function initializeRecoveryAccumulator(firstPoint: {
  date: string;
  drawdown: number;
}): RecoveryAccumulator {
  const timestamp = toTimestamp(firstPoint.date);
  const initialDrawdown = Number.isFinite(firstPoint.drawdown)
    ? firstPoint.drawdown
    : 0;

  const accumulator: RecoveryAccumulator = {
    annotations: [],
    recoveryDurations: [],
    lastPeakTimestamp: timestamp,
    underwaterStartTimestamp: timestamp,
    currentCycleMin: 0,
    isUnderwater: false,
    previousDrawdown: initialDrawdown,
  };

  if (timestamp != null) {
    accumulator.lastPeakDate = firstPoint.date;
    accumulator.underwaterStartDate = firstPoint.date;
  }

  return accumulator;
}

/**
 * Handle recovery transition (drawdown >= -EPSILON)
 * Marks new peak and calculates recovery duration
 */
function applyRecoveryTransition({
  annotation,
  state,
  timestamp,
  pointDate,
}: TransitionParams): TransitionResult {
  const updatedAnnotation: DrawdownRecoveryData = {
    ...annotation,
    peakDate: pointDate,
    daysFromPeak: 0,
  };

  const stateUpdates: Partial<RecoveryAccumulator> = {
    isUnderwater: false,
    currentCycleMin: 0,
    underwaterStartTimestamp: timestamp ?? state.lastPeakTimestamp ?? null,
    underwaterStartDate: pointDate,
  };

  let recoveryDuration: number | undefined;

  // Calculate recovery duration if emerging from underwater state
  if (state.isUnderwater && timestamp != null) {
    const startTs =
      state.underwaterStartTimestamp ?? state.lastPeakTimestamp ?? timestamp;
    const duration = Math.max(
      0,
      Math.round((timestamp - startTs) / MS_PER_DAY)
    );
    recoveryDuration = duration;
    updatedAnnotation.recoveryDurationDays = duration;
    updatedAnnotation.recoveryDepth = state.currentCycleMin;
    updatedAnnotation.isRecoveryPoint = true;
  } else if (state.previousDrawdown < -DRAWDOWN_EPSILON) {
    // Mark as recovery point even if not strictly underwater
    updatedAnnotation.isRecoveryPoint = true;
  }

  // Update peak timestamp
  if (timestamp != null) {
    stateUpdates.lastPeakTimestamp = timestamp;
    stateUpdates.lastPeakDate = pointDate;
  }

  return {
    annotation: updatedAnnotation,
    stateUpdates,
    ...(recoveryDuration !== undefined && { recoveryDuration }),
  };
}

/**
 * Handle underwater transition (drawdown < -EPSILON)
 * Tracks peak date and calculates days from peak
 */
function applyUnderwaterTransition({
  annotation,
  state,
  timestamp,
  normalizedDrawdown,
  pointDate,
}: TransitionParams): TransitionResult {
  const updatedAnnotation: DrawdownRecoveryData = { ...annotation };

  let underwaterStartTimestamp = state.underwaterStartTimestamp;
  let underwaterStartDate = state.underwaterStartDate;
  let currentCycleMin = state.currentCycleMin;

  // Initialize underwater tracking on first underwater point
  if (!state.isUnderwater) {
    underwaterStartTimestamp = state.lastPeakTimestamp ?? timestamp;
    underwaterStartDate = state.lastPeakDate ?? pointDate;
    currentCycleMin = normalizedDrawdown;
  } else if (normalizedDrawdown < currentCycleMin) {
    // Update cycle minimum if new low
    currentCycleMin = normalizedDrawdown;
  }

  // Set peak date for reference
  if (underwaterStartDate) {
    updatedAnnotation.peakDate = underwaterStartDate;
  }

  // Calculate days from peak
  if (timestamp != null && underwaterStartTimestamp != null) {
    const diff = Math.max(
      0,
      Math.round((timestamp - underwaterStartTimestamp) / MS_PER_DAY)
    );
    updatedAnnotation.daysFromPeak = diff;
  }

  const stateUpdates: Partial<RecoveryAccumulator> = {
    isUnderwater: true,
    currentCycleMin,
    underwaterStartTimestamp,
  };

  if (underwaterStartDate !== undefined) {
    stateUpdates.underwaterStartDate = underwaterStartDate;
  }

  return {
    annotation: updatedAnnotation,
    stateUpdates,
  };
}

/**
 * Process single drawdown data point and update accumulator
 */
function processDrawdownPoint(
  point: { date: string; drawdown: number },
  accumulator: RecoveryAccumulator
): RecoveryAccumulator {
  const timestamp = toTimestamp(point.date);
  const normalizedDrawdown = Number.isFinite(point.drawdown)
    ? point.drawdown
    : 0;

  // Initialize peak tracking on first point
  if (accumulator.lastPeakTimestamp == null && timestamp != null) {
    accumulator.lastPeakTimestamp = timestamp;
    accumulator.lastPeakDate = point.date;
  }

  // Create base annotation
  const baseAnnotation: DrawdownRecoveryData = {
    date: point.date,
    drawdown: normalizedDrawdown,
    isRecoveryPoint: false,
    peakDate: accumulator.lastPeakDate ?? point.date,
  };

  // Calculate days from peak if available
  if (accumulator.lastPeakTimestamp != null && timestamp != null) {
    baseAnnotation.daysFromPeak = Math.max(
      0,
      Math.round((timestamp - accumulator.lastPeakTimestamp) / MS_PER_DAY)
    );
  }

  const transitionParams: TransitionParams = {
    annotation: baseAnnotation,
    state: accumulator,
    timestamp,
    normalizedDrawdown,
    pointDate: point.date,
  };

  // Apply appropriate transition based on drawdown value
  const { annotation, stateUpdates, recoveryDuration } =
    normalizedDrawdown >= -DRAWDOWN_EPSILON
      ? applyRecoveryTransition(transitionParams)
      : applyUnderwaterTransition(transitionParams);

  // Add annotation to results
  accumulator.annotations.push(annotation);

  // Track recovery duration if applicable
  if (recoveryDuration != null) {
    accumulator.recoveryDurations.push(recoveryDuration);
  }

  // Update accumulator state
  accumulator.previousDrawdown = normalizedDrawdown;
  if (stateUpdates.isUnderwater !== undefined) {
    accumulator.isUnderwater = stateUpdates.isUnderwater;
  }
  if (stateUpdates.currentCycleMin !== undefined) {
    accumulator.currentCycleMin = stateUpdates.currentCycleMin;
  }
  if (stateUpdates.underwaterStartTimestamp !== undefined) {
    accumulator.underwaterStartTimestamp =
      stateUpdates.underwaterStartTimestamp;
  }
  if (stateUpdates.underwaterStartDate !== undefined) {
    accumulator.underwaterStartDate = stateUpdates.underwaterStartDate;
  }
  if (stateUpdates.lastPeakTimestamp !== undefined) {
    accumulator.lastPeakTimestamp = stateUpdates.lastPeakTimestamp;
  }
  if (stateUpdates.lastPeakDate !== undefined) {
    accumulator.lastPeakDate = stateUpdates.lastPeakDate;
  }

  return accumulator;
}

/**
 * Build drawdown recovery insights from raw drawdown data
 * Processes all points and calculates comprehensive metrics
 *
 * @public - Exported for use in orchestrator hooks
 */
export function buildDrawdownRecoveryInsights(
  points: { date: string; drawdown: number }[],
  recoveryThreshold: number = DRAWDOWN_CONSTANTS.RECOVERY_THRESHOLD
): { data: DrawdownRecoveryData[]; summary: DrawdownRecoverySummary } {
  if (points.length === 0) {
    return {
      data: [],
      summary: { ...DEFAULT_DRAWDOWN_SUMMARY },
    };
  }

  const firstPoint = points[0];
  if (!firstPoint) {
    return {
      data: [],
      summary: { ...DEFAULT_DRAWDOWN_SUMMARY },
    };
  }

  // Initialize accumulator with first point
  let accumulator = initializeRecoveryAccumulator(firstPoint);
  accumulator = processDrawdownPoint(firstPoint, accumulator);

  // Process remaining points
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (!point) {
      continue;
    }
    accumulator = processDrawdownPoint(point, accumulator);
  }

  // Calculate summary metrics
  const maxDrawdown = accumulator.annotations.reduce((min, point) => {
    if (!Number.isFinite(point.drawdown)) return min;
    return Math.min(min, point.drawdown);
  }, 0);

  const currentPoint =
    accumulator.annotations[accumulator.annotations.length - 1];
  const currentDrawdown = currentPoint?.drawdown ?? 0;
  const currentStatus =
    currentDrawdown <= recoveryThreshold ? "Underwater" : "At Peak";

  const totalRecoveries = accumulator.annotations.filter(
    point => point.isRecoveryPoint
  ).length;

  const averageRecoveryDays =
    accumulator.recoveryDurations.length > 0
      ? Math.round(
          accumulator.recoveryDurations.reduce((sum, value) => sum + value, 0) /
            accumulator.recoveryDurations.length
        )
      : null;

  const latestRecoveryDuration =
    accumulator.recoveryDurations[accumulator.recoveryDurations.length - 1];

  const summary: DrawdownRecoverySummary = {
    maxDrawdown,
    totalRecoveries,
    averageRecoveryDays,
    currentDrawdown,
    currentStatus,
  };

  if (accumulator.lastPeakDate) {
    summary.latestPeakDate = accumulator.lastPeakDate;
  }

  if (latestRecoveryDuration !== undefined) {
    summary.latestRecoveryDurationDays = latestRecoveryDuration;
  }

  return {
    data: accumulator.annotations,
    summary,
  };
}

/**
 * Calculate drawdown data from portfolio history
 * Computes running peak and drawdown percentage
 */
function calculateDrawdownData(
  portfolioHistory: PortfolioDataPoint[]
): { date: string; drawdown: number }[] {
  if (portfolioHistory.length === 0) {
    return [];
  }

  let runningPeak = 0;
  const drawdownPoints: { date: string; drawdown: number }[] = [];

  for (const point of portfolioHistory) {
    const value = point.value;

    // Update running peak
    if (value > runningPeak) {
      runningPeak = value;
    }

    // Calculate drawdown percentage
    const drawdown =
      runningPeak > 0 ? ((value - runningPeak) / runningPeak) * 100 : 0;

    drawdownPoints.push({
      date: point.date,
      drawdown,
    });
  }

  return drawdownPoints;
}

/**
 * Hook for processing drawdown and recovery analysis
 *
 * Transforms portfolio history into drawdown metrics with recovery point detection.
 * Handles data validation, peak tracking, drawdown calculations, and comprehensive
 * metric generation for underwater/recovery visualization.
 *
 * @param params - Configuration object containing portfolio history and state flags
 * @returns Processed drawdown data with metrics and loading/error states
 *
 * @example
 * ```tsx
 * const { drawdownData, metrics, isLoading, hasData } = useDrawdownAnalysis({
 *   portfolioHistory: dashboardData?.trends.daily_values,
 *   isLoading: isDashboardLoading,
 *   error: dashboardError?.message,
 * });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!hasData) return <EmptyState />;
 *
 * return (
 *   <DrawdownChart
 *     data={drawdownData}
 *     maxDrawdown={metrics.maxDrawdown}
 *     currentStatus={metrics.currentStatus}
 *   />
 * );
 * ```
 *
 * @example With recovery point markers
 * ```tsx
 * const { drawdownData } = useDrawdownAnalysis({
 *   portfolioHistory: apiData,
 * });
 *
 * return (
 *   <LineChart data={drawdownData}>
 *     <Line dataKey="drawdown" stroke="#f97316" />
 *     {drawdownData
 *       .filter(point => point.isRecoveryPoint)
 *       .map(point => (
 *         <ReferenceLine
 *           key={point.date}
 *           x={point.date}
 *           stroke="#10b981"
 *           strokeDasharray="3 3"
 *         />
 *       ))}
 *   </LineChart>
 * );
 * ```
 */
export function useDrawdownAnalysis(
  params: UseDrawdownAnalysisParams
): UseDrawdownAnalysisResult {
  const {
    portfolioHistory = [],
    isLoading: externalLoading = false,
    error: externalError = null,
  } = params;

  // Calculate drawdown data and recovery insights
  const drawdownAnalysis = useMemo(() => {
    // Return empty result if no data available
    if (!portfolioHistory || portfolioHistory.length === 0) {
      return {
        data: [],
        summary: { ...DEFAULT_DRAWDOWN_SUMMARY },
      };
    }

    // Calculate raw drawdown percentages from portfolio history
    const basePoints = calculateDrawdownData(portfolioHistory);

    // Build recovery insights with peak tracking
    return buildDrawdownRecoveryInsights(basePoints);
  }, [portfolioHistory]);

  // Extract metrics from summary
  const metrics = useMemo((): DrawdownMetrics | null => {
    if (drawdownAnalysis.data.length === 0) {
      return null;
    }

    const { summary } = drawdownAnalysis;

    // Calculate average drawdown across all points
    const totalDrawdown = drawdownAnalysis.data.reduce(
      (sum, point) => sum + point.drawdown,
      0
    );
    const averageDrawdown =
      drawdownAnalysis.data.length > 0
        ? totalDrawdown / drawdownAnalysis.data.length
        : 0;

    const baseMetrics: DrawdownMetrics = {
      maxDrawdown: summary.maxDrawdown,
      currentDrawdown: summary.currentDrawdown,
      recoveryCount: summary.totalRecoveries,
      averageDrawdown,
      currentStatus: summary.currentStatus,
      averageRecoveryDays: summary.averageRecoveryDays,
    };

    // Add optional properties only if defined
    if (summary.latestPeakDate !== undefined) {
      baseMetrics.latestPeakDate = summary.latestPeakDate;
    }

    if (summary.latestRecoveryDurationDays !== undefined) {
      baseMetrics.latestRecoveryDurationDays =
        summary.latestRecoveryDurationDays;
    }

    return baseMetrics;
  }, [drawdownAnalysis]);

  return {
    drawdownData: drawdownAnalysis.data,
    metrics,
    isLoading: externalLoading,
    error: externalError,
    hasData: drawdownAnalysis.data.length > 0,
  };
}
