/**
 * Market Sentiment Query Hook
 *
 * Fetches and caches market sentiment data with automatic refetching.
 * Extracted from sentimentService.ts to maintain service layer purity.
 */
import { useQuery } from "@tanstack/react-query";

import { createQueryConfig } from "@/hooks/queries/queryDefaults";
import { queryKeys } from "@/lib/state/queryClient";
import { fetchMarketSentiment } from "@/services/sentimentService";

import { logQueryError } from "./queryErrorUtils";

const SENTIMENT_CACHE_MS = 10 * 60 * 1000; // 10 minutes (matches backend cache)

/**
 * Hook to fetch market sentiment data
 *
 * @returns React Query result with market sentiment data
 */
export function useSentimentData() {
  return useQuery({
    ...createQueryConfig({ dataType: "dynamic" }),
    queryKey: queryKeys.sentiment.market(),
    queryFn: async () => {
      try {
        return await fetchMarketSentiment();
      } catch (error) {
        logQueryError("Failed to fetch market sentiment", error);
        throw error;
      }
    },
    staleTime: SENTIMENT_CACHE_MS,
    gcTime: SENTIMENT_CACHE_MS * 3,
    refetchInterval: SENTIMENT_CACHE_MS,
    retry: 1,
  });
}
