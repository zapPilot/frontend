"use client";
// Import new types and config
import { chainUtils } from "@/config/wallet";
import { Chain, WalletConnectionHooks } from "@/types/wallet";

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

  // Get supported chains from context - no memoization needed for simple data access
  const getSupportedChains = (): Chain[] => {
    return walletContext.supportedChains;
  };

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

// Import unified chain configuration
import {
  CHAIN_NAMES as CANONICAL_CHAIN_NAMES,
  CHAIN_IDS,
} from "@/config/chains";

// Legacy chain ID mappings for backward compatibility
export const SUPPORTED_CHAINS = {
  ETHEREUM: CHAIN_IDS.ETHEREUM,
  ARBITRUM: CHAIN_IDS.ARBITRUM,
  BASE: CHAIN_IDS.BASE,
  OPTIMISM: CHAIN_IDS.OPTIMISM,
} as const;

// Legacy chain display names for backward compatibility
export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.ETHEREUM]: CANONICAL_CHAIN_NAMES[CHAIN_IDS.ETHEREUM],
  [SUPPORTED_CHAINS.ARBITRUM]: CANONICAL_CHAIN_NAMES[CHAIN_IDS.ARBITRUM],
  [SUPPORTED_CHAINS.BASE]: CANONICAL_CHAIN_NAMES[CHAIN_IDS.BASE],
  [SUPPORTED_CHAINS.OPTIMISM]: CANONICAL_CHAIN_NAMES[CHAIN_IDS.OPTIMISM],
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
