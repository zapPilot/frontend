/**
 * Portfolio Analytics Utilities
 *
 * Utility functions for transforming portfolio data for analytics and chart visualization.
 * Originally from PortfolioChart component module, migrated for broader reuse.
 *
 * @module lib/analytics/portfolio-utils
 */

import type {
  AllocationTimeseriesInputPoint,
  PortfolioStackedDataPoint,
} from "@/types/analytics";
import type {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "@/types/domain/portfolio";
import { ensureNonNegative } from "@/utils/mathUtils";

/**
 * Default ratio for DeFi vs Wallet when source type data is unavailable
 * 65% DeFi / 35% Wallet is a reasonable default for most DeFi portfolios
 */
export const DEFAULT_STACKED_FALLBACK_RATIO = 0.65;

/**
 * Source totals for DeFi and Wallet breakdown
 */
interface SourceTotals {
  defiValue: number;
  walletValue: number;
}

/**
 * Normalize source type string to lowercase for consistent comparison
 */
function normalizeSourceType(value: unknown): string | undefined {
  return typeof value === "string" ? value.toLowerCase() : undefined;
}

/**
 * Accumulate source totals from categories or protocols arrays
 * Sums up DeFi and Wallet values based on sourceType field
 */
function accumulateSourceTotals(
  entries: PortfolioDataPoint["categories"] | PortfolioDataPoint["protocols"]
): SourceTotals {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { defiValue: 0, walletValue: 0 };
  }

  return entries.reduce<SourceTotals>(
    (totals, entry) => {
      const normalizedSource = normalizeSourceType(entry.sourceType);
      const rawValue = entry.value;
      const value = Number.isFinite(rawValue) ? ensureNonNegative(rawValue) : 0;

      if (normalizedSource === "defi") {
        totals.defiValue += value;
      } else if (normalizedSource === "wallet") {
        totals.walletValue += value;
      }

      return totals;
    },
    { defiValue: 0, walletValue: 0 }
  );
}

/**
 * Normalize stacked totals to match the total portfolio value
 * Handles scaling, fallback ratios, and edge cases
 */
function normalizeStackedTotals(
  totalValue: number,
  initialDefi: number,
  initialWallet: number,
  fallbackRatio: number
): SourceTotals & { stackedTotalValue: number } {
  let defiValue = initialDefi;
  let walletValue = initialWallet;
  let stackedTotalValue = defiValue + walletValue;

  // Scale DeFi/Wallet values to match total if both are present
  if (stackedTotalValue > 0 && totalValue > 0) {
    const scale = totalValue / stackedTotalValue;
    defiValue *= scale;
    walletValue *= scale;
    stackedTotalValue = defiValue + walletValue;
  }

  // Fallback: use deterministic split if source data is missing
  if (stackedTotalValue === 0 && totalValue > 0) {
    const fallbackDefi = totalValue * fallbackRatio;
    defiValue = fallbackDefi;
    walletValue = ensureNonNegative(totalValue - fallbackDefi);
    stackedTotalValue = defiValue + walletValue;
  }

  // Final fallback: use total value as stacked total
  if (stackedTotalValue === 0) {
    stackedTotalValue = ensureNonNegative(totalValue);
  }

  return { defiValue, walletValue, stackedTotalValue };
}

/**
 * Builds stacked portfolio data using real protocol source types.
 * Falls back to a deterministic split when source data is unavailable.
 *
 * @param data - Raw portfolio data points
 * @param fallbackRatio - Ratio for DeFi vs Wallet fallback (default 0.65)
 * @returns Portfolio data with DeFi/Wallet breakdown for stacked charts
 *
 * @example
 * ```ts
 * const stackedData = buildStackedPortfolioData(portfolioHistory);
 * // Returns: [{ date, value, defiValue, walletValue, stackedTotalValue, ... }]
 * ```
 */
export function buildStackedPortfolioData(
  data: PortfolioDataPoint[],
  fallbackRatio: number = DEFAULT_STACKED_FALLBACK_RATIO
): PortfolioStackedDataPoint[] {
  return data.map(point => {
    // Try to get source totals from categories first
    const categoryTotals = accumulateSourceTotals(point.categories);

    // Fall back to protocols if categories didn't have source types
    const protocolTotals =
      categoryTotals.defiValue === 0 && categoryTotals.walletValue === 0
        ? accumulateSourceTotals(point.protocols)
        : { defiValue: 0, walletValue: 0 };

    // Combine totals from both sources
    const initialDefi = categoryTotals.defiValue + protocolTotals.defiValue;
    const initialWallet =
      categoryTotals.walletValue + protocolTotals.walletValue;

    // Normalize to match total portfolio value
    const normalizedTotals = normalizeStackedTotals(
      point.value,
      initialDefi,
      initialWallet,
      fallbackRatio
    );

    return {
      ...point,
      defiValue: normalizedTotals.defiValue,
      walletValue: normalizedTotals.walletValue,
      stackedTotalValue: normalizedTotals.stackedTotalValue,
    } satisfies PortfolioStackedDataPoint;
  });
}

