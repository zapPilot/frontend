"use client";

import { useCallback } from "react";

// Import new types and config
import { WalletConnectionHooks, Chain } from "@/types/wallet";
import { chainUtils } from "@/config/wallet";

// Import new wallet context
import { useWalletContext } from "@/providers/WalletContext";

// Legacy interfaces for backward compatibility
export interface WalletChain {
  id: number;
  name: string;
  isSupported: boolean;
}

/**
 * useWalletConnection - Provider-agnostic wallet connection hook
 *
 * This hook provides a standardized interface for wallet operations
 * that works with any provider through the abstraction layer.
 *
 * Features:
 * - Provider-agnostic interface
 * - Dynamic provider switching
 * - Comprehensive error handling
 * - Backward compatibility with existing code
 *
 * Usage:
 * ```tsx
 * const { account, chain, connect, disconnect, switchChain } = useWalletConnection();
 * ```
 */
export function useWalletConnection(): WalletConnectionHooks {
  // Use the new wallet context
  const walletContext = useWalletContext();

  // Extract needed values from context
  const {
    account,
    chain,
    provider,
    providerType,
    isConnecting,
    isDisconnecting,
    error,
    connect,
    disconnect,
    switchChain,
    isChainSupported,
    clearError,
  } = walletContext;

  // Get supported chains from context
  const getSupportedChains = useCallback((): Chain[] => {
    return walletContext.supportedChains;
  }, [walletContext.supportedChains]);

  return {
    // Account management
    account,

    // Chain management
    chain,
    switchChain,

    // Connection management
    connect,
    disconnect,
    isConnecting,
    isDisconnecting,

    // Provider information
    provider,
    providerType,

    // Utility methods
    isChainSupported,
    getSupportedChains,

    // Error handling
    error,
    clearError,
  };
}

/**
 * Provider-specific type definitions for easy migration
 * When switching providers, only these mappings need to change
 */

// Legacy chain ID mappings for backward compatibility
export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  OPTIMISM: 10,
} as const;

// Legacy chain display names for backward compatibility
export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.ETHEREUM]: "Ethereum",
  [SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum",
  [SUPPORTED_CHAINS.BASE]: "Base",
  [SUPPORTED_CHAINS.OPTIMISM]: "Optimism",
} as const;

export type SupportedChainId =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

/**
 * Legacy helper for backward compatibility
 * @deprecated Use chainUtils from @/config/wallet instead
 */
export const getChainName = (chainId: number): string => {
  return chainUtils.getChainName(chainId);
};

/**
 * Legacy helper for backward compatibility
 * @deprecated Use chainUtils from @/config/wallet instead
 */
export const isChainSupported = (chainId: number): boolean => {
  return chainUtils.isChainSupported(chainId);
};
