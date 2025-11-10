/**
 * Simplified Chain Hook
 *
 * Basic chain switching functionality using the simplified wallet.
 * Much simpler than the previous complex chain management system.
 */

"use client";

import { useCallback } from "react";

import { getChainById, getSupportedMainnetChains } from "@/config/chains";

import { useWallet } from "./useWallet";

/**
 * Simplified chain hook
 */
export function useChain() {
  // Get wallet state
  const {
    chain,
    switchChain: walletSwitchChain,
    isChainSupported,
  } = useWallet();

  // Switch chain wrapper
  const switchChain = useCallback(
    async (chainId: number) => {
      if (!isChainSupported(chainId)) {
        throw new Error(`Chain ${chainId} is not supported`);
      }

      return walletSwitchChain(chainId);
    },
    [walletSwitchChain, isChainSupported]
  );

  // Get chain info
  const getChainInfo = useCallback((chainId: number) => {
    return getChainById(chainId);
  }, []);

  // Get supported chains
  const getSupportedChains = useCallback(() => {
    return getSupportedMainnetChains();
  }, []);

  return {
    // Current chain
    chain,

    // Chain operations
    switchChain,

    // Chain utilities
    isChainSupported,
    getChainInfo,
    getSupportedChains,
  };
}
