/**
 * Strategy-related TypeScript interfaces for API integration
 * Maps /api/v1/strategies endpoint response to UI components
 */

import {
  AssetCategory,
  Protocol,
} from "../../components/PortfolioAllocation/types";
import { ASSET_CATEGORIES } from "../../constants/portfolio";
import { PoolDetail } from "../../services/analyticsService";
import { categorizePool } from "../../utils/portfolio.utils";

/**
 * Actual API Strategy Response from /api/v1/strategies
 * Based on real API response structure
 */
interface StrategyProtocolResponse {
  name: string;
  protocol?: string; // Protocol identifier (e.g., 'aave-v3', 'uniswap-v3')
  chain: string; // e.g., 'base'
  weight: number; // percentage weight
  targetTokens: string[]; // e.g., ['usdc']
}

interface StrategyResponse {
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
    .filter(pool => categorizePool(pool.pool_symbols) === categoryId)
    .map(pool => ({
      id: pool.snapshot_id,
      name: formatProtocolName(pool),
      allocationPercentage: pool.contribution_to_portfolio,
      chain: capitalizeChain(pool.chain),
      protocol: pool.protocol, // Map protocol field from PoolDetail
      tvl: pool.asset_usd_value,
      apy: 0,
      riskScore: 2, // neutral risk without APR metadata
      // Enhanced pool data
      poolSymbols: pool.pool_symbols,
      aprConfidence: "low",
      aprBreakdown: {
        total: 0,
      },
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
 * Uses centralized ASSET_CATEGORIES for consistent color mapping
 */
export const getDefaultCategoryColor = (categoryName: string): string => {
  const key = categoryName.toLowerCase();

  // Direct mapping to asset categories
  const colorMap: Record<string, string> = {
    btc: ASSET_CATEGORIES.btc.brandColor,
    bitcoin: ASSET_CATEGORIES.btc.brandColor,
    eth: ASSET_CATEGORIES.eth.brandColor,
    ethereum: ASSET_CATEGORIES.eth.brandColor,
    stablecoins: ASSET_CATEGORIES.stablecoin.brandColor,
    stable: ASSET_CATEGORIES.stablecoin.brandColor,
    usdc: ASSET_CATEGORIES.stablecoin.brandColor,
    usdt: ASSET_CATEGORIES.stablecoin.brandColor,
    dai: ASSET_CATEGORIES.stablecoin.brandColor,
    // Additional mappings for common strategy types
    yield: ASSET_CATEGORIES.btc.brandColor,
    lending: ASSET_CATEGORIES.eth.brandColor,
    dex: ASSET_CATEGORIES.stablecoin.brandColor,
    liquid: ASSET_CATEGORIES.eth.chartColor,
  };

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
    public status?: number
  ) {
    super(message);
    this.name = "StrategiesApiError";
  }

  // Backward compatibility - deprecated
  get statusCode() {
    return this.status;
  }
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
