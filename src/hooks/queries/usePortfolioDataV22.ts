/**
 * React Query Hook for V22 Portfolio Data
 *
 * Fetches and transforms portfolio data for the V22 layout.
 * Combines landing page data and market sentiment into a single hook.
 */

import {
  transformToV22Data,
  type V22PortfolioData,
} from "@/adapters/portfolioDataAdapter";
import { useSentimentData } from "@/services/sentimentService";

import { useLandingPageData } from "./usePortfolioQuery";

/**
 * Custom hook for fetching V22 portfolio data
 *
 * Combines data from:
 * - Landing Page API (`/api/v2/portfolio/{userId}/landing`)
 * - Market Sentiment API (`/api/v2/market/sentiment`)
 *
 * @param userId - User wallet address or user ID
 * @returns Portfolio data transformed for V22 layout with loading/error states
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = usePortfolioDataV22(userId);
 *
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState error={error} />;
 * if (!data) return null;
 *
 * return <WalletPortfolioPresenterV22 data={data} />;
 * ```
 */
export function usePortfolioDataV22(userId: string) {
  // Fetch landing page data (portfolio metrics)
  const landingQuery = useLandingPageData(userId);

  // Fetch market sentiment data
  const sentimentQuery = useSentimentData();

  // Determine combined loading state
  const isLoading = landingQuery.isLoading || sentimentQuery.isLoading;

  // Determine combined error state (prioritize landing data errors)
  const error = landingQuery.error || sentimentQuery.error;

  // Transform data only when both queries succeed
  const data: V22PortfolioData | null =
    landingQuery.data
      ? transformToV22Data(landingQuery.data, sentimentQuery.data ?? null)
      : null;

  return {
    data,
    isLoading,
    error,
    refetch: landingQuery.refetch,
  };
}
