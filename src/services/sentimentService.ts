/**
 * Market Sentiment Service
 *
 * Fetches Fear & Greed Index data via backend proxy to avoid CORS issues.
 * Backend proxy caches data for 10 minutes to reduce load on external API.
 */

import { useQuery } from "@tanstack/react-query";

import { getQuoteForSentiment, type SentimentLabel } from "@/config/sentimentQuotes";
import { createQueryConfig } from "@/hooks/queries/queryDefaults";
import { queryKeys } from "@/lib/queryClient";
import { httpUtils } from "@/lib/http-utils";
import { createServiceCaller } from "@/lib/createServiceCaller";
import { logger } from "@/utils/logger";

const SENTIMENT_CACHE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Backend API Response Format (from proxy endpoint)
 */
interface SentimentApiResponse {
  value: number;
  status: SentimentLabel | string;
  timestamp: string;
  source: string;
  cached?: boolean;
}

/**
 * Frontend Data Model with quote integration
 */
export interface MarketSentimentData {
  value: number;
  status: SentimentLabel | string;
  timestamp: string;
  quote: {
    quote: string;
    author: string;
    sentiment: SentimentLabel;
  };
}

/**
 * Sentiment Service Error with enhanced error details
 */
export class SentimentServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SentimentServiceError";
  }
}

/**
 * Error mapper for sentiment service
 * Transforms API errors into user-friendly SentimentServiceError instances
 */
const createSentimentServiceError = (error: unknown): SentimentServiceError => {
  const apiError = error && typeof error === "object" ? error : {};
  const status = (apiError as any).status || 500;
  let message = (apiError as any).message || "Failed to fetch market sentiment";

  // Enhanced error messages based on status code
  switch (status) {
    case 503:
      message =
        "Market sentiment data is temporarily unavailable. Please try again later.";
      break;
    case 504:
      message = "Request timed out while fetching market sentiment.";
      break;
    case 502:
      message = "Invalid data received from sentiment provider.";
      break;
    case 500:
      message = "An unexpected error occurred while fetching sentiment data.";
      break;
  }

  return new SentimentServiceError(
    message,
    status,
    (apiError as any).code,
    (apiError as any).details
  );
};

const callSentimentApi = createServiceCaller(createSentimentServiceError);

/**
 * Transform backend response to frontend format with quote
 */
function transformSentimentData(
  response: SentimentApiResponse
): MarketSentimentData {
  const quote = getQuoteForSentiment(response.value);

  return {
    value: response.value,
    status: response.status,
    timestamp: response.timestamp,
    quote,
  };
}

/**
 * Fetch market sentiment from backend proxy endpoint
 *
 * Calls `/api/v1/market/sentiment` which proxies the Fear & Greed Index API
 * to avoid CORS issues. Backend handles caching and error handling.
 */
export async function fetchMarketSentiment(): Promise<MarketSentimentData> {
  return callSentimentApi(async () => {
    const response = await httpUtils.backendApi.get<SentimentApiResponse>(
      "/api/v1/market/sentiment"
    );

    return transformSentimentData(response);
  });
}

/**
 * React Query hook for market sentiment with caching and refetch strategy
 *
 * - Frontend cache: 10 minutes (matches backend cache)
 * - Auto refetch: Every 10 minutes
 * - Retry: Once on failure
 * - Stale-while-revalidate: Backend handles via HTTP headers
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
          status: error instanceof SentimentServiceError ? error.status : undefined,
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
