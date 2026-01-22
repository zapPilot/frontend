import { APIError, httpUtils } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import {
  BacktestRequest,
  BacktestResponse,
  BacktestTimelinePoint,
  SimpleBacktestRequest,
} from "@/types/backtesting";

/**
 * Convert a full BacktestRequest to a SimpleBacktestRequest.
 * Only includes properties that are supported by the simple endpoint.
 */
export function convertToSimpleRequest(params: BacktestRequest): SimpleBacktestRequest {
  const simpleRequest: SimpleBacktestRequest = {
    token_symbol: params.token_symbol,
    total_capital: params.total_capital,
  };

  if (params.start_date !== undefined) {
    simpleRequest.start_date = params.start_date;
  }
  if (params.end_date !== undefined) {
    simpleRequest.end_date = params.end_date;
  }
  if (params.days !== undefined) {
    simpleRequest.days = params.days;
  }
  if (params.rebalance_step_count !== undefined) {
    simpleRequest.rebalance_step_count = params.rebalance_step_count;
  }
  if (params.rebalance_interval_days !== undefined) {
    simpleRequest.rebalance_interval_days = params.rebalance_interval_days;
  }
  if (params.drift_threshold !== undefined) {
    simpleRequest.drift_threshold = params.drift_threshold;
  }

  return simpleRequest;
}

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
 * Maximum number of data points to keep in the timeline for chart rendering.
 * Reduces browser RAM usage while preserving important signal events.
 */
const MAX_CHART_POINTS = 90;

/**
 * Sample timeline data while preserving critical points.
 *
 * Always preserves:
 * - First and last points
 * - All points with trading events (buy_spot, sell_spot, buy_lp, sell_lp)
 *
 * Samples remaining points evenly to fill up to maxPoints.
 *
 * @param timeline - Full timeline array from API
 * @param maxPoints - Maximum number of points to return (default: MAX_CHART_POINTS)
 * @returns Sampled timeline array
 */
function sampleTimelineData(
  timeline: BacktestTimelinePoint[],
  maxPoints: number = MAX_CHART_POINTS
): BacktestTimelinePoint[] {
  // If already within limit, return as-is
  if (timeline.length <= maxPoints) {
    return timeline;
  }

  // Track indices of critical points that must be preserved
  const criticalIndices = new Set<number>();

  // Always keep first and last points
  criticalIndices.add(0);
  criticalIndices.add(timeline.length - 1);

  // Keep all points with trading events (signals) from any strategy
  timeline.forEach((point, index) => {
    // Check events across all strategies (supports dynamic strategy keys)
    const hasEvent = Object.values(point.strategies).some(
      strategy => strategy.event && strategy.event !== null
    );
    if (hasEvent) {
      criticalIndices.add(index);
    }
  });

  const criticalIndicesArray = Array.from(criticalIndices).sort(
    (a, b) => a - b
  );

  // If we have too many critical points, sample them evenly
  if (criticalIndicesArray.length >= maxPoints) {
    const criticalPoints = criticalIndicesArray
      .map(i => timeline[i])
      .filter((p): p is BacktestTimelinePoint => p !== undefined);
    return sampleEvenlyIndices(criticalPoints, maxPoints);
  }

  // Calculate remaining slots for non-critical points
  const remainingSlots = maxPoints - criticalIndicesArray.length;

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

  // Get indices of sampled non-critical points
  const sampledNonCriticalIndices = new Set<number>();
  sampledNonCritical.forEach(point => {
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
  });

  // Combine critical and sampled non-critical indices, then sort
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

/**
 * Run the simplified DCA comparison backtest.
 *
 * Uses the simplified endpoint which hardcodes:
 * - action_regimes=['extreme_fear','extreme_greed']
 * - use_equal_capital_pool=True
 *
 * Automatically samples the timeline data to reduce browser RAM usage
 * while preserving important trading signals (buy/sell events).
 */
export async function runSimpleBacktest(
  request: SimpleBacktestRequest
): Promise<BacktestResponse> {
  const response = await callBacktestingApi(() =>
    httpUtils.analyticsEngine.post<BacktestResponse>(
      "/api/v2/backtesting/dca-comparison-simple",
      request
    )
  );

  // Sample timeline data to reduce memory usage while preserving signals
  return {
    ...response,
    timeline: sampleTimelineData(response.timeline),
  };
}
