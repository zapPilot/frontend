/**
 * Utility functions for mapping different data sources to unified allocation segments.
 *
 * These mappers convert source-specific data formats into the unified 4-category model,
 * enabling consistent visualization across Dashboard, Strategy, and Backtesting views.
 */

import { UNIFIED_COLORS } from "@/constants/assets";

import type {
  BacktestConstituentsSource,
  LegacyAllocationConstituent,
  PortfolioAllocationSource,
  StrategyBucketsSource,
  UnifiedCategory,
  UnifiedSegment,
} from "./unifiedAllocationTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Category Labels
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<UnifiedCategory, string> = {
  btc: "BTC",
  "btc-stable": "BTC-STABLE",
  stable: "STABLE",
  alt: "ALT",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a unified segment with consistent structure.
 */
function createSegment(
  category: UnifiedCategory,
  percentage: number
): UnifiedSegment {
  return {
    category,
    label: CATEGORY_LABELS[category],
    percentage,
    color:
      UNIFIED_COLORS[
        category.toUpperCase().replace("-", "_") as keyof typeof UNIFIED_COLORS
      ],
  };
}

/**
 * Filters out zero/negative segments and sorts by percentage descending.
 */
function normalizeSegments(segments: UnifiedSegment[]): UnifiedSegment[] {
  return segments
    .filter(s => s.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Extracts a numeric value from a Record or returns the number directly.
 */
function getRecordValue(
  data: Record<string, number> | number,
  key: string
): number {
  if (typeof data === "number") {
    // When it's a plain number, we can't distinguish assets
    // Return 0 for specific keys, the caller handles the fallback
    return 0;
  }
  return data[key] ?? 0;
}

/**
 * Gets the total value from a Record or number.
 */
function getRecordTotal(data: Record<string, number> | number): number {
  if (typeof data === "number") {
    return data;
  }
  return Object.values(data).reduce((sum, val) => sum + val, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps portfolio allocation data (dashboard) to unified segments.
 *
 * Source values are percentages (0-100).
 * ETH and others are combined into ALT.
 * BTC-STABLE is not available from this source (no LP breakdown).
 *
 * @example
 * ```ts
 * const segments = mapPortfolioToUnified({
 *   btc: 40,
 *   eth: 30,
 *   others: 10,
 *   stablecoins: 20
 * });
 * // Returns: [{ category: 'btc', percentage: 40 }, { category: 'alt', percentage: 40 }, ...]
 * ```
 */
export function mapPortfolioToUnified(
  data: PortfolioAllocationSource
): UnifiedSegment[] {
  const segments: UnifiedSegment[] = [
    createSegment("btc", data.btc),
    createSegment("stable", data.stablecoins),
    createSegment("alt", data.eth + data.others),
    // Note: BTC-STABLE not available from portfolio endpoint (no LP breakdown)
  ];

  return normalizeSegments(segments);
}

/**
 * Maps strategy bucket data to unified segments.
 *
 * Source values are ratios (0-1), converted to percentages.
 * Assumes LP is primarily BTC-STABLE for strategy view.
 * Spot is mapped to BTC (simplified - actual BTC/ETH split not available).
 *
 * @example
 * ```ts
 * const segments = mapStrategyToUnified({
 *   spot: 0.5,
 *   lp: 0.3,
 *   stable: 0.2
 * });
 * // Returns: [{ category: 'btc', percentage: 50 }, { category: 'btc-stable', percentage: 30 }, ...]
 * ```
 */
export function mapStrategyToUnified(
  data: StrategyBucketsSource
): UnifiedSegment[] {
  const segments: UnifiedSegment[] = [
    // Spot → treated as BTC (simplified view for strategy comparison)
    createSegment("btc", data.spot * 100),
    // LP → BTC-STABLE (strategy focuses on BTC-USDC LP)
    createSegment("btc-stable", data.lp * 100),
    createSegment("stable", data.stable * 100),
  ];

  return normalizeSegments(segments);
}

/**
 * Maps backtest constituents to unified segments with LP pair breakdown.
 *
 * This is the richest mapper - it uses the full asset breakdown from backtesting:
 * - `spot.btc` → BTC
 * - `lp.btc` → BTC-STABLE
 * - `stable` → STABLE
 * - `spot.eth` + `lp.eth` + `spot.others` → ALT
 *
 * @example
 * ```ts
 * const segments = mapBacktestToUnified({
 *   spot: { btc: 3000, eth: 2000 },
 *   lp: { btc: 1000, eth: 500 },
 *   stable: 3500
 * });
 * // Returns segments with proper LP pair attribution
 * ```
 */
export function mapBacktestToUnified(
  data: BacktestConstituentsSource
): UnifiedSegment[] {
  // Calculate total portfolio value
  const spotTotal = getRecordTotal(data.spot);
  const lpTotal = getRecordTotal(data.lp);
  const total = spotTotal + lpTotal + data.stable;

  if (total === 0) {
    return [];
  }

  // Extract individual asset values
  const btcSpot = getRecordValue(data.spot, "btc");
  const btcLp = getRecordValue(data.lp, "btc");
  const ethSpot = getRecordValue(data.spot, "eth");
  const ethLp = getRecordValue(data.lp, "eth");

  // Calculate "others" as anything not explicitly BTC or ETH
  const othersSpot =
    typeof data.spot === "number"
      ? data.spot // When spot is a number, it's all "others"
      : spotTotal - btcSpot - ethSpot;

  const othersLp =
    typeof data.lp === "number"
      ? data.lp // When lp is a number, it's all "others"
      : lpTotal - btcLp - ethLp;

  const segments: UnifiedSegment[] = [
    createSegment("btc", (btcSpot / total) * 100),
    createSegment("btc-stable", (btcLp / total) * 100),
    createSegment("stable", (data.stable / total) * 100),
    // ALT = ETH spot + ETH LP + other spot + other LP
    createSegment(
      "alt",
      ((ethSpot + ethLp + othersSpot + othersLp) / total) * 100
    ),
  ];

  return normalizeSegments(segments);
}

/**
 * Maps legacy AllocationConstituent array to unified segments.
 *
 * Useful for migrating existing components that use AllocationConstituent[].
 * Maps based on symbol name matching.
 *
 * @example
 * ```ts
 * const segments = mapLegacyConstituentsToUnified([
 *   { symbol: 'BTC', value: 50, color: '#F7931A' },
 *   { symbol: 'ETH', value: 30, color: '#627EEA' },
 * ], 20); // 20% stables
 * ```
 */
export function mapLegacyConstituentsToUnified(
  cryptoAssets: LegacyAllocationConstituent[],
  stablePercentage: number
): UnifiedSegment[] {
  let btcTotal = 0;
  let altTotal = 0;

  for (const asset of cryptoAssets) {
    const symbol = asset.symbol.toUpperCase();

    // Match BTC and BTC-wrapped variants
    if (
      symbol === "BTC" ||
      symbol === "WBTC" ||
      symbol === "CBBTC" ||
      symbol === "TBTC"
    ) {
      btcTotal += asset.value;
    } else {
      // Everything else (ETH, SOL, etc.) goes to ALT
      altTotal += asset.value;
    }
  }

  const segments: UnifiedSegment[] = [
    createSegment("btc", btcTotal),
    createSegment("stable", stablePercentage),
    createSegment("alt", altTotal),
    // Note: BTC-STABLE not available from legacy format (no LP breakdown)
  ];

  return normalizeSegments(segments);
}

/**
 * Calculates the total percentage of all segments.
 * Useful for validation - should equal ~100.
 */
export function calculateTotalPercentage(segments: UnifiedSegment[]): number {
  return segments.reduce((sum, s) => sum + s.percentage, 0);
}

/**
 * Gets a human-readable summary of the allocation.
 *
 * @example
 * ```ts
 * getAllocationSummary(segments);
 * // Returns: "BTC 40%, BTC-STABLE 20%, STABLE 25%, ALT 15%"
 * ```
 */
export function getAllocationSummary(segments: UnifiedSegment[]): string {
  return segments.map(s => `${s.label} ${s.percentage.toFixed(0)}%`).join(", ");
}
