/**
 * Wallet Portfolio State Factories
 *
 * Factory functions for creating loading, error, and empty states.
 * These factories provide consistent state objects used by multiple
 * consumers (BundlePageClient, WalletPortfolio).
 *
 * Separating state creation from transformation logic improves:
 * - Testability (isolated state creation logic)
 * - Reusability (shared by multiple components)
 * - Consistency (single source of truth for initial states)
 */

import { DEFAULT_REGIME, ZERO_ALLOCATION } from "./constants";
import type { WalletPortfolioDataWithDirection } from "./types";

/**
 * Create loading state for wallet portfolio data
 *
 * Used when portfolio data is being fetched from API.
 * All numeric values default to 0/neutral, isLoading is true.
 */
export function createWalletPortfolioLoadingState(): WalletPortfolioDataWithDirection {
  return {
    balance: 0,
    roi: 0,
    roiChange7d: 0,
    roiChange30d: 0,
    sentimentValue: 50, // Neutral sentiment
    sentimentStatus: "Neutral",
    sentimentQuote: "",
    currentRegime: DEFAULT_REGIME,
    previousRegime: null,
    strategyDirection: "default",
    regimeDuration: null,
    currentAllocation: ZERO_ALLOCATION,
    targetAllocation: { crypto: 50, stable: 50 }, // Neutral 50/50 split
    delta: 0,
    positions: 0,
    protocols: 0,
    chains: 0,
    isLoading: true,
    hasError: false,
  };
}

/**
 * Create error state for wallet portfolio data
 *
 * Used when portfolio data fetch fails.
 * Extends loading state but with isLoading=false and hasError=true.
 */
export function createWalletPortfolioErrorState(): WalletPortfolioDataWithDirection {
  return {
    ...createWalletPortfolioLoadingState(),
    isLoading: false,
    hasError: true,
  };
}
