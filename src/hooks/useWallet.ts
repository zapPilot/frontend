/**
 * Simplified Wallet Hook
 *
 * Clean, direct interface for wallet operations using ThirdWeb.
 * Compatible with existing useWalletConnection API for easy migration.
 */

"use client";

import {
  isChainSupported as configIsChainSupported,
  SUPPORTED_CHAINS,
} from "@/config/chains";
import { useWalletProvider } from "@/providers/WalletProvider";

// Compatible interface matching the original useWalletConnection
interface WalletHooks {
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
  getSupportedChains: () => { id: number; name: string; symbol: string }[];
}

/**
 * Main wallet hook - drop-in replacement for useWalletConnection
 */
export function useWallet(): WalletHooks {
  const walletContext = useWalletProvider();

  // Utility functions for backward compatibility - now using canonical configuration
  const isChainSupported = (chainId: number): boolean => {
    return configIsChainSupported(chainId);
  };

  const getSupportedChains = () => {
    return SUPPORTED_CHAINS.map(chain => ({
      id: chain.id,
      name: chain.name,
      symbol: chain.symbol,
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

// Legacy useWalletConnection alias removed - use useWallet directly
// Chain constants for backward compatibility - now using canonical CHAIN_IDS
export { CHAIN_IDS as SUPPORTED_CHAINS } from "@/config/chains";
