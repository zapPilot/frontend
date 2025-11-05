/**
 * Simplified Wallet Types
 *
 * Essential types for wallet operations without over-abstraction.
 * Focused on current ThirdWeb usage while maintaining future flexibility.
 */

// Core wallet account information
export interface WalletAccount {
  address: string;
  isConnected: boolean;
  balance?: string;
  displayName?: string;
}

// Chain/network information
export interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpcUrl?: string;
  blockExplorer?: string;
  isTestnet?: boolean;
}

// Wallet error types
export interface WalletError {
  message: string;
  code?: string;
  originalError?: Error;
}

// Connection status
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

// Wallet provider interface for future flexibility
export interface WalletProviderInterface {
  // Account state
  account: WalletAccount | null;

  // Chain state
  chain: Chain | null;

  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;

  // Status
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Error handling
  error: WalletError | null;
  clearError: () => void;

  // Signing
  signMessage: (message: string) => Promise<string>;
  signTypedData?: (
    domain: unknown,
    types: unknown,
    value: unknown
  ) => Promise<string>;

  // Utilities
  isChainSupported: (chainId: number) => boolean;
  getSupportedChains: () => Chain[];
}

// Supported chain configurations
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  OPTIMISM: 10,
} as const;

export type SupportedChainId =
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

// Export all types
export type {
  WalletAccount as Account,
  WalletError as Error,
  WalletProviderInterface as Provider,
  ConnectionStatus as Status,
  Chain as WalletChain,
};
