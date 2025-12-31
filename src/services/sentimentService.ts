/**
 * Market Sentiment Service
 *
 * Fetches Fear & Greed Index data via backend proxy to avoid CORS issues.
 * Backend proxy caches data for 10 minutes to reduce load on external API.
 */

import {
  getQuoteForSentiment,
  type SentimentLabel,
} from "@/config/sentimentQuotes";
import { APIError, httpUtils } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import {
  type SentimentApiResponse,
  validateSentimentApiResponse,
} from "@/schemas/api/sentimentSchemas";

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
 * Error mapper for sentiment service using standardized createErrorMapper utility
 * Transforms API errors into user-friendly error instances
 */
const createSentimentServiceError = createErrorMapper(
  (message, status, code, details) =>
    new APIError(message, status, code, details),
  {
    500: "An unexpected error occurred while fetching sentiment data.",
    502: "Invalid data received from sentiment provider.",
    503: "Market sentiment data is temporarily unavailable. Please try again later.",
    504: "Request timed out while fetching market sentiment.",
  },
  "Failed to fetch market sentiment"
);

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
 *
 * @returns Market sentiment data with quote
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

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * @deprecated Import from @/hooks/queries/market/useSentimentQuery instead
 *
 * React hooks have been moved out of service files to maintain architectural
 * purity. Service files should only contain pure async functions.
 */
export { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";