/**
 * Get the total stacked value for a portfolio data point
 * Prefers stackedTotalValue, falls back to sum of components, then raw value
 *
 * @param point - Stacked portfolio data point
 * @returns Total portfolio value
 */
export function getStackedTotalValue(
  point: PortfolioStackedDataPoint
): number {
  if (point.stackedTotalValue > 0) {
    return point.stackedTotalValue;
  }

  const fallback = point.defiValue + point.walletValue;
  return fallback > 0 ? fallback : point.value;
}

/**
 * Build allocation history from timeseries input points
 * Aggregates allocation percentages by date and normalizes to 100%
 *
 * Supports multiple API field naming conventions:
 * - allocation_percentage, percentage_of_portfolio, percentage
 * - category_value_usd, category_value
 * - total_portfolio_value_usd, total_value
 *
 * @param rawPoints - Raw allocation timeseries data from API
 * @returns Aggregated allocation history with BTC/ETH/Stablecoin/Altcoin percentages
 *
 * @example
 * ```ts
 * const allocations = buildAllocationHistory(apiResponse.allocations);
 * // Returns: [{ date, btc: 25, eth: 30, stablecoin: 20, altcoin: 25 }]
 * ```
 */
export function buildAllocationHistory(
  rawPoints: AllocationTimeseriesInputPoint[]
): AssetAllocationPoint[] {
  if (rawPoints.length === 0) {
    return [];
  }

  // Group by date and aggregate allocations
  const allocationByDate: Record<string, AssetAllocationPoint> = {};

  for (const point of rawPoints) {
    const dateKey = point.date;
    const dayData =
      allocationByDate[dateKey] ??
      (allocationByDate[dateKey] = {
        date: dateKey,
        btc: 0,
        eth: 0,
        stablecoin: 0,
        altcoin: 0,
      });

    // Normalize category/protocol name to lowercase
    const categoryKey = (point.category ?? point.protocol ?? "")
      .toString()
      .toLowerCase();

    // Extract percentage value from various field naming conventions
    const percentageValue = Number(
      point.allocation_percentage ??
        point.percentage_of_portfolio ??
        point.percentage ??
        0
    );

    // Extract category and total values for fallback calculation
    const categoryValue = Number(
      point.category_value_usd ?? point.category_value ?? 0
    );
    const totalValue = Number(
      point.total_portfolio_value_usd ?? point.total_value ?? 0
    );

    // Compute share: use percentage if available, else calculate from values
    let computedShare = 0;
    if (!Number.isNaN(percentageValue) && percentageValue !== 0) {
      computedShare = percentageValue;
    } else if (totalValue > 0 && !Number.isNaN(categoryValue)) {
      computedShare = (categoryValue / totalValue) * 100;
    }

    // Filter out negative allocations (debt positions) and invalid values
    // Debt positions should not be included in asset allocation chart
    // They are tracked separately in LandingPageResponse.category_summary_debt
    if (!Number.isFinite(computedShare) || computedShare <= 0) {
      continue;
    }

    // Categorize by asset type
    if (categoryKey.includes("btc") || categoryKey.includes("bitcoin")) {
      dayData.btc += computedShare;
    } else if (
      categoryKey.includes("eth") ||
      categoryKey.includes("ethereum")
    ) {
      dayData.eth += computedShare;
    } else if (categoryKey.includes("stable")) {
      dayData.stablecoin += computedShare;
    } else {
      dayData.altcoin += computedShare;
    }
  }

  // Normalize to 100% and sort by date
  return Object.values(allocationByDate)
    .map(point => {
      const total = point.btc + point.eth + point.stablecoin + point.altcoin;

      // Skip normalization if total is zero or negative
      if (total <= 0) {
        return point;
      }

      // Normalize each category to sum to 100%
      return {
        ...point,
        btc: (point.btc / total) * 100,
        eth: (point.eth / total) * 100,
        stablecoin: (point.stablecoin / total) * 100,
        altcoin: (point.altcoin / total) * 100,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
