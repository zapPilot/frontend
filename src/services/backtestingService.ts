import { APIError, httpUtils } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import {
    BacktestRequest,
    BacktestResponse,
    BacktestTimelinePoint,
} from "@/types/backtesting";

const createBacktestingServiceError = createErrorMapper(
  (message, status, code, details) =>
    new APIError(message, status, code, details),
  {
    400: "Invalid backtest parameters. Please review your inputs and try again.",
    404: "Backtest endpoint not found. Please verify analytics-engine is running.",
    500: "An unexpected error occurred while running the backtest.",
    503: "Backtest service is temporarily unavailable. Please try again later.",
    504: "Backtest request timed out. Please try again.",
  },
  "Failed to run backtest"
);

const callBacktestingApi = createServiceCaller(createBacktestingServiceError);

/**
 * Minimum number of data points to keep in the timeline for chart rendering.
 * Ensures sufficient data density for meaningful chart visualization.
 */
export const MIN_CHART_POINTS = 90;

/**
 * Maximum number of data points to allow in the timeline.
 * Allows dynamic expansion for event-heavy timelines while maintaining performance.
 */
export const MAX_CHART_POINTS = 150;

/**
 * Sample timeline data while preserving critical trading events.
 *
 * Always preserves:
 * - First and last points
 * - Points where any non-dca_classic strategy has trading events (buy_spot, sell_spot, buy_lp, sell_lp)
 *
 * Dynamically expands the point limit to fit all strategy events, then samples
 * non-critical points evenly to fill remaining slots.
 *
 * @param timeline - Full timeline array from API
 * @param minPoints - Minimum number of points to return (default: MIN_CHART_POINTS)
 * @returns Sampled timeline array with trading events preserved
 */
function sampleTimelineData(
  timeline: BacktestTimelinePoint[] | undefined,
  minPoints: number = MIN_CHART_POINTS
): BacktestTimelinePoint[] {
  // Handle undefined or empty timelines gracefully
  if (!timeline || timeline.length === 0) {
    return [];
  }

  if (timeline.length <= minPoints) {
    return timeline;
  }

  // Track indices of critical points that must be preserved
  const criticalIndices = new Set<number>();
  criticalIndices.add(0);
  criticalIndices.add(timeline.length - 1);

  // Preserve events from ALL strategies except dca_classic (baseline)
  for (const [index, point] of timeline.entries()) {
    for (const [strategyId, strategy] of Object.entries(point.strategies)) {
      if (strategyId !== "dca_classic" && strategy?.event) {
        criticalIndices.add(index);
        break;
      }
    }
  }

  // Dynamically expand limit to fit ALL events + padding for chart continuity
  const eventPadding = 20;
  const effectiveMax = Math.min(
    MAX_CHART_POINTS,
    Math.max(minPoints, criticalIndices.size + eventPadding)
  );

  if (timeline.length <= effectiveMax) {
    return timeline;
  }

  const criticalIndicesArray = Array.from(criticalIndices).sort(
    (a, b) => a - b
  );

  // KEY FIX: Never resample critical points - always preserve ALL events
  // Calculate remaining slots for non-critical points
  const remainingSlots = effectiveMax - criticalIndicesArray.length;

  if (remainingSlots <= 0) {
    // If all slots needed for events, just return events in order
    return criticalIndicesArray
      .map(i => timeline[i])
      .filter((p): p is BacktestTimelinePoint => p !== undefined);
  }

  // Get all non-critical indices
  const nonCriticalIndices: number[] = [];
  for (let i = 0; i < timeline.length; i++) {
    if (!criticalIndices.has(i)) {
      nonCriticalIndices.push(i);
    }
  }

  // Sample non-critical points evenly
  const nonCriticalPoints = nonCriticalIndices
    .map(i => timeline[i])
    .filter((p): p is BacktestTimelinePoint => p !== undefined);
  const sampledNonCritical = sampleEvenlyIndices(
    nonCriticalPoints,
    remainingSlots
  );

  // Map sampled non-critical back to indices
  const sampledNonCriticalIndices = new Set<number>();
  for (const point of sampledNonCritical) {
    const index = timeline.findIndex(
      p =>
        p &&
        p.date === point.date &&
        p.price === point.price &&
        p.sentiment === point.sentiment
    );
    if (index !== -1) {
      sampledNonCriticalIndices.add(index);
    }
  }

  // Combine and sort
  const allIndices = [
    ...criticalIndicesArray,
    ...Array.from(sampledNonCriticalIndices),
  ].sort((a, b) => a - b);

  return allIndices
    .map(i => timeline[i])
    .filter((p): p is BacktestTimelinePoint => p !== undefined);
}

/**
 * Sample an array of points evenly to a target size.
 *
 * @param points - Array of points to sample
 * @param targetSize - Target number of points
 * @returns Sampled array
 */
function sampleEvenlyIndices<T>(points: T[], targetSize: number): T[] {
  if (points.length <= targetSize) {
    return points;
  }

  if (targetSize === 0) {
    return [];
  }

  if (targetSize === 1) {
    const middleIndex = Math.floor(points.length / 2);
    const point = points[middleIndex];
    return point !== undefined ? [point] : [];
  }

  const step = (points.length - 1) / (targetSize - 1);
  const sampled: T[] = [];

  for (let i = 0; i < targetSize; i++) {
    const index = Math.round(i * step);
    const point = points[index];
    if (point !== undefined) {
      sampled.push(point);
    }
  }

  return sampled;
}

/**
 * Run the DCA comparison backtest.
 *
 * Automatically samples the timeline data to reduce browser RAM usage
 * while preserving important trading signals (buy/sell events).
 */
/**
 * Export sampleTimelineData for testing purposes.
 * @internal - Not part of the public API
 */
export { sampleTimelineData as _sampleTimelineData };

export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  const response = await callBacktestingApi(() =>
    httpUtils.analyticsEngine.post<BacktestResponse>(
      "/api/v2/backtesting/dca-comparison",
      request
    )
  );

  // Sample timeline data to reduce memory usage while preserving signals
  return {
    ...response,
    timeline: sampleTimelineData(response.timeline),
  };
}
