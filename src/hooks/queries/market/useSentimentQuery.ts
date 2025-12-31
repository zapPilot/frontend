/**
 * Market Sentiment Query Hook
 *
 * Fetches and caches market sentiment data with automatic refetching.
 * Extracted from sentimentService.ts to maintain service layer purity.
 */
import { useQuery } from "@tanstack/react-query";

import { createQueryConfig } from "@/hooks/queries/queryDefaults";
import { APIError } from "@/lib/http/errors";
import { queryKeys } from "@/lib/state/queryClient";
import { fetchMarketSentiment } from "@/services/sentimentService";
import { logger } from "@/utils/logger";

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
        logger.error("Failed to fetch market sentiment", {
          error: error instanceof Error ? error.message : String(error),
          status: error instanceof APIError ? error.status : undefined,
        });
        throw error;
      }
    },
    staleTime: SENTIMENT_CACHE_MS,
    gcTime: SENTIMENT_CACHE_MS * 3,
    refetchInterval: SENTIMENT_CACHE_MS,
    retry: 1,
  });
}
