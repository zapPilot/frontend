import type { BtcPriceSnapshot } from "@/services/btcPriceService";

import { toDateKey } from "./dateUtils";

/**
 * Creates a Map of BTC prices keyed by YYYY-MM-DD
 */
export function buildBtcPriceMap(
  btcPriceData: BtcPriceSnapshot[] | undefined
): Map<string, number> {
  return new Map(
    (btcPriceData ?? []).flatMap(snap => {
      const dateKey = toDateKey(snap.date);
      if (!dateKey) return [];
      return [[dateKey, snap.price_usd] as const];
    })
  );
}

/**
 * Finds the first available BTC price baseline within the portfolio timeline
 */
export function findBtcBaseline(
  dailyValues: { date?: string; total_value_usd?: number }[],
  btcPriceMap: Map<string, number>
) {
  let firstBtcPrice: number | null = null;
  let firstBtcDate: string | null = null;

  for (const dailyValue of dailyValues) {
    const dateKey = toDateKey(dailyValue.date);
    if (dateKey) {
      const btcPrice = btcPriceMap.get(dateKey);
      if (btcPrice) {
        firstBtcPrice = btcPrice;
        firstBtcDate = dateKey;
        break;
      }
    }
  }

  return { firstBtcPrice, firstBtcDate };
}

/**
 * Calculates what the portfolio would be worth if invested in BTC
 */
export function calculateBtcEquivalent(
  dateKey: string | null,
  btcPriceMap: Map<string, number>,
  firstBtcPrice: number | null,
  baselinePortfolioValue: number
): number | null {
  if (!firstBtcPrice || baselinePortfolioValue <= 0 || !dateKey) return null;

  const currentBtcPrice = btcPriceMap.get(dateKey);
  if (!currentBtcPrice) return null;

  return (baselinePortfolioValue / firstBtcPrice) * currentBtcPrice;
}
