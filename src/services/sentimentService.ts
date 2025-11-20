import { useQuery } from "@tanstack/react-query";

import { getQuoteForSentiment, type SentimentLabel } from "@/config/sentimentQuotes";
import { createQueryConfig } from "@/hooks/queries/queryDefaults";
import { queryKeys } from "@/lib/queryClient";
import { httpGet } from "@/lib/http-utils";
import { logger } from "@/utils/logger";

const FEAR_GREED_ENDPOINT =
  "https://api.alternative.me/fng/?limit=1&format=json";
const SENTIMENT_CACHE_MS = 10 * 60 * 1000; // 10 minutes

interface FearGreedApiEntry {
  value: string;
  value_classification: SentimentLabel | string;
  timestamp: string;
  time_until_update: string;
}

interface FearGreedApiResponse {
  name: string;
  data: FearGreedApiEntry[];
  metadata?: {
    error?: string | null;
  };
}

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

function normalizeEntry(entry: FearGreedApiEntry): MarketSentimentData {
  const value = Number(entry.value);
  const timestamp = new Date(Number(entry.timestamp) * 1000).toISOString();
  const quote = getQuoteForSentiment(value);

  return {
    value,
    status: entry.value_classification,
    timestamp: Number.isNaN(Date.parse(timestamp))
      ? new Date().toISOString()
      : timestamp,
    quote,
  };
}

export async function fetchMarketSentiment(): Promise<MarketSentimentData> {
  const response = await httpGet<FearGreedApiResponse>(FEAR_GREED_ENDPOINT);

  if (response.metadata?.error) {
    throw new Error(response.metadata.error);
  }

  const entry = response.data?.[0];

  if (!entry) {
    throw new Error("No sentiment data available");
  }

  return normalizeEntry(entry);
}

export function useSentimentData() {
  return useQuery({
    ...createQueryConfig({ dataType: "dynamic" }),
    queryKey: queryKeys.sentiment.market(),
    queryFn: async () => {
      try {
        return await fetchMarketSentiment();
      } catch (error) {
        logger.warn("Failed to fetch market sentiment", {
          error: error instanceof Error ? error.message : String(error),
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

