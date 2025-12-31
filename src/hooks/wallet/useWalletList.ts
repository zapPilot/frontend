import { useCallback, useEffect, useState } from "react";

import { loadWallets as fetchWallets } from "@/components/WalletManager/services/WalletService";
import { TIMINGS } from "@/constants/timings";
import type { WalletData } from "@/lib/validation/walletUtils";

interface ConnectedWallet {
  address: string;
  isActive: boolean;
}

interface UseWalletListParams {
  userId: string | null | undefined;
  connectedWallets: ConnectedWallet[];
  isOpen: boolean;
  isOwner: boolean;
}

/**
 * Hook for managing wallet list loading and periodic refresh
 *
 * Handles:
 * - Initial wallet loading when modal opens
 * - Periodic auto-refresh for owner viewing their own wallets
 * - Active state synchronization with connected wallets
 */
export function useWalletList({
  userId,
  connectedWallets,
  isOpen,
  isOwner,
}: UseWalletListParams) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load wallets from API
  const loadWallets = useCallback(
    async (silent = false) => {
      if (!userId) return;

      if (!silent) {
        setIsRefreshing(true);
      }

      try {
        const loadedWallets = await fetchWallets(userId);

        // Mark wallets as active based on WalletProvider's connectedWallets
        const walletsWithActiveState = loadedWallets.map(wallet => ({
          ...wallet,
          isActive: connectedWallets.some(
            cw =>
              cw.address.toLowerCase() === wallet.address.toLowerCase() &&
              cw.isActive
          ),
        }));

        setWallets(walletsWithActiveState);
      } catch {
        // Handle silently - error state is managed by service response
      } finally {
        if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [userId, connectedWallets]
  );

  // Load wallets when component opens or user changes
  useEffect(() => {
    if (isOpen && userId) {
      void loadWallets();
    }
  }, [isOpen, userId, loadWallets]);

  // Auto-refresh data periodically (only for connected users viewing their own data)
  useEffect(() => {
    if (!isOpen || !userId || !isOwner) return;

    const interval = setInterval(() => {
      void loadWallets(true); // Silent refresh
    }, TIMINGS.WALLET_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isOpen, userId, isOwner, loadWallets]);

  return {
    wallets,
    setWallets,
    isRefreshing,
    loadWallets,
  };
}
