import type { RegimeId } from "@/components/wallet/regime/regimeData";
import { getDefaultQuoteForRegime } from "@/constants/regimes";
import { getRegimeFromSentiment } from "@/lib/regimeMapper";
import type { MarketSentimentData } from "@/services/sentimentService";

export interface SentimentInfo {
  value: number;
  status: string;
  quote: string;
  regime: RegimeId;
}

/**
 * Transforms sentiment data into consumption-ready format
 */
export function processSentimentData(
  sentimentData: MarketSentimentData | null
): SentimentInfo {
  const value = sentimentData?.value ?? 50;
  const regime = getRegimeFromSentiment(value);

  return {
    value,
    status: sentimentData?.status ?? "Neutral",
    quote: sentimentData?.quote?.quote ?? getDefaultQuoteForRegime(regime),
    regime,
  };
}
