/**
 * Unified Chain Configuration API
 *
 * This is the main entry point for all chain-related configuration.
 * Import from this file to access chain data in any format needed.
 *
 * Usage Examples:
 * ```typescript
 * // Get all supported chains in canonical format
 * import { SUPPORTED_CHAINS } from '@/config/chains';
 *
 * // Get ThirdWeb-compatible chains
 * import { getThirdWebChains } from '@/config/chains';
 *
 * // Get legacy wallet format chains
 * import { getLegacyChains } from '@/config/chains';
 *
 * // Chain utilities
 * import { getChainById, isChainSupported } from '@/config/chains';
 * ```
 */

// Core types and definitions
export type {
  BaseChainConfig,
  ChainAdapter,
  ChainEnvironmentConfig,
  ChainListAdapter,
  ChainRegistry,
  SupportedChainId,
  ThirdWebChainConfig,
} from "./types";

// Canonical chain definitions
export {
  CHAIN_CONFIG,
  CHAIN_IDS,
  CHAIN_NAMES,
  CHAIN_REGISTRY,
  MAINNET_CHAINS,
  SUPPORTED_CHAINS,
} from "./definitions";

// Adapter functions
export {
  createChainSelector,
  createRpcUrlWithKey,
  getMainnetChains,
  getSupportedChains,
  toChainIdMapping,
  toChainNameMapping,
  toThirdWebChain,
  toThirdWebChains,
  toWagmiChain,
  toWagmiChains,
  withApiKeys,
} from "./adapters";

// Re-export for convenience
import { CHAIN_REGISTRY, SUPPORTED_CHAINS } from "./definitions";

import { getMainnetChains, toThirdWebChains } from "./adapters";

/**
 * Convenience functions for common use cases
 */

/**
 * Get all supported chains in ThirdWeb format
 */
export const getThirdWebChains = () => toThirdWebChains(SUPPORTED_CHAINS);

/**
 * Get supported mainnet chains only
 */
export const getSupportedMainnetChains = () =>
  getMainnetChains(SUPPORTED_CHAINS);

/**
 * Chain utility functions
 */

/**
 * Get chain configuration by ID
 */
export const getChainById = (chainId: number) => {
  return CHAIN_REGISTRY[chainId] || null;
};

/**
 * Check if a chain is supported
 */
export const isChainSupported = (chainId: number): boolean => {
  const chain = getChainById(chainId);
  return chain ? chain.isSupported : false;
};

/**
 * Get chain name by ID
 */
export const getChainName = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain ? chain.name : `Chain ${chainId}`;
};

/**
 * Get chain symbol by ID
 */
export const getChainSymbol = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain ? chain.symbol : "UNKNOWN";
};

/**
 * Get chain icon URL by ID
 */
export const getChainIcon = (chainId: number): string | undefined => {
  const chain = getChainById(chainId);
  return chain?.iconUrl;
};

/**
 * Format chain for display in UI components
 */
export const formatChainForDisplay = (chainId: number) => {
  const chain = getChainById(chainId);
  if (!chain) {
    return { name: `Chain ${chainId}`, symbol: "UNKNOWN", icon: undefined };
  }

  return {
    name: chain.name,
    symbol: chain.symbol,
    icon: chain.iconUrl,
  };
};

/**
 * Get RPC URL for chain
 */
export const getChainRpcUrl = (chainId: number): string | null => {
  const chain = getChainById(chainId);
  return chain ? chain.rpcUrls.default.http[0] || null : null;
};

/**
 * Get block explorer URL for chain
 */
export const getChainBlockExplorer = (chainId: number): string | null => {
  const chain = getChainById(chainId);
  return chain ? chain.blockExplorers.default.url : null;
};
