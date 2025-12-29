/**
 * Allocation Weights Service
 *
 * Fetches marketcap-weighted allocation weights from analytics-engine
 * for dynamic BTC/ETH portfolio target calculations.
 */

import { httpUtils } from "@/lib/http";

export interface AllocationWeightsResponse {
  btc_weight: number;
  eth_weight: number;
  btc_market_cap: number | null;
  eth_market_cap: number | null;
  timestamp: string;
  is_fallback: boolean;
  cached: boolean;
}

/**
 * Fetch marketcap-weighted allocation weights for BTC/ETH
 *
 * Returns weights (0-1 each, sum to 1.0) based on current market caps.
 * Falls back to 60/40 if market data unavailable.
 *
 * @returns Promise<AllocationWeightsResponse>
 */
export async function getAllocationWeights(): Promise<AllocationWeightsResponse> {
  return httpUtils.analyticsEngine.get<AllocationWeightsResponse>(
    `/api/v2/market/allocation-weights`
  );
}
