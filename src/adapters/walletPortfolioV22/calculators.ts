/**
 * V22 Portfolio Calculators
 *
 * Pure calculation functions for portfolio allocations and metrics.
 * These functions transform landing page API responses into structured
 * allocation data with proper percentages and constituent breakdowns.
 *
 * Key Features:
 * - Division by zero protection
 * - Constituent builder functions for testability
 * - Separation of concerns (each function has single responsibility)
 */

import type { LandingPageResponse } from "@/schemas/api/analyticsSchemas";

import { ASSET_COLORS, DEFAULT_STABLE_SPLIT, ZERO_ALLOCATION } from "./constants";
import type { AllocationConstituent, V22AllocationData } from "./types";

/**
 * Calculate total assets from landing page data
 *
 * @internal - Used by other calculator functions
 */
function calculateTotalAssets(landingData: LandingPageResponse): number {
  const { portfolio_allocation } = landingData;
  return (
    portfolio_allocation.btc.total_value +
    portfolio_allocation.eth.total_value +
    portfolio_allocation.others.total_value +
    portfolio_allocation.stablecoins.total_value
  );
}

/**
 * Calculate crypto/stable percentage split with totals
 *
 * Returns both percentages and absolute totals for use by constituent builders.
 */
export function calculateAllocationPercentages(
  landingData: LandingPageResponse
): { crypto: number; stable: number; cryptoTotal: number; stableTotal: number } {
  const { portfolio_allocation } = landingData;
  const totalAssets = calculateTotalAssets(landingData);

  if (totalAssets === 0) {
    return { crypto: 0, stable: 0, cryptoTotal: 0, stableTotal: 0 };
  }

  const cryptoTotal =
    portfolio_allocation.btc.total_value +
    portfolio_allocation.eth.total_value +
    portfolio_allocation.others.total_value;
  const stableTotal = portfolio_allocation.stablecoins.total_value;

  return {
    crypto: (cryptoTotal / totalAssets) * 100,
    stable: (stableTotal / totalAssets) * 100,
    cryptoTotal,
    stableTotal,
  };
}

/**
 * Build crypto asset constituents (BTC, ETH, Others)
 *
 * Creates allocation breakdown for crypto assets with percentages
 * relative to total crypto value. Only includes assets with non-zero values.
 *
 * @param landingData - Portfolio data from API
 * @param cryptoTotal - Total crypto value for percentage calculations
 */
export function buildCryptoConstituents(
  landingData: LandingPageResponse,
  cryptoTotal: number
): AllocationConstituent[] {
  const { portfolio_allocation } = landingData;
  const constituents: AllocationConstituent[] = [];

  if (cryptoTotal === 0) return constituents;

  if (portfolio_allocation.btc.total_value > 0) {
    constituents.push({
      asset: "BTC",
      symbol: "BTC",
      name: "Bitcoin",
      value: (portfolio_allocation.btc.total_value / cryptoTotal) * 100,
      color: ASSET_COLORS.BTC,
    });
  }

  if (portfolio_allocation.eth.total_value > 0) {
    constituents.push({
      asset: "ETH",
      symbol: "ETH",
      name: "Ethereum",
      value: (portfolio_allocation.eth.total_value / cryptoTotal) * 100,
      color: ASSET_COLORS.ETH,
    });
  }

  if (portfolio_allocation.others.total_value > 0) {
    constituents.push({
      asset: "Others",
      symbol: "ALT",
      name: "Altcoins",
      value: (portfolio_allocation.others.total_value / cryptoTotal) * 100,
      color: ASSET_COLORS.ALT,
    });
  }

  return constituents;
}

/**
 * Build stablecoin constituents (USDC, USDT with estimated split)
 *
 * NOTE: Backend returns aggregated stablecoin totals without breakdown.
 * Using DEFAULT_STABLE_SPLIT (60/40 USDC/USDT) until API is updated.
 *
 * @param _landingData - Portfolio data (unused but kept for future API support)
 * @param stableTotal - Total stablecoin value
 */
