import { useCallback, useEffect, useState } from "react";
import {
  getBundleWalletsByPrimary,
  getUserByWallet,
  transformBundleWallets,
} from "../services/quantEngine";

interface ApiUserResponse {
  id: string;
  user_id?: string;
}

interface BundleWallet {
  id: string;
  address: string;
  label: string;
  isActive: boolean;
  isMain: boolean;
  isVisible: boolean;
  createdAt: string | null;
}

interface UseBundleWalletsConfig {
  primaryWallet?: string;
  enabled?: boolean;
}

interface UseBundleWalletsReturn {
  wallets: BundleWallet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalWallets: number;
  visibleWallets: number;
  setActiveWallet: (walletId: string) => void;
}

/**
 * Hook to fetch and manage bundle wallets from quant-engine
 */
export function useBundleWallets({
  primaryWallet,
  enabled = true,
}: UseBundleWalletsConfig = {}): UseBundleWalletsReturn {
  const [wallets, setWallets] = useState<BundleWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBundleWallets = useCallback(async () => {
    if (!primaryWallet || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get user by wallet to get userId
      const userResponse = (await getUserByWallet(
        primaryWallet
      )) as ApiUserResponse;

      // Fetch bundle data from API using userId
      const bundleData = await getBundleWalletsByPrimary(
        userResponse.user_id || userResponse.id
      );

      // Transform to UI format
      const transformedWallets = transformBundleWallets(bundleData);
      setWallets(transformedWallets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch bundle wallets";
      setError(errorMessage);
      console.error("Bundle wallets fetch error:", err);

      // Fallback to mock data on error
      setWallets([
        {
          id: "fallback-1",
          address: primaryWallet,
          label: "Main Wallet",
          isActive: true,
          isMain: true,
          isVisible: true,
          createdAt: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [primaryWallet, enabled]);

  const setActiveWallet = useCallback((walletId: string) => {
    setWallets(prev =>
      prev.map(wallet => ({
        ...wallet,
        isActive: wallet.id === walletId,
      }))
    );
  }, []);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchBundleWallets();
  }, [fetchBundleWallets]);

  // Calculate metrics
  const totalWallets = wallets.length;
  const visibleWallets = wallets.filter(w => w.isVisible).length;

  return {
    wallets: wallets.filter(w => w.isVisible), // Only return visible wallets
    loading,
    error,
    refetch: fetchBundleWallets,
    totalWallets,
    visibleWallets,
    setActiveWallet,
  };
}
