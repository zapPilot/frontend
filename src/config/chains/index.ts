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

// Canonical chain definitions
// Re-export for convenience
import { getMainnetChains, toThirdWebChains } from "./adapters";
import { CHAIN_REGISTRY, SUPPORTED_CHAINS } from "./definitions";

export {
  CHAIN_REGISTRY,
  SUPPORTED_CHAINS,
} from "./definitions";

// Adapter functions
export {
  getMainnetChains,
  toThirdWebChains,
} from "./adapters";

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
 * Get chain symbol by ID
 */
export const getChainSymbol = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain ? chain.symbol : "UNKNOWN";
};