export function buildStableConstituents(
  _landingData: LandingPageResponse,
  stableTotal: number
): AllocationConstituent[] {
  if (stableTotal === 0) return [];

  // NOTE: Using estimated split until backend provides actual breakdown
  return [
    {
      asset: "USDC",
      symbol: "USDC",
      name: "USD Coin",
      value: DEFAULT_STABLE_SPLIT.USDC,
      color: ASSET_COLORS.USDC,
    },
    {
      asset: "USDT",
      symbol: "USDT",
      name: "Tether",
      value: DEFAULT_STABLE_SPLIT.USDT,
      color: ASSET_COLORS.USDT,
    },
  ];
}

/**
 * Build simplified crypto for composition bar
 *
 * Creates asset breakdown with percentages relative to TOTAL portfolio
 * (not just crypto total). Used for the composition bar visualization.
 *
 * @param landingData - Portfolio data from API
 * @param totalAssets - Total portfolio value for percentage calculations
 */
export function buildSimplifiedCrypto(
  landingData: LandingPageResponse,
  totalAssets: number
): AllocationConstituent[] {
  const { portfolio_allocation } = landingData;
  const simplified: AllocationConstituent[] = [];

  if (totalAssets === 0) return simplified;

  const btcPercent =
    (portfolio_allocation.btc.total_value / totalAssets) * 100;
  const ethPercent =
    (portfolio_allocation.eth.total_value / totalAssets) * 100;
  const othersPercent =
    (portfolio_allocation.others.total_value / totalAssets) * 100;

  if (btcPercent > 0) {
    simplified.push({
      asset: "BTC",
      symbol: "BTC",
      name: "Bitcoin",
      value: btcPercent,
      color: ASSET_COLORS.BTC,
    });
  }

  if (ethPercent > 0) {
    simplified.push({
      asset: "ETH",
      symbol: "ETH",
      name: "Ethereum",
      value: ethPercent,
      color: ASSET_COLORS.ETH,
    });
  }

  if (othersPercent > 0) {
    simplified.push({
      asset: "ALT",
      symbol: "ALT",
      name: "Altcoins",
      value: othersPercent,
      color: ASSET_COLORS.ALT,
    });
  }

  return simplified;
}

/**
 * Main allocation calculator (orchestrates all constituent builders)
 *
 * Calculates complete allocation structure including:
 * - Crypto/stable percentage split
 * - Detailed constituent breakdowns
 * - Simplified crypto for composition visualization
 *
 * @param landingData - Portfolio landing page data from API
 * @returns Complete allocation data structure
 */
export function calculateAllocation(
  landingData: LandingPageResponse
): V22AllocationData {
  const totalAssets = calculateTotalAssets(landingData);

  // Early return for empty portfolio (prevents division by zero)
  if (totalAssets === 0) {
    return ZERO_ALLOCATION;
  }

  const { crypto, stable, cryptoTotal, stableTotal } =
    calculateAllocationPercentages(landingData);

  return {
    crypto,
    stable,
    constituents: {
      crypto: buildCryptoConstituents(landingData, cryptoTotal),
      stable: buildStableConstituents(landingData, stableTotal),
    },
    simplifiedCrypto: buildSimplifiedCrypto(landingData, totalAssets),
  };
}

/**
 * Extract ROI change values from landing page data
 *
 * Safely extracts 7-day and 30-day ROI changes with fallback to 0
 * for missing data.
 */
export function extractROIChanges(landingData: LandingPageResponse): {
  roiChange7d: number;
  roiChange30d: number;
} {
  const windows = landingData.portfolio_roi.windows;

  return {
    roiChange7d: windows?.["7d"]?.value ?? 0,
    roiChange30d: windows?.["30d"]?.value ?? 0,
  };
}

/**
 * Calculate allocation delta (drift from target)
 *
 * Measures how far current allocation has drifted from target.
 * Used to determine when rebalancing is needed.
 *
 * @param currentCrypto - Current crypto allocation percentage
 * @param targetCrypto - Target crypto allocation percentage
 * @returns Absolute difference between current and target
 */
export function calculateDelta(
  currentCrypto: number,
  targetCrypto: number
): number {
  return Math.abs(currentCrypto - targetCrypto);
}
