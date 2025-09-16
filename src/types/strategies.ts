/**
 * Strategy-related TypeScript interfaces for API integration
 * Maps /api/v1/strategies endpoint response to UI components
 */

import {
  AssetCategory,
  Protocol,
} from "../components/PortfolioAllocation/types";
import { PoolDetail } from "../services/analyticsService";

/**
 * Actual API Strategy Response from /api/v1/strategies
 * Based on real API response structure
 */
export interface StrategyProtocolResponse {
  name: string;
  protocol?: string; // Protocol identifier (e.g., 'aave-v3', 'uniswap-v3')
  chain: string; // e.g., 'base'
  weight: number; // percentage weight
  targetTokens: string[]; // e.g., ['usdc']
}

export interface StrategyResponse {
  id: string;
  displayName: string;
  description: string;
  targetAssets: string[];
  chains: string[];
  protocolCount: number;
  enabledProtocolCount: number;
  // Optional per-strategy protocol breakdown from intent service
  protocols?: StrategyProtocolResponse[];
}

/**
 * Complete API Response from /api/v1/strategies
 * Based on actual API response structure
 */
export interface StrategiesApiResponse {
  success: boolean;
  strategies: StrategyResponse[];
  total: number;
  supportedChains: string[];
  lastUpdated: string;
}

/**
 * Transform PoolDetail array to Protocol array for specific category
 * Maps real user portfolio pool positions to Protocol interface
 */
export const transformPoolsToProtocols = (
  pools: PoolDetail[],
  categoryId: string
): Protocol[] => {
  return pools
    .filter(pool => matchesCategory(pool, categoryId))
    .map(pool => ({
      id: pool.snapshot_id,
      name: formatProtocolName(pool),
      allocationPercentage: pool.contribution_to_portfolio,
      chain: capitalizeChain(pool.chain),
      protocol: pool.protocol, // Map protocol field from PoolDetail
      tvl: pool.asset_usd_value,
      apy: pool.final_apr,
      riskScore: pool.protocol_matched ? 1 : 3, // Lower risk for verified APR
      // Enhanced pool data
      poolSymbols: pool.pool_symbols,
      aprConfidence: getAPRConfidence(pool),
      aprBreakdown: (() => {
        const breakdown: {
          total: number;
          base?: number;
          reward?: number;
          updatedAt?: string;
        } = {
          total: pool.final_apr,
        };
        if (pool.apr_data.apr_base != null)
          breakdown.base = pool.apr_data.apr_base as number;
        if (pool.apr_data.apr_reward != null)
          breakdown.reward = pool.apr_data.apr_reward as number;
        if (pool.apr_data.apr_updated_at != null)
          breakdown.updatedAt = pool.apr_data.apr_updated_at as string;
        return breakdown;
      })(),
    }));
};

/**
 * Transform strategy protocol entries (from intent service) to Protocols
 */
export const transformStrategyProtocols = (
  protocols: StrategyProtocolResponse[] | undefined,
  strategyId: string
): Protocol[] => {
  if (!protocols || protocols.length === 0) return [];

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return protocols.map(p => ({
    id: `${strategyId}:${p.chain}:${slugify(p.name)}`,
    name: p.name,
    allocationPercentage: p.weight,
    chain: p.chain,
    ...(p.protocol && { protocol: p.protocol }), // Only include if defined
    // Map targetTokens for display in UI
    targetTokens: p.targetTokens,
  }));
};

/**
 * Determine if a pool belongs to a specific category based on its symbols
 */
