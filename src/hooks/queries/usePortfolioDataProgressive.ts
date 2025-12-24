/**
 * Progressive Portfolio Data Hook
 *
 * Exposes section-specific loading states for progressive rendering.
 * Each dashboard section can render independently as its data becomes available.
 *
 * Sections:
 * - Balance: Requires landing data only
 * - Composition: Requires landing data only
 * - Strategy: Requires landing + sentiment + regime history
 * - Sentiment: Requires sentiment data only (independent)
 */

import { calculateAllocation } from "@/adapters/portfolio/allocationAdapter";
import { getRegimeStrategyInfo, getTargetAllocation } from "@/adapters/portfolio/regimeAdapter";
import { processSentimentData } from "@/adapters/portfolio/sentimentAdapter";
import {
    transformToWalletPortfolioDataWithDirection,
    type WalletPortfolioDataWithDirection,
} from "@/adapters/walletPortfolioDataAdapter";
import { useRegimeHistory, type RegimeHistoryData } from "@/services/regimeHistoryService";
import { useSentimentData, type MarketSentimentData } from "@/services/sentimentService";
import type {
    BalanceData,
    CompositionData,
    DashboardProgressiveState,
    SentimentData,
    StrategyData,
} from "@/types/portfolio-progressive";

import { useLandingPageData } from "./usePortfolioQuery";

/**
 * Extract ROI changes from landing page data
 * Replicates logic from walletPortfolioDataAdapter
 */
