/**
 * Wallet Portfolio Adapter Module
 *
 * Transforms API responses (landing page, sentiment, risk) into wallet portfolio data format.
 *
 * This module provides a complete toolkit for portfolio data transformation:
 * - **Type Definitions**: AllocationConstituent, WalletPortfolioAllocationData, WalletPortfolioData
 * - **Color Constants**: ASSET_COLORS for consistent visualization
 * - **Allocation Calculators**: Pure functions for portfolio calculations
 * - **Data Transformers**: Main transformation orchestration
 * - **State Factories**: Loading/error state creators
 *
 * ## Usage Examples
 *
 * ```typescript
 * // Import types
 * import type { WalletPortfolioData } from "@/adapters/walletPortfolio";
 *
 * // Import constants
 * import { ASSET_COLORS } from "@/adapters/walletPortfolio";
 *
 * // Import transformers
 * import { transformToWalletPortfolioData, createWalletPortfolioLoadingState } from "@/adapters/walletPortfolio";
 *
 * // Transform API data
 * const portfolioData = transformToWalletPortfolioData(landingData, sentimentData);
 *
 * // Create loading state
 * const loadingState = createWalletPortfolioLoadingState();
 * ```
 *
 * ## Module Structure
 *
 * - `types.ts` - Type definitions
 * - `constants.ts` - ASSET_COLORS, DEFAULT_STABLE_SPLIT, etc.
 * - `calculators.ts` - Pure calculation functions
 * - `transformers.ts` - Main transformation logic
 * - `stateFactories.ts` - Loading/error state creators
 */

// ============================================================================
// Types
// ============================================================================
export type {
  AllocationConstituent,
  WalletPortfolioAllocationData,
  WalletPortfolioData,
  WalletPortfolioDataWithDirection,
} from "./types";

// ============================================================================
// Constants
// ============================================================================
export {
  ASSET_COLORS,
  DEFAULT_REGIME,
  DEFAULT_STABLE_SPLIT,
  ZERO_ALLOCATION,
} from "./constants";

// ============================================================================
// Calculators
// ============================================================================
export {
  buildCryptoConstituents,
  buildSimplifiedCrypto,
  buildStableConstituents,
  calculateAllocation,
  calculateAllocationPercentages,
  calculateDelta,
  extractROIChanges,
} from "./calculators";

// ============================================================================
// Transformers
// ============================================================================
export { transformToWalletPortfolioData } from "./transformers";

// ============================================================================
// State Factories
// ============================================================================
export {
  createWalletPortfolioErrorState,
  createWalletPortfolioLoadingState,
} from "./stateFactories";
