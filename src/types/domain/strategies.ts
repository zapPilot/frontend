/**
 * Strategy-related TypeScript interfaces for API integration
 * Maps /api/v1/strategies endpoint response to UI components
 */


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

// Imports removed - unused (2025-12-22)
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

// Helper functions removed - unused (2025-12-22)
// This file checks out as dead code mostly, except for StrategiesApiResponse if used elsewhere.
// But as per plan, I am removing logic.

// transformPoolsToProtocols, transformStrategyProtocols, transformCategory, getDefaultCategoryColor removed.
