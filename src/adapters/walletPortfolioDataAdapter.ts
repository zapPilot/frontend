/**
 * Portfolio Data Adapter
 *
 * Transforms API responses from analyticsService and sentimentService
 * into the wallet portfolio data structure.
 *
 * Orchestrates sub-adapters for specific domain logic:
 * - allocationAdapter: Portfolio math and constituent checking
 * - regimeAdapter: Regime targets and history
 * - sentimentAdapter: Sentiment value and text processing
 */

import {
  type AllocationConstituent,
  calculateAllocation,
  calculateDelta,
} from "@/adapters/portfolio/allocationAdapter";
import {
  getRegimeStrategyInfo,
  getTargetAllocation,
} from "@/adapters/portfolio/regimeAdapter";
import { processSentimentData } from "@/adapters/portfolio/sentimentAdapter";
import type { RegimeId } from "@/components/wallet/regime/regimeData";
import { GHOST_MODE_PREVIEW } from "@/constants/ghostModeData";
import { getDefaultQuoteForRegime } from "@/constants/regimes";
import { getRegimeFromSentiment } from "@/lib/domain/regimeMapper";
import type {
  DirectionType,
  DurationInfo,
} from "@/schemas/api/regimeHistorySchemas";
import type { LandingPageResponse } from "@/services/analyticsService";
import type { RegimeHistoryData } from "@/services/regimeHistoryService";
import type { MarketSentimentData } from "@/services/sentimentService";

// Re-export ASSET_COLORS for components that might use it from different paths
// (Ideally components should import from @/constants/assets directly, but this keeps backwards compat if needed)
export { ASSET_COLORS } from "@/constants/assets";

// Re-export AllocationConstituent from canonical source (allocationAdapter)
// This eliminates the duplicate interface definition
export type { AllocationConstituent } from "@/adapters/portfolio/allocationAdapter";

/**
 * Wallet Portfolio Data Structure
 * Matches the structure expected by WalletPortfolioPresenter
 */
interface WalletPortfolioData {
  // Portfolio metrics
  balance: number;
  roi: number;
  roiChange7d: number;
  roiChange30d: number;

  // Market sentiment
  sentimentValue: number;
  sentimentStatus: string;
  sentimentQuote: string;

  // Regime data
  currentRegime: RegimeId;

  // Allocations
  currentAllocation: {
    crypto: number;
    stable: number;
    constituents: {
      crypto: AllocationConstituent[];
      stable: AllocationConstituent[];
    };
    simplifiedCrypto: AllocationConstituent[];
  };
  targetAllocation: {
    crypto: number;
    stable: number;
  };
  delta: number;

  // Portfolio details
  positions: number;
  protocols: number;
  chains: number;