const matchesCategory = (pool: PoolDetail, categoryId: string): boolean => {
  const symbols = pool.pool_symbols.map(s => s.toLowerCase());

  switch (categoryId) {
    case "btc":
      return symbols.some(s => ["btc", "wbtc", "bitcoin"].includes(s));
    case "eth":
      return symbols.some(s =>
        ["eth", "weth", "steth", "reth", "ethereum"].includes(s)
      );
    case "stablecoins":
    case "stablecoin":
      return symbols.some(s =>
        ["usdc", "usdt", "dai", "busd", "frax", "lusd"].includes(s)
      );
    case "others":
    default:
      // If it doesn't match BTC, ETH, or stablecoins, it goes to others
      const isBtc = symbols.some(s => ["btc", "wbtc", "bitcoin"].includes(s));
      const isEth = symbols.some(s =>
        ["eth", "weth", "steth", "reth", "ethereum"].includes(s)
      );
      const isStable = symbols.some(s =>
        ["usdc", "usdt", "dai", "busd", "frax", "lusd"].includes(s)
      );
      return !isBtc && !isEth && !isStable;
  }
};

/**
 * Format protocol name with pool composition
 */
const formatProtocolName = (pool: PoolDetail): string => {
  const poolTokens =
    pool.pool_symbols.length > 0 ? ` (${pool.pool_symbols.join("/")})` : "";
  return `${pool.protocol_name}${poolTokens}`;
};

/**
 * Get APR confidence level based on protocol match and APR data
 */
const getAPRConfidence = (pool: PoolDetail): "high" | "medium" | "low" => {
  if (pool.protocol_matched && pool.apr_data.apr !== null) {
    return "high";
  }
  if (pool.final_apr > 0) {
    return "medium";
  }
  return "low";
};

/**
 * Capitalize chain name consistently
 */
const capitalizeChain = (chain: string): string => {
  return chain.charAt(0).toUpperCase() + chain.slice(1);
};

/**
 * Transform API strategy response to UI AssetCategory interface
 */
export const transformCategory = (
  strategy: StrategyResponse,
  poolDetails: PoolDetail[] = []
): AssetCategory => ({
  id: strategy.id,
  name: strategy.displayName,
  color: getDefaultCategoryColor(strategy.displayName),
  description: strategy.description,
  targetAssets: strategy.targetAssets,
  chains: strategy.chains,
  protocolCount: strategy.protocolCount,
  enabledProtocolCount: strategy.enabledProtocolCount,
  // Prefer protocols from the strategies API when available;
  // otherwise, fall back to user portfolio pool details
  protocols:
    transformStrategyProtocols(strategy.protocols, strategy.id).length > 0
      ? transformStrategyProtocols(strategy.protocols, strategy.id)
      : transformPoolsToProtocols(poolDetails, strategy.id),
});

/**
 * Transform complete API response to AssetCategory array
 */
export const transformStrategiesResponse = (
  apiResponse: StrategiesApiResponse,
  poolDetails: PoolDetail[] = []
): AssetCategory[] => {
  if (!apiResponse.success || !apiResponse.strategies) {
    throw new Error("Invalid strategies API response");
  }

  return apiResponse.strategies.map(strategy =>
    transformCategory(strategy, poolDetails)
  );
};

/**
 * Get default color for category based on name/type
 */
export const getDefaultCategoryColor = (categoryName: string): string => {
  const colorMap: Record<string, string> = {
    btc: "#F59E0B",
    bitcoin: "#F59E0B",
    eth: "#8B5CF6",
    ethereum: "#8B5CF6",
    stablecoins: "#10B981",
    stable: "#10B981",
    usdc: "#10B981",
    usdt: "#10B981",
    dai: "#10B981",
    defi: "#3B82F6",
    yield: "#F59E0B",
    lending: "#8B5CF6",
    dex: "#10B981",
    liquid: "#6366F1",
  };

  const key = categoryName.toLowerCase();
  return (
    colorMap[key] ||
    Object.entries(colorMap).find(([name]) => key.includes(name))?.[1] ||
    "#6B7280" // Default gray
  );
};

/**
 * Error types for strategies API
 */
export class StrategiesApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "StrategiesApiError";
  }
}

/**
 * Loading state interface for strategies data
 */
export interface StrategiesLoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: StrategiesApiError | Error;
  data?: AssetCategory[];
  isRefetching?: boolean;
}

/**
 * Configuration options for strategies fetching
 */
export interface StrategiesFetchConfig {
  chainId?: number;
  category?: string;
  minTvl?: number;
  maxRisk?: number;
  includeInactive?: boolean;
}
