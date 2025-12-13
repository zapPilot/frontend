/**
 * React Query Hook for V22 Portfolio Data
 *
 * Fetches and transforms portfolio data for the V22 layout.
 * Combines landing page data, market sentiment, and regime history into a single hook.
 *
 * Only landing page data is required - sentiment and regime history are optional.
 * Errors in optional data sources are handled gracefully and won't block the UI.
 */

import {
  transformToV22DataWithDirection,
  type V22PortfolioDataWithDirection,
} from "@/adapters/portfolioDataAdapter";
import { useRegimeHistory } from "@/services/regimeHistoryService";
import { useSentimentData } from "@/services/sentimentService";

import { useLandingPageData } from "./usePortfolioQuery";

/**
 * Custom hook for fetching V22 portfolio data
 *
 * Combines data from:
 * - Landing Page API (`/api/v2/portfolio/{userId}/landing`) [required]
 * - Market Sentiment API (`/api/v2/market/sentiment`) [optional, defaults to neutral]
 * - Regime History API (`/api/v2/market/regime/history`) [optional, graceful fallback]
 *
 * @param userId - User wallet address or user ID
 * @returns Portfolio data transformed for V22 layout with loading/error states
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = usePortfolioDataV22(userId);
 *
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState error={error} />;  // Only landing data errors
 * if (!data) return null;
 *
 * // Sentiment and regime data always present (may be defaults)
 * console.log(`Regime: ${data.currentRegime}`);  // defaults to neutral if sentiment fails
 * console.log(`Direction: ${data.strategyDirection}`);  // defaults to 'default' if history fails
 *
 * return <WalletPortfolioPresenterV22 data={data} />;
 * ```
 */
export function usePortfolioDataV22(userId: string) {
  // Fetch landing page data (portfolio metrics)
  const landingQuery = useLandingPageData(userId);

  // Fetch market sentiment data
  const sentimentQuery = useSentimentData();

  // Fetch regime history data (optional, gracefully falls back to defaults on error)
  const regimeHistoryQuery = useRegimeHistory();

  // Loading state: Only wait for landing data (sentiment and regime are optional)
  // Both sentiment and regime history have graceful fallbacks via adapter defaults
  const isLoading = landingQuery.isLoading;

  // Error state: Only landing data errors block the UI
  // Sentiment errors fall back to neutral (50), regime history errors fall back to defaults
  const error = landingQuery.error;

  // Transform data with directional support when available
  const data: V22PortfolioDataWithDirection | null = landingQuery.data
    ? transformToV22DataWithDirection(
        landingQuery.data,
        sentimentQuery.data ?? null,
        // Pass regime history data if available (null coalescing for safety)
        regimeHistoryQuery.data ?? null
      )
    : null;

  return {
    data,
    isLoading,
    error,
    refetch: landingQuery.refetch,
  };
}