  // Loading states
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Wallet Portfolio Data with Directional Strategy Support
 *
 * Extends WalletPortfolioData with regime transition context for
 * directional portfolio visualization and strategy guidance.
 */
export interface WalletPortfolioDataWithDirection extends WalletPortfolioData {
  // Regime history fields
  /** Previous regime for context (null if no history) */
  previousRegime: RegimeId | null;
  /** Computed strategy direction (fromLeft/fromRight/default) */
  strategyDirection: DirectionType;
  /** Duration in current regime */
  regimeDuration: DurationInfo;
}

/**
 * Transforms Landing Page Response and Sentiment Data into wallet portfolio data
 *
 * @param landingData - Portfolio data from /api/v2/portfolio/{userId}/landing
 * @param sentimentData - Market sentiment from /api/v2/market/sentiment
 * @returns Portfolio data structure
 */
export function transformToWalletPortfolioData(
  landingData: LandingPageResponse,
  sentimentData: MarketSentimentData | null
): WalletPortfolioData {
  // Process sentiment
  const sentimentInfo = processSentimentData(sentimentData);

  // Get target allocation for current regime
  const targetAllocation = getTargetAllocation(sentimentInfo.regime);

  // Calculate current allocation from portfolio data
  const currentAllocation = calculateAllocation(landingData);

  // Calculate drift (delta) between current and target allocation
  const delta = calculateDelta(
    currentAllocation.crypto,
    targetAllocation.crypto
  );

  // Extract ROI changes
  const roiChanges = extractROIChanges(landingData);

  return {
    // Portfolio metrics
    balance: landingData.net_portfolio_value ?? 0,
    roi: landingData.portfolio_roi.recommended_yearly_roi,
    roiChange7d: roiChanges.change7d,
    roiChange30d: roiChanges.change30d,

    // Market sentiment
    sentimentValue: sentimentInfo.value,
    sentimentStatus: sentimentInfo.status,
    sentimentQuote: sentimentInfo.quote,

    // Regime
    currentRegime: sentimentInfo.regime,

    // Allocations
    currentAllocation,
    targetAllocation,
    delta,

    // Portfolio details
    positions: landingData.pool_details?.length ?? 0,
    protocols: countUniqueProtocols(landingData.pool_details ?? []),
    chains: countUniqueChains(landingData.pool_details ?? []),

    // Loading states
    isLoading: false,
    hasError: false,
  };
}

/**
 * Extracts ROI changes from landing page data
 */
function extractROIChanges(landingData: LandingPageResponse): {
  change7d: number;
  change30d: number;
} {
  const roiData = landingData.portfolio_roi;

  // Try to get from windows first
  let change7d = 0;
  let change30d = 0;

  if (roiData.windows) {
    change7d = roiData.windows["7d"]?.value ?? 0;
    change30d = roiData.windows["30d"]?.value ?? 0;
  } else {
    // Fallback to legacy fields
    change7d = roiData.roi_7d?.value ?? 0;
    change30d = roiData.roi_30d?.value ?? 0;
  }

  return { change7d, change30d };
}

function applyRegimeHistoryFields(
  baseData: WalletPortfolioData,
  regimeHistoryData: RegimeHistoryData | null
): WalletPortfolioDataWithDirection {
  const strategyInfo = getRegimeStrategyInfo(regimeHistoryData);

  return {
    ...baseData,
    ...strategyInfo,
  };
}

/**
 * Counts unique protocols in pool details
 */
function countUniqueProtocols(
  poolDetails: LandingPageResponse["pool_details"]
): number {
  const uniqueProtocols = new Set(poolDetails.map(pool => pool.protocol_id));
  return uniqueProtocols.size;
}

/**
 * Counts unique chains in pool details
 */
function countUniqueChains(
  poolDetails: LandingPageResponse["pool_details"]
): number {
  const uniqueChains = new Set(poolDetails.map(pool => pool.chain));
  return uniqueChains.size;
}

/**
 * Transforms Landing Page, Sentiment, and Regime History Data into wallet portfolio data with direction
 *
 * Enhanced version of transformToWalletPortfolioData that includes regime transition context
 * for directional strategy visualization.
 *
 * @param landingData - Portfolio data from /api/v2/portfolio/{userId}/landing
 * @param sentimentData - Market sentiment from /api/v2/market/sentiment
 * @param regimeHistoryData - Regime history from /api/v2/market/regime/history
 * @returns Portfolio data with directional strategy fields
 */
export function transformToWalletPortfolioDataWithDirection(
  landingData: LandingPageResponse,
  sentimentData: MarketSentimentData | null,
  regimeHistoryData: RegimeHistoryData | null
): WalletPortfolioDataWithDirection {
  // Start with base portfolio data
  const baseData = transformToWalletPortfolioData(landingData, sentimentData);

  return applyRegimeHistoryFields(baseData, regimeHistoryData);
}

/**
 * Creates an empty portfolio state with real sentiment data
 * Used for disconnected users to show intriguing market regime preview
 *
 * @param sentimentData - Real-time market sentiment from /api/v2/market/sentiment
 * @param regimeHistoryData - Regime history from /api/v2/market/regime/history
 * @returns Empty portfolio state with real sentiment and regime-based targets
 */
export function createEmptyPortfolioState(
  sentimentData: MarketSentimentData | null,
  regimeHistoryData: RegimeHistoryData | null
): WalletPortfolioDataWithDirection {
  const sentimentValue = sentimentData?.value ?? 50;
  const currentRegime = getRegimeFromSentiment(sentimentValue);
  const targetAllocation = getTargetAllocation(currentRegime);

  // Use Ghost Mode preview data for enticing visual preview
  // This shows unconnected users what their dashboard could look like
  const previewAllocation = {
    crypto: GHOST_MODE_PREVIEW.currentAllocation.crypto,
    stable: GHOST_MODE_PREVIEW.currentAllocation.stable,
    constituents: GHOST_MODE_PREVIEW.currentAllocation.constituents,
    simplifiedCrypto: GHOST_MODE_PREVIEW.currentAllocation.simplifiedCrypto,
  };

  const baseData: WalletPortfolioData = {
    // Portfolio metrics - use preview values for visual appeal
    balance: GHOST_MODE_PREVIEW.balance,
    roi: GHOST_MODE_PREVIEW.roi,
    roiChange7d: GHOST_MODE_PREVIEW.roiChange7d,
    roiChange30d: GHOST_MODE_PREVIEW.roiChange30d,

    // Market sentiment - REAL data
    sentimentValue,
    sentimentStatus: sentimentData?.status ?? "Neutral",
    sentimentQuote:
      sentimentData?.quote?.quote ?? getDefaultQuoteForRegime(currentRegime),

    // Regime - derived from REAL sentiment
    currentRegime,

    // Allocations - use preview for visual, real target from regime
    currentAllocation: previewAllocation,
    targetAllocation, // Real target from regime
    delta: GHOST_MODE_PREVIEW.delta,

    // Portfolio details - use preview values
    positions: GHOST_MODE_PREVIEW.positions,
    protocols: GHOST_MODE_PREVIEW.protocols,
    chains: GHOST_MODE_PREVIEW.chains,

    // States
    isLoading: false,
    hasError: false,
  };

  return applyRegimeHistoryFields(baseData, regimeHistoryData);
}

/**
 * Base state factory for creating placeholder states
 */
function createBaseState(
  overrides: Partial<WalletPortfolioData> = {}
): WalletPortfolioData {
  return {
    balance: 0,
    roi: 0,
    roiChange7d: 0,
    roiChange30d: 0,
    sentimentValue: 50,
    sentimentStatus: "Neutral",
    sentimentQuote: "",
    currentRegime: "n",
    currentAllocation: {
      crypto: 0,
      stable: 0,
      constituents: { crypto: [], stable: [] },
      simplifiedCrypto: [],
    },
    targetAllocation: { crypto: 0, stable: 0 },
    delta: 0,
    positions: 0,
    protocols: 0,
    chains: 0,
    isLoading: false,
    hasError: false,
    ...overrides,
  };
}

/**
 * Creates a loading state placeholder
 */
export function createWalletPortfolioLoadingState(): WalletPortfolioData {
  return createBaseState({ isLoading: true });
}

/**
 * Creates an error state placeholder
 */
export function createWalletPortfolioErrorState(): WalletPortfolioData {
  return createBaseState({
    sentimentValue: 0,
    sentimentStatus: "Error",
    hasError: true,
  });
}
