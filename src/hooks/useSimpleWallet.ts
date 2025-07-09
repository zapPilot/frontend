"use client";

import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
} from "thirdweb/react";
import { useCallback } from "react";

/**
 * Simplified wallet hook using ThirdWeb's built-in hooks
 *
 * This provides a clean interface for wallet operations without complex abstractions
 */
export function useSimpleWallet() {
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const isConnected = !!activeAccount;
  const address = activeAccount?.address;

  const handleDisconnect = useCallback(async () => {
    if (activeWallet) {
      await disconnect(activeWallet);
    }
  }, [activeWallet, disconnect]);

  const formatAddress = useCallback((addr?: string, length = 8) => {
    if (!addr) return "";
    if (addr.length <= length) return addr;
    const start = Math.ceil(length / 2);
    const end = Math.floor(length / 2);
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  }, []);

  const copyAddress = useCallback(async () => {
    if (!address) return false;

    try {
      await navigator.clipboard.writeText(address);
      return true;
    } catch (error) {
      console.error("Failed to copy address:", error);
      return false;
    }
  }, [address]);

  return {
    // Account info
    account: activeAccount,
    address,
    isConnected,

    // Wallet info
    wallet: activeWallet,

    // Actions
    disconnect: handleDisconnect,

    // Utilities
    formatAddress,
    copyAddress,
  };
}

export default useSimpleWallet;
