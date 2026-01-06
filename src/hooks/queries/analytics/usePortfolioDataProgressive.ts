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

import {
  transformToWalletPortfolioDataWithDirection,
  type WalletPortfolioDataWithDirection,
} from "@/adapters/walletPortfolioDataAdapter";
import { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
import { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";
import {
  combineStrategyData,
  extractBalanceData,
  extractCompositionData,
  extractSentimentData,
} from "@/lib/portfolio/portfolioTransformers";
import type { DashboardProgressiveState } from "@/types/portfolio-progressive";

import { useLandingPageData } from "./usePortfolioQuery";

/**
 * Progressive portfolio data hook
 *
 * Composes existing hooks and exposes section-specific states.
 * Allows each dashboard section to render independently.
 *
 * @param userId - User wallet address or user ID
 * @param isEtlInProgress - Whether ETL data fetch is currently in progress (disables landing query during ETL)
 * @returns Section states with loading/error information
 */
export function usePortfolioDataProgressive(
  userId: string,
  isEtlInProgress = false
): DashboardProgressiveState {
  // Fetch data from independent sources
  const landingQuery = useLandingPageData(userId, isEtlInProgress);
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
    isLoading:
      landingQuery.isLoading ||
      sentimentQuery.isLoading ||
      regimeQuery.isLoading,
    error: (landingQuery.error ||
      sentimentQuery.error ||
      regimeQuery.error) as Error | null,
  };

  // 4. Independent Sentiment Section (Depends only on Sentiment)
  const sentimentSection = {
    data: sentimentQuery.data
      ? extractSentimentData(sentimentQuery.data)
      : null,
    isLoading: sentimentQuery.isLoading,
    error: sentimentQuery.error as Error | null,
  };

  // Legacy Unified Data (for backward compatibility)
  const unifiedData: WalletPortfolioDataWithDirection | null = landingQuery.data
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
