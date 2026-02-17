/**
 * Chain Configuration Adapters
 *
 * This module provides adapter functions to convert canonical chain configurations
 * to different formats required by various Web3 providers and libraries.
 */

import type { Chain as ThirdWebChain } from "thirdweb/chains";

import type { BaseChainConfig } from "./types";

/**
 * Convert canonical chain config to ThirdWeb chain format
 * Internal function used by toThirdWebChains
 */
function toThirdWebChain(config: BaseChainConfig): ThirdWebChain {
  return {
    id: config.id,
    name: config.name,
    rpc: config.rpcUrls.default.http[0], // ThirdWeb expects a single RPC URL string
    nativeCurrency: config.nativeCurrency,
    blockExplorers: config.blockExplorers
      ? [config.blockExplorers.default]
      : undefined,
  } as ThirdWebChain;
}

/**
 * Convert list of canonical chains to ThirdWeb chains
 */
export function toThirdWebChains(configs: BaseChainConfig[]): ThirdWebChain[] {
  return configs.map(toThirdWebChain);
}

/**
 * Get only mainnet chains from a list
 */
export function getMainnetChains(
  configs: BaseChainConfig[]
): BaseChainConfig[] {
  return configs.filter(config => config.isSupported);
}
