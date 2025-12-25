/**
 * Regime Mapper Utility
 *
 * Maps Fear & Greed Index sentiment values (0-100) to market regime IDs.
 * Provides validation and helper functions for regime determination.
 */

import type { RegimeId } from "@/components/wallet/regime/regimeData";

export const REGIME_LABELS: Record<RegimeId, string> = {
  ef: "Extreme Fear",
  f: "Fear",
  n: "Neutral",
  g: "Greed",
  eg: "Extreme Greed",
};

/**
 * Maps a sentiment value (0-100) to the corresponding market regime.
 *
 * Sentiment Ranges:
 * - Extreme Fear (ef): 0-25
 * - Fear (f): 26-45
 * - Neutral (n): 46-54
 * - Greed (g): 55-75
 * - Extreme Greed (eg): 76-100
 *
 * @param sentimentValue - Sentiment score from 0 (extreme fear) to 100 (extreme greed)
 * @returns RegimeId corresponding to the sentiment level
 *
 * @example
 * ```typescript
 * const regime = getRegimeFromSentiment(65); // returns "g" (Greed)
 * const extreme = getRegimeFromSentiment(90); // returns "eg" (Extreme Greed)
 * ```
 */
export function getRegimeFromSentiment(sentimentValue: number): RegimeId {
  // Validate input
  if (isNaN(sentimentValue) || !isFinite(sentimentValue)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[regimeMapper] Invalid sentiment value: ${sentimentValue}. Defaulting to neutral regime.`
    );
    return "n";
  }

  // Handle out-of-range values
  if (sentimentValue < 0 || sentimentValue > 100) {
    // eslint-disable-next-line no-console
    console.warn(
      `[regimeMapper] Sentiment value ${sentimentValue} is out of range (0-100). Defaulting to neutral regime.`
    );
    return "n";
  }

  // Map sentiment to regime
  if (sentimentValue <= 25) return "ef"; // Extreme Fear: 0-25
  if (sentimentValue <= 45) return "f"; // Fear: 26-45
  if (sentimentValue <= 54) return "n"; // Neutral: 46-54
  if (sentimentValue <= 75) return "g"; // Greed: 55-75
  return "eg"; // Extreme Greed: 76-100
}

// Unused exports removed: getRegimeLabelFromSentiment, isSentimentInRegime
