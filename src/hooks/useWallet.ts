/**
 * Simplified Wallet Hook
 *
 * Clean, direct interface for wallet operations using ThirdWeb.
 * Compatible with existing useWalletConnection API for easy migration.
 */

"use client";

import { useWalletProvider } from "@/providers/WalletProvider";

// Compatible interface matching the original useWalletConnection
export interface WalletHooks {
  // Account management
  account: {
    address: string;
    isConnected: boolean;
    balance?: string;
  } | null;

  // Chain management
  chain: {
    id: number;
    name: string;
    symbol: string;
  } | null;
  switchChain: (chainId: number) => Promise<void>;

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Status
  isConnected: boolean;

  // Error handling
  error: { message: string; code?: string } | null;
  clearError: () => void;

  // Signing operations
  signMessage: (message: string) => Promise<string>;

  // Utility methods for backward compatibility
  isChainSupported: (chainId: number) => boolean;
  getSupportedChains: () => Array<{ id: number; name: string; symbol: string }>;
}

// Supported chain configuration (simplified)
const SUPPORTED_CHAIN_IDS = [1, 42161, 8453, 10] as const; // Ethereum, Arbitrum, Base, Optimism

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  42161: "Arbitrum One",
  8453: "Base",
  10: "Optimism",
};

const CHAIN_SYMBOLS: Record<number, string> = {
  1: "ETH",
  42161: "ETH",
  8453: "ETH",
  10: "ETH",
};

/**
 * Main wallet hook - drop-in replacement for useWalletConnection
 */
export function useWallet(): WalletHooks {
  const walletContext = useWalletProvider();

  // Utility functions for backward compatibility
  const isChainSupported = (chainId: number): boolean => {
    return SUPPORTED_CHAIN_IDS.includes(chainId as any);
  };

  const getSupportedChains = () => {
    return SUPPORTED_CHAIN_IDS.map(id => ({
      id,
      name: CHAIN_NAMES[id] || `Chain ${id}`,
      symbol: CHAIN_SYMBOLS[id] || "ETH",
    }));
  };

  return {
    // Direct mapping from simplified context
    account: walletContext.account,
    chain: walletContext.chain,
    switchChain: walletContext.switchChain,
    connect: walletContext.connect,
    disconnect: walletContext.disconnect,
    isConnecting: walletContext.isConnecting,
    isDisconnecting: walletContext.isDisconnecting,
    isConnected: walletContext.isConnected,
    error: walletContext.error,
    clearError: walletContext.clearError,
    signMessage: walletContext.signMessage,

    // Utility methods
    isChainSupported,
    getSupportedChains,
  };
}

// Legacy exports for backward compatibility
export const useWalletConnection = useWallet;

// Chain constants for backward compatibility
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  OPTIMISM: 10,
} as const;

export type SupportedChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

// Default export
export default useWallet;
