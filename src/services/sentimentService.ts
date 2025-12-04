/**
 * Market Sentiment Service
 *
 * Fetches Fear & Greed Index data via backend proxy to avoid CORS issues.
 * Backend proxy caches data for 10 minutes to reduce load on external API.
 */

import { useQuery } from "@tanstack/react-query";

import {
  getQuoteForSentiment,
  type SentimentLabel,
} from "@/config/sentimentQuotes";
import { createQueryConfig } from "@/hooks/queries/queryDefaults";
import { createServiceCaller } from "@/lib/createServiceCaller";
import { APIError, httpUtils } from "@/lib/http-utils";
import { queryKeys } from "@/lib/queryClient";
import {
  validateSentimentApiResponse,
  type SentimentApiResponse,
} from "@/schemas/api/sentimentSchemas";
import { logger } from "@/utils/logger";

const SENTIMENT_CACHE_MS = 10 * 60 * 1000; // 10 minutes

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
 * Error mapper for sentiment service
 * Transforms API errors into user-friendly error instances
 */
const createSentimentServiceError = (error: unknown): APIError => {
  const apiError =
    error && typeof error === "object"
      ? (error as {
          status?: number;
          message?: string;
          code?: string;
          details?: Record<string, unknown>;
        })
      : {};
  const status = apiError.status || 500;
  let message = apiError.message || "Failed to fetch market sentiment";

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

  return new APIError(message, status, apiError.code, apiError.details);
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
 * Calls `/api/v2/market/sentiment` which proxies the Fear & Greed Index API
 * to avoid CORS issues. Backend handles caching and error handling.
 */
export async function fetchMarketSentiment(): Promise<MarketSentimentData> {
  return callSentimentApi(async () => {
    const response = await httpUtils.analyticsEngine.get(
      "/api/v2/market/sentiment"
    );

    const validatedResponse = validateSentimentApiResponse(response);
    return transformSentimentData(validatedResponse);
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
