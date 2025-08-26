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
 * Wagmi chain interface
 */
interface WagmiChain {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
      webSocket?: string[];
    };
    public: {
      http: string[];
      webSocket?: string[];
    };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
    etherscan?: {
      name: string;
      url: string;
    };
  };
}

/**
 * Convert canonical chain config to Wagmi-compatible format
 */
export const toWagmiChain: ChainAdapter<WagmiChain> = config => {
  return {
    id: config.id,
    name: config.name,
    network: config.name.toLowerCase().replace(/\s+/g, "-"),
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: config.rpcUrls.default,
      public: config.rpcUrls.public || config.rpcUrls.default,
    },
    blockExplorers: {
      default: config.blockExplorers.default,
      etherscan:
        config.blockExplorers.etherscan || config.blockExplorers.default,
    },
  };
};

/**
 * Convert list of canonical chains to Wagmi format
 */
export const toWagmiChains: ChainListAdapter<WagmiChain> = configs => {
  return configs.map(toWagmiChain);
};

/**
 * Convert canonical chain config to simple ID mapping format
 */
export const toChainIdMapping = (configs: BaseChainConfig[]) => {
  return configs.reduce(
    (mapping, config) => {
      mapping[config.name.toUpperCase().replace(/\s+/g, "_")] = config.id;
      return mapping;
    },
    {} as Record<string, number>
  );
};

/**
 * Convert canonical chain config to name mapping format
 */
export const toChainNameMapping = (configs: BaseChainConfig[]) => {
  return configs.reduce(
    (mapping, config) => {
      mapping[config.id] = config.name;
      return mapping;
    },
    {} as Record<number, string>
  );
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
 * Create RPC URL with API key injection
 */
export const createRpcUrlWithKey = (baseUrl: string, apiKey?: string) => {
  if (!apiKey) return baseUrl;

  // Handle Infura URLs
  if (baseUrl.includes("infura.io/v3/")) {
    return baseUrl + apiKey;
  }

  // Handle Alchemy URLs
  if (baseUrl.includes("g.alchemy.com/v2/")) {
    return baseUrl + apiKey;
  }

  // Default: append as query parameter
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}key=${apiKey}`;
};

/**
 * Enhanced chain config with API keys injected
 */
export const withApiKeys = (
  config: BaseChainConfig,
  apiKeys?: { infura?: string; alchemy?: string }
): BaseChainConfig => {
  if (!apiKeys) return config;

  const enhancedRpcUrls = {
    ...config.rpcUrls,
    default: {
      ...config.rpcUrls.default,
      http: config.rpcUrls.default.http.map(url => {
        if (url.includes("infura.io") && apiKeys.infura) {
          return createRpcUrlWithKey(url, apiKeys.infura);
        }
        if (url.includes("alchemy.com") && apiKeys.alchemy) {
          return createRpcUrlWithKey(url, apiKeys.alchemy);
        }
        return url;
      }),
    },
  };

  return {
    ...config,
    rpcUrls: enhancedRpcUrls,
  };
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
