import { httpUtils } from "@/lib/http";

export interface BtcPriceSnapshot {
  date: string;
  price_usd: number;
  market_cap_usd?: number;
  volume_24h_usd?: number;
  source: string;
}

export interface BtcPriceHistoryResponse {
  snapshots: BtcPriceSnapshot[];
  count: number;
  days_requested: number;
  oldest_date: string | null;
  latest_date: string | null;
  cached: boolean;
}

/**
 * Fetch BTC historical price data from analytics-engine
 *
 * @param days - Number of days of history (1-365, default: 90)
 * @returns Promise<BtcPriceHistoryResponse>
 */
export async function getBtcPriceHistory(
  days = 90
): Promise<BtcPriceHistoryResponse> {
  return httpUtils.analyticsEngine.get<BtcPriceHistoryResponse>(
    `/api/v2/market/btc/history?days=${days}`
  );
}
