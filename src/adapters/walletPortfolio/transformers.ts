/**
 * Wallet Portfolio Transformers
 *
 * Main transformation orchestration layer that converts API responses
 * (landing page, sentiment) into wallet portfolio data format.
 *
 * This is a thin orchestration layer that delegates heavy lifting to
 * calculator functions for better testability and maintainability.
 */

import {
  getRegimeAllocation,
  getRegimeById,
  type RegimeId,
} from "@/components/wallet/regime/regimeData";
import { getRegimeFromSentiment } from "@/lib/regimeMapper";
import type { LandingPageResponse } from "@/schemas/api/analyticsSchemas";
import type { MarketSentimentData } from "@/services/sentimentService";

import {
  calculateAllocation,
  calculateDelta,
  extractROIChanges,
} from "./calculators";
import { DEFAULT_REGIME } from "./constants";
import type { WalletPortfolioData } from "./types";

/**
 * Transform API responses into wallet portfolio data format
 *
 * Orchestrates the complete transformation pipeline:
 * 1. Determine current regime from sentiment data
 * 2. Get target allocation for the regime
 * 3. Calculate current allocation from portfolio data
 * 4. Calculate allocation drift (delta)
 * 5. Extract ROI metrics
 * 6. Assemble complete wallet portfolio data structure
 *
 * @param landingData - Portfolio landing page data from API
 * @param sentimentData - Market sentiment data (optional)
 * @returns Complete wallet portfolio data
 */
export function transformToWalletPortfolioData(
  landingData: LandingPageResponse,
  sentimentData?: MarketSentimentData | null
): WalletPortfolioData {
  // Determine current regime from sentiment
  const currentRegime: RegimeId = sentimentData
    ? getRegimeFromSentiment(sentimentData.value)
    : DEFAULT_REGIME;

  // Get regime configuration for target allocation
  const regimeConfig = getRegimeById(currentRegime);
  const regimeAllocation = getRegimeAllocation(regimeConfig);
  const targetAllocation = {
    crypto: regimeAllocation.spot + regimeAllocation.lp,
    stable: regimeAllocation.stable,
  };

  // Calculate current allocation from portfolio data
  const currentAllocation = calculateAllocation(landingData);

  // Calculate allocation drift
  const delta = calculateDelta(
    currentAllocation.crypto,
    targetAllocation.crypto
  );

  // Extract ROI change metrics
  const { roiChange7d, roiChange30d } = extractROIChanges(landingData);

  return {
    // Portfolio metrics
    balance: landingData.net_portfolio_value ?? 0,
    roi: landingData.portfolio_roi.recommended_yearly_roi,
    roiChange7d,
    roiChange30d,

    // Regime & sentiment
    sentimentValue: sentimentData?.value ?? 50, // Default to neutral (50)
    sentimentStatus: sentimentData?.status ?? "Neutral",
    sentimentQuote: sentimentData?.quote.quote ?? "",
    currentRegime,

    // Allocations
    currentAllocation,
    targetAllocation,
    delta,

    // Portfolio details
    positions:
      landingData.total_positions ?? landingData.pool_details?.length ?? 0,
    protocols: landingData.protocols_count ?? 0,
    chains: landingData.chains_count ?? 0,

    // State
    isLoading: false,
    hasError: false,
  };
}