function extractROIChanges(landingData: {
  portfolio_roi: {
    windows?: Record<string, { value: number }>;
    roi_7d?: { value: number };
    roi_30d?: { value: number };
  };
}): {
  change7d: number;
  change30d: number;
} {
  const roiData = landingData.portfolio_roi;

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

/**
 * Count unique protocols in pool details
 */
function countUniqueProtocols(
  poolDetails: { protocol_id: string }[]
): number {
  const uniqueProtocols = new Set(poolDetails.map((pool) => pool.protocol_id));
  return uniqueProtocols.size;
}

/**
 * Count unique chains in pool details
 */
function countUniqueChains(poolDetails: { chain: string }[]): number {
  const uniqueChains = new Set(poolDetails.map((pool) => pool.chain));
  return uniqueChains.size;
}

/**
 * Extract balance section data from landing response
 * Note: Uses 'any' for landing type since the actual landing response has complex nested types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBalanceData(landing: any): BalanceData {
  const roiChanges = extractROIChanges(landing);

  return {
    balance: landing.net_portfolio_value ?? 0,
    roi: landing.portfolio_roi?.recommended_yearly_roi ?? 0,
    roiChange7d: roiChanges.change7d,
    roiChange30d: roiChanges.change30d,
  };
}

/**
 * Extract composition section data from landing response
 * Note: Uses 'any' for landing type since the actual landing response has complex nested types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCompositionData(landing: any): CompositionData {
  const currentAllocation = calculateAllocation(landing);
  
  // Use imported utilities
  const sentimentInfo = processSentimentData(null); // Fallback to neutral for composition which is acceptable
  const targetAllocation = getTargetAllocation(sentimentInfo.regime);

  const delta = Math.abs(currentAllocation.crypto - targetAllocation.crypto);

  return {
    currentAllocation,
    targetAllocation,
    delta,
    positions: landing.pool_details?.length ?? 0,
    protocols: countUniqueProtocols(landing.pool_details ?? []),
    chains: countUniqueChains(landing.pool_details ?? []),
  };
}

/**
 * Combine strategy data from all sources
 */
function combineStrategyData(
  landingData: unknown | undefined,
  sentimentData: MarketSentimentData | undefined,
  regimeHistoryData: RegimeHistoryData | undefined
): StrategyData | null {
  if (!landingData) return null;

  // Process sentiment (with fallback to neutral if undefined)
  // If strict independent loading is required, this might be adjusted, 
  // but StrategyCard traditionally needs some strategy to display.
  // For V2 independent sentiment, the StrategyCard will handle nullish parts gracefully.
  const sentimentInfo = processSentimentData(sentimentData ?? null);

  // Get target allocation for current regime
  const targetAllocation = getTargetAllocation(sentimentInfo.regime);

  // Get regime history info (with defaults if unavailable)
  const strategyInfo = getRegimeStrategyInfo(regimeHistoryData ?? null);

  return {
    currentRegime: sentimentInfo.regime,
    sentimentValue: sentimentData?.value ?? null,
    sentimentStatus: sentimentInfo.status,
    sentimentQuote: sentimentInfo.quote,
    targetAllocation,
    strategyDirection: strategyInfo.strategyDirection,
    previousRegime: strategyInfo.previousRegime,
    hasSentiment: !!sentimentData,
    hasRegimeHistory: !!regimeHistoryData,
  };
}

/**
 * Extract sentiment section data
 */
function extractSentimentData(sentiment: {
  value: number;
  status: string;
  quote: { quote: string };
}): SentimentData {
  return {
    value: sentiment.value,
    status: sentiment.status,
    quote: sentiment.quote.quote,
  };
}

/**
 * Progressive portfolio data hook
 *
 * Composes existing hooks and exposes section-specific states.
 * Allows each dashboard section to render independently.
 *
 * @param userId - User wallet address or user ID
 * @returns Section states with loading/error information
 */
export function usePortfolioDataProgressive(
  userId: string
): DashboardProgressiveState {
  // Fetch data from independent sources
  const landingQuery = useLandingPageData(userId);
  const sentimentQuery = useSentimentData();
  const regimeQuery = useRegimeHistory();

  // 1. Balance Section (Depends only on Landing)
  const balanceSection = {
    data: landingQuery.data ? extractBalanceData(landingQuery.data) : null,
    isLoading: landingQuery.isLoading,
    error: landingQuery.error as Error | null,
  };

  // 2. Composition Section (Depends only on Landing, uses static sentiment fallback)
  const compositionSection = {
    data: landingQuery.data ? extractCompositionData(landingQuery.data) : null,
    isLoading: landingQuery.isLoading,
    error: landingQuery.error as Error | null,
  };

  // 3. Strategy Section (Depends on Landing + Sentiment + Regime)
  // Logic: Strategy needs landing data to exist basically. 
  // Sentiment and Regime are technically optional but usually preferred.
  // We'll mark it loading if landing is loading.
  const strategySection = {
    data: combineStrategyData(
      landingQuery.data,
      sentimentQuery.data,
      regimeQuery.data
    ),
    isLoading: landingQuery.isLoading || sentimentQuery.isLoading || regimeQuery.isLoading,
    error: (landingQuery.error || sentimentQuery.error || regimeQuery.error) as Error | null,
  };

  // 4. Independent Sentiment Section (Depends only on Sentiment)
  const sentimentSection = {
    data: sentimentQuery.data ? extractSentimentData(sentimentQuery.data) : null,
    isLoading: sentimentQuery.isLoading,
    error: sentimentQuery.error as Error | null,
  };

  // Legacy Unified Data (for backward compatibility)
  const unifiedData: WalletPortfolioDataWithDirection | null =
    landingQuery.data
      ? transformToWalletPortfolioDataWithDirection(
          landingQuery.data,
          sentimentQuery.data ?? null,
          regimeQuery.data ?? null
        )
      : null;

  const refetchAll = async () => {
    await Promise.all([
      landingQuery.refetch(),
      sentimentQuery.refetch(),
      regimeQuery.refetch(),
    ]);
  };

  return {
    unifiedData,
    sections: {
      balance: balanceSection,
      composition: compositionSection,
      strategy: strategySection,
      sentiment: sentimentSection,
    },
    isLoading:
      landingQuery.isLoading ||
      sentimentQuery.isLoading ||
      regimeQuery.isLoading,
    error:
      (landingQuery.error as Error) ||
      (sentimentQuery.error as Error) ||
      (regimeQuery.error as Error) ||
      null,
    refetch: refetchAll,
  };
}
