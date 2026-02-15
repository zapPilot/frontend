import type {
  BacktestTimelinePoint,
  BacktestTransferMetadata,
} from "@/types/backtesting";

const VALID_BUCKETS = new Set(["spot", "stable", "lp"]);
const DMA_WINDOW_DAYS = 200;

interface StrategyMetrics {
  metadata?: { transfers?: unknown };
  signal?: unknown;
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

function isValidTransfer(t: unknown): t is BacktestTransferMetadata {
  if (!t || typeof t !== "object") {
    return false;
  }

  const transfer = t as Partial<BacktestTransferMetadata>;
  return (
    VALID_BUCKETS.has(transfer.from_bucket ?? "") &&
    VALID_BUCKETS.has(transfer.to_bucket ?? "") &&
    typeof transfer.amount_usd === "number"
  );
}

function extractTransfers(
  strategy: BacktestTimelinePoint["strategies"][string] | undefined
): BacktestTransferMetadata[] {
  const metrics = strategy?.metrics as StrategyMetrics | undefined;
  const transfers = metrics?.metadata?.transfers;

  if (!Array.isArray(transfers)) {
    return [];
  }

  return transfers.filter(isValidTransfer);
}

function isDcaBaselineStrategy(
  strategy: BacktestTimelinePoint["strategies"][string] | undefined
): boolean {
  const metrics = strategy?.metrics as StrategyMetrics | undefined;
  return metrics?.signal === "dca";
}

function getTimelinePointPrice(point: BacktestTimelinePoint): number | null {
  const prices = point.token_price ?? {};
  const btcPrice = prices["btc"];

  if (typeof btcPrice === "number" && Number.isFinite(btcPrice)) {
    return btcPrice;
  }

  for (const value of Object.values(prices)) {
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
export function enrichTimelineWithDma200(
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
      const removedValue = window.shift();
      if (removedValue != null) {
        rollingSum -= removedValue;
      }
    }

    const dma200 =
      window.length === DMA_WINDOW_DAYS ? rollingSum / DMA_WINDOW_DAYS : null;

    return { ...point, dma_200: dma200 };
  });
}

function sampleEvenlyFromIndices(
  indices: number[],
  targetSize: number
): number[] {
  if (indices.length <= targetSize) {
    return indices;
  }

  if (targetSize === 0) {
    return [];
  }

  if (targetSize === 1) {
    const middleIndex = indices[Math.floor(indices.length / 2)];
    return middleIndex !== undefined ? [middleIndex] : [];
  }

  const step = (indices.length - 1) / (targetSize - 1);
  const sampled: number[] = [];
  for (let i = 0; i < targetSize; i++) {
    const indexValue = indices[Math.round(i * step)];
    if (indexValue !== undefined) {
      sampled.push(indexValue);
    }
  }

  return sampled;
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
export function sampleTimelineData(
  timeline: BacktestTimelinePoint[] | undefined,
  minPoints: number = MIN_CHART_POINTS
): BacktestTimelinePoint[] {
  if (!timeline || timeline.length === 0) {
    return [];
  }

  if (timeline.length <= minPoints) {
    return timeline;
  }

  const criticalIndices = new Set<number>([0, timeline.length - 1]);

  for (const [index, point] of timeline.entries()) {
    for (const strategy of Object.values(point.strategies)) {
      if (isDcaBaselineStrategy(strategy)) {
        continue;
      }

      const hasEvent = strategy?.event != null;
      const hasTransfers = extractTransfers(strategy).length > 0;
      if (hasEvent || hasTransfers) {
        criticalIndices.add(index);
        break;
      }
    }
  }

  const eventPadding = 20;
  const effectiveMax = Math.min(
    MAX_CHART_POINTS,
    Math.max(minPoints, criticalIndices.size + eventPadding)
  );

  if (timeline.length <= effectiveMax) {
    return timeline;
  }

  const sortedCriticalIndices = Array.from(criticalIndices).sort(
    (a, b) => a - b
  );
  const remainingSlots = effectiveMax - sortedCriticalIndices.length;

  if (remainingSlots <= 0) {
    return sortedCriticalIndices
      .map(index => timeline[index])
      .filter((point): point is BacktestTimelinePoint => point !== undefined);
  }

  const nonCriticalIndices: number[] = [];
  for (let i = 0; i < timeline.length; i++) {
    if (!criticalIndices.has(i)) {
      nonCriticalIndices.push(i);
    }
  }

  const sampledNonCriticalIndices = sampleEvenlyFromIndices(
    nonCriticalIndices,
    remainingSlots
  );

  const finalIndices = [
    ...sortedCriticalIndices,
    ...sampledNonCriticalIndices,
  ].sort((a, b) => a - b);

  return finalIndices
    .map(index => timeline[index])
    .filter((point): point is BacktestTimelinePoint => point !== undefined);
}
