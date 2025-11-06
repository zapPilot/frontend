/**
 * Simplified Wallet Types
 *
 * Essential types for wallet operations without over-abstraction.
 * Focused on current ThirdWeb usage while maintaining future flexibility.
 */

// Chain/network information
interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpcUrl?: string;
  blockExplorer?: string;
  isTestnet?: boolean;
}

// Supported chain configurations
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  OPTIMISM: 10,
} as const;

type SupportedChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

// Chain metadata
export const CHAIN_INFO: Record<SupportedChainId, Chain> = {
  [SUPPORTED_CHAINS.ETHEREUM]: {
    id: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/",
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
  },
  [SUPPORTED_CHAINS.ARBITRUM]: {
    id: 42161,
    name: "Arbitrum One",
    symbol: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    isTestnet: false,
  },
  [SUPPORTED_CHAINS.BASE]: {
    id: 8453,
    name: "Base",
    symbol: "ETH",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    isTestnet: false,
  },
  [SUPPORTED_CHAINS.OPTIMISM]: {
    id: 10,
    name: "Optimism",
    symbol: "ETH",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    isTestnet: false,
  },
};

// Utility functions
export const chainUtils = {
  isSupported: (chainId: number): chainId is SupportedChainId => {
    return Object.values(SUPPORTED_CHAINS).includes(
      chainId as SupportedChainId
    );
  },

  getChainInfo: (chainId: number): Chain | undefined => {
    return chainUtils.isSupported(chainId) ? CHAIN_INFO[chainId] : undefined;
  },

  getSupportedChains: (): Chain[] => {
    return Object.values(CHAIN_INFO);
  },

  getChainName: (chainId: number): string => {
    const info = chainUtils.getChainInfo(chainId);
    return info?.name || `Chain ${chainId}`;
  },

  getChainSymbol: (chainId: number): string => {
    const info = chainUtils.getChainInfo(chainId);
    return info?.symbol || "ETH";
  },
};
