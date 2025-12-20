/**
 * V22 Portfolio Adapter Module
 *
 * Transforms API responses (landing page, sentiment, risk) into V22 portfolio data format.
 *
 * This module provides a complete toolkit for portfolio data transformation:
 * - **Type Definitions**: AllocationConstituent, V22AllocationData, V22PortfolioData
 * - **Color Constants**: ASSET_COLORS for consistent visualization
 * - **Allocation Calculators**: Pure functions for portfolio calculations
 * - **Data Transformers**: Main transformation orchestration
 * - **State Factories**: Loading/error state creators
 *
 * ## Usage Examples
 *
 * ```typescript
 * // Import types
 * import type { V22PortfolioData } from "@/adapters/walletPortfolioV22";
 *
 * // Import constants
 * import { ASSET_COLORS } from "@/adapters/walletPortfolioV22";
 *
 * // Import transformers
 * import { transformToV22Data, createV22LoadingState } from "@/adapters/walletPortfolioV22";
 *
 * // Transform API data
 * const portfolioData = transformToV22Data(landingData, sentimentData);
 *
 * // Create loading state
 * const loadingState = createV22LoadingState();
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
  V22AllocationData,
  V22PortfolioData,
  V22PortfolioDataWithDirection,
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
export { transformToV22Data } from "./transformers";

// ============================================================================
// State Factories
// ============================================================================
export { createV22ErrorState, createV22LoadingState } from "./stateFactories";
