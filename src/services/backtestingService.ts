import { APIError, httpUtils } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import {
  BacktestRequest,
  BacktestResponse,
  BacktestStrategyCatalogResponseV3,
  BacktestTimelinePoint,
  BacktestTransferMetadata,
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

function extractTransfers(
  strategy: BacktestTimelinePoint["strategies"][string] | undefined
): BacktestTransferMetadata[] {
  const metrics = strategy?.metrics as
    | { metadata?: { transfers?: unknown } }
    | undefined;
  const transfers = metrics?.metadata?.transfers;
  if (!Array.isArray(transfers)) return [];

  return transfers
    .map(t => {
      if (!t || typeof t !== "object") return null;
      const maybe = t as Partial<BacktestTransferMetadata>;
      if (
        (maybe.from_bucket !== "spot" &&
          maybe.from_bucket !== "stable" &&
          maybe.from_bucket !== "lp") ||
        (maybe.to_bucket !== "spot" &&
          maybe.to_bucket !== "stable" &&
          maybe.to_bucket !== "lp") ||
        typeof maybe.amount_usd !== "number"
      ) {
        return null;
      }
      return maybe as BacktestTransferMetadata;
    })
    .filter((t): t is BacktestTransferMetadata => t != null);
}

function isDcaBaselineStrategy(
  strategy: BacktestTimelinePoint["strategies"][string] | undefined
): boolean {
  const metrics = strategy?.metrics as { signal?: unknown } | undefined;
  return metrics?.signal === "dca";
}

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
const DMA_WINDOW_DAYS = 200;

function getTimelinePointPrice(point: BacktestTimelinePoint): number | null {
  const btcPrice = point.token_price?.["btc"];
  if (typeof btcPrice === "number" && Number.isFinite(btcPrice)) {
    return btcPrice;
  }

  for (const value of Object.values(point.token_price ?? {})) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

/**
 * Enrich timeline points with rolling DMA-200 values.
 *
 * Notes:
 * - Uses BTC price when available, otherwise falls back to the first numeric token price.
 * - Requires a full contiguous 200-day window; missing price resets the window.
 */
function enrichTimelineWithDma200(
  timeline: BacktestTimelinePoint[] | undefined
): BacktestTimelinePoint[] {
  if (!timeline || timeline.length === 0) {
    return [];
  }

  const window: number[] = [];
  let rollingSum = 0;

  return timeline.map(point => {
    const price = getTimelinePointPrice(point);
    if (price == null) {
      window.length = 0;
      rollingSum = 0;
      return { ...point, dma_200: null };
    }

    window.push(price);
    rollingSum += price;

    if (window.length > DMA_WINDOW_DAYS) {
      const removed = window.shift();
      if (removed != null) {
        rollingSum -= removed;
      }
    }

    const dma200 =
      window.length === DMA_WINDOW_DAYS ? rollingSum / DMA_WINDOW_DAYS : null;

    return { ...point, dma_200: dma200 };
  });
}

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
    for (const strategy of Object.values(point.strategies)) {
      if (isDcaBaselineStrategy(strategy)) continue;

      const hasEvent = strategy?.event != null;
      const hasTransfers = extractTransfers(strategy).length > 0;
      if (hasEvent || hasTransfers) {
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
    // date is unique for daily candles; keying by it avoids token_price shape issues
    const index = timeline.findIndex(p => p && p.date === point.date);
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
 *
 * Uses a custom 10-minute timeout to accommodate complex backtesting
 * calculations that may involve:
 * - Multiple allocation strategies
 * - Extended historical data ranges (90+ days)
 * - High computational load on the analytics server
 */
/**
 * Export internal helpers for testing purposes.
 * @internal - Not part of the public API
 */
export {
  enrichTimelineWithDma200 as _enrichTimelineWithDma200,
  sampleTimelineData as _sampleTimelineData,
};

export async function getBacktestingStrategiesV3(): Promise<BacktestStrategyCatalogResponseV3> {
  return callBacktestingApi(() =>
    httpUtils.analyticsEngine.get<BacktestStrategyCatalogResponseV3>(
      "/api/v3/backtesting/strategies"
    )
  );
}

export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  const response = await callBacktestingApi(() =>
    httpUtils.analyticsEngine.post<BacktestResponse>(
      "/api/v3/backtesting/compare",
      request,
      {
        timeout: 600000, // 10 minutes (20x default timeout for complex backtests)
      }
    )
  );

  // Compute DMA200 on the full timeline first, then sample while preserving events.
  const timelineWithDma = enrichTimelineWithDma200(response.timeline);

  // Sample timeline data to reduce memory usage while preserving signals
  return {
    ...response,
    timeline: sampleTimelineData(timelineWithDma),
  };
}
