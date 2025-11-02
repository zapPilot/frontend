/**
 * Chain Configuration Adapters
 *
 * This module provides adapter functions to convert canonical chain configurations
 * to different formats required by various Web3 providers and libraries.
 */

import type { Chain as ThirdWebChain } from "thirdweb/chains";

import { BaseChainConfig, ChainAdapter, ChainListAdapter } from "./types";

/**
 * Convert canonical chain config to ThirdWeb chain format
 */
export const toThirdWebChain: ChainAdapter<ThirdWebChain> = config => {
  return {
    id: config.id,
    name: config.name,
    rpc: config.rpcUrls.default.http[0], // ThirdWeb expects a single RPC URL string
    nativeCurrency: config.nativeCurrency,
    blockExplorers: config.blockExplorers
      ? [config.blockExplorers.default]
      : undefined,
  } as ThirdWebChain;
};

/**
 * Convert list of canonical chains to ThirdWeb chains
 */
export const toThirdWebChains: ChainListAdapter<ThirdWebChain> = configs => {
  return configs.map(toThirdWebChain);
};

/**
 * Get only supported chains from a list
 */
export const getSupportedChains = (configs: BaseChainConfig[]) => {
  return configs.filter(config => config.isSupported);
};

/**
 * Get only mainnet chains from a list
 */
export const getMainnetChains = (configs: BaseChainConfig[]) => {
  return configs.filter(config => config.isSupported);
};

/**
 * Create chain selector for UI components
 */
export const createChainSelector = (configs: BaseChainConfig[]) => {
  return configs
    .filter(config => config.isSupported)
    .map(config => ({
      id: config.id,
      name: config.name,
      symbol: config.symbol,
      icon: config.iconUrl,
    }));
};
